import {
  OutreachCampaignStatus,
  OutreachMessageType,
  PersonalizationLevel,
  OutreachRecipientStatus,
  ResponseClassification,
  EngagementIntent,
} from "@prisma/client";

export type {
  OutreachCampaignStatus,
  OutreachMessageType,
  PersonalizationLevel,
  OutreachRecipientStatus,
  ResponseClassification,
  EngagementIntent,
};

export interface CandidateEvidenceSummary {
  hasAssessment: boolean;
  assessmentTitle?: string;
  overallScore?: number;
  demonstratedSkills: string[];
  topEvidenceSnippet?: string;
}

export interface OutreachCandidateData {
  id: string;
  name: string;
  email: string;
  headline?: string | null;
  location?: string | null;
  skills: string[];
  experienceSummary?: string | null;
  assessmentEvidence?: CandidateEvidenceSummary;
  applicationId?: string | null;
  isOptedOut?: boolean;
}

export interface OutreachJobData {
  id: string;
  title: string;
  companyName: string;
  requiredSkills: string[];
  location?: string;
  isRemote?: boolean;
}

export interface GeneratedOutreachDraft {
  stepOrder: number;
  delayDays: number;
  messageType: OutreachMessageType;
  personalizationLevel: PersonalizationLevel;
  subject: string;
  body: string;
  groundedFacts: string[];
  missingDataWarnings: string[];
  suggestedCta: string;
}

export interface DuplicateContactWarning {
  candidateId: string;
  candidateName: string;
  isDuplicate: boolean;
  hasRecentContact: boolean;
  lastContactDate?: string;
  lastMessageSnippet?: string;
  hasActiveInterview: boolean;
  activeInterviewStage?: string;
  hasActiveCampaign: boolean;
  activeCampaignName?: string;
  isOptedOut: boolean;
  warningSeverity: "NONE" | "LOW" | "MODERATE" | "HIGH" | "BLOCKING";
  warningMessage?: string;
  recommendation: string;
}

export interface ResponseClassificationResult {
  classification: ResponseClassification;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  engagementIntent: EngagementIntent;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  suggestedNextAction: string;
  suggestedActionType: "SCHEDULE_INTERVIEW" | "SEND_JOB_DETAILS" | "PROVIDE_SALARY" | "SEND_FOLLOW_UP" | "RESPECT_OPT_OUT" | "NO_ACTION";
  summary: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  status: OutreachCampaignStatus;
  totalRecipients: number;
  draftCount: number;
  approvedCount: number;
  sentCount: number;
  deliveredCount: number;
  repliedCount: number;
  positiveReplyCount: number;
  interviewsCount: number;
  optedOutCount: number;
  bouncedCount: number;
  deliveryRate: number | null; // null if sent = 0
  replyRate: number | null; // null if delivered = 0
  positiveReplyRate: number | null; // null if replied = 0
  interviewConversionRate: number | null; // null if replied = 0
}
