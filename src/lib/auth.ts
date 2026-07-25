export type UserRole = "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: "VERIFIED" | "PENDING" | "BLOCKED";
  companyName?: string;
  headline?: string;
  country?: string;
}

export const PRECONFIGURED_USERS: AuthUser[] = [
  {
    id: "owner-1",
    name: "Platform Owner",
    email: "owner@nexthire.com",
    role: "PLATFORM_ADMIN",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    status: "VERIFIED",
    headline: "Super Administrator & Systems Owner",
    country: "United States",
  },
  {
    id: "recruiter-1",
    name: "Sarah Jenkins",
    email: "recruiter@nexthire.com",
    role: "RECRUITER",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1D7dFdsnx2LAf_HxMUQf5KpCl5o2SHtRoQtxP7qjPB2D7KMODcDu0063TsqSLCewWg9M09otOoMbH-NfUzvBYL92WSEUJQDyw0W-Bmok-FvgZyL21HUitslBJkhfhVC2G8gAQ6LSZ_X8qMYN9F5R1R_kgZFA67hps92BfZKbel7Lmg6aApF7Nih5ph9jjS0S0rUr2W_p3a3L0hwTkNXDRL4DpAgeh-X1qCkE5OBpKsWx0JHS37gayqR4caP6y50K32RpNrJ5CHWlC",
    status: "VERIFIED",
    companyName: "Stellar Systems",
    headline: "Lead Talent Acquisition Manager",
    country: "United States",
  },
  {
    id: "seeker-1",
    name: "Alex Rivers",
    email: "jobseeker@nexthire.com",
    role: "JOB_SEEKER",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    status: "VERIFIED",
    headline: "Senior UX Specialist & Systems Architect",
    country: "United States",
  },
];

export function hasRouteAccess(userRole: UserRole | undefined, pathname: string): boolean {
  if (!userRole) return false;

  // 1. Platform Owner (Super Admin) Access Controls
  if (userRole === "PLATFORM_ADMIN") {
    // Admin is restricted from candidate portal & resume creation
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/applications") || pathname.startsWith("/profile")) {
      return false;
    }
    return true;
  }

  // 2. Recruiter Access Controls
  if (userRole === "RECRUITER") {
    // Recruiter is strictly blocked from Admin Console and Candidate Portal
    if (pathname.startsWith("/admin")) return false;
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/applications") || pathname.startsWith("/profile")) {
      return false;
    }
    return true;
  }

  // 3. Job Seeker Access Controls
  if (userRole === "JOB_SEEKER") {
    // Job Seeker is strictly blocked from Recruiter Suite and Admin Console
    if (pathname.startsWith("/recruiter")) return false;
    if (pathname.startsWith("/admin")) return false;
    return true;
  }

  return false;
}
