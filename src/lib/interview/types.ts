import {
  InterviewerRecommendation,
  InterviewDecisionType,
  EvidenceQualityLevel,
} from "@prisma/client";

export type CompetencyVerificationStatus = "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED";

export type {
  InterviewerRecommendation,
  InterviewDecisionType,
  EvidenceQualityLevel,
};

export interface GroundedInterviewQuestion {
  id: string;
  category: string;
  competency: string;
  question: string;
  followUp: string;
  evidenceToLookFor: string;
  redFlags: string;
  verificationStatus: CompetencyVerificationStatus;
  rationale: string;
}

export interface GroundedInterviewPlan {
  id?: string;
  interviewId: string;
  companyId: string;
  jobId?: string | null;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  interviewType: string;
  durationMinutes: number;
  objectives: string[];
  competencies: string[];
  questions: GroundedInterviewQuestion[];
  unverifiedGaps: string[];
  verifiedCompetencies: string[];
  partiallyVerifiedCompetencies: string[];
  createdAt?: string;
}

export interface CompetencyScoreInput {
  competency: string;
  score: number; // 1 - 5
  observedEvidence?: string;
  interviewerOpinion?: string;
  aiInference?: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  recommendation?: string;
}

export interface StructuredNotesResult {
  strengths: string[];
  concerns: string[];
  observedEvidence: Array<{
    competency: string;
    fact: string;
    source: "INTERVIEW_STATEMENT" | "CODE_DEMO" | "WORK_SAMPLE";
  }>;
  unverifiedAreas: string[];
  followUpQuestions: string[];
  sanitizedNotes: string;
}

export interface InterviewScorecardPayload {
  interviewId: string;
  overallRecommendation: InterviewerRecommendation;
  strongestEvidence?: string;
  biggestConcern?: string;
  rawNotes?: string;
  structuredNotes?: StructuredNotesResult;
  isComplete: boolean;
  scores: CompetencyScoreInput[];
}

export interface EvidenceConflict {
  sourceA: string; // e.g. "Resume Claim: 5 years AWS experience"
  sourceB: string; // e.g. "Interview Note: Candidate stated they started AWS last year"
  conflictDescription: string;
  clarificationQuestion: string;
}

export interface InterviewSummaryResult {
  interviewId: string;
  candidateName: string;
  jobTitle: string;
  strengths: string[];
  concerns: string[];
  verifiedCompetencies: string[];
  unverifiedCompetencies: string[];
  recommendedFollowUp: string[];
  conflictingEvidence: EvidenceConflict[];
  evidenceQuality: EvidenceQualityLevel;
  averageScore: number;
  totalScorecards: number;
  recommendationsBreakdown: Record<InterviewerRecommendation, number>;
  aiSynthesis: string;
}

export interface DecisionSupportResult {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  currentStatus: string;
  totalInterviews: number;
  scorecardsCount: number;
  averageCompetencyScore: number;
  overallRecommendationConsensus: InterviewerRecommendation;
  strengthsSummary: string[];
  concernsSummary: string[];
  unverifiedRequirements: string[];
  conflictingEvidence: EvidenceConflict[];
  suggestedAction: InterviewDecisionType;
  actionConfidence: "HIGH" | "MEDIUM" | "LOW";
  pros: string[];
  cons: string[];
  evidenceRationale: string;
}

export interface CandidateComparisonMetric {
  candidateId: string;
  candidateName: string;
  avatar?: string;
  applicationId: string;
  jobTitle: string;
  applicationStatus: string;
  overallMatchScore: number;
  skillsAssessmentScore?: number;
  interviewAverageScore?: number;
  verifiedSkillsCount: number;
  unverifiedGapsCount: number;
  recommendationConsensus?: InterviewerRecommendation;
  keyStrengths: string[];
  keyConcerns: string[];
  competencyScores: Record<string, number>;
}

export interface CandidateComparisonMatrix {
  jobId: string;
  jobTitle: string;
  evaluatedCompetencies: string[];
  candidates: CandidateComparisonMetric[];
  generatedAt: string;
}
