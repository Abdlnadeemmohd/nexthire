export type CopilotIntentType =
  | "SEARCH_CANDIDATES"
  | "EXPLAIN_CANDIDATE_FIT"
  | "ANALYZE_JOB_PIPELINE"
  | "TALENT_REDISCOVERY"
  | "GET_RECRUITER_TASKS"
  | "GET_RECRUITER_METRICS"
  | "GET_OUTREACH_CAMPAIGNS"
  | "GET_CAMPAIGN_METRICS"
  | "PAUSE_OUTREACH_CAMPAIGN"
  | "PREPARE_INTERVIEW"
  | "SUMMARIZE_INTERVIEW"
  | "GET_INCOMPLETE_SCORECARDS"
  | "COMPARE_CANDIDATES"
  | "CHECK_EVIDENCE_CONFLICTS"
  | "GET_HIRING_FUNNEL"
  | "GET_JOB_HEALTH"
  | "GET_BOTTLENECKS"
  | "GET_STALLED_CANDIDATES"
  | "GET_RECRUITER_WORKLOAD"
  | "GET_HIRING_RISKS"
  | "GET_RECOMMENDED_ACTIONS"
  | "COMPARE_HIRING_FUNNEL"
  | "EXECUTE_RECRUITER_ACTION"
  // --- PHASE 12: MARKET & TALENT SUPPLY INTELLIGENCE ---
  | "GET_TALENT_SUPPLY"
  | "GET_SKILL_SCARCITY"
  | "GET_LOCATION_SUPPLY"
  | "GET_REMOTE_SUPPLY"
  | "GET_SENIORITY_SUPPLY"
  | "GET_SUPPLY_VS_FUNNEL"
  | "GET_MARKET_TRENDS"
  | "GET_SOURCING_STRATEGY"
  | "GET_REQUIREMENT_STRICTNESS"
  // --- PHASE 13: RECRUITER GROWTH, TEAM COLLABORATION & HIRING OPERATIONS ---
  | "GET_TEAM_WORKLOAD"
  | "GET_UNASSIGNED_WORK"
  | "GET_RECRUITER_CAPACITY"
  | "GET_HANDOFFS"
  | "GET_DUPLICATE_WORK"
  | "GET_TEAM_FUNNEL"
  | "GET_TEAM_ACTIVITY"
  | "GET_ASSIGNMENT_RECOMMENDATION"
  | "GET_TEAM_BOTTLENECKS"
  | "GET_COLLABORATION_ACTIONS"
  // --- PHASE 14: EXECUTIVE HIRING INTELLIGENCE & FORECASTING ---
  | "GET_EXECUTIVE_OVERVIEW"
  | "GET_HIRING_PLAN_STATUS"
  | "GET_HIRING_FORECAST"
  | "GET_EXECUTIVE_HIRING_RISKS"
  | "GET_EXECUTIVE_TIME_TO_HIRE"
  | "GET_HIRING_EFFICIENCY"
  | "GET_SOURCE_ROI"
  | "GET_ORGANIZATIONAL_BOTTLENECKS"
  | "GET_EXECUTIVE_RECOMMENDATIONS"
  | "GET_COST_INTELLIGENCE"
  | "GENERAL_HIRING_ADVICE";

export interface ParsedSearchCriteria {
  role?: string;
  seniority?: "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "PRINCIPAL";
  minExperienceYears?: number;
  skills: string[];
  preferredSkills?: string[];
  location?: string;
  country?: string;
  remotePreference?: "REMOTE_ONLY" | "HYBRID" | "ON_SITE" | "ANY";
  industry?: string;
  education?: string;
  limit?: number;
  offset?: number;
}

export interface CandidateFitEvidence {
  skill: string;
  evidenceType: "EXPLICIT_SKILL" | "EXPERIENCE_ROLE" | "PROJECT_ACHIEVEMENT" | "CERTIFICATION";
  description: string;
  yearsOfExperience?: number;
}

export interface CandidateFitGap {
  skillOrRequirement: string;
  severity: "CRITICAL" | "MODERATE" | "MINOR";
  description: string;
}

export interface ExplainableCandidateFit {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  overallScore: number; // 0 - 100
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  strongEvidence: CandidateFitEvidence[];
  potentialGaps: CandidateFitGap[];
  suggestedVerificationQuestions: string[];
  sourceSummary: {
    skillsMatchedCount: number;
    skillsTotalCount: number;
    hasRelevantTitle: boolean;
    locationMatch: boolean;
    remoteCompatible: boolean;
  };
}

export interface PipelineStageBreakdown {
  stage: string;
  count: number;
  percentageOfTotal: number;
}

export interface JobPipelineDiagnosis {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  activeCandidatesCount: number;
  stageBreakdown: PipelineStageBreakdown[];
  conversionRates: {
    screenToShortlist: number; // percentage
    shortlistToInterview: number; // percentage
    interviewToOffer: number; // percentage
    overallOfferRate: number; // percentage
  };
  bottlenecks: Array<{
    stage: string;
    description: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    observedFact: string;
    inferredInsight: string;
    actionableRecommendation: string;
  }>;
  slaStatus: {
    totalApproachingSLA: number;
    totalBreachedSLA: number;
  };
}

export interface RediscoveredCandidate {
  candidateId: string;
  name: string;
  headline: string;
  location?: string;
  previousJobTitle: string;
  previousStageReached: string;
  appliedDate: string;
  currentMatchScore: number;
  isSilverMedalist: boolean;
  matchingSkills: string[];
}

export interface NeedsAttentionTask {
  id: string;
  type:
    | "SLA_WARNING"
    | "SHORTLISTED_PENDING_INTERVIEW"
    | "UNANSWERED_CANDIDATE"
    | "OVERDUE_SCORECARD"
    | "OFFER_EXPIRING"
    | "HIGH_FIT_NOT_CONTACTED";
  priority: "CRITICAL" | "IMPORTANT" | "NORMAL";
  title: string;
  description: string;
  entityId: string;
  entityType: "APPLICATION" | "INTERVIEW" | "OFFER" | "CANDIDATE" | "JOB";
  ctaText: string;
  ctaUrl: string;
  targetCount: number;
}

export interface RecruiterActionProposal {
  actionType: "SHORTLIST" | "MOVE_STAGE" | "REJECT" | "PREPARE_MESSAGE";
  targetCandidateId?: string;
  targetCandidateName?: string;
  targetApplicationId?: string;
  targetJobId?: string;
  targetJobTitle?: string;
  newStage?: string;
  rejectionReason?: string;
  notes?: string;
  affectedCount: number;
  requiresConfirmation: boolean;
  confirmationMessage: string;
  stateChanging: boolean;
}

export interface CopilotChatResponse {
  intent: CopilotIntentType;
  answer: string;
  toolUsed: string;
  data?: {
    candidates?: Array<{
      id: string;
      name: string;
      headline: string;
      location?: string;
      skills: string[];
      matchScore?: number;
      isDiscoverable: boolean;
      avatar?: string;
    }>;
    fitAnalysis?: ExplainableCandidateFit;
    pipelineDiagnosis?: JobPipelineDiagnosis;
    rediscoveredCandidates?: RediscoveredCandidate[];
    needsAttentionTasks?: NeedsAttentionTask[];
    metrics?: {
      totalActiveJobs: number;
      totalPipelineCandidates: number;
      totalPendingReviews: number;
      totalInterviewsScheduled: number;
    };
    actionProposal?: RecruiterActionProposal;
    actionResult?: {
      success: boolean;
      message: string;
      auditEventId?: string;
    };
  };
  suggestions: string[];
}
