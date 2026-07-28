"use client";

import { CertificateRecord } from "@/components/profile/CertificateUploadModal";
import { RecruiterIdentity } from "@/components/recruiter/RecruiterProfileCard";
import { ScheduledInterviewEvent } from "@/components/recruiter/InterviewScheduleModal";
import { RejectionFeedbackData } from "@/components/recruiter/StructuredRejectionModal";
import { CandidateTimelineEvent } from "@/components/recruiter/CandidateTimelineModal";

export type JobStatus = "OPEN" | "CLOSING_SOON" | "PAUSED" | "FILLED" | "EXPIRED" | "ARCHIVED";

export type ApplicationStage =
  | "APPLIED"
  | "REVIEW"
  | "SCREENING"
  | "INTERVIEW"
  | "TECHNICAL"
  | "HR"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export interface SyncJob {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: string;
  salary: string;
  status: JobStatus;
  postedDate: string;
  applicantsCount: number;
  description: string;
  requirements: string[];
  recruiterId?: string;
}

export interface SyncApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  appliedDate: string;
  lastUpdated: string;
  stage: ApplicationStage;
  aiMatchScore: number;
  resumeScore: number;
  experience: string;
  location: string;
  availability: string;
  salaryExpectation: string;
  skills: string[];
  starRating: number;
  timeline: CandidateTimelineEvent[];
  rejectionFeedback?: RejectionFeedbackData;
  scheduledInterviews?: ScheduledInterviewEvent[];
}

export interface SyncNotification {
  id: string;
  userId: string;
  userRole: "JOB_SEEKER" | "RECRUITER" | "ADMIN";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "APPLICATION" | "INTERVIEW" | "OFFER" | "REJECTION" | "JOB_CLOSED" | "VERIFICATION";
}

export interface SyncAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  details: string;
}

const INITIAL_JOBS: SyncJob[] = [
  {
    id: "job-1",
    title: "Senior Full-Stack Engineer (Next.js & TypeScript)",
    company: "Stellar Systems",
    companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    location: "San Francisco, CA (Remote)",
    type: "Full-Time",
    salary: "$160,000 - $180,000/yr",
    status: "OPEN",
    postedDate: "2 days ago",
    applicantsCount: 14,
    description: "Architect high-performance Web SaaS platforms using Next.js 14, React 18, and GraphQL microservices.",
    requirements: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL"],
  },
  {
    id: "job-2",
    title: "Lead DevOps & Platform Engineer",
    company: "CloudScale Tech",
    companyLogo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80",
    location: "Austin, TX (Hybrid)",
    type: "Full-Time",
    salary: "$185,000 - $205,000/yr",
    status: "OPEN",
    postedDate: "4 days ago",
    applicantsCount: 8,
    description: "Manage multi-region Kubernetes clusters, Terraform infrastructure, and automated CI/CD pipelines.",
    requirements: ["Kubernetes", "AWS", "Terraform", "Docker", "CI/CD"],
  },
  {
    id: "job-3",
    title: "Staff AI/ML Engineer",
    company: "Apex Intelligence",
    companyLogo: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80",
    location: "Seattle, WA (Remote)",
    type: "Full-Time",
    salary: "$190,000 - $220,000/yr",
    status: "CLOSING_SOON",
    postedDate: "1 week ago",
    applicantsCount: 22,
    description: "Fine-tune LLM models, build vector search retrieval systems, and integrate PyTorch agents into SaaS production.",
    requirements: ["PyTorch", "Python", "LLMs", "LangChain", "Vector DBs"],
  },
];

const INITIAL_APPLICATIONS: SyncApplication[] = [
  {
    id: "app-101",
    jobId: "job-1",
    jobTitle: "Senior Full-Stack Engineer (Next.js & TypeScript)",
    company: "Stellar Systems",
    companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    candidateName: "Alex Rivers",
    candidateEmail: "alex.rivers@example.com",
    candidateAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    appliedDate: "2026-07-26",
    lastUpdated: "2 hours ago",
    stage: "REVIEW",
    aiMatchScore: 96,
    resumeScore: 94,
    experience: "7+ years",
    location: "San Francisco, CA (Remote)",
    availability: "Immediate (2 weeks notice)",
    salaryExpectation: "$160k - $180k/yr",
    skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL"],
    starRating: 5,
    timeline: [
      {
        id: "t-1",
        timestamp: "2026-07-26 10:30 AM",
        stage: "APPLIED",
        actorName: "Alex Rivers",
        actorRole: "Candidate",
        description: "Application submitted via NextHire AI Direct Apply.",
        badgeType: "APPLIED",
      },
      {
        id: "t-2",
        timestamp: "2 hours ago",
        stage: "REVIEW",
        actorName: "Sarah Jenkins",
        actorRole: "Lead Recruiter",
        description: "Moved to Resume Review stage after AI match scan (96% fit).",
        badgeType: "NOTE",
      },
    ],
  },
  {
    id: "app-102",
    jobId: "job-2",
    jobTitle: "Lead DevOps & Platform Engineer",
    company: "CloudScale Tech",
    companyLogo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80",
    candidateName: "David Chen",
    candidateEmail: "david.chen@example.com",
    candidateAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    appliedDate: "2026-07-24",
    lastUpdated: "1 day ago",
    stage: "INTERVIEW",
    aiMatchScore: 92,
    resumeScore: 89,
    experience: "9+ years",
    location: "Austin, TX (Hybrid)",
    availability: "1 month notice",
    salaryExpectation: "$185k - $205k/yr",
    skills: ["Kubernetes", "AWS", "Terraform", "Docker", "CI/CD"],
    starRating: 4,
    timeline: [
      {
        id: "t-3",
        timestamp: "2026-07-24",
        stage: "APPLIED",
        actorName: "David Chen",
        actorRole: "Candidate",
        description: "Application received.",
        badgeType: "APPLIED",
      },
      {
        id: "t-4",
        timestamp: "1 day ago",
        stage: "INTERVIEW",
        actorName: "Sarah Jenkins",
        actorRole: "Lead Recruiter",
        description: "Scheduled Technical Architecture Interview via Google Meet.",
        badgeType: "INTERVIEW",
      },
    ],
  },
];

class RecruitmentEngineService {
  private jobs: SyncJob[] = INITIAL_JOBS;
  private applications: SyncApplication[] = INITIAL_APPLICATIONS;
  private certificates: CertificateRecord[] = [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect - Professional",
      category: "Cloud Architecture",
      issuingAuthority: "Amazon Web Services",
      credentialId: "AWS-ARCH-9847192",
      credentialUrl: "https://aws.amazon.com/verification",
      issueDate: "2025-06-15",
      expiryDate: "2028-06-15",
      noExpiryDate: false,
      fileName: "aws_solutions_architect.pdf",
      fileType: "PDF",
      status: "VERIFIED",
      verifiedDate: "2025-06-16",
      verifiedBy: "Platform Owner Admin",
    },
  ];
  private recruiterIdentities: Record<string, RecruiterIdentity> = {
    "recruiter-1": {
      id: "recruiter-1",
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      title: "Lead Technical Recruiter & Engineering Partner",
      department: "Global Tech Talent Acquisition",
      company: "Stellar Systems",
      isVerified: true,
      activeJobsCount: 4,
      avgResponseTime: "< 2 hours",
      rating: 4.9,
      summary: "10+ years connecting elite Staff Full-Stack, AI/ML, and DevOps Engineers with enterprise SaaS teams.",
    },
  };
  private notifications: SyncNotification[] = [
    {
      id: "n-1",
      userId: "seeker-1",
      userRole: "JOB_SEEKER",
      title: "Application Stage Updated",
      message: "Stellar Systems updated your application status for Senior Full-Stack Engineer to 'Resume Review'.",
      timestamp: "2 hours ago",
      read: false,
      type: "APPLICATION",
    },
  ];
  private auditLogs: SyncAuditLog[] = [
    {
      id: "audit-1",
      timestamp: new Date().toISOString(),
      actor: "System",
      role: "SYSTEM",
      action: "RECRUITMENT_ENGINE_INIT",
      target: "NextHire Core Engine",
      details: "Cross-portal state engine initialized.",
    },
  ];
  private verifiedUsers: Record<string, boolean> = {
    "seeker-1": true,
    "recruiter-1": true,
    "company-1": true,
  };

  // Listeners for real-time reactivity
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- RECRUITER DOMAIN EMAIL VALIDATION ---
  public validateRecruiterEmail(email: string): { isValid: boolean; error?: string } {
    const domain = email.split("@")[1]?.toLowerCase();
    const disallowedDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "mail.com", "aol.com"];
    if (!domain) return { isValid: false, error: "Please enter a valid email address." };
    if (disallowedDomains.includes(domain)) {
      return {
        isValid: false,
        error: `Corporate domain required. Personal domain '@${domain}' is not permitted for recruiter signups. Please use your official company email (e.g. sarah@company.com).`,
      };
    }
    return { isValid: true };
  }

  // --- RECRUITER IDENTITY ---
  public getRecruiterIdentity(id = "recruiter-1"): RecruiterIdentity {
    return this.recruiterIdentities[id] || this.recruiterIdentities["recruiter-1"];
  }

  // --- CERTIFICATE MANAGEMENT ---
  public getCertificates(): CertificateRecord[] {
    return this.certificates;
  }

  public addCertificate(cert: CertificateRecord): void {
    this.certificates.unshift(cert);
    this.addNotification({
      userId: "admin-1",
      userRole: "ADMIN",
      title: "New Certificate Uploaded",
      message: `New certificate '${cert.name}' submitted for verification.`,
      type: "VERIFICATION",
    });
    this.addAuditLog("Alex Rivers", "JOB_SEEKER", "UPLOAD_CERTIFICATE", cert.name, "Submitted for verification.");
    this.notify();
  }

  public verifyCertificate(certId: string, verifiedBy = "Platform Owner Admin"): void {
    const cert = this.certificates.find((c) => c.id === certId);
    if (cert) {
      cert.status = "VERIFIED";
      cert.verifiedDate = new Date().toISOString().split("T")[0];
      cert.verifiedBy = verifiedBy;

      this.addNotification({
        userId: "seeker-1",
        userRole: "JOB_SEEKER",
        title: "Certificate Verified!",
        message: `Your certification '${cert.name}' has been officially verified by NextHire.`,
        type: "VERIFICATION",
      });
      this.addAuditLog(verifiedBy, "ADMIN", "VERIFY_CERTIFICATE", cert.name, "Certificate verified.");
      this.notify();
    }
  }

  // --- JOB CONTEXT ACTIONS ---
  public pauseJob(jobId: string): boolean {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = "PAUSED";
      this.addAuditLog("Sarah Jenkins", "RECRUITER", "PAUSE_JOB", job.title, "Job hiring paused.");
      this.notify();
      return true;
    }
    return false;
  }

  public reopenJob(jobId: string): boolean {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = "OPEN";
      this.addAuditLog("Sarah Jenkins", "RECRUITER", "REOPEN_JOB", job.title, "Job hiring reopened.");
      this.notify();
      return true;
    }
    return false;
  }

  public duplicateJob(jobId: string): SyncJob | null {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      const copy: SyncJob = {
        ...job,
        id: `job-${Date.now()}`,
        title: `${job.title} (Copy)`,
        postedDate: "Just now",
        applicantsCount: 0,
        status: "OPEN",
      };
      this.jobs.unshift(copy);
      this.addAuditLog("Sarah Jenkins", "RECRUITER", "DUPLICATE_JOB", copy.title, "Job duplicated.");
      this.notify();
      return copy;
    }
    return null;
  }

  public deleteJob(jobId: string, recruiterName = "Sarah Jenkins"): boolean {
    const jobIndex = this.jobs.findIndex((j) => j.id === jobId);
    if (jobIndex !== -1) {
      const job = this.jobs[jobIndex];
      job.status = "ARCHIVED";

      // Notify applicants
      const affected = this.applications.filter((a) => a.jobId === jobId);
      affected.forEach((app) => {
        this.addNotification({
          userId: app.candidateEmail,
          userRole: "JOB_SEEKER",
          title: `Job Post Archived: ${job.title}`,
          message: `${job.company} has archived the ${job.title} job posting.`,
          type: "JOB_CLOSED",
        });
      });

      this.addAuditLog(recruiterName, "RECRUITER", "DELETE_JOB", job.title, "Job posting archived and preserved for historical analytics.");
      this.notify();
      return true;
    }
    return false;
  }

  // --- JOB MANAGEMENT ---
  public getJobs(): SyncJob[] {
    return this.jobs;
  }

  public getJobById(id: string): SyncJob | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  // --- APPLICATION MANAGEMENT ---
  public getApplications(): SyncApplication[] {
    return this.applications;
  }

  public getApplicationsForCandidate(candidateEmail: string): SyncApplication[] {
    return this.applications.filter((a) => a.candidateEmail.toLowerCase() === candidateEmail.toLowerCase());
  }

  public getApplicationsForJob(jobId: string): SyncApplication[] {
    return this.applications.filter((a) => a.jobId === jobId);
  }

  // --- WORKFLOW ACTION: APPLY ---
  public applyForJob(jobId: string, candidate: { name: string; email: string; avatar?: string }): SyncApplication | null {
    const job = this.getJobById(jobId);
    if (!job || job.status === "FILLED" || job.status === "EXPIRED") return null;

    const newApp: SyncApplication = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      candidateAvatar: candidate.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      appliedDate: new Date().toISOString().split("T")[0],
      lastUpdated: "Just now",
      stage: "APPLIED",
      aiMatchScore: 94,
      resumeScore: 92,
      experience: "6+ years",
      location: candidate.name === "Alex Rivers" ? "San Francisco, CA" : "Remote",
      availability: "Immediate",
      salaryExpectation: job.salary,
      skills: job.requirements,
      starRating: 5,
      timeline: [
        {
          id: `t-${Date.now()}`,
          timestamp: "Just now",
          stage: "APPLIED",
          actorName: candidate.name,
          actorRole: "Candidate",
          description: "Application submitted via NextHire AI Direct Apply.",
          badgeType: "APPLIED",
        },
      ],
    };

    job.applicantsCount += 1;
    this.applications.unshift(newApp);

    // Notifications & Audit
    this.addNotification({
      userId: "recruiter-1",
      userRole: "RECRUITER",
      title: "New Job Application Received",
      message: `${candidate.name} applied for ${job.title}.`,
      type: "APPLICATION",
    });

    this.addAuditLog(candidate.name, "JOB_SEEKER", "SUBMIT_APPLICATION", job.title, `Applied to ${job.company}`);

    this.notify();
    return newApp;
  }

  // --- WORKFLOW ACTION: UPDATE STAGE ---
  public updateApplicationStage(appId: string, newStage: ApplicationStage, recruiterName = "Sarah Jenkins"): boolean {
    const app = this.applications.find((a) => a.id === appId);
    if (!app || app.stage === "WITHDRAWN") return false;

    app.stage = newStage;
    app.lastUpdated = "Just now";

    const newEvt: CandidateTimelineEvent = {
      id: `t-${Date.now()}`,
      timestamp: "Just now",
      stage: newStage,
      actorName: recruiterName,
      actorRole: "Lead Recruiter",
      description: `Application status updated to ${newStage}.`,
      badgeType: newStage === "OFFER" ? "OFFER" : newStage === "REJECTED" ? "REJECTED" : "NOTE",
    };

    app.timeline.unshift(newEvt);

    // Notify Job Seeker
    this.addNotification({
      userId: app.candidateEmail,
      userRole: "JOB_SEEKER",
      title: `Application Status Updated: ${newStage.replace("_", " ")}`,
      message: `${app.company} updated your application status for ${app.jobTitle} to ${newStage.replace("_", " ")}.`,
      type: newStage === "OFFER" ? "OFFER" : newStage === "REJECTED" ? "REJECTION" : "APPLICATION",
    });

    this.addAuditLog(recruiterName, "RECRUITER", "UPDATE_APPLICATION_STAGE", app.candidateName, `Moved to ${newStage}`);

    this.notify();
    return true;
  }

  // --- WORKFLOW ACTION: HIRE CANDIDATE & AUTO-CLOSE JOB ---
  public hireCandidate(appId: string, recruiterName = "Sarah Jenkins"): boolean {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) return false;

    app.stage = "HIRED";
    app.lastUpdated = "Just now";

    const job = this.getJobById(app.jobId);
    if (job) {
      job.status = "FILLED";
      
      // Auto-notify remaining active candidates that position has been filled
      const remainingApps = this.applications.filter(
        (a) => a.jobId === job.id && a.id !== appId && a.stage !== "REJECTED" && a.stage !== "WITHDRAWN"
      );

      remainingApps.forEach((rem) => {
        rem.stage = "REJECTED";
        rem.rejectionFeedback = {
          reason: "ROLE_CLOSED",
          recruiterComments: `Thank you for taking the time to interview with ${job.company}. We have selected a candidate and this position has now been filled. We encourage you to reapply for future roles!`,
          missingSkills: [],
          suggestedCertifications: [],
          resumeImprovementAdvice: "Keep your profile updated for upcoming engineering openings.",
          interviewImprovementAdvice: "Strong overall profile.",
          reapplicationEligibilityMonths: 3,
          sendEmailNotification: true,
          createdAt: new Date().toISOString(),
        };
        rem.timeline.unshift({
          id: `t-auto-${Date.now()}`,
          timestamp: "Just now",
          stage: "REJECTED",
          actorName: "System Automation",
          actorRole: "SYSTEM",
          description: "Position filled by selected candidate. Application concluded.",
          badgeType: "REJECTED",
        });

        this.addNotification({
          userId: rem.candidateEmail,
          userRole: "JOB_SEEKER",
          title: `Position Filled: ${job.title}`,
          message: `${job.company} has filled the ${job.title} position. Thank you for your application.`,
          type: "JOB_CLOSED",
        });
      });
    }

    this.addNotification({
      userId: app.candidateEmail,
      userRole: "JOB_SEEKER",
      title: "Congratulations! You have been Hired!",
      message: `Official congratulations from ${app.company}! You have been hired for ${app.jobTitle}.`,
      type: "OFFER",
    });

    this.addAuditLog(recruiterName, "RECRUITER", "HIRE_CANDIDATE", app.candidateName, `Hired for ${app.jobTitle}. Job auto-closed.`);

    this.notify();
    return true;
  }

  // --- WORKFLOW ACTION: WITHDRAW APPLICATION (CANDIDATE ONLY) ---
  public withdrawApplication(appId: string, candidateName = "Alex Rivers"): boolean {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) return false;

    app.stage = "WITHDRAWN";
    app.lastUpdated = "Just now";

    app.timeline.unshift({
      id: `t-w-${Date.now()}`,
      timestamp: "Just now",
      stage: "WITHDRAWN",
      actorName: candidateName,
      actorRole: "Candidate",
      description: "Application withdrawn by candidate.",
      badgeType: "NOTE",
    });

    this.addNotification({
      userId: "recruiter-1",
      userRole: "RECRUITER",
      title: "Candidate Withdrew Application",
      message: `${candidateName} has withdrawn their application for ${app.jobTitle}.`,
      type: "APPLICATION",
    });

    this.addAuditLog(candidateName, "JOB_SEEKER", "WITHDRAW_APPLICATION", app.jobTitle, "Candidate withdrew application.");

    this.notify();
    return true;
  }

  // --- USER VERIFICATION (ADMIN) ---
  public isUserVerified(userId: string): boolean {
    return !!this.verifiedUsers[userId];
  }

  public verifyUser(userId: string, approvedBy = "Platform Owner Admin"): void {
    this.verifiedUsers[userId] = true;
    this.addNotification({
      userId,
      userRole: "JOB_SEEKER",
      title: "Profile Verified!",
      message: "Your NextHire Job Seeker profile has been official verified by platform administrators.",
      type: "VERIFICATION",
    });
    this.addAuditLog(approvedBy, "ADMIN", "VERIFY_USER", userId, "User profile verified.");
    this.notify();
  }

  // --- NOTIFICATIONS & AUDIT LOGS ---
  public getNotifications(userRole: "JOB_SEEKER" | "RECRUITER" | "ADMIN"): SyncNotification[] {
    return this.notifications.filter((n) => n.userRole === userRole);
  }

  public getAuditLogs(): SyncAuditLog[] {
    return this.auditLogs;
  }

  private addNotification(n: Omit<SyncNotification, "id" | "timestamp" | "read">) {
    this.notifications.unshift({
      ...n,
      id: `notif-${Date.now()}`,
      timestamp: "Just now",
      read: false,
    });
  }

  private addAuditLog(actor: string, role: string, action: string, target: string, details: string) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      actor,
      role,
      action,
      target,
      details,
    });
  }
}

export const RecruitmentEngine = new RecruitmentEngineService();
