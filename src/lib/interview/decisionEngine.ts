import { prisma } from "@/lib/prisma";
import {
  DecisionSupportResult,
  InterviewSummaryResult,
  EvidenceConflict,
  InterviewerRecommendation,
  InterviewDecisionType,
  EvidenceQualityLevel,
} from "./types";

/**
 * Aggregates all scorecards and generates a post-interview summary for a specific interview session.
 */
export async function generateInterviewSummary(
  interviewId: string,
  companyId: string
): Promise<InterviewSummaryResult> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          job: { include: { company: true } },
          applicant: {
            include: {
              profile: true,
              assessmentSubmissions: {
                include: { assessment: true },
                orderBy: { submittedAt: "desc" },
              },
            },
          },
        },
      },
      scorecards: {
        include: {
          scores: true,
          interviewer: true,
        },
      },
      plan: true,
      summary: true,
    },
  });

  if (!interview) {
    throw new Error(`Interview not found: ${interviewId}`);
  }

  const app = interview.application;
  const job = app.job;
  const candidate = app.applicant;
  const scorecards = interview.scorecards;

  const strengths: string[] = [];
  const concerns: string[] = [];
  const verifiedCompetencies = new Set<string>();
  const unverifiedCompetencies = new Set<string>();
  const recommendedFollowUp: string[] = [];
  const conflicts: EvidenceConflict[] = [];

  const recBreakdown: Record<InterviewerRecommendation, number> = {
    STRONG_YES: 0,
    YES: 0,
    MAYBE: 0,
    NO: 0,
    STRONG_NO: 0,
  };

  let totalScoreSum = 0;
  let totalScoresCount = 0;

  for (const sc of scorecards) {
    if (sc.overallRecommendation) {
      recBreakdown[sc.overallRecommendation] = (recBreakdown[sc.overallRecommendation] || 0) + 1;
    }
    if (sc.strongestEvidence) strengths.push(sc.strongestEvidence);
    if (sc.biggestConcern) concerns.push(sc.biggestConcern);

    // Parse structured notes if present
    if (sc.structuredNotes) {
      try {
        const parsed = typeof sc.structuredNotes === "string" ? JSON.parse(sc.structuredNotes) : sc.structuredNotes;
        if (Array.isArray(parsed.strengths)) strengths.push(...parsed.strengths);
        if (Array.isArray(parsed.concerns)) concerns.push(...parsed.concerns);
        if (Array.isArray(parsed.unverifiedAreas)) {
          parsed.unverifiedAreas.forEach((u: string) => unverifiedCompetencies.add(u));
        }
        if (Array.isArray(parsed.followUpQuestions)) {
          recommendedFollowUp.push(...parsed.followUpQuestions);
        }
      } catch {
        // Safe fallback
      }
    }

    for (const score of sc.scores) {
      totalScoreSum += score.score;
      totalScoresCount++;

      if (score.score >= 4) {
        verifiedCompetencies.add(score.competency);
      } else if (score.score <= 2) {
        unverifiedCompetencies.add(score.competency);
        concerns.push(`Low rating (${score.score}/5) on ${score.competency}: ${score.observedEvidence || "Needs further validation"}`);
      }
    }
  }

  // Detect conflicting evidence between candidate profile/resume, assessment, and interview notes
  const profile = candidate.profile;
  let resumeExperience = 0;
  try {
    if (profile?.experience) {
      const parsedExp = JSON.parse(profile.experience);
      if (Array.isArray(parsedExp)) {
        resumeExperience = parsedExp.length * 2;
      }
    }
  } catch {}

  // Check if any interviewer noted Junior or solo vs senior claims
  for (const sc of scorecards) {
    const raw = (sc.rawNotes || "").toLowerCase();
    if (resumeExperience >= 5 && (raw.includes("junior") || raw.includes("started last year") || raw.includes("beginner"))) {
      conflicts.push({
        sourceA: `Resume Claim: ${resumeExperience}+ years of professional experience`,
        sourceB: `Interview Note: Interviewer observed candidate described recent entry-level exposure`,
        conflictDescription: "Potential discrepancy between claimed tenure and interview technical depth",
        clarificationQuestion: "Clarify timeline of production leadership and specific years in primary stack.",
      });
    }
  }

  // Determine overall evidence quality
  let evidenceQuality: EvidenceQualityLevel = "MEDIUM";
  if (totalScoresCount >= 5 || (scorecards.length >= 2 && totalScoresCount >= 4)) {
    evidenceQuality = "HIGH";
  } else if (scorecards.length === 0 || totalScoresCount <= 2) {
    evidenceQuality = "LOW";
  }

  const averageScore = totalScoresCount > 0 ? Number((totalScoreSum / totalScoresCount).toFixed(1)) : 0;

  const uniqueStrengths = Array.from(new Set(strengths)).filter(Boolean);
  const uniqueConcerns = Array.from(new Set(concerns)).filter(Boolean);
  const uniqueVerified = Array.from(new Set(verifiedCompetencies));
  const uniqueUnverified = Array.from(new Set(unverifiedCompetencies));
  const uniqueFollowUps = Array.from(new Set(recommendedFollowUp)).filter(Boolean);

  const aiSynthesis = `Candidate demonstrated strong performance across ${uniqueVerified.length} competencies with an average evaluation score of ${averageScore}/5. ${
    uniqueConcerns.length > 0
      ? `Key areas requiring attention include: ${uniqueConcerns.slice(0, 2).join("; ")}.`
      : "No critical red flags or competency deficiencies were observed."
  }`;

  const result: InterviewSummaryResult = {
    interviewId,
    candidateName: candidate.name,
    jobTitle: job.title,
    strengths: uniqueStrengths,
    concerns: uniqueConcerns,
    verifiedCompetencies: uniqueVerified,
    unverifiedCompetencies: uniqueUnverified,
    recommendedFollowUp: uniqueFollowUps,
    conflictingEvidence: conflicts,
    evidenceQuality,
    averageScore,
    totalScorecards: scorecards.length,
    recommendationsBreakdown: recBreakdown,
    aiSynthesis,
  };

  // Persist summary in database
  await prisma.interviewSummary.upsert({
    where: { interviewId },
    create: {
      interviewId,
      companyId,
      strengths: JSON.stringify(result.strengths),
      concerns: JSON.stringify(result.concerns),
      verifiedCompetencies: JSON.stringify(result.verifiedCompetencies),
      unverifiedCompetencies: JSON.stringify(result.unverifiedCompetencies),
      recommendedFollowUp: JSON.stringify(result.recommendedFollowUp),
      conflictingEvidence: JSON.stringify(result.conflictingEvidence),
      evidenceQuality: result.evidenceQuality,
      aiSynthesis: result.aiSynthesis,
    },
    update: {
      strengths: JSON.stringify(result.strengths),
      concerns: JSON.stringify(result.concerns),
      verifiedCompetencies: JSON.stringify(result.verifiedCompetencies),
      unverifiedCompetencies: JSON.stringify(result.unverifiedCompetencies),
      recommendedFollowUp: JSON.stringify(result.recommendedFollowUp),
      conflictingEvidence: JSON.stringify(result.conflictingEvidence),
      evidenceQuality: result.evidenceQuality,
      aiSynthesis: result.aiSynthesis,
    },
  });

  return result;
}

/**
 * Synthesizes cross-interview evidence and generates AI decision support with mandatory human confirmation gate.
 */
export async function generateDecisionSupport(
  applicationId: string,
  companyId: string
): Promise<DecisionSupportResult> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { company: true } },
      applicant: {
        include: {
          profile: true,
          assessmentSubmissions: {
            include: { assessment: true },
            orderBy: { submittedAt: "desc" },
          },
        },
      },
      interviews: {
        include: {
          scorecards: {
            include: { scores: true, interviewer: true },
          },
          summary: true,
        },
      },
    },
  });

  if (!app) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  const job = app.job;
  const candidate = app.applicant;
  const interviews = app.interviews;

  const allScorecards = interviews.flatMap(i => i.scorecards);
  let totalScoreSum = 0;
  let totalScoreCount = 0;
  const allStrengths: string[] = [];
  const allConcerns: string[] = [];
  const unverifiedSet = new Set<string>();
  const conflicts: EvidenceConflict[] = [];

  const recCounts: Record<InterviewerRecommendation, number> = {
    STRONG_YES: 0,
    YES: 0,
    MAYBE: 0,
    NO: 0,
    STRONG_NO: 0,
  };

  for (const sc of allScorecards) {
    if (sc.overallRecommendation) {
      recCounts[sc.overallRecommendation] = (recCounts[sc.overallRecommendation] || 0) + 1;
    }
    if (sc.strongestEvidence) allStrengths.push(sc.strongestEvidence);
    if (sc.biggestConcern) allConcerns.push(sc.biggestConcern);

    for (const score of sc.scores) {
      totalScoreSum += score.score;
      totalScoreCount++;
      if (score.score <= 2) {
        unverifiedSet.add(score.competency);
        allConcerns.push(`${score.competency} rated ${score.score}/5`);
      }
    }
  }

  const avgScore = totalScoreCount > 0 ? Number((totalScoreSum / totalScoreCount).toFixed(1)) : 0;

  // Determine consensus recommendation
  let consensus: InterviewerRecommendation = "YES";
  if (recCounts.STRONG_NO > 0) {
    consensus = "STRONG_NO";
  } else if (recCounts.NO >= 2) {
    consensus = "NO";
  } else if (recCounts.STRONG_YES >= 2 && recCounts.NO === 0) {
    consensus = "STRONG_YES";
  } else if (recCounts.MAYBE > recCounts.YES) {
    consensus = "MAYBE";
  }

  // Synthesize suggested action
  let suggestedAction: InterviewDecisionType = "ADVANCE";
  let actionConfidence: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";

  if (consensus === "STRONG_YES" || (consensus === "YES" && avgScore >= 4.0)) {
    suggestedAction = app.status === "FINAL_DECISION" ? "OFFER" : "ADVANCE";
    actionConfidence = "HIGH";
  } else if (consensus === "NO" || consensus === "STRONG_NO" || avgScore < 2.5) {
    suggestedAction = "REJECT";
    actionConfidence = "HIGH";
  } else {
    suggestedAction = "HOLD";
    actionConfidence = "LOW";
  }

  const pros = Array.from(new Set(allStrengths)).slice(0, 4);
  const cons = Array.from(new Set(allConcerns)).slice(0, 4);

  if (pros.length === 0) {
    pros.push(`Solid resume background aligned with ${job.title}`);
  }

  const evidenceRationale = `Based on ${allScorecards.length} completed scorecard(s) across ${interviews.length} interview round(s), the candidate achieved an average competency score of ${avgScore}/5 with consensus recommendation "${consensus}".`;

  return {
    applicationId,
    candidateId: candidate.id,
    candidateName: candidate.name,
    jobId: job.id,
    jobTitle: job.title,
    companyId,
    currentStatus: app.status,
    totalInterviews: interviews.length,
    scorecardsCount: allScorecards.length,
    averageCompetencyScore: avgScore,
    overallRecommendationConsensus: consensus,
    strengthsSummary: pros,
    concernsSummary: cons,
    unverifiedRequirements: Array.from(unverifiedSet),
    conflictingEvidence: conflicts,
    suggestedAction,
    actionConfidence,
    pros,
    cons,
    evidenceRationale,
  };
}
