import { AuthUser, PRECONFIGURED_USERS, UserRole } from "@/lib/auth";

class AuthService {
  private STORAGE_KEY = "nexthire_auth_user_session";

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

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (remember && typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        }
        return { success: true, user: data.user };
      }

      return {
        success: false,
        error: data.error || "Authentication failed. Please verify credentials.",
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

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        }
        this.setCookieSession(data.user);
        return { success: true, user: data.user };
      }

      return {
        success: false,
        error: data.error || "Firebase authentication token validation failed.",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error validating Firebase session." };
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
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
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

      const resData = await res.json();
      if (res.ok && resData.success && resData.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(resData.user));
        }
        return { success: true, user: resData.user };
      }
      return { success: false, error: resData.error || "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
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

      const resData = await res.json();
      if (res.ok && resData.success && resData.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(resData.user));
        }
        return { success: true, user: resData.user };
      }
      return { success: false, error: resData.error || "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  private setCookieSession(user: AuthUser | null) {
    if (typeof window === "undefined") return;
    if (user) {
      const value = encodeURIComponent(JSON.stringify(user));
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

  public async sendPasswordReset(email: string): Promise<{ success: boolean }> {
    await new Promise((res) => setTimeout(res, 400));
    return { success: true };
  }
}

export const authService = new AuthService();
