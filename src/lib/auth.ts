export type UserRole = "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN";

export type EmploymentStatus =
  | "UNEMPLOYED"
  | "ON_NOTICE_PERIOD"
  | "SEARCHING_EMPLOYED"
  | "OPEN_TO_OPPORTUNITIES"
  | "EMPLOYED";

export interface UserExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements?: string[];
}

export interface UserEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
}

export interface UserCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  verificationLink?: string;
  certificateFileUrl?: string;
}

export interface VerificationDocument {
  id: string;
  documentType: "PASSPORT" | "NATIONAL_ID" | "DRIVER_LICENSE" | "BUSINESS_LICENSE" | "TAX_CERTIFICATE";
  documentUrl: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: "VERIFIED" | "PENDING" | "BLOCKED";
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  badgeStatus?: "APPROVED" | "PENDING" | "SUSPENDED" | "REJECTED";
  companyId?: string;
  companyName?: string;
  headline?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  bio?: string;
  employmentStatus?: EmploymentStatus;
  resumeUrl?: string;
  resumeFileName?: string;
  experience?: UserExperience[];
  education?: UserEducation[];
  certifications?: UserCertification[];
  verificationDocs?: VerificationDocument[];
  portfolioLinks?: {
    linkedin?: string;
    github?: string;
    website?: string;
    behance?: string;
    dribbble?: string;
  };
}

export const PRECONFIGURED_USERS: AuthUser[] = [
  {
    id: "owner-1",
    name: "Stage 1 Platform Owner",
    email: "owner@nexthire.cloud",
    role: "PLATFORM_ADMIN",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60",
    status: "VERIFIED",
    badgeStatus: "APPROVED",
    headline: "Platform Administrator & Owner",
    phone: "+1 (555) 901-2000",
    city: "San Francisco",
    country: "United States",
  },
  {
    id: "recruiter-1",
    name: "Stage 1 Recruiter",
    email: "recruiter@nexthire.cloud",
    role: "RECRUITER",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
    status: "VERIFIED",
    badgeStatus: "APPROVED",
    companyName: "Employer Partner",
    headline: "Lead Talent Acquisition Partner",
    phone: "+1 (555) 342-8900",
    address: "100 Tech Plaza, Suite 400",
    city: "San Francisco",
    country: "United States",
    bio: "Managing technical hiring and recruitment pipelines on NextHire.",
  },
  {
    id: "seeker-1",
    name: "Stage 1 Candidate",
    email: "jobseeker@nexthire.cloud",
    role: "JOB_SEEKER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    status: "VERIFIED",
    badgeStatus: "APPROVED",
    headline: "Senior Full-Stack Engineer",
    phone: "+1 (555) 890-1234",
    address: "742 Market Street",
    city: "San Francisco",
    country: "United States",
    bio: "Dedicated Stage 1 test candidate evaluating the live NextHire job search, application lifecycle, and resume management workflow.",
    employmentStatus: "OPEN_TO_OPPORTUNITIES",
    experience: [],
    education: [],
    certifications: [],
    verificationDocs: [],
    portfolioLinks: {
      linkedin: "https://linkedin.com",
      github: "https://github.com",
    },
  },
];

export function hasRouteAccess(userRole: UserRole | undefined, pathname: string): boolean {
  if (!userRole) return false;

  // 1. Platform Owner (Super Admin) Access Controls
  if (userRole === "PLATFORM_ADMIN") {
    if (
      pathname.startsWith("/jobseeker") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/applications") ||
      pathname.startsWith("/profile")
    ) {
      return false;
    }
    return true;
  }

  // 2. Recruiter Access Controls
  if (userRole === "RECRUITER") {
    if (pathname.startsWith("/admin")) return false;
    if (
      pathname.startsWith("/jobseeker") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/applications") ||
      pathname.startsWith("/profile")
    ) {
      return false;
    }
    return true;
  }

  // 3. Job Seeker Access Controls
  if (userRole === "JOB_SEEKER") {
    if (pathname.startsWith("/recruiter")) return false;
    if (pathname.startsWith("/admin")) return false;
    return true;
  }

  return false;
}
