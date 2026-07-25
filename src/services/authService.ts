import { AuthUser, PRECONFIGURED_USERS, UserRole } from "@/lib/auth";

/**
 * AuthService Abstraction Layer
 * Designed for clean migration: When integrating Firebase Authentication in production,
 * replace the mock methods below with Firebase Auth SDK calls (signInWithEmailAndPassword, etc.)
 * with ZERO changes required to UI components, AuthContext, or route guards.
 */

class AuthService {
  private STORAGE_KEY = "nexthire_auth_user_session";

  /**
   * Automatic Role Detection Authentication
   * Role parameter is now optional. The auth engine automatically determines the role by checking account credentials.
   */
  public async login(
    email: string,
    pass: string,
    providedRole?: UserRole,
    remember: boolean = true
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    // Simulate network delay for real auth experience
    await new Promise((res) => setTimeout(res, 400));

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Owner / Super Admin Automatic Check
    if (normalizedEmail === "owner@nexthire.com" || providedRole === "PLATFORM_ADMIN") {
      if (normalizedEmail === "owner@nexthire.com" && pass === "Owner@123") {
        const ownerUser = PRECONFIGURED_USERS[0];
        if (remember) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ownerUser));
        }
        return { success: true, user: ownerUser };
      } else if (normalizedEmail === "owner@nexthire.com") {
        return {
          success: false,
          error: "Invalid Platform Owner password. (Default: Owner@123)",
        };
      }
    }

    // 2. Recruiter Account Automatic Check
    if (normalizedEmail === "recruiter@nexthire.com" || providedRole === "RECRUITER") {
      if (normalizedEmail === "recruiter@nexthire.com" && pass === "Recruiter@123") {
        const recruiterUser = PRECONFIGURED_USERS[1];
        if (remember) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recruiterUser));
        }
        return { success: true, user: recruiterUser };
      } else if (normalizedEmail === "recruiter@nexthire.com") {
        return {
          success: false,
          error: "Invalid Recruiter password. (Default: Recruiter@123)",
        };
      }
    }

    // 3. Job Seeker Account Automatic Check
    if (normalizedEmail === "jobseeker@nexthire.com" || providedRole === "JOB_SEEKER") {
      if (normalizedEmail === "jobseeker@nexthire.com" && pass === "JobSeeker@123") {
        const seekerUser = PRECONFIGURED_USERS[2];
        if (remember) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(seekerUser));
        }
        return { success: true, user: seekerUser };
      } else if (normalizedEmail === "jobseeker@nexthire.com") {
        return {
          success: false,
          error: "Invalid Job Seeker password. (Default: JobSeeker@123)",
        };
      }
    }

    // Dynamic Automatic Role Inference for custom test emails
    let inferredRole: UserRole = "JOB_SEEKER";
    if (normalizedEmail.includes("recruiter") || normalizedEmail.includes("hr")) {
      inferredRole = "RECRUITER";
    } else if (normalizedEmail.includes("owner") || normalizedEmail.includes("admin")) {
      inferredRole = "PLATFORM_ADMIN";
    }

    const dynamicUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: email.split("@")[0] || "Test User",
      email: email,
      role: providedRole || inferredRole,
      avatar:
        inferredRole === "RECRUITER"
          ? PRECONFIGURED_USERS[1].avatar
          : PRECONFIGURED_USERS[2].avatar,
      status: inferredRole === "RECRUITER" ? "PENDING" : "VERIFIED",
      country: "United States",
      headline: `${(providedRole || inferredRole).replace("_", " ")} Account`,
    };

    if (remember) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dynamicUser));
    }
    return { success: true, user: dynamicUser };
  }

  public async registerSeeker(data: {
    name: string;
    email: string;
    phone: string;
    country: string;
    password: string;
  }): Promise<{ success: boolean; user: AuthUser }> {
    await new Promise((res) => setTimeout(res, 500));

    const newSeeker: AuthUser = {
      id: `seeker-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: "JOB_SEEKER",
      avatar: PRECONFIGURED_USERS[2].avatar,
      status: "VERIFIED",
      country: data.country,
      headline: "Registered Candidate",
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSeeker));
    return { success: true, user: newSeeker };
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
  }): Promise<{ success: boolean; user: AuthUser }> {
    await new Promise((res) => setTimeout(res, 500));

    const newRecruiter: AuthUser = {
      id: `recruiter-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: "RECRUITER",
      avatar: PRECONFIGURED_USERS[1].avatar,
      status: "PENDING",
      companyName: data.companyName,
      headline: `${data.designation} at ${data.companyName}`,
      country: data.location,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newRecruiter));
    return { success: true, user: newRecruiter };
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

  public logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  public async sendPasswordReset(email: string): Promise<{ success: boolean }> {
    await new Promise((res) => setTimeout(res, 400));
    return { success: true };
  }
}

export const authService = new AuthService();
