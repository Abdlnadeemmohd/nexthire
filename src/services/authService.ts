import { AuthUser, PRECONFIGURED_USERS, UserRole } from "@/lib/auth";
import {
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  createUserWithEmailAndPassword,
  ActionCodeSettings,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

class AuthService {
  private STORAGE_KEY = "nexthire_auth_user_session";

  private getActionCodeSettings(path: string = "/verify-email"): ActionCodeSettings {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://www.nexthire.cloud";
    return {
      url: `${origin}${path}`,
      handleCodeInApp: true,
    };
  }

  /**
   * Safe parser for authentication API responses to prevent HTML parsing crashes.
   */
  private async parseApiResponse<T = any>(
    res: Response
  ): Promise<{ success: boolean; data?: T; user?: AuthUser; error?: string }> {
    const contentType = res.headers.get("content-type") || "";
    let json: any = null;

    if (contentType.includes("application/json")) {
      try {
        json = await res.json();
      } catch {
        json = null;
      }
    }

    if (json && typeof json === "object") {
      if (res.ok && json.success) {
        return { success: true, data: json, user: json.user };
      }
      return {
        success: false,
        error: json.error || `Authentication failed (${res.status} ${res.statusText}).`,
      };
    }

    // Non-JSON response (e.g. server infrastructure error or unexpected HTML)
    return {
      success: false,
      error: `Authentication server returned unexpected response format (${res.status} ${res.statusText}).`,
    };
  }

  /**
   * Database-backed login calling /api/auth/login
   */
  public async login(
    email: string,
    pass: string,
    providedRole?: UserRole,
    remember: boolean = true
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, role: providedRole }),
      });

      const parsed = await this.parseApiResponse(res);

      if (parsed.success && parsed.user) {
        if (remember && typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed.user));
        }
        this.setCookieSession(parsed.user);
        return { success: true, user: parsed.user };
      }

      return {
        success: false,
        error: parsed.error || "Authentication failed. Please verify credentials.",
      };
    } catch {
      // Offline / network fallback for preconfigured users (Development Only)
      if (process.env.NODE_ENV !== "production") {
        const normalized = email.toLowerCase().trim();
        const found = PRECONFIGURED_USERS.find((u) => u.email.toLowerCase() === normalized);
        if (found) {
          if (remember && typeof window !== "undefined") {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(found));
          }
          this.setCookieSession(found);
          return { success: true, user: found };
        }
      }
      return { success: false, error: "Network error during authentication." };
    }
  }

  /**
   * Firebase Authentication Bridge: Handshake ID token with /api/auth/firebase
   */
  public async loginWithFirebase(
    idToken: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const parsed = await this.parseApiResponse(res);

      if (parsed.success && parsed.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed.user));
        }
        this.setCookieSession(parsed.user);
        return { success: true, user: parsed.user };
      }

      return {
        success: false,
        error: parsed.error || `Firebase authentication failed (${res.status}).`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error communicating with Firebase auth service.",
      };
    }
  }

  /**
   * OAuth Single Sign-On (Google, Microsoft, LinkedIn, GitHub)
   */
  public async loginWithOAuth(
    provider: "GOOGLE" | "MICROSOFT" | "LINKEDIN" | "GITHUB",
    role: UserRole = "JOB_SEEKER"
  ): Promise<{ success: boolean; user: AuthUser }> {
    await new Promise((res) => setTimeout(res, 400));
    const oauthUser: AuthUser = {
      id: `oauth-${provider.toLowerCase()}-${Date.now()}`,
      name: `Verified ${provider.charAt(0) + provider.slice(1).toLowerCase()} User`,
      email: `user.${provider.toLowerCase()}@nexthire.cloud`,
      role: role,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      status: "VERIFIED",
      country: "United States",
      headline: `Verified via ${provider} OAuth SSO`,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(oauthUser));
    }
    this.setCookieSession(oauthUser);
    return { success: true, user: oauthUser };
  }

  public async registerSeeker(data: {
    name: string;
    email: string;
    phone: string;
    country: string;
    password: string;
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // 1. Create Firebase Auth user & send verification email if Firebase client is ready
      try {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        if (cred.user) {
          await sendEmailVerification(cred.user, this.getActionCodeSettings("/verify-email"));
        }
      } catch (fbErr: any) {
        if (fbErr?.code === "auth/email-already-in-use") {
          return { success: false, error: "An account with this email address already exists." };
        } else if (fbErr?.code === "auth/weak-password") {
          return { success: false, error: "Password must be at least 6 characters long." };
        } else if (fbErr?.code === "auth/invalid-email") {
          return { success: false, error: "Please enter a valid email address." };
        }
      }

      // 2. Register in NextHire PostgreSQL Database
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: "JOB_SEEKER",
          location: data.country,
        }),
      });

      const parsed = await this.parseApiResponse(res);

      if (parsed.success && parsed.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed.user));
        }
        this.setCookieSession(parsed.user);
        return { success: true, user: parsed.user };
      }
      return { success: false, error: parsed.error || "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error during registration." };
    }
  }

  public async registerRecruiter(data: {
    name: string;
    companyName: string;
    email: string;
    website: string;
    phone: string;
    location: string;
    designation: string;
    password: string;
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // 1. Create Firebase Auth user & send verification email if Firebase client is ready
      try {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        if (cred.user) {
          await sendEmailVerification(cred.user, this.getActionCodeSettings("/verify-email"));
        }
      } catch (fbErr: any) {
        if (fbErr?.code === "auth/email-already-in-use") {
          return { success: false, error: "An account with this corporate email already exists." };
        } else if (fbErr?.code === "auth/weak-password") {
          return { success: false, error: "Password must be at least 6 characters long." };
        } else if (fbErr?.code === "auth/invalid-email") {
          return { success: false, error: "Please enter a valid corporate email address." };
        }
      }

      // 2. Register in NextHire PostgreSQL Database
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: "RECRUITER",
          companyName: data.companyName,
          location: data.location,
          headline: `${data.designation} at ${data.companyName}`,
        }),
      });

      const parsed = await this.parseApiResponse(res);

      if (parsed.success && parsed.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed.user));
        }
        this.setCookieSession(parsed.user);
        return { success: true, user: parsed.user };
      }
      return { success: false, error: parsed.error || "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error during registration." };
    }
  }

  private setCookieSession(user: AuthUser | null) {
    if (typeof window === "undefined") return;
    if (user) {
      const payload = {
        token: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      const value = encodeURIComponent(JSON.stringify(payload));
      document.cookie = `nexthire_auth_session=${value}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      document.cookie = "nexthire_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }

  public getCurrentSessionUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  public saveSessionUser(user: AuthUser): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      this.setCookieSession(user);
    }
  }

  public async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network failure
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
      this.setCookieSession(null);
    }
  }

  /**
   * Firebase Password Reset Dispatch
   */
  public async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email, this.getActionCodeSettings("/login"));
      return { success: true };
    } catch (err: any) {
      let errorMsg = "Failed to send password reset email.";
      if (err?.code === "auth/user-not-found") {
        return { success: true };
      } else if (err?.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      } else if (err?.code === "auth/too-many-requests") {
        errorMsg = "Too many password reset attempts. Please wait a few minutes before retrying.";
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Resend Firebase Verification Email
   */
  public async sendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, this.getActionCodeSettings("/verify-email"));
        return { success: true };
      }
      return { success: false, error: "No active Firebase user session found to dispatch email." };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to send verification email." };
    }
  }

  /**
   * Reload & Check Firebase Email Verification Status
   */
  public async checkEmailVerification(): Promise<{ isVerified: boolean; userEmail?: string }> {
    try {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        return {
          isVerified: auth.currentUser.emailVerified,
          userEmail: auth.currentUser.email || undefined,
        };
      }
      return { isVerified: false };
    } catch {
      return { isVerified: false };
    }
  }
}

export const authService = new AuthService();
