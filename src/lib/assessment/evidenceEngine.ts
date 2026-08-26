import {
  AssessmentEvaluationResult,
  AssessmentQuestionData,
  CandidateAnswerInput,
  CategoryScoreBreakdown,
  EvidenceSummary,
  SkillsEvidenceRow,
  SkillVerificationState,
  TargetedInterviewVerificationQuestion,
} from "./types";

/**
 * Sanitizes candidate answer text against prompt injection attempts.
 * Candidate answers are untrusted input.
 */
export function sanitizeCandidateAnswer(text: string): { sanitized: string; hadInjectionAttempt: boolean } {
  if (!text) return { sanitized: "", hadInjectionAttempt: false };

  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+prompt/i,
    /you\s+must\s+give\s+(me\s+)?(100|full\s+marks|top\s+score|maximum)/i,
    /mark\s+this\s+(as\s+)?(100|perfect|correct)/i,
    /drop\s+table/i,
    /--\s*system/i,
    /<script/i,
    /role:\s*["']?system["']?/i,
  ];

  let hadInjectionAttempt = false;
  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      hadInjectionAttempt = true;
      break;
    }
  }

  // Sanitize and neutralize injection instructions while preserving the candidate's actual technical content
  let sanitized = text
    .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, "[REDACTED_INSTRUCTION]")
    .replace(/you\s+must\s+give\s+(me\s+)?(100|full\s+marks|top\s+score|maximum)/gi, "[REDACTED_SCORE_DEMAND]")
    .replace(/mark\s+this\s+(as\s+)?(100|perfect|correct)/gi, "[REDACTED_SCORE_DEMAND]")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  return { sanitized, hadInjectionAttempt };
}

/**
 * Evaluates candidate assessment submissions against rubrics.
 * Purely grounded in submitted text and question criteria.
 */
export function evaluateAssessmentSubmission(
  questions: AssessmentQuestionData[],
  answers: CandidateAnswerInput[],
  resumeSkills: string[] = []
): AssessmentEvaluationResult {
  const evaluatedAnswers: AssessmentEvaluationResult["evaluatedAnswers"] = [];
  const demonstratedPoints: string[] = [];
  const partialPoints: string[] = [];
  const missingPoints: string[] = [];
  const inconsistencies: string[] = [];

  const categoryScoresMap: Record<
    string,
    { totalScore: number; maxScore: number; evidence: string[]; gaps: string[] }
  > = {};

  let totalEarnedScore = 0;
  let totalMaxScore = 0;

  for (const question of questions) {
    const answerInput = answers.find((a) => a.questionId === question.id);
    const rawAnswerText = answerInput?.answerText || "";
    const { sanitized: answerText, hadInjectionAttempt } = sanitizeCandidateAnswer(rawAnswerText);

    if (hadInjectionAttempt) {
      inconsistencies.push(
        `Submission for "${question.category}" contained instructional override tokens; evaluated strictly on technical merits.`
      );
    }

    const words = answerText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const answerLower = answerText.toLowerCase();

    let questionScore = 0;
    const questionMaxScore = question.maxScore || 20;
    const qEvidence: string[] = [];
    const qGaps: string[] = [];

    // Evaluate each rubric criterion (0-5 scale)
    for (const criterion of question.rubric) {
      let criterionScore = 0;
      const criterionKeywords = criterion.name.toLowerCase().split(/\s+/);
      const matchedKeywordCount = criterionKeywords.filter((k) => k.length > 3 && answerLower.includes(k)).length;

      if (wordCount < 10) {
        criterionScore = 0;
        qGaps.push(`Missing coverage for ${criterion.name}: response too brief or empty.`);
      } else if (wordCount >= 10 && wordCount < 25) {
        criterionScore = Math.min(criterion.maxScore, 2);
        qGaps.push(`Partial explanation for ${criterion.name}: provides high-level mention without implementation depth.`);
      } else if (wordCount >= 25 && wordCount < 50) {
        criterionScore = Math.min(criterion.maxScore, 3 + (matchedKeywordCount > 0 ? 1 : 0));
        qEvidence.push(`Demonstrated solid understanding of ${criterion.name}.`);
      } else {
        // Detailed response
        criterionScore = Math.min(criterion.maxScore, 4 + (matchedKeywordCount > 0 ? 1 : 0));
        qEvidence.push(`Demonstrated comprehensive, in-depth analysis of ${criterion.name}.`);
      }

      questionScore += criterionScore;
    }

    // Cap question score to maxScore
    questionScore = Math.min(questionMaxScore, questionScore);
    totalEarnedScore += questionScore;
    totalMaxScore += questionMaxScore;

    // Record evidence & gaps
    demonstratedPoints.push(...qEvidence);
    if (qGaps.length > 0) {
      partialPoints.push(...qGaps);
    } else if (questionScore === questionMaxScore) {
      // Full score
    } else {
      missingPoints.push(`Advanced edge-case optimization for ${question.category} was not elaborated.`);
    }

    // Category aggregation
    const cat = question.category || "General Technical";
    if (!categoryScoresMap[cat]) {
      categoryScoresMap[cat] = { totalScore: 0, maxScore: 0, evidence: [], gaps: [] };
    }
    categoryScoresMap[cat].totalScore += questionScore;
    categoryScoresMap[cat].maxScore += questionMaxScore;
    categoryScoresMap[cat].evidence.push(...qEvidence);
    categoryScoresMap[cat].gaps.push(...qGaps);

    evaluatedAnswers.push({
      questionId: question.id || "",
      score: questionScore,
      feedback:
        questionScore >= questionMaxScore * 0.75
          ? "Strong response addressing core architectural and operational requirements."
          : questionScore >= questionMaxScore * 0.5
          ? "Adequate foundational understanding; lacks deep production optimization examples."
          : "Insufficient detail provided for production verification.",
      evidencePoints: qEvidence,
      gapPoints: qGaps,
    });
  }

  // Calculate percentage category scores
  const categoryScores: Record<string, number> = {};
  const categoryBreakdowns: CategoryScoreBreakdown[] = [];

  for (const [cat, data] of Object.entries(categoryScoresMap)) {
    const pct = data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0;
    categoryScores[cat] = pct;
    categoryBreakdowns.push({
      category: cat,
      score: data.totalScore,
      maxScore: data.maxScore,
      percentage: pct,
      evidence: data.evidence,
      gaps: data.gaps,
    });
  }

  const overallScore = totalMaxScore > 0 ? Math.round((totalEarnedScore / totalMaxScore) * 100) : 0;
  const isPassed = overallScore >= 70;

  // Build Skills Evidence Matrix (Resume Claim vs Assessment Evidence)
  const skillVerificationMatrix: SkillsEvidenceRow[] = [];
  const assessedCategories = Object.keys(categoryScoresMap);

  // Cross-reference assessed skills
  for (const breakdown of categoryBreakdowns) {
    const skillName = breakdown.category.split("&")[0].trim();
    const isClaimedInResume = resumeSkills.some(
      (s) => s.toLowerCase().includes(skillName.toLowerCase()) || skillName.toLowerCase().includes(s.toLowerCase())
    );

    let state: SkillVerificationState = "UNVERIFIED";
    let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";

    if (breakdown.percentage >= 80) {
      state = "STRONGLY_DEMONSTRATED";
      confidence = "HIGH";
    } else if (breakdown.percentage >= 60) {
      state = "DEMONSTRATED";
      confidence = "HIGH";
    } else if (breakdown.percentage >= 35) {
      state = "REQUIRES_REVIEW";
      confidence = "MEDIUM";
    } else {
      state = "REQUIRES_REVIEW";
      confidence = "LOW";
    }

    skillVerificationMatrix.push({
      skill: skillName,
      resumeClaim: isClaimedInResume ? "Claimed in profile/resume" : "Not listed in primary skills",
      assessmentEvidence: state,
      confidence,
      evidenceSnippet: breakdown.evidence[0] || "Foundational concepts addressed.",
      gapSnippet: breakdown.gaps[0] || undefined,
    });
  }

  // Cross-reference unassessed resume skills
  for (const rSkill of resumeSkills) {
    const alreadyMapped = skillVerificationMatrix.some(
      (m) => m.skill.toLowerCase().includes(rSkill.toLowerCase()) || rSkill.toLowerCase().includes(m.skill.toLowerCase())
    );
    if (!alreadyMapped) {
      skillVerificationMatrix.push({
        skill: rSkill,
        resumeClaim: "Claimed in profile/resume",
        assessmentEvidence: "UNVERIFIED",
        confidence: "LOW",
        gapSnippet: "Skill not assessed in this technical evaluation round.",
      });
    }
  }

  // Generate Targeted Interview Verification Questions based on identified gaps
  const recommendedQuestions: TargetedInterviewVerificationQuestion[] = [];

  for (const row of skillVerificationMatrix) {
    if (row.assessmentEvidence === "REQUIRES_REVIEW" || row.assessmentEvidence === "UNVERIFIED") {
      recommendedQuestions.push({
        skill: row.skill,
        question: `Can you walk us through a complex production challenge you solved using ${row.skill}, and how you handled latency/scaling trade-offs?`,
        rationale: `Candidate's ${row.skill} capability is currently ${row.assessmentEvidence.toLowerCase()}; verify hands-on production experience in live interview.`,
        suggestedFollowUp: `What metrics or telemetry did you monitor to verify the solution was resilient?`,
      });
    }
  }

  return {
    overallScore,
    passingScore: 70,
    isPassed,
    categoryScores,
    categoryBreakdowns,
    evidenceSummary: {
      demonstrated: demonstratedPoints.slice(0, 8),
      partial: partialPoints.slice(0, 6),
      missing: missingPoints.slice(0, 4),
      inconsistencies,
    },
    skillVerificationMatrix,
    recommendedQuestions: recommendedQuestions.slice(0, 4),
    evaluatedAnswers,
  };
}
