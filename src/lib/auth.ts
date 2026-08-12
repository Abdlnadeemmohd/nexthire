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
    name: "Platform Owner",
    email: "owner@nexthire.com",
    role: "PLATFORM_ADMIN",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    status: "VERIFIED",
    badgeStatus: "APPROVED",
    headline: "Super Administrator & Systems Owner",
    phone: "+1 (555) 901-2000",
    city: "San Francisco",
    country: "United States",
  },
  {
    id: "recruiter-1",
    name: "Sarah Jenkins",
    email: "recruiter@nexthire.com",
    role: "RECRUITER",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1D7dFdsnx2LAf_HxMUQf5KpCl5o2SHtRoQtxP7qjPB2D7KMODcDu0063TsqSLCewWg9M09otOoMbH-NfUzvBYL92WSEUJQDyw0W-Bmok-FvgZyL21HUitslBJkhfhVC2G8gAQ6LSZ_X8qMYN9F5R1R_kgZFA67hps92BfZKbel7Lmg6aApF7Nih5ph9jjS0S0rUr2W_p3a3L0hwTkNXDRL4DpAgeh-X1qCkE5OBpKsWx0JHS37gayqR4caP6y50K32RpNrJ5CHWlC",
    status: "VERIFIED",
    badgeStatus: "APPROVED",
    companyName: "Stellar Systems",
    headline: "Lead Talent Acquisition Manager",
    phone: "+1 (555) 342-8900",
    address: "100 Tech Plaza, Suite 400",
    city: "Seattle",
    country: "United States",
    bio: "Head of Engineering Talent at Stellar Systems. Specialized in distributed cloud infrastructure & AI research recruitment.",
    verificationDocs: [
      { id: "vdoc-rec1", documentType: "BUSINESS_LICENSE", documentUrl: "/docs/business_license_stellar.pdf", submittedAt: "2026-06-15", status: "APPROVED" },
      { id: "vdoc-rec2", documentType: "TAX_CERTIFICATE", documentUrl: "/docs/tax_certificate_stellar.pdf", submittedAt: "2026-06-15", status: "APPROVED" },
    ],
  },
  {
    id: "seeker-1",
    name: "Alex Rivers",
    email: "jobseeker@nexthire.com",
    role: "JOB_SEEKER",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    status: "VERIFIED",
    badgeStatus: "APPROVED",
    headline: "Senior UX Specialist & Systems Architect",
    phone: "+1 (555) 890-1234",
    address: "742 Market Street",
    city: "San Francisco",
    country: "United States",
    bio: "Passionate Staff Systems Architect with 8+ years designing scalable cloud backends and high-conversion enterprise UX.",
    employmentStatus: "ON_NOTICE_PERIOD",
    resumeUrl: "/resumes/Alex_Rivers_Resume_2026.pdf",
    resumeFileName: "Alex_Rivers_Resume_2026.pdf",
    experience: [
      {
        id: "exp-1",
        company: "Vortex Labs",
        role: "Senior Systems Architect",
        startDate: "2022-03",
        endDate: "Present",
        description: "Led migration of microservices architecture to Kubernetes, improving uptime to 99.99%.",
        achievements: ["Reduced API latency by 42%", "Mentored 6 junior engineers"],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "Stanford University",
        degree: "B.S.",
        fieldOfStudy: "Computer Science",
        graduationYear: "2020",
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Solutions Architect - Professional",
        issuer: "Amazon Web Services",
        issueDate: "2024-01-15",
        expiryDate: "2027-01-15",
        verificationLink: "https://aws.amazon.com/verification/CERT-9902",
        certificateFileUrl: "/certs/aws_solutions_architect.pdf",
      },
    ],
    verificationDocs: [
      { id: "vdoc-seek1", documentType: "PASSPORT", documentUrl: "/docs/passport_alex_rivers.pdf", submittedAt: "2026-07-01", status: "APPROVED" },
    ],
    portfolioLinks: {
      linkedin: "https://linkedin.com/in/alexrivers",
      github: "https://github.com/alexrivers",
      website: "https://alexrivers.dev",
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
