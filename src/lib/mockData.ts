export interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string;
  location: string;
  country: string;
  salaryMin: number;
  salaryMax: number;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "REMOTE" | "HYBRID";
  experienceLevel: string;
  category: string;
  isRemote: boolean;
  isHighPriority?: boolean;
  status?: "OPEN" | "HIGH_PRIORITY" | "INTERVIEWING" | "FILLED" | "CLOSED";
  matchScore: number;
  tags: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  postedAt: string;
  companyDescription: string;
  companyWebsite: string;
  companySize: string;
}

export interface CandidateFeedback {
  reason: string;
  improvementAdvice: string;
  missingSkills: string[];
  missingExperience?: string;
  missingCertifications?: string[];
  additionalNotes?: string;
  createdAt: string;
}

export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  candidateName: string;
  candidateAvatar: string;
  candidateTitle: string;
  matchScore: number;
  employmentStatus?: "UNEMPLOYED" | "ON_NOTICE_PERIOD" | "SEARCHING_EMPLOYED" | "OPEN_TO_OPPORTUNITIES" | "EMPLOYED";
  status: "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
  appliedAt: string;
  appliedDateTimestamp?: number;
  slaStatus?: "HEALTHY" | "NEAR_SLA" | "SLA_BREACHED";
  daysAwaitingUpdate?: number;
  updatedAt: string;
  resumeUrl: string;
  location: string;
  skills: string[];
  notes?: string;
  interviewDate?: string;
  feedback?: CandidateFeedback;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  content: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
    url: string;
  };
  timestamp: string;
  read: boolean;
  isRecruiter: boolean;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "JOB_SEEKER" | "RECRUITER" | "COMPANY_ADMIN" | "PLATFORM_ADMIN";
  avatar: string;
  country: string;
  status: "VERIFIED" | "PENDING" | "BLOCKED" | "SUSPENDED";
  subscription: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
  createdAt: string;
}

export interface CompanyModerationItem {
  id: string;
  companyName: string;
  logo: string;
  website: string;
  email: string;
  taxId: string;
  licenseNumber: string;
  recruiterName: string;
  recruiterEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string;
  notes?: string;
}

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  subscribersCount: number;
  status: "ACTIVE" | "INACTIVE";
  mrr: number;
}

export interface TransactionItem {
  id: string;
  customerName: string;
  companyName: string;
  planName: string;
  amount: number;
  status: "PAID" | "PENDING" | "REFUNDED";
  date: string;
}

// Clean production defaults without hardcoded mock arrays
export const INITIAL_JOBS: Job[] = [];
export const INITIAL_APPLICATIONS: CandidateApplication[] = [];
export const INITIAL_MESSAGES: MessageItem[] = [];
export const INITIAL_USERS: UserItem[] = [];
export const INITIAL_MODERATION_COMPANIES: CompanyModerationItem[] = [];
export const INITIAL_SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [];
export const INITIAL_TRANSACTIONS: TransactionItem[] = [];

export const PROFILE_DATA = {
  name: "",
  headline: "",
  location: "",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
  bio: "",
  resumeScore: 0,
  completeness: 0,
  skills: [],
  experience: [],
  education: [],
  portfolio: [],
};
