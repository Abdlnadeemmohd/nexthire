import { AuthUser, PRECONFIGURED_USERS, UserRole } from "@/lib/auth";
import {
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
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
   * Safe parser for authentication API responses that prevents secondary parsing crashes,
   * handles non-JSON HTML/text server errors, and provides user-friendly diagnostic messages.
   */
  private async parseApiResponse<T = any>(
    res: Response
  ): Promise<{ success: boolean; data?: T; user?: AuthUser; error?: string; category?: string }> {
    let json: any = null;

    // 1. Attempt to parse response body as text first, then JSON
    try {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        try {
          json = JSON.parse(text);
        } catch {
          // Response is unparseable plain text or HTML
          json = null;
        }
      }
    } catch {
      json = null;
    }

    // 2. Structured JSON response handling
    if (json && typeof json === "object") {
      if (res.ok && json.success) {
        return { success: true, data: json, user: json.user };
      }
      return {
        success: false,
        error: json.error || `Authentication failed (${res.status} ${res.statusText}).`,
        category: json.category,
      };
    }

    // 3. User-friendly fallback messages for non-JSON or infrastructure errors
    let fallbackMessage = `Authentication service error (${res.status}).`;
    if (res.status === 500) {
      fallbackMessage = "Authentication server temporarily encountered an internal error. Please try again or contact support.";
    } else if (res.status === 503) {
      fallbackMessage = "Authentication database or configuration service is temporarily unavailable. Please try again shortly.";
    } else if (res.status === 401) {
      fallbackMessage = "Invalid authentication credentials or expired token.";
    } else if (res.status === 403) {
      fallbackMessage = "Access denied for this resource.";
    } else if (res.status === 404) {
      fallbackMessage = "Authentication endpoint not found on server.";
    }

    return {
      success: false,
      error: fallbackMessage,
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
        return { success: true, user: parsed.user };
      }

      return {
        success: false,
        error: parsed.error || "Authentication failed. Please verify credentials.",
      };
    } catch {
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
   * OAuth Single Sign-On (Real Firebase Google SSO & Provider Guards)
   */
  public async loginWithOAuth(
    provider: "GOOGLE" | "MICROSOFT" | "LINKEDIN" | "GITHUB",
    role: UserRole = "JOB_SEEKER"
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (provider === "GOOGLE") {
      try {
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: "select_account" });
        const cred = await signInWithPopup(auth, googleProvider);
        if (cred.user) {
          const idToken = await cred.user.getIdToken();
          return await this.loginWithFirebase(idToken);
        }
        return { success: false, error: "Google Sign-In was cancelled or incomplete." };
      } catch (err: any) {
        if (err?.code === "auth/popup-closed-by-user") {
          return { success: false, error: "Google Sign-In popup was closed before completion." };
        }
        return { success: false, error: err?.message || "Google authentication failed." };
      }
    }

    return {
      success: false,
      error: `${provider.charAt(0) + provider.slice(1).toLowerCase()} Single Sign-On is not configured on this deployment. Please sign in with Google or Email.`,
    };
  }

  public async registerSeeker(data: {
    name: string;
    email: string;
    phone: string;
    country: string;
    password: string;
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      let firebaseUid: string | undefined = undefined;

      // 1. Create Firebase Auth user & send verification email if Firebase client is ready
      try {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        if (cred.user) {
          firebaseUid = cred.user.uid;
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

      // 2. Register in NextHire Neon PostgreSQL Database
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid,
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
      let firebaseUid: string | undefined = undefined;

      // 1. Create Firebase Auth user & send verification email if Firebase client is ready
      try {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        if (cred.user) {
          firebaseUid = cred.user.uid;
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

      // 2. Register in NextHire Neon PostgreSQL Database
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid,
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
        return { success: true, user: parsed.user };
      }
      return { success: false, error: parsed.error || "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error during registration." };
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
    }
  }

  public async logout(): Promise<void> {
    // 1. Invalidate server-side session and expire session cookie
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        keepalive: true,
      });
    } catch {
      // In case of offline/network interruption, continue clearing client state
    }

    // 2. Sign out Firebase client authentication
    try {
      await signOut(auth);
    } catch (fbErr) {
      console.warn("Firebase client sign-out notice:", fbErr);
    }

    // 3. Clear all client-side authentication storage & notifications cache
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem("nexthire_notifications");
        sessionStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem("nexthire_auth_user_session");
      } catch {}
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
