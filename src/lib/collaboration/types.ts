/**
 * NextHire Phase 13 — Recruiter Growth, Team Collaboration & Hiring Operations
 * Exhaustive TypeScript interfaces and domain types.
 */

import {
  TeamRole,
  AssignmentStatus,
  HandoffStatus,
  CollaborationNoteType,
  HiringTaskPriority,
  HiringTaskStatus,
} from "@prisma/client";

export {
  TeamRole,
  AssignmentStatus,
  HandoffStatus,
  CollaborationNoteType,
  HiringTaskPriority,
  HiringTaskStatus,
};

export type WorkloadLevel = "NORMAL" | "BUSY" | "OVERLOADED" | "CRITICAL";

export type AssignmentStrategy =
  | "ASSIGN_TO_LEAST_LOADED"
  | "ASSIGN_BY_JOB_EXPERTISE"
  | "ASSIGN_BY_LOCATION"
  | "ASSIGN_BY_ROLE_EXPERIENCE"
  | "ASSIGN_BY_CURRENT_PIPELINE_CONTEXT"
  | "KEEP_CURRENT_OWNER"
  | "ESCALATE_TO_TEAM_LEAD";

export interface RecruiterMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  headline: string | null;
  role: string;
  teamRole: TeamRole;
  teamId: string | null;
  teamName: string | null;
  assignedCandidatesCount: number;
  assignedJobsCount: number;
  activeTasksCount: number;
  pendingReviewsCount: number;
  pendingScorecardsCount: number;
  overdueTasksCount: number;
  workloadScore: number;
  workloadStatus: WorkloadLevel;
}

export interface CandidateAssignmentRecord {
  id: string;
  companyId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  applicationId: string | null;
  jobId: string | null;
  jobTitle: string | null;
  recruiterId: string;
  recruiterName: string;
  teamId: string | null;
  teamName: string | null;
  assignedById: string;
  assignedByName: string;
  reason: string | null;
  status: AssignmentStatus;
  assignedAt: string;
  unassignedAt: string | null;
}

export interface RecruiterHandoffRecord {
  id: string;
  companyId: string;
  fromRecruiterId: string;
  fromRecruiterName: string;
  toRecruiterId: string;
  toRecruiterName: string;
  candidateId: string;
  candidateName: string;
  applicationId: string | null;
  jobId: string | null;
  jobTitle: string | null;
  reason: string;
  currentStage: string;
  completedWork: string[];
  pendingWork: string[];
  importantEvidence: string | null;
  nextRecommendedAction: string | null;
  status: HandoffStatus;
  dueAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export interface CollaborationNoteRecord {
  id: string;
  companyId: string;
  authorId: string;
  authorName: string;
  candidateId: string;
  candidateName: string;
  applicationId: string | null;
  jobId: string | null;
  jobTitle: string | null;
  noteType: CollaborationNoteType;
  content: string;
  mentions: Array<{ userId: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface HiringTaskRecord {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  priority: HiringTaskPriority;
  status: HiringTaskStatus;
  assigneeId: string;
  assigneeName: string;
  creatorId: string;
  creatorName: string;
  candidateId: string | null;
  candidateName: string | null;
  applicationId: string | null;
  jobId: string | null;
  jobTitle: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export type DuplicateWorkType =
  | "CONCURRENT_OUTREACH"
  | "SIMULTANEOUS_REVIEW"
  | "OVERLAPPING_NOTES"
  | "MULTIPLE_ASSIGNMENTS";

export interface DuplicateWorkAlert {
  id: string;
  type: DuplicateWorkType;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  candidateId: string;
  candidateName: string;
  jobId: string | null;
  jobTitle: string | null;
  participants: Array<{ recruiterId: string; recruiterName: string; role: string }>;
  description: string;
  existingActivity: string;
  recommendedResolution: string;
  detectedAt: string;
}

export interface SmartAssignmentRecommendation {
  candidateId: string;
  candidateName: string;
  jobId: string | null;
  jobTitle: string | null;
  recommendedRecruiterId: string;
  recommendedRecruiterName: string;
  recommendedRecruiterEmail: string;
  strategy: AssignmentStrategy;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasonSummary: string;
  evidence: string[];
  candidateCurrentWorkload: number;
  currentOwnerName?: string | null;
}

export interface TeamWorkloadOverview {
  companyId: string;
  totalRecruiters: number;
  distribution: {
    normal: number;
    busy: number;
    overloaded: number;
    critical: number;
  };
  members: RecruiterMember[];
  unassignedCandidatesCount: number;
  unassignedJobsCount: number;
  overloadedRecruiters: RecruiterMember[];
}

export interface TeamProductivityMetrics {
  recruiterId: string;
  recruiterName: string;
  applicationsReviewed: number;
  candidatesProgressed: number;
  interviewsCompleted: number;
  scorecardsCompleted: number;
  outreachCompleted: number;
  tasksCompleted: number;
  avgReviewTimeHours: number | null;
  avgHandoffTimeHours: number | null;
  slaAdherenceRate: number | null;
  sampleSize: number;
  isSufficientData: boolean;
  contextualNote: string;
}

export interface TeamFunnelStageConversion {
  stage: string;
  entrants: number;
  exits: number;
  conversionRate: number | null;
  dropOffRate: number | null;
}

export interface TeamFunnelMetrics {
  companyId: string;
  totalApplications: number;
  stages: TeamFunnelStageConversion[];
  overallConversionRate: number | null;
  offerAcceptanceRate: number | null;
  sampleSize: number;
  isSufficientData: boolean;
}

export interface TeamActivityItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: "CANDIDATE" | "JOB" | "HANDOFF" | "TASK" | "NOTE" | "SCORECARD";
  targetId: string;
  targetName: string;
  summary: string;
  metadata?: Record<string, any>;
}

export interface TeamOverviewResponse {
  companyId: string;
  companyName: string;
  teams: Array<{
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
  }>;
  members: RecruiterMember[];
  workload: TeamWorkloadOverview;
  unassignedCandidates: CandidateAssignmentRecord[];
  activeHandoffs: RecruiterHandoffRecord[];
  duplicateWorkAlerts: DuplicateWorkAlert[];
  recentActivity: TeamActivityItem[];
}
