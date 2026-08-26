/**
 * NextHire Phase 11 — Hiring Funnel Intelligence & Recruiter Strategy Engine
 * Type definitions for funnels, bottlenecks, stalled candidates, workload, and recommendations.
 */

export type FunnelStageName =
  | "APPLICATION"
  | "REVIEWING"
  | "SHORTLISTED"
  | "ASSESSMENT"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export type HealthStatus = "HEALTHY" | "WATCH" | "AT_RISK" | "CRITICAL";

export type WorkloadStatus = "NORMAL" | "BUSY" | "OVERLOADED" | "CRITICAL";

export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type BottleneckType =
  | "APPLICATION_BACKLOG"
  | "REVIEW_BACKLOG"
  | "SHORTLIST_BACKLOG"
  | "ASSESSMENT_BACKLOG"
  | "INTERVIEW_BACKLOG"
  | "SCORECARD_BACKLOG"
  | "OFFER_BACKLOG"
  | "OUTREACH_BACKLOG";

export type RecommendationCategory =
  | "REVIEW_BACKLOG"
  | "SOURCE_MORE_CANDIDATES"
  | "CONTACT_HIGH_FIT"
  | "SCHEDULE_INTERVIEW"
  | "COMPLETE_SCORECARD"
  | "FOLLOW_UP_CANDIDATE"
  | "FOLLOW_UP_OFFER"
  | "IMPROVE_JOB_DESCRIPTION"
  | "ADJUST_SOURCING"
  | "REVIEW_FUNNEL"
  | "INVESTIGATE_WITHDRAWALS";

export interface StageMetric {
  stage: FunnelStageName;
  entrants: number;
  exits: number;
  activeCount: number;
  conversionRate: number | null; // null if entrants is 0
  dropOffRate: number | null;
  medianTimeHours: number | null;
  avgTimeHours: number | null;
}

export interface FunnelHealthSignal {
  id: string;
  type: "WARNING" | "CRITICAL" | "POSITIVE" | "INFO";
  title: string;
  description: string;
  metric: string;
  threshold: string;
  observedValue: string | number;
}

export interface GroundedEvidenceItem {
  key: string;
  label: string;
  value: string | number;
  source: string; // e.g. "PostgreSQL Application Table", "InterviewScorecard Table"
}

export interface FunnelHealthScore {
  score: number; // 0 - 100
  status: HealthStatus;
  signals: FunnelHealthSignal[];
  evidence: GroundedEvidenceItem[];
  calculationSummary: string;
}

export interface JobFunnelMetrics {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  activeApplications: number;
  stages: StageMetric[];
  qualifiedCount: number;
  qualifiedRate: number | null;
  timeToFirstReviewHours: number | null;
  timeToShortlistHours: number | null;
  timeToInterviewHours: number | null;
  timeToOfferHours: number | null;
  timeToHireHours: number | null;
  overallConversionRate: number | null;
  rejectionRate: number | null;
  withdrawalRate: number | null;
  offerAcceptanceRate: number | null;
  health: FunnelHealthScore;
}

export interface BottleneckItem {
  id: string;
  type: BottleneckType;
  severity: PriorityLevel;
  jobId: string;
  jobTitle: string;
  affectedCount: number;
  oldestAgeDays: number;
  thresholdDays: number;
  evidence: string;
  recommendedAction: string;
}

export interface StalledCandidate {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  currentStage: string;
  daysInStage: number;
  expectedThresholdDays: number;
  riskLevel: PriorityLevel;
  lastActivityAt: Date;
  matchScore: number;
  recommendedAction: string;
}

export interface RecruiterWorkload {
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  activeJobsCount: number;
  activeCandidatesCount: number;
  pendingReviewsCount: number;
  pendingScorecardsCount: number;
  pendingOutreachApprovalsCount: number;
  upcomingInterviewsCount: number;
  overdueTasksCount: number;
  workloadScore: number; // 0 - 100
  status: WorkloadStatus;
  explanation: string;
}

export interface StrategicRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: PriorityLevel;
  title: string;
  reason: string;
  evidence: string;
  expectedImpact: string; // Conservative language, e.g. "likely to unblock 4 candidates in interview stage"
  confidence: ConfidenceLevel;
  entityType: "JOB" | "APPLICATION" | "INTERVIEW" | "OUTREACH" | "ASSESSMENT" | "RECRUITER";
  entityId?: string;
  entityName?: string;
  ctaText: string;
  ctaUrl: string;
}

export interface HistoricalComparison {
  metricName: string;
  currentJobValue: number | string;
  companyHistoricalMedian: number | string | null;
  categoryMedian: number | string | null;
  sampleSize: number;
  isSufficientData: boolean;
  summary: string;
}

export interface HiringTargetRisk {
  jobId: string;
  jobTitle: string;
  targetHiringDate: Date | null;
  daysRemaining: number | null;
  estimatedDaysToHire: number | null;
  velocityStatus: "ON_TRACK" | "WATCH" | "AT_RISK" | "CRITICAL" | "INSUFFICIENT_DATA";
  explanation: string;
}

export interface IntelligenceOverview {
  companyId: string;
  totalActiveJobs: number;
  totalActiveCandidates: number;
  overallFunnelHealth: HealthStatus;
  criticalBottlenecksCount: number;
  stalledCandidatesCount: number;
  overdueTasksCount: number;
  workloadDistribution: {
    normal: number;
    busy: number;
    overloaded: number;
    critical: number;
  };
  jobsSummary: {
    overallHealth: HealthStatus;
    averageHealthScore: number;
    activeJobsCount: number;
    totalApplications: number;
    totalActive: number;
    totalQualified: number;
    jobFunnels: JobFunnelMetrics[];
  };
  bottlenecks: BottleneckItem[];
  stalledCandidates: StalledCandidate[];
  strategicRecommendations: StrategicRecommendation[];
  topUrgentActions: StrategicRecommendation[];
  hiringTargetRisks?: Array<{
    jobId: string;
    jobTitle: string;
    targetHiringDate: Date | null;
    daysUntilTarget: number | null;
    estimatedTimeToHireDays: number | null;
    hiresNeeded: number;
    hiresRemaining: number;
    velocityStatus: "ON_TRACK" | "BEHIND" | "AT_RISK" | "CRITICAL" | "INSUFFICIENT_DATA";
    explanation: string;
  }>;
  myWorkload?: RecruiterWorkload | null;
  jobsHealthList: {
    jobId: string;
    jobTitle: string;
    healthStatus: HealthStatus;
    healthScore: number;
    totalApplications: number;
    primaryBottleneck: string | null;
    qualifiedCount: number;
  }[];
  generatedAt: Date;
}
