import { prisma } from "@/lib/prisma";
import { CandidateComparisonMatrix, CandidateComparisonMetric, InterviewerRecommendation } from "./types";

/**
 * Generates a side-by-side comparison matrix for 2 to 5 candidates applying for the same role.
 */
export async function generateCandidateComparison(
  applicationIds: string[],
  companyId: string
): Promise<CandidateComparisonMatrix> {
  if (!applicationIds || applicationIds.length < 2 || applicationIds.length > 5) {
    throw new Error("Candidate comparison requires between 2 and 5 applications.");
  }

  const applications = await prisma.application.findMany({
    where: {
      id: { in: applicationIds },
      job: { companyId },
    },
    include: {
      job: true,
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
            include: { scores: true },
          },
          summary: true,
        },
      },
    },
  });

  if (applications.length === 0) {
    throw new Error("No valid applications found for comparison.");
  }

  const firstJob = applications[0].job;
  const evaluatedCompetenciesSet = new Set<string>();
  const candidates: CandidateComparisonMetric[] = [];

  for (const app of applications) {
    const applicant = app.applicant;
    const profile = applicant.profile;
    const allScorecards = app.interviews.flatMap(i => i.scorecards);

    let totalScore = 0;
    let scoreCount = 0;
    const competencyScores: Record<string, number> = {};
    const strengths: string[] = [];
    const concerns: string[] = [];

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
      if (sc.strongestEvidence) strengths.push(sc.strongestEvidence);
      if (sc.biggestConcern) concerns.push(sc.biggestConcern);

      for (const s of sc.scores) {
        evaluatedCompetenciesSet.add(s.competency);
        competencyScores[s.competency] = s.score;
        totalScore += s.score;
        scoreCount++;
      }
    }

    const interviewAvg = scoreCount > 0 ? Number((totalScore / scoreCount).toFixed(1)) : undefined;

    // Latest skills assessment score
    const latestAssessment = applicant.assessmentSubmissions[0];
    const assessmentScore = latestAssessment ? latestAssessment.overallScore : undefined;

    // Consensus recommendation
    let consensus: InterviewerRecommendation | undefined = undefined;
    if (allScorecards.length > 0) {
      if (recCounts.STRONG_NO > 0 || recCounts.NO >= 2) consensus = "NO";
      else if (recCounts.STRONG_YES >= 2) consensus = "STRONG_YES";
      else if (recCounts.YES >= 1) consensus = "YES";
      else consensus = "MAYBE";
    }

    // Verified skills count
    let verifiedCount = 0;
    let gapsCount = 0;
    if (latestAssessment?.skillVerificationMatrix) {
      try {
        const matrix = JSON.parse(latestAssessment.skillVerificationMatrix);
        if (Array.isArray(matrix)) {
          verifiedCount = matrix.filter((m: any) => m.confidence === "HIGH").length;
          gapsCount = matrix.filter((m: any) => m.confidence === "LOW" || !m.confidence).length;
        }
      } catch {
        // Safe fallback
      }
    }

    candidates.push({
      candidateId: applicant.id,
      candidateName: applicant.name,
      avatar: applicant.avatar || undefined,
      applicationId: app.id,
      jobTitle: app.job.title,
      applicationStatus: app.status,
      overallMatchScore: app.matchScore || 85,
      skillsAssessmentScore: assessmentScore,
      interviewAverageScore: interviewAvg,
      verifiedSkillsCount: verifiedCount,
      unverifiedGapsCount: gapsCount,
      recommendationConsensus: consensus,
      keyStrengths: Array.from(new Set(strengths)).slice(0, 3),
      keyConcerns: Array.from(new Set(concerns)).slice(0, 2),
      competencyScores,
    });
  }

  return {
    jobId: firstJob.id,
    jobTitle: firstJob.title,
    evaluatedCompetencies: Array.from(evaluatedCompetenciesSet),
    candidates,
    generatedAt: new Date().toISOString(),
  };
}
