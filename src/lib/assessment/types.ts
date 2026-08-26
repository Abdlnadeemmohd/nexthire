import { QuestionType, AssessmentStatus, InvitationStatus, SubmissionStatus } from "@prisma/client";

export type { QuestionType, AssessmentStatus, InvitationStatus, SubmissionStatus };

export type SkillVerificationState =
  | "UNVERIFIED"
  | "CLAIMED"
  | "DEMONSTRATED"
  | "STRONGLY_DEMONSTRATED"
  | "REQUIRES_REVIEW";

export interface RubricCriterion {
  name: string;
  maxScore: number;
  description: string;
}

export interface AssessmentQuestionData {
  id?: string;
  category: string;
  type: QuestionType;
  question: string;
  codeSnippet?: string;
  sampleAnswer?: string;
  rubric: RubricCriterion[];
  maxScore: number;
  order: number;
}

export interface AssessmentCreateInput {
  title: string;
  description: string;
  category?: string;
  durationMinutes?: number;
  passingScore?: number;
  jobId?: string;
  questions: AssessmentQuestionData[];
}

export interface CandidateAnswerInput {
  questionId: string;
  answerText: string;
}

export interface SkillsEvidenceRow {
  skill: string;
  resumeClaim: string;
  assessmentEvidence: SkillVerificationState;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidenceSnippet?: string;
  gapSnippet?: string;
}

export interface CategoryScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  evidence: string[];
  gaps: string[];
}

export interface EvidenceSummary {
  demonstrated: string[];
  partial: string[];
  missing: string[];
  inconsistencies: string[];
}

export interface TargetedInterviewVerificationQuestion {
  skill: string;
  question: string;
  rationale: string;
  suggestedFollowUp?: string;
}

export interface AssessmentEvaluationResult {
  overallScore: number;
  passingScore: number;
  isPassed: boolean;
  categoryScores: Record<string, number>;
  categoryBreakdowns: CategoryScoreBreakdown[];
  evidenceSummary: EvidenceSummary;
  skillVerificationMatrix: SkillsEvidenceRow[];
  recommendedQuestions: TargetedInterviewVerificationQuestion[];
  evaluatedAnswers: {
    questionId: string;
    score: number;
    feedback: string;
    evidencePoints: string[];
    gapPoints: string[];
  }[];
}

export interface AssessmentInvitationDetail {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  assessmentDescription: string;
  durationMinutes: number;
  jobId?: string | null;
  jobTitle?: string | null;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  status: InvitationStatus;
  deadline: string;
  invitedAt: string;
  startedAt?: string | null;
  submittedAt?: string | null;
  questionsCount: number;
  submission?: {
    id: string;
    overallScore: number;
    status: SubmissionStatus;
    submittedAt: string;
  } | null;
}
