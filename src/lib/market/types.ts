/**
 * NextHire Phase 12 — Market & Talent Supply Intelligence Engine Types
 * Formal classification, metrics, distributions, and strategy recommendation types.
 */

export type MarketSourceType =
  | "PLATFORM_OBSERVED"
  | "PLATFORM_HISTORICAL"
  | "EXTERNAL_MARKET"
  | "INFERRED"
  | "ESTIMATED"
  | "INSUFFICIENT_DATA";

export type MarketConfidence = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

export type SkillScarcityLevel =
  | "ABUNDANT"
  | "HEALTHY"
  | "LIMITED"
  | "SCARCE"
  | "CRITICALLY_SCARCE"
  | "INSUFFICIENT_DATA";

export type RemoteSupplyLevel =
  | "REMOTE_SUPPLY_HEALTHY"
  | "REMOTE_SUPPLY_LIMITED"
  | "REMOTE_SUPPLY_SCARCE"
  | "INSUFFICIENT_DATA";

export type ConcentrationLevel =
  | "HIGH_CONCENTRATION"
  | "MODERATE_CONCENTRATION"
  | "DISTRIBUTED"
  | "INSUFFICIENT_DATA";

export type SupplyConstraintType =
  | "SUPPLY_CONSTRAINT"
  | "FUNNEL_CONSTRAINT"
  | "BOTH"
  | "INSUFFICIENT_DATA";

export type StrategyCategory =
  | "EXPAND_LOCATION"
  | "EXPAND_REMOTE"
  | "RELAX_NONCRITICAL_SKILL"
  | "RELAX_EXPERIENCE_REQUIREMENT"
  | "SOURCE_VERIFIED_CANDIDATES"
  | "SOURCE_ADJACENT_SKILLS"
  | "PRIORITIZE_UNDERREPRESENTED_REGION"
  | "CONTINUE_CURRENT_SOURCING"
  | "FIX_FUNNEL_BEFORE_SOURCING";

export type SeniorityLevel =
  | "ENTRY"
  | "JUNIOR"
  | "MID"
  | "SENIOR"
  | "LEAD"
  | "PRINCIPAL"
  | "EXECUTIVE";

export interface SourceMetadata {
  sourceType: MarketSourceType;
  sampleSize: number;
  dataWindow: string; // e.g. "last_90_days" | "active_discoverable_pool"
  lastUpdated: Date;
  confidence: MarketConfidence;
  disclaimer: string;
}

export interface TalentSupplySummary {
  totalDiscoverable: number;
  totalMatching: number;
  qualifiedCount: number;
  verifiedCount: number;
  partiallyVerifiedCount: number;
  unverifiedCount: number;
  concentration: ConcentrationLevel;
  sourceMetadata: SourceMetadata;
}

export interface SkillSupplyMetric {
  skill: string;
  matchingCount: number;
  verifiedCount: number;
  poolPercentage: number;
  relativeScarcity: SkillScarcityLevel;
  confidence: MarketConfidence;
  evidence: string[];
  adjacentSkills: string[];
}

export interface LocationSupplyMetric {
  city: string;
  country: string;
  totalCandidates: number;
  qualifiedCandidates: number;
  verifiedCandidates: number;
  percentageOfPool: number;
}

export interface RemoteSupplyMetric {
  remotePreference: string;
  candidateCount: number;
  percentageOfPool: number;
  status: RemoteSupplyLevel;
  summary: string;
}

export interface SenioritySupplyMetric {
  level: SeniorityLevel;
  totalCount: number;
  qualifiedCount: number;
  verifiedCount: number;
  avgExperienceYears: number;
  percentageOfPool: number;
}

export interface SupplyVsFunnelResult {
  jobId: string;
  jobTitle: string;
  classification: SupplyConstraintType;
  totalMatchingSupply: number;
  qualifiedSupply: number;
  verifiedSupply: number;
  funnelApplications: number;
  funnelShortlisted: number;
  funnelInterviews: number;
  funnelOffers: number;
  funnelHealthScore: number;
  diagnosisSummary: string;
  evidence: string[];
  recommendation: string;
  confidence: MarketConfidence;
  sourceMetadata: SourceMetadata;
}

export interface RequirementRelaxationSimulation {
  parameter: string; // e.g. "Kubernetes (Remove Skill)", "Experience (8 -> 5 yrs)", "Location (Bengaluru -> All India Remote)"
  originalValue: string;
  relaxedValue: string;
  originalPoolSize: number;
  relaxedPoolSize: number;
  poolGainPercentage: number;
  feasibilityRisk: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
}

export interface RequirementStrictnessResult {
  jobId: string;
  jobTitle: string;
  baselinePoolSize: number;
  simulations: RequirementRelaxationSimulation[];
  mostRestrictiveRequirement: string;
  overallStrictnessScore: number; // 0-100 (100 = hyper restrictive)
  summary: string;
  sourceMetadata: SourceMetadata;
}

export interface MarketTrendMetric {
  period: "7d" | "30d" | "90d" | "180d";
  sampleSize: number;
  candidateGrowthRate: number; // percentage e.g. +12%
  qualifiedGrowthRate: number;
  topGrowingSkills: Array<{ skill: string; growthPercentage: number }>;
  remoteCandidateGrowthRate: number;
  isSufficientData: boolean;
  baselineComparisonPeriod: string;
  sourceMetadata: SourceMetadata;
}

export interface SourcingRecommendation {
  id: string;
  category: StrategyCategory;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  reason: string;
  evidence: string;
  confidence: MarketConfidence;
  expectedImpact: string;
  ctaText: string;
  ctaUrl: string;
  requiresConfirmation: boolean;
}

export interface JobMarketIntelligence {
  jobId: string;
  jobTitle: string;
  companyId: string;
  talentSupply: TalentSupplySummary;
  skillScarcity: SkillSupplyMetric[];
  topLocations: LocationSupplyMetric[];
  remoteSupply: RemoteSupplyMetric[];
  senioritySupply: SenioritySupplyMetric[];
  supplyVsFunnel: SupplyVsFunnelResult;
  requirementStrictness: RequirementStrictnessResult;
  recommendations: SourcingRecommendation[];
  sourceMetadata: SourceMetadata;
}

export interface MarketOverview {
  companyId: string;
  totalActiveJobs: number;
  totalDiscoverableTalent: number;
  talentConcentration: ConcentrationLevel;
  topScarcitySkills: SkillSupplyMetric[];
  topLocations: LocationSupplyMetric[];
  remoteDistribution: RemoteSupplyMetric[];
  seniorityDistribution: SenioritySupplyMetric[];
  jobMarketSummaries: Array<{
    jobId: string;
    jobTitle: string;
    supplyLevel: SkillScarcityLevel;
    qualifiedCount: number;
    verifiedCount: number;
    supplyVsFunnel: SupplyConstraintType;
    primaryBottleneckOrRisk: string;
  }>;
  recentTrends: MarketTrendMetric;
  topRecommendations: SourcingRecommendation[];
  sourceMetadata: SourceMetadata;
}
