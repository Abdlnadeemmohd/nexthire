export type ExecutiveRiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type HiringPlanStatus = "TARGET" | "IN_PROGRESS" | "AT_RISK" | "BEHIND" | "COMPLETED";

export type ExecutiveReportPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY";

export type TimeToHireBottleneck =
  | "RECRUITER_REVIEW"
  | "CANDIDATE_RESPONSE"
  | "INTERVIEW_SCHEDULING"
  | "SCORECARD_DELAY"
  | "OFFER_DELAY"
  | "APPROVAL_DELAY"
  | "SUPPLY_CONSTRAINT"
  | "UNKNOWN";

export type RiskCategory =
  | "HIRING_TARGET_RISK"
  | "REQUISITION_RISK"
  | "PIPELINE_RISK"
  | "SUPPLY_RISK"
  | "CAPACITY_RISK"
  | "SLA_RISK"
  | "INTERVIEW_RISK"
  | "OFFER_RISK"
  | "TEAM_OVERLOAD"
  | "DATA_QUALITY_RISK";

export interface DataLimitation {
  isSufficientData: boolean;
  sampleSize: number;
  reason?: string;
  minimumThreshold?: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  assumptions: string[];
}

export interface ExecutiveOverviewMetrics {
  openRequisitions: number;
  filledPositions: number;
  jobsAtRisk: number;
  activeCandidates: number;
  interviewsScheduled: number;
  offersOutstanding: number;
  hiresCompleted: number;
  averageTimeToHireDays: number | null;
  medianTimeToHireDays: number | null;
  averageTimeToFillDays: number | null;
  medianTimeToFillDays: number | null;
  offerAcceptanceRate: number | null;
  applicationToInterviewConversion: number | null;
  interviewToOfferConversion: number | null;
  offerToHireConversion: number | null;
  hiringTargetProgressPercentage: number | null;
  recruiterCapacityScore: number | null;
  criticalBottlenecksCount: number;
  supplyConstraintsCount: number;
  funnelConstraintsCount: number;
  limitations: DataLimitation;
}

export interface HiringPlanProgress {
  planId: string;
  companyId: string;
  title: string;
  department: string;
  targetHires: number;
  completedHires: number;
  progressPercentage: number;
  startDate: string;
  targetDate: string;
  budget: number | null;
  priority: string;
  status: HiringPlanStatus;
  rolesCount: number;
  rolesSummary: Array<{
    roleId: string;
    roleTitle: string;
    targetHires: number;
    filledHires: number;
    status: HiringPlanStatus;
    jobId?: string | null;
    recruiterName?: string | null;
  }>;
  isSufficientData: boolean;
  limitations: DataLimitation;
}

export interface ForecastResult {
  expectedCompletionDate: string | null;
  projectedOpenRequisitions: number;
  expectedHiringVelocityPerMonth: number;
  riskOfMissingTargetScore: number; // 0 - 100
  targetBreachRiskLevel: ExecutiveRiskLevel;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  sampleSize: number;
  historicalWindowDays: number;
  assumptions: string[];
  dataLimitations: string;
}

export interface StageTimeToHireMetric {
  stageName: string;
  averageDays: number | null;
  medianDays: number | null;
  p75Days: number | null;
  bottleneckType: TimeToHireBottleneck;
  candidateCount: number;
}

export interface TimeToHireAnalysis {
  overallAverageDays: number | null;
  overallMedianDays: number | null;
  stages: StageTimeToHireMetric[];
  primaryBottleneckStage: string | null;
  primaryBottleneckType: TimeToHireBottleneck;
  limitations: DataLimitation;
}

export interface CostAndRoiIntelligence {
  platformCostTotal: number | null;
  jobSpendTotal: number | null;
  costPerHire: number | null;
  costPerInterview: number | null;
  costPerQualifiedCandidate: number | null;
  costPerSuccessfulOutreach: number | null;
  recruiterProductivityScore: number | null;
  pipelineEfficiencyRatio: number | null;
  dataStatus: "AVAILABLE" | "DATA_NOT_AVAILABLE" | "PARTIAL";
  explanation: string;
}

export interface CapacityForecast {
  totalRecruiters: number;
  overloadedRecruitersCount: number;
  optimalRecruitersCount: number;
  underloadedRecruitersCount: number;
  averageCapacityLoadPercentage: number;
  projectedStaffingBottleneck: boolean;
  recommendedHiresRequired: number;
  limitations: DataLimitation;
}

export interface OrganizationalRiskItem {
  riskId: string;
  category: RiskCategory;
  riskLevel: ExecutiveRiskLevel;
  observedFacts: string[];
  reason: string;
  affectedJobsCount: number;
  affectedCandidatesCount: number;
  affectedJobIds: string[];
  recommendedAction: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  dataLimitations: string;
}

export interface SourcingChannelRoiItem {
  channelName: string;
  sourceType: string;
  totalOutreachOrCandidates: number;
  qualifiedCandidates: number;
  interviewsResulting: number;
  hiresResulting: number;
  conversionToQualifiedRate: number;
  conversionToHireRate: number;
  efficiencyRating: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
}

export interface InternalBenchmarkItem {
  metricName: string;
  currentCompanyValue: number | null;
  companyHistoricalMedian: number | null;
  sampleSize: number;
  isSufficientData: boolean;
  variancePercentage: number | null;
  explanation: string;
}

export interface ExecutiveReportData {
  reportId?: string;
  companyId: string;
  companyName: string;
  title: string;
  period: ExecutiveReportPeriod;
  startDate: string;
  endDate: string;
  generatedAt: string;
  executiveSummary: string;
  hiringProgress: {
    targetHires: number;
    completedHires: number;
    progressPercentage: number;
    openRequisitions: number;
  };
  funnelPerformance: {
    totalApplications: number;
    totalInterviews: number;
    totalOffers: number;
    totalHires: number;
    overallConversionRate: number;
  };
  timeToHire: {
    averageDays: number | null;
    medianDays: number | null;
    primaryBottleneck: string | null;
  };
  recruiterCapacity: {
    totalRecruiters: number;
    averageLoadPercentage: number;
    status: string;
  };
  risksSummary: OrganizationalRiskItem[];
  talentSupplySummary: string;
  completedHiresCount: number;
  outstandingOffersCount: number;
  recommendations: Array<{
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    action: string;
    rationale: string;
    expectedImpact: string;
  }>;
  dataLimitations: string[];
}

export interface ExecutiveCopilotResponse {
  intent: string;
  observedData: string;
  insights: string;
  risks: string;
  forecast: string;
  recommendations: string;
  dataLimitations: string;
  followUpSuggestions: string[];
}
