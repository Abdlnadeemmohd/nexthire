export type UserRole = "JOB_SEEKER" | "RECRUITER" | "RECRUITER_MANAGER" | "COMPANY_ADMIN" | "PLATFORM_ADMIN";

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
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
  location?: string;
  workModel?: "Onsite" | "Hybrid" | "Remote";
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description: string;
  responsibilities?: string[];
  achievements?: string[];
  skills?: string[];
  companyUrl?: string;
}

export interface UserEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string;
  endDate?: string;
  graduationYear?: string;
  gradeGpa?: string;
  description?: string;
  institutionUrl?: string;
  activities?: string;
  isCurrent?: boolean;
}

export interface UserCertification {
  id: string;
  name: string;
  issuer: string;
  category?: string;
  issueDate: string;
  expiryDate?: string;
  noExpiryDate?: boolean;
  credentialId?: string;
  verificationLink?: string;
  certificateFileUrl?: string;
  status?: "PENDING" | "VERIFIED" | "EXPIRED" | "REJECTED" | "UNVERIFIED";
  description?: string;
}

export interface CandidateSkill {
  id: string;
  name: string;
  category: "Technical" | "Business" | "Tools" | "Domain";
  level?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  isHighlighted?: boolean;
}

export interface CandidateProject {
  id: string;
  title: string;
  role?: string;
  description: string;
  techStack?: string[];
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  projectUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  companyName?: string;
}

export interface CandidateLink {
  id: string;
  platform:
    | "LinkedIn"
    | "GitHub"
    | "Website"
    | "Portfolio"
    | "Behance"
    | "Dribbble"
    | "Kaggle"
    | "Stack Overflow"
    | "Medium"
    | "YouTube"
    | "Twitter"
    | "Scholar"
    | "Other";
  label: string;
  url: string;
  note?: string;
  isPublic?: boolean;
}

export interface CandidateAchievement {
  id: string;
  title: string;
  date?: string;
  category?: "Award" | "Honor" | "Hackathon" | "Competition" | "Milestone" | "Other" | string;
  description?: string;
  issuer?: string;
  url?: string;
}

export interface CandidatePublication {
  id: string;
  title: string;
  publisher?: string;
  publicationDate?: string;
  date?: string;
  url?: string;
  description?: string;
  authors?: string;
}

export interface CandidateLanguage {
  id: string;
  language: string;
  proficiency: "Native" | "Fluent" | "Professional" | "Conversational" | "Elementary" | "Basic" | string;
}

export interface CandidateVolunteer {
  id: string;
  organization: string;
  role: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  url?: string;
}

export interface CandidateCourse {
  id: string;
  title?: string;
  name?: string;
  provider?: string;
  institution?: string;
  date?: string;
  completionDate?: string;
  certificateUrl?: string;
  url?: string;
  description?: string;
  skills?: string[];
}

export interface CandidatePreferences {
  resumeTemplate?: "modern" | "classic" | "minimal" | string;
  employmentStatus?:
    | "Open to Opportunities"
    | "Available for Work"
    | "Employed"
    | "Unemployed"
    | "Not Looking"
    | string;
  openToWorkStatus?:
    | "ACTIVELY_LOOKING"
    | "OPEN_TO_OFFERS"
    | "OPEN_TO_RECRUITERS"
    | "FREELANCE_CONTRACT"
    | "NOT_LOOKING"
    | string;
  targetRoles?: string[];
  preferredRoles?: string[];
  preferredLocations?: string[];
  preferredTypes?: string[];
  workModels?: ("Onsite" | "Hybrid" | "Remote")[];
  remotePreference?: "REMOTE" | "HYBRID" | "ONSITE" | "ANY" | string;
  relocation?: "YES" | "NO" | "OPEN" | string;
  openToRelocation?: boolean;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  expectedSalaryCurrency?: string;
  currency?: string;
  salaryPeriod?: "YEAR" | "MONTH" | string;
  noticePeriod?: "IMMEDIATE" | "1_WEEK" | "2_WEEKS" | "1_MONTH" | "2_MONTHS" | "3_MONTHS_PLUS" | string;
  noticePeriodDays?: number;
  industries?: string[];
}

export interface CandidateVisibility {
  isPublic?: boolean;
  searchable?: boolean;
  isDiscoverable?: boolean;
  contactVisibility?: "DIRECT" | "ON_REQUEST" | "MASKED" | string;
  resumeVisibility?: "ALL" | "UNLOCKED_ONLY" | string;
  hideFromCurrentCompany?: boolean;
  currentCompanyName?: string;
}

export type RecruiterHiringStatus =
  | "ACTIVELY_HIRING"
  | "HIRING"
  | "OPEN_TO_OUTREACH"
  | "BUILDING_PIPELINE"
  | "HIRING_MULTIPLE"
  | "NOT_HIRING"
  | "INACTIVE"
  | string;

export interface CompanyAssociation {
  companyId: string;
  companyName: string;
  relationship:
    | "CURRENT_EMPLOYER"
    | "PREVIOUS_EMPLOYER"
    | "RECRUITING_PARTNER"
    | "RETAINED_AGENCY"
    | "AGENCY_CLIENT"
    | "VENTURE_PORTFOLIO"
    | "ADVISORY"
    | "OTHER"
    | string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  logoUrl?: string;
  isVerifiedCompany?: boolean;
}

export interface RecruiterProfileData {
  status?: RecruiterHiringStatus;
  headline?: string;
  recruiterRole?: string;
  yearsExperience?: number;
  industryFocus?: string[];
  recruitingSpecialties?: string[];
  recruitingSkills?: string[];
  languages?: string[];
  targetRoles?: string[];
  departments?: string[];
  seniorityLevels?: string[];
  hiringLocations?: string[];
  remotePreferences?: string[];
  employmentTypes?: string[];
  hiringVolume?: string;
  links?: CandidateLink[];
  achievements?: string[];
  companyAssociations?: CompanyAssociation[];
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  hiringDomains?: string[];
  totalHires?: number;
  activeListingsCount?: number;
}

export interface CompanyValue {
  title: string;
  description: string;
  icon?: string;
}

export interface CompanyBenefit {
  id?: string;
  category: string;
  title?: string;
  description?: string;
  perks?: string[];
}

export interface CompanyLocation {
  id?: string;
  name?: string;
  city: string;
  state?: string;
  country: string;
  isHQ?: boolean;
  isHeadquarters?: boolean;
  address?: string;
}

export interface CompanyMediaItem {
  id: string;
  url: string;
  caption?: string;
  type: "OFFICE" | "CULTURE" | "TEAM" | "BRAND";
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
  isVerified?: boolean;
  isTester?: boolean;
  accountType?: "NORMAL" | "QA_TESTER";
  subscriptionTier?: string;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  badgeStatus?: "APPROVED" | "PENDING" | "SUSPENDED" | "REJECTED";
  companyId?: string;
  companyName?: string;
  managerId?: string;
  managerName?: string;
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
  skillsList?: CandidateSkill[];
  projects?: CandidateProject[];
  portfolioLinksList?: CandidateLink[];
  achievements?: CandidateAchievement[];
  publications?: CandidatePublication[];
  languages?: CandidateLanguage[];
  volunteer?: CandidateVolunteer[];
  courses?: CandidateCourse[];
  preferences?: CandidatePreferences;
  visibility?: CandidateVisibility;
  recruiterData?: RecruiterProfileData;
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
  // =========================================================================
  // A. FULL-ACCESS QA ACCOUNTS (Dedicated QA Testing)
  // =========================================================================
  {
    id: "owner-1",
    name: "Stage 1 Platform Owner",
    email: "owner@nexthire.cloud",
    role: "PLATFORM_ADMIN",
    isTester: true,
    accountType: "QA_TESTER",
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
    isTester: true,
    accountType: "QA_TESTER",
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
    isTester: true,
    accountType: "QA_TESTER",
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

  // =========================================================================
  // B. LIVE / REALISTIC USER ACCOUNTS (Normal Production Rules)
  // =========================================================================
  {
    id: "live-seeker-1",
    name: "Alex Rivera",
    email: "jb1@nexthire.cloud",
    role: "JOB_SEEKER",
    isTester: false,
    accountType: "NORMAL",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
    status: "PENDING",
    badgeStatus: "PENDING",
    headline: "Frontend Software Engineer",
    phone: "+1 (555) 234-5678",
    city: "Austin",
    country: "United States",
    bio: "Live Job Seeker testing standard candidate application workflows and real profile requirements.",
    employmentStatus: "OPEN_TO_OPPORTUNITIES",
    experience: [],
    education: [],
    certifications: [],
  },
  {
    id: "live-recruiter-1",
    name: "Marcus Vance",
    email: "rc1@nexthire.cloud",
    role: "RECRUITER",
    isTester: false,
    accountType: "NORMAL",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60",
    status: "PENDING",
    badgeStatus: "PENDING",
    companyName: "Acme Corporation",
    companyId: "00000000-0000-0000-0000-000000000002",
    managerId: "live-manager-1",
    managerName: "Elena Rostova",
    headline: "Technical Recruiter",
    phone: "+1 (555) 345-6789",
    city: "New York",
    country: "United States",
    bio: "Live Recruiter working under Talent Manager at Acme Corp.",
  },
  {
    id: "live-manager-1",
    name: "Elena Rostova",
    email: "rcm@nexthire.cloud",
    role: "RECRUITER_MANAGER",
    isTester: false,
    accountType: "NORMAL",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60",
    status: "VERIFIED",
    badgeStatus: "APPROVED",
    companyName: "Acme Corporation",
    companyId: "00000000-0000-0000-0000-000000000002",
    headline: "Head of Recruiting & Talent Acquisition",
    phone: "+1 (555) 456-7890",
    city: "New York",
    country: "United States",
    bio: "Recruiting Manager directing technical hiring and managing recruiter allocations at Acme Corp.",
  },
];

export function isRecruiterOrAdmin(role?: string): boolean {
  return role === "RECRUITER" || role === "RECRUITER_MANAGER" || role === "COMPANY_ADMIN" || role === "PLATFORM_ADMIN";
}

export function isRecruiterRole(role?: string): boolean {
  return role === "RECRUITER" || role === "RECRUITER_MANAGER";
}

export function isRecruiterManager(role?: string): boolean {
  return role === "RECRUITER_MANAGER" || role === "COMPANY_ADMIN" || role === "PLATFORM_ADMIN";
}

export function hasManagerAccess(user?: { role?: UserRole | string; isTester?: boolean } | null): boolean {
  if (!user) return false;
  if (user.isTester) return true;
  return user.role === "RECRUITER_MANAGER" || user.role === "COMPANY_ADMIN" || user.role === "PLATFORM_ADMIN";
}

export function canManageTeam(user?: { role?: UserRole | string; isTester?: boolean } | null): boolean {
  return hasManagerAccess(user);
}

export function canManageAssessments(user?: { role?: UserRole | string; isTester?: boolean } | null): boolean {
  return hasManagerAccess(user);
}

export function canViewTeamOutreach(user?: { role?: UserRole | string; isTester?: boolean } | null): boolean {
  return hasManagerAccess(user);
}

export function canViewCompanyMarketIntelligence(user?: { role?: UserRole | string; isTester?: boolean } | null): boolean {
  return hasManagerAccess(user);
}

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

  // 2. Recruiter & Recruiter Manager Access Controls
  if (userRole === "RECRUITER" || userRole === "RECRUITER_MANAGER" || userRole === "COMPANY_ADMIN") {
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
