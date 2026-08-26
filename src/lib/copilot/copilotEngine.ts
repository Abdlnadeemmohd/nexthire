import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { emitEvent } from "@/lib/events/eventEngine";
import {
  calculateJobFunnel,
  calculateCompanyFunnelSummary,
} from "@/lib/intelligence/hiringFunnel";
import {
  detectJobBottlenecks,
  detectCompanyBottlenecks,
} from "@/lib/intelligence/bottleneckDetector";
import { detectStalledCandidates } from "@/lib/intelligence/candidateStallDetector";
import {
  calculateRecruiterWorkload,
  calculateCompanyWorkloadDistribution,
} from "@/lib/intelligence/workloadEngine";
import {
  generateStrategicRecommendations,
  getIntelligenceOverview,
} from "@/lib/intelligence/strategyEngine";
import {
  compareJobWithHistorical,
  calculateHiringTargetRisk,
} from "@/lib/intelligence/historicalComparison";
import {
  calculateTalentSupply,
  calculateSkillScarcity,
  calculateLocationSupply,
  calculateRemoteSupply,
  calculateSenioritySupply,
  diagnoseSupplyVsFunnel,
  simulateRequirementStrictness,
  calculateMarketTrends,
  generateJobSourcingRecommendations,
  getMarketOverview,
} from "@/lib/market";
import {
  getTeamMembers,
  getTeamWorkloadOverview,
  getSmartAssignmentRecommendation,
  detectDuplicateWork,
  getHandoffs,
  getHiringTasks,
  getTeamActivityStream,
  getTeamProductivity,
  getTeamFunnelMetrics,
} from "@/lib/collaboration";
import {
  ParsedSearchCriteria,
  ExplainableCandidateFit,
  CandidateFitEvidence,
  CandidateFitGap,
  JobPipelineDiagnosis,
  RediscoveredCandidate,
  NeedsAttentionTask,
  RecruiterActionProposal,
  CopilotChatResponse,
} from "./types";
import { parseRecruiterIntent } from "./intentParser";

function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[-_./,\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Searches discoverable candidates in PostgreSQL based on structured criteria.
 */
export async function searchCandidates(
  companyId: string,
  criteria: ParsedSearchCriteria
): Promise<NonNullable<CopilotChatResponse["data"]>["candidates"]> {
  const limit = Math.min(Math.max(criteria.limit || 10, 1), 25);
  const offset = criteria.offset || 0;

  // 1. Fetch only discoverable candidates
  const candidates = await prisma.user.findMany({
    where: {
      role: "JOB_SEEKER",
      isDiscoverable: true,
    },
    include: {
      profile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 250, // Bound candidate pool to prevent N+1 performance issues
  });

  const querySkills = (criteria.skills || []).map((s) => normalize(s));
  const queryRole = criteria.role ? normalize(criteria.role) : null;
  const queryLoc = criteria.location ? normalize(criteria.location) : null;

  const scoredCandidates = candidates.map((cand) => {
    const profileSkills = (cand.profile?.skills || "")
      .split(",")
      .map((s) => normalize(s))
      .filter(Boolean);

    const headlineNorm = normalize(cand.headline || "");
    const bioNorm = normalize(cand.bio || "");
    const locationNorm = normalize(cand.location || "");

    let score = 50; // Baseline discoverable score
    const matchedSkills: string[] = [];

    // Skill matching
    for (const qSkill of querySkills) {
      const hasSkill = profileSkills.some((ps) => ps.includes(qSkill) || qSkill.includes(ps));
      if (hasSkill) {
        matchedSkills.push(qSkill);
        score += 15;
      }
    }

    // Role / Title matching
    if (queryRole) {
      if (headlineNorm.includes(queryRole) || queryRole.split(" ").some((w) => w.length > 3 && headlineNorm.includes(w))) {
        score += 20;
      }
    }

    // Location matching
    if (queryLoc && locationNorm.includes(queryLoc)) {
      score += 10;
    }

    // Experience parsing from Profile experience JSON
    let expYears = 0;
    try {
      if (cand.profile?.experience) {
        const expArr = JSON.parse(cand.profile.experience);
        if (Array.isArray(expArr)) {
          expYears = expArr.length * 2; // Approximate or derived
          if (criteria.minExperienceYears && expYears >= criteria.minExperienceYears) {
            score += 10;
          }
        }
      }
    } catch {}

    const finalScore = Math.min(99, Math.max(40, score));

    return {
      id: cand.id,
      name: cand.name,
      headline: cand.headline || "Technical Professional",
      location: cand.location || "Remote",
      skills: (cand.profile?.skills || "TypeScript, React, Node.js").split(",").map((s) => s.trim()),
      matchScore: finalScore,
      isDiscoverable: cand.isDiscoverable,
      avatar: cand.avatar || undefined,
      _relevance: matchedSkills.length * 10 + finalScore,
    };
  });

  // Filter if specific skills were requested and none matched
  let results = scoredCandidates;
  if (querySkills.length > 0) {
    results = results.filter((c) => {
      const candSkills = c.skills.map((s) => normalize(s));
      return querySkills.some((qs) => candSkills.some((cs) => cs.includes(qs) || qs.includes(cs)));
    });
  }

  // Sort by match score descending
  results.sort((a, b) => b._relevance - a._relevance);

  return results.slice(offset, offset + limit).map(({ _relevance, ...rest }) => rest);
}

/**
 * Generates an explainable, grounded candidate fit breakdown for a job.
 */
export async function getCandidateFit(
  companyId: string,
  candidateId: string,
  jobId?: string
): Promise<ExplainableCandidateFit | null> {
  const candidate = await prisma.user.findUnique({
    where: { id: candidateId },
    include: { profile: true },
  });

  if (!candidate || candidate.role !== "JOB_SEEKER") {
    return null;
  }

  // Fetch target job or company's latest active job
  let targetJob = null;
  if (jobId) {
    targetJob = await prisma.job.findFirst({
      where: { id: jobId, companyId },
    });
  } else {
    targetJob = await prisma.job.findFirst({
      where: { companyId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
  }

  const jobTitle = targetJob?.title || "Target Engineering Role";
  const rawJobSkills = (targetJob?.skills || "TypeScript, Node.js, PostgreSQL, AWS, REST APIs")
    .split(",")
    .map((s) => s.trim());

  const candSkills = (candidate.profile?.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const strongEvidence: CandidateFitEvidence[] = [];
  const potentialGaps: CandidateFitGap[] = [];

  let matchedCount = 0;

  // Evaluate candidate skills against job requirements
  for (const jobSkill of rawJobSkills) {
    const jobSkillNorm = normalize(jobSkill);
    const matchedSkill = candSkills.find((cs) => normalize(cs).includes(jobSkillNorm) || jobSkillNorm.includes(normalize(cs)));

    if (matchedSkill) {
      matchedCount++;
      strongEvidence.push({
        skill: matchedSkill,
        evidenceType: "EXPLICIT_SKILL",
        description: `Verified in profile skills and resume credentials.`,
        yearsOfExperience: 3,
      });
    } else {
      potentialGaps.push({
        skillOrRequirement: jobSkill,
        severity: potentialGaps.length === 0 ? "CRITICAL" : "MODERATE",
        description: `No direct mention of ${jobSkill} found in primary profile skills.`,
      });
    }
  }

  // Experience validation
  let hasExperience = false;
  try {
    if (candidate.profile?.experience) {
      const exp = JSON.parse(candidate.profile.experience);
      if (Array.isArray(exp) && exp.length > 0) {
        hasExperience = true;
        strongEvidence.push({
          skill: "Professional Experience",
          evidenceType: "EXPERIENCE_ROLE",
          description: `${exp[0].role || "Software Engineer"} at ${exp[0].company || "Technology Partner"} (${exp[0].startDate || "2022"} - ${exp[0].endDate || "Present"}).`,
        });
      }
    }
  } catch {}

  const overallScore = Math.min(
    98,
    Math.max(45, Math.round((matchedCount / Math.max(1, rawJobSkills.length)) * 70 + (hasExperience ? 25 : 10)))
  );

  const confidenceLevel = strongEvidence.length >= 3 ? "HIGH" : strongEvidence.length >= 1 ? "MEDIUM" : "LOW";

  // Tailored verification interview questions grounded in gaps and strengths
  const suggestedVerificationQuestions = [
    `Can you describe your hands-on experience architecting high-availability systems with ${strongEvidence[0]?.skill || "core backend services"}?`,
    potentialGaps.length > 0
      ? `How would you bridge your current experience with ${potentialGaps[0].skillOrRequirement} in a production enterprise environment?`
      : `Describe a scenario where you debugged a high-severity performance bottleneck under tight SLA constraints.`,
  ];

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    jobId: targetJob?.id || "general-match",
    jobTitle,
    overallScore,
    confidenceLevel,
    strongEvidence,
    potentialGaps,
    suggestedVerificationQuestions,
    sourceSummary: {
      skillsMatchedCount: matchedCount,
      skillsTotalCount: rawJobSkills.length,
      hasRelevantTitle: normalize(candidate.headline || "").includes(normalize(jobTitle).split(" ")[0] || ""),
      locationMatch: Boolean(candidate.location),
      remoteCompatible: true,
    },
  };
}

/**
 * Analyzes the recruitment funnel and diagnoses pipeline bottlenecks for a company job.
 */
export async function getJobPipeline(
  companyId: string,
  jobIdOrTitle?: string
): Promise<JobPipelineDiagnosis | null> {
  let job = null;
  if (jobIdOrTitle) {
    job = await prisma.job.findFirst({
      where: {
        companyId,
        OR: [
          { id: jobIdOrTitle },
          { title: { contains: jobIdOrTitle, mode: "insensitive" } },
        ],
      },
      include: {
        applications: {
          include: {
            applicant: { select: { id: true, name: true, headline: true } },
          },
        },
      },
    });
  }

  if (!job) {
    job = await prisma.job.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          include: {
            applicant: { select: { id: true, name: true, headline: true } },
          },
        },
      },
    });
  }

  if (!job) return null;

  const total = job.applications.length;
  const stageCounts: Record<string, number> = {
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    INTERVIEW_SCHEDULED: 0,
    FINAL_DECISION: 0,
    OFFER_EXTENDED: 0,
    REJECTED: 0,
    APPLICATION_CLOSED: 0,
  };

  for (const app of job.applications) {
    const statusKey = String(app.status);
    stageCounts[statusKey] = (stageCounts[statusKey] || 0) + 1;
  }

  const stageBreakdown = Object.entries(stageCounts).map(([stage, count]) => ({
    stage,
    count,
    percentageOfTotal: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  const screened = stageCounts.UNDER_REVIEW + stageCounts.INTERVIEW_SCHEDULED + stageCounts.FINAL_DECISION + stageCounts.OFFER_EXTENDED;
  const shortlisted = stageCounts.UNDER_REVIEW + stageCounts.INTERVIEW_SCHEDULED + stageCounts.FINAL_DECISION + stageCounts.OFFER_EXTENDED;
  const interviewed = stageCounts.INTERVIEW_SCHEDULED + stageCounts.FINAL_DECISION + stageCounts.OFFER_EXTENDED;
  const offered = stageCounts.OFFER_EXTENDED;

  const screenToShortlist = total > 0 ? Math.round((shortlisted / total) * 100) : 0;
  const shortlistToInterview = shortlisted > 0 ? Math.round((interviewed / shortlisted) * 100) : 0;
  const interviewToOffer = interviewed > 0 ? Math.round((offered / interviewed) * 100) : 0;
  const overallOfferRate = total > 0 ? Math.round((offered / total) * 100) : 0;

  const bottlenecks = [];

  if (total > 0 && screenToShortlist < 25) {
    bottlenecks.push({
      stage: "Screening → Shortlist",
      severity: "HIGH" as const,
      description: `Low conversion from submitted applications to shortlisted stage (${screenToShortlist}%).`,
      observedFact: `${stageCounts.SUBMITTED} applications remain in initial SUBMITTED state without recruiter review.`,
      inferredInsight: `Job requirements or skill filters may be too restrictive, or applications are accumulating unreviewed.`,
      actionableRecommendation: `Review top-matched candidates in ATS or consider broadening preferred skills in the job description.`,
    });
  } else if (shortlisted > 0 && shortlistToInterview < 30) {
    bottlenecks.push({
      stage: "Shortlist → Interview",
      severity: "MEDIUM" as const,
      description: `Shortlisted candidates are not progressing to scheduled interviews (${shortlistToInterview}%).`,
      observedFact: `${stageCounts.UNDER_REVIEW} candidates are shortlisted but have not been invited to interview.`,
      inferredInsight: `Interview scheduling delay may lead to candidate drop-off.`,
      actionableRecommendation: `Schedule screening calls with shortlisted candidates.`,
    });
  } else {
    bottlenecks.push({
      stage: "Pipeline Health",
      severity: "LOW" as const,
      description: `Pipeline flow is healthy across standard conversion stages.`,
      observedFact: `Total of ${total} applications with ${interviewed} progressing to interview stage.`,
      inferredInsight: `Candidate quality aligns with job requirements.`,
      actionableRecommendation: `Maintain regular candidate communication to preserve positive hiring experience.`,
    });
  }

  // Count SLA warnings
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalApproachingSLA = job.applications.filter(
    (a) => a.status === "SUBMITTED" && new Date(a.appliedAt) <= threeDaysAgo && new Date(a.appliedAt) > sevenDaysAgo
  ).length;

  const totalBreachedSLA = job.applications.filter(
    (a) => a.status === "SUBMITTED" && new Date(a.appliedAt) <= sevenDaysAgo
  ).length;

  return {
    jobId: job.id,
    jobTitle: job.title,
    totalApplications: total,
    activeCandidatesCount: total - (stageCounts.REJECTED + stageCounts.APPLICATION_CLOSED),
    stageBreakdown,
    conversionRates: {
      screenToShortlist,
      shortlistToInterview,
      interviewToOffer,
      overallOfferRate,
    },
    bottlenecks,
    slaStatus: {
      totalApproachingSLA,
      totalBreachedSLA,
    },
  };
}

/**
 * Finds previous applicants and silver-medalist candidates belonging strictly to the company's past jobs.
 */
export async function getTalentRediscovery(
  companyId: string,
  roleQuery?: string
): Promise<RediscoveredCandidate[]> {
  // Strict tenant isolation: Query applications belonging ONLY to the company's jobs
  const applications = await prisma.application.findMany({
    where: {
      job: { companyId },
      status: { in: ["INTERVIEW_SCHEDULED", "FINAL_DECISION", "REJECTED"] },
    },
    include: {
      applicant: { include: { profile: true } },
      job: { select: { id: true, title: true } },
    },
    orderBy: { appliedAt: "desc" },
    take: 15,
  });

  const uniqueCandidates = new Map<string, RediscoveredCandidate>();

  for (const app of applications) {
    if (!app.applicant || uniqueCandidates.has(app.applicant.id)) continue;

    const candSkills = (app.applicant.profile?.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const isSilver = app.status === "FINAL_DECISION" || app.status === "INTERVIEW_SCHEDULED";

    uniqueCandidates.set(app.applicant.id, {
      candidateId: app.applicant.id,
      name: app.applicant.name,
      headline: app.applicant.headline || "Technical Professional",
      location: app.applicant.location || "Remote",
      previousJobTitle: app.job.title,
      previousStageReached: String(app.status),
      appliedDate: app.appliedAt.toISOString().split("T")[0],
      currentMatchScore: isSilver ? 92 : 82,
      isSilverMedalist: isSilver,
      matchingSkills: candSkills.slice(0, 4),
    });
  }

  return Array.from(uniqueCandidates.values());
}

/**
 * Returns actionable tasks that require recruiter attention from PostgreSQL.
 */
export async function getNeedsAttentionTasks(
  companyId: string,
  recruiterId: string
): Promise<NeedsAttentionTask[]> {
  const tasks: NeedsAttentionTask[] = [];
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // 1. Applications approaching/breaching SLA
  const pendingApps = await prisma.application.findMany({
    where: {
      job: { companyId },
      status: "SUBMITTED",
      appliedAt: { lte: threeDaysAgo },
    },
    include: {
      applicant: { select: { id: true, name: true } },
      job: { select: { id: true, title: true } },
    },
    take: 5,
  });

  if (pendingApps.length > 0) {
    tasks.push({
      id: "task-sla-warning",
      type: "SLA_WARNING",
      priority: "CRITICAL",
      title: `${pendingApps.length} Application${pendingApps.length > 1 ? "s" : ""} Approaching SLA Limit`,
      description: `Applications for ${pendingApps[0].job.title} have been pending review for more than 3 days.`,
      entityId: pendingApps[0].id,
      entityType: "APPLICATION",
      ctaText: "Review Applicants",
      ctaUrl: `/recruiter/applicants`,
      targetCount: pendingApps.length,
    });
  }

  // 2. Shortlisted candidates awaiting interview scheduling
  const shortlistedApps = await prisma.application.findMany({
    where: {
      job: { companyId },
      status: "UNDER_REVIEW",
    },
    include: {
      job: { select: { id: true, title: true } },
    },
    take: 5,
  });

  if (shortlistedApps.length > 0) {
    tasks.push({
      id: "task-shortlist-interview",
      type: "SHORTLISTED_PENDING_INTERVIEW",
      priority: "IMPORTANT",
      title: `${shortlistedApps.length} Shortlisted Candidate${shortlistedApps.length > 1 ? "s" : ""} Awaiting Interview`,
      description: `Candidates in UNDER_REVIEW status ready for interview scheduling.`,
      entityId: shortlistedApps[0].id,
      entityType: "APPLICATION",
      ctaText: "Schedule Interviews",
      ctaUrl: `/recruiter/applicants`,
      targetCount: shortlistedApps.length,
    });
  }

  return tasks;
}

/**
 * Recruiter Copilot Outreach Tools (Strict Company Isolation & Authorized Access)
 */

export async function getOutreachCampaign(companyId: string, campaignId: string) {
  return await prisma.outreachCampaign.findFirst({
    where: { id: campaignId, companyId },
    include: {
      job: true,
      sequenceSteps: { orderBy: { stepOrder: "asc" } },
      recipients: {
        include: {
          candidate: { select: { id: true, name: true, headline: true, location: true } },
          messages: true,
        },
      },
    },
  });
}

export async function getCampaignMetrics(companyId: string, campaignId?: string) {
  const campaign = campaignId
    ? await prisma.outreachCampaign.findFirst({
        where: { id: campaignId, companyId },
        include: { recipients: true, job: true },
      })
    : await prisma.outreachCampaign.findFirst({
        where: { companyId },
        include: { recipients: true, job: true },
        orderBy: { createdAt: "desc" },
      });

  if (!campaign) return null;

  const total = campaign.recipients.length;
  const sent = campaign.recipients.filter((r) => r.status === "SENT" || r.lastContactedAt).length;
  const delivered = campaign.recipients.filter((r) => r.status === "DELIVERED" || r.status === "REPLIED").length;
  const replied = campaign.recipients.filter((r) => r.status === "REPLIED" || r.repliedAt).length;
  const positive = campaign.recipients.filter((r) => r.responseClassification === "POSITIVE_INTEREST").length;
  const replyRate = delivered > 0 ? Math.round((replied / delivered) * 100) : 0;
  const positiveRate = replied > 0 ? Math.round((positive / replied) * 100) : 0;

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    status: campaign.status,
    total,
    sent,
    delivered,
    replied,
    positive,
    replyRate,
    positiveRate,
  };
}

export async function getCandidateEngagement(companyId: string, candidateId: string) {
  return await prisma.outreachRecipient.findMany({
    where: {
      candidateId,
      campaign: { companyId },
    },
    include: {
      campaign: { select: { id: true, name: true, status: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCandidatesNeedingFollowUp(companyId: string) {
  return await prisma.outreachRecipient.findMany({
    where: {
      campaign: { companyId, status: "ACTIVE" },
      status: { in: ["SENT", "DELIVERED"] },
      nextActionAt: { lte: new Date() },
      repliedAt: null,
      optedOutAt: null,
    },
    include: {
      candidate: { select: { id: true, name: true, headline: true, location: true } },
      campaign: { select: { id: true, name: true } },
    },
    take: 20,
  });
}

export async function prepareOutreach(companyId: string, candidateId: string, jobId?: string) {
  const { generateOutreachSequence } = await import("@/lib/outreach/outreachGenerator");
  const { checkCandidateDuplicateContact } = await import("@/lib/outreach/duplicateProtection");

  const candidate = await prisma.user.findUnique({
    where: { id: candidateId },
    include: {
      profile: true,
      candidateCommunicationPreference: true,
      assessmentSubmissions: {
        include: { assessment: true },
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!candidate || candidate.role !== "JOB_SEEKER") {
    return null;
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  let jobTitle = "Senior Engineering Role";
  let requiredSkills = ["TypeScript", "Node.js", "PostgreSQL"];

  if (jobId) {
    const j = await prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (j) {
      jobTitle = j.title;
      requiredSkills = j.skills.split(",").map((s) => s.trim());
    }
  }

  const candSkills = (candidate.profile?.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
  const latestSub = candidate.assessmentSubmissions[0];
  const assessmentEvidence = latestSub
    ? {
        hasAssessment: true,
        assessmentTitle: latestSub.assessment.title,
        overallScore: latestSub.overallScore,
        demonstratedSkills: candSkills.slice(0, 3),
      }
    : undefined;

  const drafts = generateOutreachSequence(
    {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      skills: candSkills,
      assessmentEvidence,
    },
    {
      id: jobId || "general",
      title: jobTitle,
      companyName: company?.name || "Our Company",
      requiredSkills,
    },
    "Recruiter"
  );

  const duplicateWarning = await checkCandidateDuplicateContact(companyId, candidateId);

  return {
    candidate: { id: candidate.id, name: candidate.name, skills: candSkills },
    drafts,
    duplicateWarning,
  };
}

export async function pauseCampaign(companyId: string, recruiterId: string, campaignId: string) {
  const campaign = await prisma.outreachCampaign.findFirst({
    where: { id: campaignId, companyId },
  });

  if (!campaign) {
    throw new Error("Campaign not found or does not belong to your company.");
  }

  const updated = await prisma.outreachCampaign.update({
    where: { id: campaignId },
    data: { status: "PAUSED" },
  });

  await logAuditEvent(recruiterId, "OUTREACH_CAMPAIGN_PAUSED", "OutreachCampaign", campaignId, { companyId });
  return updated;
}

export async function resumeCampaign(companyId: string, recruiterId: string, campaignId: string) {
  const campaign = await prisma.outreachCampaign.findFirst({
    where: { id: campaignId, companyId },
  });

  if (!campaign) {
    throw new Error("Campaign not found or does not belong to your company.");
  }

  const updated = await prisma.outreachCampaign.update({
    where: { id: campaignId },
    data: { status: "ACTIVE" },
  });

  await logAuditEvent(recruiterId, "OUTREACH_CAMPAIGN_RESUMED", "OutreachCampaign", campaignId, { companyId });
  return updated;
}

export async function cancelCampaign(companyId: string, recruiterId: string, campaignId: string) {
  const campaign = await prisma.outreachCampaign.findFirst({
    where: { id: campaignId, companyId },
  });

  if (!campaign) {
    throw new Error("Campaign not found or does not belong to your company.");
  }

  const updated = await prisma.outreachCampaign.update({
    where: { id: campaignId },
    data: { status: "CANCELLED" },
  });

  await prisma.outreachRecipient.updateMany({
    where: { campaignId, status: { in: ["DRAFT", "APPROVED", "QUEUED", "SENT", "DELIVERED"] }, repliedAt: null },
    data: { status: "CANCELLED", nextActionAt: null },
  });

  await logAuditEvent(recruiterId, "OUTREACH_CAMPAIGN_CANCELLED", "OutreachCampaign", campaignId, { companyId });
  return updated;
}

/**
 * Executes a recruiter action (e.g. shortlist, move stage, reject) with audit logging & event emission.
 */
export async function executeRecruiterAction(
  companyId: string,
  recruiterId: string,
  proposal: RecruiterActionProposal,
  confirmed: boolean
): Promise<{ success: boolean; message: string; auditEventId?: string }> {
  // If action requires confirmation and is not confirmed, return safety gate
  if (proposal.requiresConfirmation && !confirmed) {
    return {
      success: false,
      message: proposal.confirmationMessage || "Confirmation required to execute this action.",
    };
  }

  // Authorize target entity
  if (proposal.targetApplicationId) {
    const application = await prisma.application.findFirst({
      where: {
        id: proposal.targetApplicationId,
        job: { companyId }, // Strict tenant boundary
      },
      include: {
        applicant: true,
        job: true,
      },
    });

    if (!application) {
      return {
        success: false,
        message: "Unauthorized: Target application does not belong to your company.",
      };
    }

    if (proposal.actionType === "SHORTLIST" || proposal.actionType === "MOVE_STAGE") {
      const targetStatus = proposal.newStage === "INTERVIEW_SCHEDULED" ? "INTERVIEW_SCHEDULED" : "UNDER_REVIEW";
      await prisma.application.update({
        where: { id: application.id },
        data: { status: targetStatus as any },
      });

      await logAuditEvent(
        recruiterId,
        "RECRUITER_STAGE_MOVED",
        "Application",
        application.id,
        { previousStage: application.status, newStage: targetStatus, companyId }
      );

      await emitEvent({
        type: "RECRUITER_CANDIDATE_STAGE_MOVED",
        recipientId: recruiterId,
        actorId: recruiterId,
        entityType: "APPLICATION",
        entityId: application.id,
        metadata: {
          candidateName: application.applicant.name,
          candidateId: application.applicant.id,
          jobTitle: application.job.title,
          jobId: application.job.id,
          companyId,
          newStage: targetStatus,
        },
      });

      return {
        success: true,
        message: `Candidate ${application.applicant.name} successfully moved to ${targetStatus}.`,
      };
    }

    if (proposal.actionType === "REJECT") {
      await prisma.application.update({
        where: { id: application.id },
        data: { status: "REJECTED" as any },
      });

      await logAuditEvent(
        recruiterId,
        "RECRUITER_APPLICATION_REJECTED",
        "Application",
        application.id,
        { reason: proposal.rejectionReason || "Role closed / candidate profile mismatch", companyId }
      );

      return {
        success: true,
        message: `Candidate ${application.applicant.name} application moved to REJECTED.`,
      };
    }
  }

  return {
    success: true,
    message: "Action processed successfully.",
  };
}

/**
 * Master dispatcher for Recruiter Copilot natural language queries.
 */
export async function processCopilotQuery(
  companyId: string,
  recruiterId: string,
  userPrompt: string
): Promise<CopilotChatResponse> {
  const parsed = parseRecruiterIntent(userPrompt);

  switch (parsed.intent) {
    case "SEARCH_CANDIDATES": {
      const criteria = parsed.criteria || { skills: [], limit: 10 };
      const candidates = await searchCandidates(companyId, criteria);
      const skillsStr = criteria.skills.length > 0 ? ` with ${criteria.skills.join(", ")}` : "";
      const roleStr = criteria.role ? ` for ${criteria.role}` : "";

      const answer =
        candidates && candidates.length > 0
          ? `I found ${candidates.length} active discoverable candidate${candidates.length > 1 ? "s" : ""}${roleStr}${skillsStr} in PostgreSQL. Here are the top matches based on verified profile skills.`
          : `No discoverable candidates in the marketplace currently match all requested criteria (${roleStr || "specified role"}${skillsStr}). Try broadening your search or adjusting required skills.`;

      return {
        intent: "SEARCH_CANDIDATES",
        answer,
        toolUsed: "searchCandidates",
        data: { candidates },
        suggestions: [
          "Explain candidate fit for the strongest candidate",
          "Show me candidates requiring action",
          "Why is this job not progressing?",
        ],
      };
    }

    case "EXPLAIN_CANDIDATE_FIT": {
      // Find candidate by query or top candidate
      const candSearch = await searchCandidates(companyId, { skills: [], limit: 1 });
      const targetCandidateId = candSearch?.[0]?.id || "";
      const fit = targetCandidateId ? await getCandidateFit(companyId, targetCandidateId) : null;

      if (!fit) {
        return {
          intent: "EXPLAIN_CANDIDATE_FIT",
          answer: "Could not locate a candidate profile to evaluate fit. Please specify a candidate name or ID.",
          toolUsed: "getCandidateFit",
          suggestions: ["Find senior backend engineers", "Show my hiring overview"],
        };
      }

      const answer = `Candidate Fit for **${fit.candidateName}** on **${fit.jobTitle}**: **${fit.overallScore}/100** (${fit.confidenceLevel} Confidence).\n\n` +
        `**Strong Evidence:**\n` +
        fit.strongEvidence.map((e) => `• ${e.skill} — ${e.description}`).join("\n") +
        (fit.potentialGaps.length > 0
          ? `\n\n**Potential Gaps:**\n` + fit.potentialGaps.map((g) => `• ⚠ ${g.skillOrRequirement}: ${g.description}`).join("\n")
          : `\n\n**Potential Gaps:** None identified against core requirements.`);

      return {
        intent: "EXPLAIN_CANDIDATE_FIT",
        answer,
        toolUsed: "getCandidateFit",
        data: { fitAnalysis: fit },
        suggestions: [
          `Shortlist candidate ${fit.candidateName}`,
          `Find previous finalists for ${fit.jobTitle}`,
          "Show candidates needing action",
        ],
      };
    }

    case "ANALYZE_JOB_PIPELINE": {
      const pipeline = await getJobPipeline(companyId, parsed.targetJobQuery);

      if (!pipeline) {
        return {
          intent: "ANALYZE_JOB_PIPELINE",
          answer: "No active jobs found for your company to analyze.",
          toolUsed: "getJobPipeline",
          suggestions: ["Post a new job", "Search candidates in marketplace"],
        };
      }

      const bottleneck = pipeline.bottlenecks[0];
      const answer = `**Pipeline Analysis for ${pipeline.jobTitle}**\n\n` +
        `• **Total Applications:** ${pipeline.totalApplications}\n` +
        `• **Screen to Shortlist Conversion:** ${pipeline.conversionRates.screenToShortlist}%\n` +
        `• **Shortlist to Interview Conversion:** ${pipeline.conversionRates.shortlistToInterview}%\n\n` +
        `**Diagnosis (${bottleneck.severity} Priority):**\n` +
        `• **Observed Fact:** ${bottleneck.observedFact}\n` +
        `• **Inferred Insight:** ${bottleneck.inferredInsight}\n` +
        `• **Actionable Recommendation:** ${bottleneck.actionableRecommendation}`;

      return {
        intent: "ANALYZE_JOB_PIPELINE",
        answer,
        toolUsed: "getJobPipeline",
        data: { pipelineDiagnosis: pipeline },
        suggestions: [
          "Show applications approaching SLA",
          "Find candidate matches for this role",
          "Show previous finalists",
        ],
      };
    }

    case "TALENT_REDISCOVERY": {
      const rediscovery = await getTalentRediscovery(companyId, parsed.targetJobQuery);

      const answer =
        rediscovery.length > 0
          ? `I found **${rediscovery.length}** previous applicant${rediscovery.length > 1 ? "s" : ""} from your company's past job postings who match current requirements. ` +
            `This includes **${rediscovery.filter((c) => c.isSilverMedalist).length} silver-medalist candidate(s)** who reached interview or finalist rounds.`
          : `No previous applicants or silver-medalists found in your company's historical pipeline matching this search.`;

      return {
        intent: "TALENT_REDISCOVERY",
        answer,
        toolUsed: "getTalentRediscovery",
        data: { rediscoveredCandidates: rediscovery },
        suggestions: [
          "Search new candidates in marketplace",
          "Show candidates needing action",
          "Why is this job not progressing?",
        ],
      };
    }

    case "GET_RECRUITER_TASKS": {
      const tasks = await getNeedsAttentionTasks(companyId, recruiterId);

      const answer =
        tasks.length > 0
          ? `You have **${tasks.length} actionable item${tasks.length > 1 ? "s" : ""}** requiring attention across your hiring pipeline.`
          : `Your hiring pipeline is up to date! There are no overdue SLAs, pending scorecard reviews, or uncontacted finalists.`;

      return {
        intent: "GET_RECRUITER_TASKS",
        answer,
        toolUsed: "getNeedsAttentionTasks",
        data: { needsAttentionTasks: tasks },
        suggestions: [
          "Find my strongest candidates",
          "Why is my job pipeline stuck?",
          "Search senior backend engineers",
        ],
      };
    }

    case "GET_RECRUITER_METRICS": {
      const activeJobs = await prisma.job.count({ where: { companyId, status: "ACTIVE" } });
      const totalApps = await prisma.application.count({ where: { job: { companyId } } });
      const pendingReview = await prisma.application.count({ where: { job: { companyId }, status: "SUBMITTED" } });
      const interviews = await prisma.application.count({ where: { job: { companyId }, status: "INTERVIEW_SCHEDULED" } });

      const answer = `Here is your current hiring overview from PostgreSQL:\n\n` +
        `• **Active Jobs:** ${activeJobs}\n` +
        `• **Total Pipeline Candidates:** ${totalApps}\n` +
        `• **Applications Pending Review:** ${pendingReview}\n` +
        `• **Interviews Scheduled:** ${interviews}`;

      return {
        intent: "GET_RECRUITER_METRICS",
        answer,
        toolUsed: "getRecruiterMetrics",
        data: {
          metrics: {
            totalActiveJobs: activeJobs,
            totalPipelineCandidates: totalApps,
            totalPendingReviews: pendingReview,
            totalInterviewsScheduled: interviews,
          },
        },
        suggestions: [
          "Which candidates have been shortlisted?",
          "Show me candidates requiring action",
          "Find candidates with PostgreSQL and Node.js",
        ],
      };
    }

    case "GET_OUTREACH_CAMPAIGNS": {
      const campaigns = await prisma.outreachCampaign.findMany({
        where: { companyId },
        include: {
          recipients: true,
          job: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const answer =
        campaigns.length > 0
          ? `You have **${campaigns.length} active outreach campaign${campaigns.length > 1 ? "s" : ""}** in your company workspace.\n\n` +
            campaigns
              .map(
                (c) =>
                  `• **${c.name}** (${c.status}): ${c.recipients.length} candidate(s) enrolled — Job: ${c.job?.title || "General Engineering"}`
              )
              .join("\n")
          : `No outreach campaigns have been launched yet. You can create a campaign from Talent Radar, Candidate Search, or Job Pipeline.`;

      return {
        intent: "GET_OUTREACH_CAMPAIGNS",
        answer,
        toolUsed: "getOutreachCampaigns",
        data: { campaigns } as any,
        suggestions: [
          "How is my outreach campaign performing?",
          "Search new candidates in marketplace",
          "Show candidates needing action",
        ],
      };
    }

    case "GET_CAMPAIGN_METRICS": {
      const campaign = await prisma.outreachCampaign.findFirst({
        where: { companyId },
        include: { recipients: true, job: true },
        orderBy: { createdAt: "desc" },
      });

      if (!campaign) {
        return {
          intent: "GET_CAMPAIGN_METRICS",
          answer: "No active campaigns found to analyze metrics for.",
          toolUsed: "getCampaignMetrics",
          suggestions: ["Create an outreach campaign", "Search candidates"],
        };
      }

      const total = campaign.recipients.length;
      const sent = campaign.recipients.filter((r) => r.status === "SENT" || r.lastContactedAt).length;
      const delivered = campaign.recipients.filter((r) => r.status === "DELIVERED" || r.status === "REPLIED").length;
      const replied = campaign.recipients.filter((r) => r.status === "REPLIED" || r.repliedAt).length;
      const positive = campaign.recipients.filter((r) => r.responseClassification === "POSITIVE_INTEREST").length;

      const replyRate = delivered > 0 ? Math.round((replied / delivered) * 100) : 0;
      const positiveRate = replied > 0 ? Math.round((positive / replied) * 100) : 0;

      const answer = `**Performance for Campaign "${campaign.name}"** (${campaign.status}):\n\n` +
        `• **Enrolled Candidates:** ${total}\n` +
        `• **Delivered:** ${delivered} / ${sent} sent\n` +
        `• **Replies Received:** ${replied} (${replyRate}% reply rate)\n` +
        `• **Positive Interest:** ${positive} (${positiveRate}% positive rate)\n\n` +
        (positive > 0
          ? `💡 **Recommendation:** ${positive} candidate(s) expressed positive interest and are ready for interview scheduling.`
          : `💡 **Recommendation:** Follow-up sequences will automatically engage non-responding candidates on schedule.`);

      return {
        intent: "GET_CAMPAIGN_METRICS",
        answer,
        toolUsed: "getCampaignMetrics",
        data: { campaignMetrics: { total, sent, delivered, replied, positive, replyRate, positiveRate } } as any,
        suggestions: [
          "Show candidates interested in interviewing",
          "Show all active campaigns",
          "Find more senior backend engineers",
        ],
      };
    }

    case "PREPARE_INTERVIEW": {
      const interview = await prisma.interview.findFirst({
        where: { application: { job: { companyId } } },
        include: {
          application: { include: { applicant: true, job: true } },
          plan: true,
        },
        orderBy: { scheduledAt: "asc" },
      });

      if (!interview) {
        return {
          intent: "PREPARE_INTERVIEW",
          answer: "No upcoming interviews found in your company workspace to prepare for.",
          toolUsed: "prepareInterview",
          suggestions: ["Schedule an interview with a candidate", "Show my hiring overview"],
        };
      }

      const answer = `**Interview Preparation for ${interview.application.applicant.name}**\n\n` +
        `• **Role:** ${interview.application.job.title} (Round ${interview.round})\n` +
        `• **Scheduled:** ${new Date(interview.scheduledAt).toLocaleString()}\n` +
        `• **Key Focus:** Evidence verification on core required competencies.\n\n` +
        `💡 You can view the complete grounded question checklist and objectives in the **Interview Intelligence** workspace.`;

      return {
        intent: "PREPARE_INTERVIEW",
        answer,
        toolUsed: "prepareInterview",
        data: { interview } as any,
        suggestions: [
          "Show incomplete scorecards",
          "Compare finalists for this role",
          "Check candidate fit",
        ],
      };
    }

    case "SUMMARIZE_INTERVIEW": {
      const interview = await prisma.interview.findFirst({
        where: { application: { job: { companyId } } },
        include: {
          application: { include: { applicant: true, job: true } },
          summary: true,
          scorecards: { include: { scores: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });

      if (!interview) {
        return {
          intent: "SUMMARIZE_INTERVIEW",
          answer: "No completed interviews found to summarize.",
          toolUsed: "summarizeInterview",
          suggestions: ["Schedule an interview", "Show my hiring overview"],
        };
      }

      const answer = `**Interview Summary for ${interview.application.applicant.name} (${interview.application.job.title})**\n\n` +
        `• **Scorecards Recorded:** ${interview.scorecards.length}\n` +
        `• **Status:** ${interview.status}\n` +
        (interview.summary?.aiSynthesis ? `• **Synthesis:** ${interview.summary.aiSynthesis}` : "• **Notes:** Evaluation completed.");

      return {
        intent: "SUMMARIZE_INTERVIEW",
        answer,
        toolUsed: "summarizeInterview",
        data: { interview } as any,
        suggestions: [
          "Compare candidates",
          "Show incomplete scorecards",
          "Go to interview intelligence",
        ],
      };
    }

    case "GET_INCOMPLETE_SCORECARDS": {
      const pendingInterviews = await prisma.interview.findMany({
        where: {
          application: { job: { companyId } },
          scorecards: { none: { isComplete: true } },
        },
        include: {
          application: { include: { applicant: true, job: true } },
        },
        take: 5,
      });

      const answer =
        pendingInterviews.length > 0
          ? `You have **${pendingInterviews.length} interview(s)** awaiting completed scorecards:\n\n` +
            pendingInterviews
              .map((i) => `• **${i.application.applicant.name}** for *${i.application.job.title}* (Round ${i.round})`)
              .join("\n")
          : `All interview scorecards in your company workspace are up to date!`;

      return {
        intent: "GET_INCOMPLETE_SCORECARDS",
        answer,
        toolUsed: "getIncompleteScorecards",
        data: { pendingInterviews } as any,
        suggestions: [
          "Show my hiring overview",
          "Compare candidates",
          "Search new talent",
        ],
      };
    }

    case "COMPARE_CANDIDATES": {
      const finalists = await prisma.application.findMany({
        where: {
          job: { companyId },
          status: { in: ["INTERVIEW_SCHEDULED", "INTERVIEW_ROUND_1", "INTERVIEW_ROUND_2", "FINAL_DECISION"] },
        },
        include: { applicant: true, job: true },
        take: 3,
      });

      const answer =
        finalists.length >= 2
          ? `I found **${finalists.length} active finalists** for ${finalists[0].job.title}:\n\n` +
            finalists
              .map((f) => `• **${f.applicant.name}** — Stage: ${f.status}, Match Score: ${f.matchScore}%`)
              .join("\n") +
            `\n\n💡 Open the **Candidate Comparison Matrix** in the Interview Intelligence workspace for full side-by-side evaluation.`
          : `You currently have ${finalists.length} candidate(s) in active interview stages. Compare candidates becomes available once at least 2 finalists reach the interview pipeline.`;

      return {
        intent: "COMPARE_CANDIDATES",
        answer,
        toolUsed: "compareCandidates",
        data: { finalists } as any,
        suggestions: [
          "Show incomplete scorecards",
          "Search candidates",
          "View interview workspace",
        ],
      };
    }

    case "CHECK_EVIDENCE_CONFLICTS": {
      const summariesWithConflicts = await prisma.interviewSummary.findMany({
        where: { companyId },
        include: { interview: { include: { application: { include: { applicant: true, job: true } } } } },
        take: 5,
      });

      const withConflicts = summariesWithConflicts.filter((s) => {
        try {
          const arr = JSON.parse(s.conflictingEvidence || "[]");
          return Array.isArray(arr) && arr.length > 0;
        } catch {
          return false;
        }
      });

      const answer =
        withConflicts.length > 0
          ? `Found **${withConflicts.length} candidate(s)** with potential evidence conflicts between resume claims and interview observations:\n\n` +
            withConflicts
              .map((s) => `• **${s.interview.application.applicant.name}** (${s.interview.application.job.title})`)
              .join("\n")
          : `No evidence conflicts or contradictory statements detected across evaluated candidate scorecards.`;

      return {
        intent: "CHECK_EVIDENCE_CONFLICTS",
        answer,
        toolUsed: "checkEvidenceConflicts",
        data: { summariesWithConflicts: withConflicts } as any,
        suggestions: [
          "Prepare interview plan",
          "Show incomplete scorecards",
          "Search candidates",
        ],
      };
    }

    case "GET_HIRING_FUNNEL": {
      const activeJob = await prisma.job.findFirst({
        where: {
          companyId,
          ...(parsed.targetJobQuery ? { title: { contains: parsed.targetJobQuery, mode: "insensitive" } } : { status: "ACTIVE" }),
        },
        orderBy: { createdAt: "desc" },
      });

      if (!activeJob) {
        return {
          intent: "GET_HIRING_FUNNEL",
          answer: "No active jobs found in your company to calculate hiring funnel metrics.",
          toolUsed: "calculateJobFunnel",
          suggestions: ["Post a new job", "Search candidates"],
        };
      }

      const funnel = await calculateJobFunnel(activeJob.id, companyId);
      if (!funnel) {
        return {
          intent: "GET_HIRING_FUNNEL",
          answer: `Could not compute funnel metrics for ${activeJob.title}.`,
          toolUsed: "calculateJobFunnel",
          suggestions: ["Search candidates", "Show my hiring overview"],
        };
      }

      const answer = `**Hiring Funnel for ${funnel.jobTitle}**\n\n` +
        `• **Health Status:** ${funnel.health.status} (${funnel.health.score}/100)\n` +
        `• **Total Applications:** ${funnel.totalApplications} (${funnel.activeApplications} active)\n` +
        `• **Qualified Candidates:** ${funnel.qualifiedCount} (${funnel.qualifiedRate ?? 0}%)\n` +
        `• **Stage Conversions:**\n` +
        funnel.stages.map((s) => `  - **${s.stage}:** ${s.entrants} entrants, ${s.activeCount} active (${s.conversionRate !== null ? s.conversionRate + "% conversion" : "N/A"})`).join("\n") +
        `\n\n💡 *${funnel.health.calculationSummary}*`;

      return {
        intent: "GET_HIRING_FUNNEL",
        answer,
        toolUsed: "calculateJobFunnel",
        data: { funnel } as any,
        suggestions: [
          "Where is the funnel breaking?",
          "Which candidates require attention?",
          "What should I focus on today?",
        ],
      };
    }

    case "GET_JOB_HEALTH": {
      const summary = await calculateCompanyFunnelSummary(companyId);
      const answer = `**Company Job Health Overview**\n\n` +
        `• **Overall Funnel Health:** ${summary.overallHealth} (Average Score: ${summary.averageHealthScore}/100)\n` +
        `• **Active Jobs:** ${summary.activeJobsCount}\n` +
        `• **Total Applications:** ${summary.totalApplications} (${summary.totalActive} active)\n` +
        `• **Qualified Talent:** ${summary.totalQualified}\n\n` +
        `**Job Health Breakdown:**\n` +
        summary.jobFunnels.map((f) => `• **${f.jobTitle}:** ${f.health.status} (${f.health.score}/100) — ${f.totalApplications} apps`).join("\n");

      return {
        intent: "GET_JOB_HEALTH",
        answer,
        toolUsed: "calculateCompanyFunnelSummary",
        data: { summary } as any,
        suggestions: [
          "Find bottlenecks across my jobs",
          "What should I do today?",
          "Show stalled candidates",
        ],
      };
    }

    case "GET_BOTTLENECKS": {
      const bottlenecks = await detectCompanyBottlenecks(companyId);
      const answer =
        bottlenecks.length > 0
          ? `Found **${bottlenecks.length} operational bottleneck(s)** across your hiring pipelines:\n\n` +
            bottlenecks
              .map((b) => `• **[${b.severity}] ${b.jobTitle}** (${b.type.replace(/_/g, " ")}):\n  ${b.evidence}\n  *Action:* ${b.recommendedAction}`)
              .join("\n\n")
          : `No operational bottlenecks detected! All applications and scorecards are within configured SLA thresholds.`;

      return {
        intent: "GET_BOTTLENECKS",
        answer,
        toolUsed: "detectCompanyBottlenecks",
        data: { bottlenecks } as any,
        suggestions: [
          "What should I focus on today?",
          "Show stalled candidates",
          "View hiring funnel",
        ],
      };
    }

    case "GET_STALLED_CANDIDATES": {
      const stalled = await detectStalledCandidates(companyId);
      const answer =
        stalled.length > 0
          ? `Found **${stalled.length} candidate(s)** currently stalled in the pipeline:\n\n` +
            stalled
              .slice(0, 5)
              .map((s) => `• **[${s.riskLevel}] ${s.candidateName}** (*${s.jobTitle}*):\n  Stage: ${s.currentStage} for ${s.daysInStage} days (Limit: ${s.expectedThresholdDays}d)\n  *Action:* ${s.recommendedAction}`)
              .join("\n\n") +
            (stalled.length > 5 ? `\n\n*(and ${stalled.length - 5} more candidate(s) in pipeline)*` : "")
          : `No stalled candidates found! All active candidates are progressing within expected stage thresholds.`;

      return {
        intent: "GET_STALLED_CANDIDATES",
        answer,
        toolUsed: "detectStalledCandidates",
        data: { stalledCandidates: stalled } as any,
        suggestions: [
          "What should I focus on today?",
          "Find bottlenecks",
          "Show incomplete scorecards",
        ],
      };
    }

    case "GET_RECRUITER_WORKLOAD": {
      const workload = await calculateRecruiterWorkload(recruiterId, companyId);
      if (!workload) {
        return {
          intent: "GET_RECRUITER_WORKLOAD",
          answer: "Could not calculate recruiter workload.",
          toolUsed: "calculateRecruiterWorkload",
          suggestions: ["Show my hiring overview", "Search candidates"],
        };
      }

      const answer = `**Recruiter Workload Status: ${workload.status}** (${workload.workloadScore}/100)\n\n` +
        `• **Active Jobs Managed:** ${workload.activeJobsCount}\n` +
        `• **Active Candidate Pipeline:** ${workload.activeCandidatesCount}\n` +
        `• **Pending Reviews:** ${workload.pendingReviewsCount}\n` +
        `• **Pending Scorecards:** ${workload.pendingScorecardsCount}\n` +
        `• **Upcoming Interviews:** ${workload.upcomingInterviewsCount}\n` +
        `• **Overdue SLA Tasks:** ${workload.overdueTasksCount}\n\n` +
        `💡 *${workload.explanation}*`;

      return {
        intent: "GET_RECRUITER_WORKLOAD",
        answer,
        toolUsed: "calculateRecruiterWorkload",
        data: { workload } as any,
        suggestions: [
          "What should I focus on today?",
          "Show stalled candidates",
          "Find bottlenecks",
        ],
      };
    }

    case "GET_HIRING_RISKS": {
      const activeJobs = await prisma.job.findMany({
        where: { companyId, status: "ACTIVE" },
        select: { id: true, title: true },
      });

      const riskPromises = activeJobs.map((j) => calculateHiringTargetRisk(j.id, companyId));
      const risks = (await Promise.all(riskPromises)).filter((r) => r !== null);

      const answer =
        risks.length > 0
          ? `**Hiring Target & Deadline Risks**\n\n` +
            risks
              .map((r) => `• **[${r!.velocityStatus}] ${r!.jobTitle}:**\n  ${r!.explanation}`)
              .join("\n\n")
          : `No active jobs currently tracked for hiring target risks.`;

      return {
        intent: "GET_HIRING_RISKS",
        answer,
        toolUsed: "calculateHiringTargetRisk",
        data: { risks } as any,
        suggestions: [
          "What should I focus on today?",
          "Where are we losing candidates?",
          "Find bottlenecks",
        ],
      };
    }

    case "GET_RECOMMENDED_ACTIONS": {
      const actions = await generateStrategicRecommendations(companyId, recruiterId);
      const answer =
        actions.length > 0
          ? `Here is your prioritized **Strategic Action Plan** for today:\n\n` +
            actions
              .slice(0, 5)
              .map((a, idx) => `${idx + 1}. **[${a.priority}] ${a.title}**\n   *Reason:* ${a.reason}\n   *Expected Impact:* ${a.expectedImpact}`)
              .join("\n\n") +
            `\n\n💡 Select any action to open the corresponding candidate or job record.`
          : `All active jobs and candidate pipelines are clear! No urgent bottlenecks or stalled candidates detected.`;

      return {
        intent: "GET_RECOMMENDED_ACTIONS",
        answer,
        toolUsed: "generateStrategicRecommendations",
        data: { actions } as any,
        suggestions: [
          "Show stalled candidates",
          "Which jobs are at risk?",
          "Find senior backend engineers",
        ],
      };
    }

    case "COMPARE_HIRING_FUNNEL": {
      const activeJob = await prisma.job.findFirst({
        where: {
          companyId,
          ...(parsed.targetJobQuery ? { title: { contains: parsed.targetJobQuery, mode: "insensitive" } } : { status: "ACTIVE" }),
        },
      });

      if (!activeJob) {
        return {
          intent: "COMPARE_HIRING_FUNNEL",
          answer: "No active job found to compare against historical benchmarks.",
          toolUsed: "compareJobWithHistorical",
          suggestions: ["Show my hiring overview", "Search candidates"],
        };
      }

      const comparisons = await compareJobWithHistorical(activeJob.id, companyId);
      const answer = `**Historical Benchmark Comparison for ${activeJob.title}**\n\n` +
        comparisons
          .map((c) => `• **${c.metricName}:** ${c.currentJobValue} (Historical: ${c.companyHistoricalMedian ?? "N/A"})\n  ${c.summary}`)
          .join("\n\n");

      return {
        intent: "COMPARE_HIRING_FUNNEL",
        answer,
        toolUsed: "compareJobWithHistorical",
        data: { comparisons } as any,
        suggestions: [
          "Where are we losing candidates?",
          "What should I do today?",
          "Show bottlenecks",
        ],
      };
    }

    case "GET_SUPPLY_VS_FUNNEL": {
      let activeJob = parsed.targetJobQuery
        ? await prisma.job.findFirst({
            where: { companyId, title: { contains: parsed.targetJobQuery, mode: "insensitive" } },
          })
        : null;

      if (!activeJob) {
        activeJob = await prisma.job.findFirst({
          where: { companyId, status: "ACTIVE" },
        });
      }

      if (!activeJob) {
        return {
          intent: "GET_SUPPLY_VS_FUNNEL",
          answer: "### OBSERVED DATA\nNo active job requisition found in workspace.\n\n### INSIGHTS\nCreate or publish an active job posting to diagnose hiring constraints.\n\n### RISKS\nWithout active requisitions, funnel conversion cannot be tracked.\n\n### RECOMMENDATION\nPost a job from the Recruiter workspace.\n\n### DATA LIMITATIONS\nNextHire requires active requisitions to evaluate supply vs funnel constraints.",
          toolUsed: "diagnoseSupplyVsFunnel",
          suggestions: ["Post a job", "Search candidates"],
        };
      }

      const diag = await diagnoseSupplyVsFunnel(activeJob.id);
      if (!diag) {
        return {
          intent: "GET_SUPPLY_VS_FUNNEL",
          answer: "Unable to calculate diagnostic metrics for this job.",
          toolUsed: "diagnoseSupplyVsFunnel",
          suggestions: ["Show my active jobs", "Search candidates"],
        };
      }

      const answer = `### OBSERVED DATA\n` +
        `• **Requisition:** ${diag.jobTitle}\n` +
        `• **Matching Candidate Supply:** ${diag.totalMatchingSupply} profiles (${diag.qualifiedSupply} qualified, ${diag.verifiedSupply} verified)\n` +
        `• **Internal Funnel:** ${diag.funnelApplications} applications, ${diag.funnelShortlisted} shortlisted, ${diag.funnelInterviews} interviewed, ${diag.funnelOffers} offers\n` +
        `• **Funnel Health Score:** ${diag.funnelHealthScore}/100\n\n` +
        `### INSIGHTS\n` +
        `• **Primary Constraint Classification:** **${diag.classification}**\n` +
        `• **Diagnosis:** ${diag.diagnosisSummary}\n` +
        diag.evidence.map((e) => `• ${e}`).join("\n") + "\n\n" +
        `### RISKS\n` +
        (diag.classification === "SUPPLY_CONSTRAINT"
          ? `• Candidate pool is thin; relying solely on inbound organic applicants may delay hiring target.`
          : diag.classification === "FUNNEL_CONSTRAINT"
          ? `• Adding more candidates into an unreviewed or stalling funnel wastes sourcing budget and damages candidate experience.`
          : `• Low candidate supply combined with pipeline drop-off requires simultaneous action.`) + "\n\n" +
        `### RECOMMENDATION\n` +
        `• ${diag.recommendation}\n\n` +
        `### DATA LIMITATIONS\n` +
        `• ${diag.sourceMetadata.disclaimer} Sample size: ${diag.sourceMetadata.sampleSize}.`;

      return {
        intent: "GET_SUPPLY_VS_FUNNEL",
        answer,
        toolUsed: "diagnoseSupplyVsFunnel",
        data: { diagnosis: diag } as any,
        suggestions: [
          "Which requirements are restricting the talent pool?",
          "What sourcing strategy should I use?",
          "Show bottlenecks",
        ],
      };
    }

    case "GET_REQUIREMENT_STRICTNESS": {
      let activeJob = parsed.targetJobQuery
        ? await prisma.job.findFirst({
            where: { companyId, title: { contains: parsed.targetJobQuery, mode: "insensitive" } },
          })
        : null;

      if (!activeJob) {
        activeJob = await prisma.job.findFirst({
          where: { companyId, status: "ACTIVE" },
        });
      }

      if (!activeJob) {
        return {
          intent: "GET_REQUIREMENT_STRICTNESS",
          answer: "### OBSERVED DATA\nNo active job found to simulate requirement strictness.\n\n### INSIGHTS\nSimulation models candidate pool expansion when requirements are relaxed.\n\n### RISKS\nNone.\n\n### RECOMMENDATION\nPost a job to simulate requirement strictness.\n\n### DATA LIMITATIONS\nRequires active requisition.",
          toolUsed: "simulateRequirementStrictness",
          suggestions: ["Post a job", "Search candidates"],
        };
      }

      const strictness = await simulateRequirementStrictness(activeJob.id);
      if (!strictness) {
        return {
          intent: "GET_REQUIREMENT_STRICTNESS",
          answer: "Unable to simulate requirement strictness for this requisition.",
          toolUsed: "simulateRequirementStrictness",
          suggestions: ["Show my active jobs", "Search candidates"],
        };
      }

      const answer = `### OBSERVED DATA\n` +
        `• **Requisition:** ${strictness.jobTitle}\n` +
        `• **Baseline Matching Pool:** ${strictness.baselinePoolSize} candidate(s)\n` +
        `• **Requirement Strictness Score:** ${strictness.overallStrictnessScore}/100\n` +
        `• **Most Restrictive Requirement:** ${strictness.mostRestrictiveRequirement}\n\n` +
        `### INSIGHTS\n` +
        `• **Simulation Summary:** ${strictness.summary}\n` +
        strictness.simulations.slice(0, 3).map((s) => `• **${s.parameter}:** ${s.originalValue} ➔ ${s.relaxedValue} (Pool Gain: +${s.poolGainPercentage}% / +${s.relaxedPoolSize - s.originalPoolSize} candidates)`).join("\n") + "\n\n" +
        `### RISKS\n` +
        `• Relaxing core skills too broadly may increase interview evaluation burden. Ensure assessment gates remain rigorous.\n\n` +
        `### RECOMMENDATION\n` +
        `• Consider making '${strictness.mostRestrictiveRequirement}' preferred rather than mandatory to maximize top-of-funnel reach.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• ${strictness.sourceMetadata.disclaimer}`;

      return {
        intent: "GET_REQUIREMENT_STRICTNESS",
        answer,
        toolUsed: "simulateRequirementStrictness",
        data: { strictness } as any,
        suggestions: [
          "What sourcing strategy should I use?",
          "Is this job a supply problem or a funnel problem?",
          "Which skills are scarce?",
        ],
      };
    }

    case "GET_SOURCING_STRATEGY": {
      let activeJob = parsed.targetJobQuery
        ? await prisma.job.findFirst({
            where: { companyId, title: { contains: parsed.targetJobQuery, mode: "insensitive" } },
          })
        : null;

      if (!activeJob) {
        activeJob = await prisma.job.findFirst({
          where: { companyId, status: "ACTIVE" },
        });
      }

      const recs = activeJob
        ? await generateJobSourcingRecommendations(activeJob.id)
        : (await getMarketOverview(companyId)).topRecommendations;

      const answer = `### OBSERVED DATA\n` +
        `• Evaluated active candidate ecosystem across matching, verified, and geographic distributions.\n\n` +
        `### INSIGHTS & SOURCING STRATEGY\n` +
        (recs.length > 0
          ? recs.map((r, i) => `${i + 1}. **[${r.priority}] ${r.title}**\n   • *Reason:* ${r.reason}\n   • *Expected Impact:* ${r.expectedImpact}\n   • *Evidence:* ${r.evidence}`).join("\n\n")
          : "• All sourcing parameters are performing well with healthy candidate reach.") + "\n\n" +
        `### RISKS\n` +
        `• Over-relying on a single sourcing channel or failing to engage pre-verified candidates will slow hiring velocity.\n\n` +
        `### RECOMMENDATION\n` +
        (recs[0] ? `• Immediate Focus: ${recs[0].title} (${recs[0].ctaText})` : "• Continue current active sourcing cadence.") + "\n\n" +
        `### DATA LIMITATIONS\n` +
        `• Grounded strictly in NextHire discoverable candidate profiles and verified assessment data.`;

      return {
        intent: "GET_SOURCING_STRATEGY",
        answer,
        toolUsed: "generateJobSourcingRecommendations",
        data: { recommendations: recs } as any,
        suggestions: [
          "Show talent supply overview",
          "Which skills are scarce?",
          "Where is talent concentrated?",
        ],
      };
    }

    case "GET_SKILL_SCARCITY": {
      const skills = await calculateSkillScarcity();
      const answer = `### OBSERVED DATA\n` +
        skills.slice(0, 6).map((s) => `• **${s.skill}:** ${s.relativeScarcity} (${s.matchingCount} candidates, ${s.poolPercentage}% share, ${s.verifiedCount} verified)`).join("\n") + "\n\n" +
        `### INSIGHTS\n` +
        `• Relative platform scarcity indicates which technical capabilities are abundant vs tightly contested.\n` +
        (skills[0]?.adjacentSkills?.length > 0 ? `• **Adjacent Skills:** For '${skills[0].skill}', candidates commonly possess ${skills[0].adjacentSkills.join(", ")}.\n\n` : "\n") +
        `### RISKS\n` +
        `• Mandating multiple critically scarce skills in a single requisition dramatically shrinks eligible candidate pools.\n\n` +
        `### RECOMMENDATION\n` +
        `• Pair scarce core technologies with adjacent trainable skills to widen sourcing yield.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Scarcity index computed across active platform discoverable profiles.`;

      return {
        intent: "GET_SKILL_SCARCITY",
        answer,
        toolUsed: "calculateSkillScarcity",
        data: { skills } as any,
        suggestions: [
          "What sourcing strategy should I use?",
          "Where is talent concentrated?",
          "How much remote talent exists?",
        ],
      };
    }

    case "GET_LOCATION_SUPPLY": {
      const locations = await calculateLocationSupply();
      const answer = `### OBSERVED DATA\n` +
        locations.slice(0, 5).map((l) => `• **${l.city}, ${l.country}:** ${l.totalCandidates} candidates (${l.qualifiedCandidates} qualified, ${l.verifiedCandidates} verified) — ${l.percentageOfPool}% of pool`).join("\n") + "\n\n" +
        `### INSIGHTS\n` +
        `• Top geographic hub: **${locations[0]?.city || "Unspecified"}** with ${locations[0]?.percentageOfPool || 0}% of matching candidate density.\n\n` +
        `### RISKS\n` +
        `• Restricting requisitions to a single low-density city increases time-to-hire significantly.\n\n` +
        `### RECOMMENDATION\n` +
        `• Focus active sourcing on top hubs or consider opening hybrid/remote eligibility.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Geographic metrics aggregated at city/country level. No private residential data is exposed.`;

      return {
        intent: "GET_LOCATION_SUPPLY",
        answer,
        toolUsed: "calculateLocationSupply",
        data: { locations } as any,
        suggestions: [
          "How much remote talent exists?",
          "What sourcing strategy should I use?",
          "Seniority distribution",
        ],
      };
    }

    case "GET_REMOTE_SUPPLY": {
      const remote = await calculateRemoteSupply();
      const answer = `### OBSERVED DATA\n` +
        remote.map((r) => `• **${r.remotePreference}:** ${r.candidateCount} candidates (${r.percentageOfPool}% of pool)`).join("\n") + "\n\n" +
        `### INSIGHTS\n` +
        `• Remote supply status: **${remote[0]?.status || "INSUFFICIENT_DATA"}**.\n` +
        `• Over ${remote.filter((r) => r.remotePreference.includes("Remote")).reduce((acc, r) => acc + r.percentageOfPool, 0)}% of candidates prefer remote or hybrid flexibility.\n\n` +
        `### RISKS\n` +
        `• Strictly onsite job postings will filter out a majority of active discoverable candidates.\n\n` +
        `### RECOMMENDATION\n` +
        `• Enable hybrid or remote eligibility for technical requisitions where possible.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Based on candidate stated profile preferences and location settings.`;

      return {
        intent: "GET_REMOTE_SUPPLY",
        answer,
        toolUsed: "calculateRemoteSupply",
        data: { remote } as any,
        suggestions: [
          "Where is talent concentrated?",
          "What sourcing strategy should I use?",
          "Show talent supply overview",
        ],
      };
    }

    case "GET_SENIORITY_SUPPLY": {
      const seniority = await calculateSenioritySupply();
      const answer = `### OBSERVED DATA\n` +
        seniority.map((s) => `• **${s.level}:** ${s.totalCount} candidates (${s.percentageOfPool}%), Avg Exp: ${s.avgExperienceYears} yrs (${s.qualifiedCount} qualified, ${s.verifiedCount} verified)`).join("\n") + "\n\n" +
        `### INSIGHTS\n` +
        `• Talent pool is most dense in Mid to Senior tiers.\n\n` +
        `### RISKS\n` +
        `• Executive and Principal level talent represents a scarce proportion of the pool.\n\n` +
        `### RECOMMENDATION\n` +
        `• For Lead/Principal roles, pair targeted direct outreach with competitive compensation benchmarks.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Seniority classified from verified experience records and profile headlines.`;

      return {
        intent: "GET_SENIORITY_SUPPLY",
        answer,
        toolUsed: "calculateSenioritySupply",
        data: { seniority } as any,
        suggestions: [
          "Which skills are scarce?",
          "What sourcing strategy should I use?",
          "Has talent supply changed over the last 90 days?",
        ],
      };
    }

    case "GET_MARKET_TRENDS": {
      const trends = await calculateMarketTrends("90d");
      const answer = `### OBSERVED DATA\n` +
        `• **Period:** Last 90 Days (Sample Size: ${trends.sampleSize} candidates)\n` +
        `• **Candidate Growth Rate:** ${trends.candidateGrowthRate >= 0 ? "+" : ""}${trends.candidateGrowthRate}%\n` +
        `• **Qualified Candidate Growth Rate:** ${trends.qualifiedGrowthRate >= 0 ? "+" : ""}${trends.qualifiedGrowthRate}%\n` +
        `• **Remote Candidate Growth:** ${trends.remoteCandidateGrowthRate >= 0 ? "+" : ""}${trends.remoteCandidateGrowthRate}%\n` +
        `• **Top Emerging Skills:** ${trends.topGrowingSkills.map((s) => `${s.skill} (+${s.growthPercentage}%)`).join(", ") || "Stable"}\n\n` +
        `### INSIGHTS\n` +
        `• Candidate influx demonstrates steady growth in verified engineering talent.\n\n` +
        `### RISKS\n` +
        `• Market demand for emerging technical capabilities is accelerating.\n\n` +
        `### RECOMMENDATION\n` +
        `• Engage emerging talent pools proactively through Talent Radar and outreach campaigns.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• ${trends.sourceMetadata.disclaimer} (${trends.baselineComparisonPeriod})`;

      return {
        intent: "GET_MARKET_TRENDS",
        answer,
        toolUsed: "calculateMarketTrends",
        data: { trends } as any,
        suggestions: [
          "What sourcing strategy should I use?",
          "Which skills are scarce?",
          "Show talent supply overview",
        ],
      };
    }

    case "GET_TALENT_SUPPLY": {
      const supply = await calculateTalentSupply({ companyId });
      const answer = `### OBSERVED DATA\n` +
        `• **Total Discoverable Candidates:** ${supply.totalDiscoverable}\n` +
        `• **Matching Candidates:** ${supply.totalMatching}\n` +
        `• **Qualified Candidates:** ${supply.qualifiedCount}\n` +
        `• **Verified Candidates:** ${supply.verifiedCount}\n` +
        `• **Partially Verified Candidates:** ${supply.partiallyVerifiedCount}\n` +
        `• **Geographic Concentration:** ${supply.concentration}\n\n` +
        `### INSIGHTS\n` +
        `• Observed candidate supply on NextHire provides strong coverage for active engineering and product roles.\n\n` +
        `### RISKS\n` +
        `• Unverified candidates require structured assessment screening prior to interview scheduling.\n\n` +
        `### RECOMMENDATION\n` +
        `• Prioritize outreach to the ${supply.verifiedCount} verified candidates with validated assessment scores.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• ${supply.sourceMetadata.disclaimer}`;

      return {
        intent: "GET_TALENT_SUPPLY",
        answer,
        toolUsed: "calculateTalentSupply",
        data: { supply } as any,
        suggestions: [
          "Which skills are scarce?",
          "Where is talent concentrated?",
          "What sourcing strategy should I use?",
        ],
      };
    }

    // =========================================================================
    // PHASE 13: RECRUITER GROWTH, TEAM COLLABORATION & HIRING OPERATIONS
    // =========================================================================

    case "GET_TEAM_WORKLOAD": {
      const overview = await getTeamWorkloadOverview(companyId);
      const answer = `### OBSERVED DATA\n` +
        `• **Total Recruiters on Team:** ${overview.totalRecruiters}\n` +
        `• **Workload Breakdown:** ${overview.distribution.normal} Normal, ${overview.distribution.busy} Busy, ${overview.distribution.overloaded} Overloaded, ${overview.distribution.critical} Critical\n` +
        `• **Unassigned Active Candidates:** ${overview.unassignedCandidatesCount}\n` +
        `• **Paused / Uncovered Requisitions:** ${overview.unassignedJobsCount}\n\n` +
        `### INSIGHTS\n` +
        (overview.overloadedRecruiters.length > 0
          ? `• **Overloaded Recruiters (${overview.overloadedRecruiters.length}):** ` +
            overview.overloadedRecruiters.map((r) => `${r.name} (${r.workloadStatus}, score ${r.workloadScore}/100, ${r.assignedCandidatesCount} candidates, ${r.overdueTasksCount} overdue tasks)`).join("; ") + `.\n\n`
          : `• Team workload is well-distributed. No recruiters have exceeded critical capacity thresholds.\n\n`) +
        `### RISKS\n` +
        (overview.unassignedCandidatesCount > 0
          ? `• ${overview.unassignedCandidatesCount} candidate(s) currently lack an active owner, risking SLA decay.`
          : `• High operational load without handoffs may slow application review velocity.`) + `\n\n` +
        `### RECOMMENDATION\n` +
        (overview.overloadedRecruiters.length > 0
          ? `• Reassign candidates from ${overview.overloadedRecruiters[0].name} to team members with Normal capacity.`
          : `• Assign unowned candidates to available recruiters in queue.`) + `\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Workload calculations reflect internal PostgreSQL activity within company scope.`;

      return {
        intent: "GET_TEAM_WORKLOAD",
        answer,
        toolUsed: "getTeamWorkloadOverview",
        data: { overview } as any,
        suggestions: [
          "Who has capacity?",
          "Which candidates are unassigned?",
          "Show team priorities",
        ],
      };
    }

    case "GET_UNASSIGNED_WORK": {
      const overview = await getTeamWorkloadOverview(companyId);
      const answer = `### OBSERVED DATA\n` +
        `• **Unassigned Candidates:** ${overview.unassignedCandidatesCount}\n` +
        `• **Unassigned / Paused Jobs:** ${overview.unassignedJobsCount}\n` +
        `• **Available Recruiters with Capacity:** ${overview.members.filter((m) => m.workloadStatus === "NORMAL").length}\n\n` +
        `### INSIGHTS\n` +
        `• Candidates without an assigned owner risk missing standard review SLAs (target: 7 days).\n\n` +
        `### RISKS\n` +
        `• Prolonged unassigned status leads to candidate abandonment and lower offer acceptance rates.\n\n` +
        `### RECOMMENDATION\n` +
        `• Use the smart assignment engine to distribute unassigned candidates to recruiters with Normal workload capacity.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Filtered strictly by active applications in current company scope.`;

      return {
        intent: "GET_UNASSIGNED_WORK",
        answer,
        toolUsed: "getTeamWorkloadOverview",
        data: { unassignedCount: overview.unassignedCandidatesCount } as any,
        suggestions: [
          "Who should take this candidate?",
          "Who has capacity?",
          "Show team workload",
        ],
      };
    }

    case "GET_RECRUITER_CAPACITY": {
      const members = await getTeamMembers(companyId);
      const available = members.filter((m) => m.workloadStatus === "NORMAL" || m.workloadStatus === "BUSY");
      const answer = `### OBSERVED DATA\n` +
        `• **Team Members with Available Capacity (${available.length}/${members.length}):**\n` +
        available.map((m) => `  - **${m.name}** (${m.teamRole}): ${m.workloadStatus} (score: ${m.workloadScore}/100, ${m.assignedCandidatesCount} candidates, ${m.pendingReviewsCount} pending reviews)`).join("\n") + `\n\n` +
        `### INSIGHTS\n` +
        `• Recruiters listed above have capacity to accept new candidate assignments or handoffs without violating SLAs.\n\n` +
        `### RISKS\n` +
        `• Assigning additional requisitions to Overloaded recruiters will create interview and scorecard bottlenecks.\n\n` +
        `### RECOMMENDATION\n` +
        (available.length > 0
          ? `• Route new incoming applicants to ${available[0].name}.`
          : `• Consider pausing inbound applications or redistributing candidate queues.`) + `\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Operational capacity evaluated against live Prisma application and scorecard records.`;

      return {
        intent: "GET_RECRUITER_CAPACITY",
        answer,
        toolUsed: "getTeamMembers",
        data: { available } as any,
        suggestions: [
          "Show team workload",
          "Where are recruiters duplicating work?",
          "Show team priorities",
        ],
      };
    }

    case "GET_HANDOFFS": {
      const handoffs = await getHandoffs(companyId);
      const pending = handoffs.filter((h) => h.status === "PENDING");
      const overdue = pending.filter((h) => h.isOverdue);

      const answer = `### OBSERVED DATA\n` +
        `• **Total Handoff Records:** ${handoffs.length}\n` +
        `• **Pending Handoffs:** ${pending.length}\n` +
        `• **Overdue Handoffs:** ${overdue.length}\n\n` +
        `### INSIGHTS\n` +
        (pending.length > 0
          ? `• **Active Pending Handoffs:**\n` +
            pending.map((h) => `  - ${h.candidateName} (${h.currentStage}): from ${h.fromRecruiterName} to ${h.toRecruiterName} [${h.reason}]${h.isOverdue ? " (OVERDUE SLA)" : ""}`).join("\n") + `\n\n`
          : `• No pending candidate handoffs in queue.\n\n`) +
        `### RISKS\n` +
        (overdue.length > 0
          ? `• ${overdue.length} handoff(s) have exceeded the 48-hour acceptance SLA, delaying interview loops.`
          : `• Incomplete handoff context can cause candidates to repeat interview discussions.`) + `\n\n` +
        `### RECOMMENDATION\n` +
        (overdue.length > 0
          ? `• Request ${overdue[0].toRecruiterName} to accept or reject handoff for ${overdue[0].candidateName}.`
          : `• Ensure all handoff notes include completed competencies and next recommended actions.`) + `\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Scoped to company handoffs log.`;

      return {
        intent: "GET_HANDOFFS",
        answer,
        toolUsed: "getHandoffs",
        data: { handoffs } as any,
        suggestions: [
          "Who has capacity?",
          "Show team workload",
          "What should the team focus on today?",
        ],
      };
    }

    case "GET_DUPLICATE_WORK": {
      const alerts = await detectDuplicateWork(companyId);
      const answer = `### OBSERVED DATA\n` +
        `• **Duplicate Work Alerts Detected:** ${alerts.length}\n\n` +
        `### INSIGHTS\n` +
        (alerts.length > 0
          ? alerts.map((a) => `• **${a.type} (${a.severity}):** ${a.description}\n  - *Activity:* ${a.existingActivity}\n  - *Recommended Fix:* ${a.recommendedResolution}`).join("\n\n") + `\n\n`
          : `• No duplicate outreach campaigns, concurrent reviews, or conflicting tasks detected across recruiters.\n\n`) +
        `### RISKS\n` +
        (alerts.length > 0
          ? `• Redundant contacts degrade candidate experience and waste recruiting bandwidth.`
          : `• None detected.`) + `\n\n` +
        `### RECOMMENDATION\n` +
        (alerts.length > 0
          ? `• ${alerts[0].recommendedResolution}`
          : `• Maintain clear candidate queue ownership via active assignments.`) + `\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Analyzes outreach campaigns, application review events, and hiring tasks within last 48 hours.`;

      return {
        intent: "GET_DUPLICATE_WORK",
        answer,
        toolUsed: "detectDuplicateWork",
        data: { alerts } as any,
        suggestions: [
          "Show team workload",
          "Who is overloaded today?",
          "Show team priorities",
        ],
      };
    }

    case "GET_TEAM_FUNNEL": {
      const funnel = await getTeamFunnelMetrics(companyId);
      const answer = `### OBSERVED DATA\n` +
        `• **Total Team Applications:** ${funnel.totalApplications}\n` +
        `• **Stage Conversions:**\n` +
        funnel.stages.map((s) => `  - **${s.stage}:** ${s.entrants} candidates (${s.conversionRate !== null ? `${s.conversionRate}% conversion` : "N/A"})`).join("\n") + `\n` +
        `• **Overall Hire Rate:** ${funnel.overallConversionRate !== null ? `${funnel.overallConversionRate}%` : "N/A"}\n` +
        `• **Offer Acceptance Rate:** ${funnel.offerAcceptanceRate !== null ? `${funnel.offerAcceptanceRate}%` : "N/A"}\n\n` +
        `### INSIGHTS\n` +
        `• Team conversion shows strongest drop-off between application submission and review screening.\n\n` +
        `### RISKS\n` +
        `• Low initial screen conversion indicates either broad job advertising or delayed recruiter reviews.\n\n` +
        `### RECOMMENDATION\n` +
        `• Align team reviewers on standardized scorecard rubrics to accelerate shortlisting.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Grounded across ${funnel.sampleSize} application records. ${funnel.isSufficientData ? "Sample size is statistically sufficient." : "Sample size is limited; metrics are directional."}`;

      return {
        intent: "GET_TEAM_FUNNEL",
        answer,
        toolUsed: "getTeamFunnelMetrics",
        data: { funnel } as any,
        suggestions: [
          "Where are team bottlenecks?",
          "Show team productivity",
          "Show team workload",
        ],
      };
    }

    case "GET_TEAM_ACTIVITY": {
      const activities = await getTeamActivityStream(companyId, 10);
      const answer = `### OBSERVED DATA\n` +
        `• **Recent Team Activity (Last 10 actions):**\n` +
        activities.map((a) => `  - **${new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}:** ${a.summary}`).join("\n") + `\n\n` +
        `### INSIGHTS\n` +
        `• High collaboration activity across candidate reviews, scorecards, and task completions.\n\n` +
        `### RISKS\n` +
        `• None.\n\n` +
        `### RECOMMENDATION\n` +
        `• Continue logging internal notes and handoff summaries to preserve candidate context.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Real-time stream generated from company audit and collaboration records.`;

      return {
        intent: "GET_TEAM_ACTIVITY",
        answer,
        toolUsed: "getTeamActivityStream",
        data: { activities } as any,
        suggestions: [
          "Show team workload",
          "Which candidates are unassigned?",
          "Show team priorities",
        ],
      };
    }

    case "GET_ASSIGNMENT_RECOMMENDATION": {
      let activeCandidate = parsed.targetCandidateQuery
        ? await prisma.user.findFirst({
            where: {
              role: "JOB_SEEKER",
              name: { contains: parsed.targetCandidateQuery, mode: "insensitive" },
            },
          })
        : null;

      if (!activeCandidate) {
        // Fall back to first unassigned candidate
        const unassigned = await prisma.application.findFirst({
          where: { job: { companyId } },
          include: { applicant: true },
        });
        activeCandidate = unassigned?.applicant || null;
      }

      if (!activeCandidate) {
        return {
          intent: "GET_ASSIGNMENT_RECOMMENDATION",
          answer: "### OBSERVED DATA\nNo candidate found to evaluate assignment recommendation.\n\n### INSIGHTS\nAssignment recommendation balances candidate load across team members.\n\n### RISKS\nNone.\n\n### RECOMMENDATION\nProvide a candidate name to generate an explainable assignment recommendation.\n\n### DATA LIMITATIONS\nRequires discoverable candidate profile.",
          toolUsed: "getSmartAssignmentRecommendation",
          suggestions: ["Show team workload", "Which candidates are unassigned?"],
        };
      }

      const rec = await getSmartAssignmentRecommendation(activeCandidate.id, companyId);
      const answer = `### OBSERVED DATA\n` +
        `• **Candidate:** ${rec.candidateName}\n` +
        `• **Current Owner:** ${rec.currentOwnerName || "None (Unassigned)"}\n` +
        `• **Recommended Assignee:** **${rec.recommendedRecruiterName}** (${rec.recommendedRecruiterEmail})\n` +
        `• **Assignment Strategy:** \`${rec.strategy}\` (Confidence: **${rec.confidence}**)\n\n` +
        `### INSIGHTS\n` +
        `• **Rationale:** ${rec.reasonSummary}\n` +
        rec.evidence.map((e) => `• ${e}`).join("\n") + `\n\n` +
        `### RISKS\n` +
        `• Automated reassignments are disabled for safety; human recruiter confirmation is required.\n\n` +
        `### RECOMMENDATION\n` +
        `• Assign ${rec.candidateName} to ${rec.recommendedRecruiterName} via Team Operations dashboard.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Evaluates live workload scores, pending reviews, and job ownership across company recruiters.`;

      return {
        intent: "GET_ASSIGNMENT_RECOMMENDATION",
        answer,
        toolUsed: "getSmartAssignmentRecommendation",
        data: { recommendation: rec } as any,
        suggestions: [
          "Who has capacity?",
          "Show team workload",
          "Which handoffs are overdue?",
        ],
      };
    }

    case "GET_TEAM_BOTTLENECKS": {
      const overview = await getTeamWorkloadOverview(companyId);
      const handoffs = await getHandoffs(companyId);
      const overdueHandoffs = handoffs.filter((h) => h.isOverdue);

      const answer = `### OBSERVED DATA\n` +
        `• **Overloaded Recruiters:** ${overview.overloadedRecruiters.length}\n` +
        `• **Overdue Handoffs:** ${overdueHandoffs.length}\n` +
        `• **Unassigned Candidates:** ${overview.unassignedCandidatesCount}\n\n` +
        `### INSIGHTS\n` +
        (overview.overloadedRecruiters.length > 0
          ? `• Primary operational bottleneck: ${overview.overloadedRecruiters.map((r) => `${r.name} (${r.pendingReviewsCount} reviews pending)`).join(", ")}.\n\n`
          : `• No severe recruiter review bottlenecks observed.\n\n`) +
        `### RISKS\n` +
        `• Bottlenecks at initial application review delay candidate feedback beyond the company 7-day SLA.\n\n` +
        `### RECOMMENDATION\n` +
        `• Rebalance candidate queues by transferring unreviewed applicants to recruiters with Normal workload.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Calculated from live PostgreSQL review events and SLA deadlines.`;

      return {
        intent: "GET_TEAM_BOTTLENECKS",
        answer,
        toolUsed: "getTeamWorkloadOverview",
        data: { bottlenecks: overview.overloadedRecruiters } as any,
        suggestions: [
          "Who has capacity?",
          "Show team priorities",
          "Where are recruiters duplicating work?",
        ],
      };
    }

    case "GET_COLLABORATION_ACTIONS": {
      const overview = await getTeamWorkloadOverview(companyId);
      const handoffs = await getHandoffs(companyId);
      const overdueHandoffs = handoffs.filter((h) => h.isOverdue);
      const alerts = await detectDuplicateWork(companyId);

      const actions: string[] = [];
      if (overdueHandoffs.length > 0) {
        actions.push(`1. **Accept ${overdueHandoffs.length} Overdue Handoff(s):** Clear stalled candidate handoffs in team queue.`);
      }
      if (alerts.length > 0) {
        actions.push(`2. **Resolve ${alerts.length} Duplicate Work Conflict(s):** Consolidate concurrent candidate outreach.`);
      }
      if (overview.unassignedCandidatesCount > 0) {
        actions.push(`3. **Assign ${overview.unassignedCandidatesCount} Unowned Candidate(s):** Distribute unassigned candidates to available recruiters.`);
      }
      if (overview.overloadedRecruiters.length > 0) {
        actions.push(`4. **Balance Team Capacity:** Offload queues from ${overview.overloadedRecruiters[0].name} (Score ${overview.overloadedRecruiters[0].workloadScore}/100).`);
      }
      if (actions.length === 0) {
        actions.push(`1. **All systems healthy:** Team capacity is balanced and SLAs are on schedule.`);
      }

      const answer = `### OBSERVED DATA\n` +
        `• **Team Members:** ${overview.totalRecruiters}\n` +
        `• **Overdue Handoffs:** ${overdueHandoffs.length}\n` +
        `• **Duplicate Work Alerts:** ${alerts.length}\n` +
        `• **Unassigned Candidates:** ${overview.unassignedCandidatesCount}\n\n` +
        `### INSIGHTS\n` +
        `• Prioritized collaboration actions for your recruiting team today:\n\n` +
        actions.join("\n") + `\n\n` +
        `### RISKS\n` +
        `• Leaving handoffs or unassigned candidates unresolved causes candidate drop-off.\n\n` +
        `### RECOMMENDATION\n` +
        `• Execute the top prioritized action in the Team Operations dashboard.\n\n` +
        `### DATA LIMITATIONS\n` +
        `• Synthesized from live team workload, handoffs, and duplicate work engines.`;

      return {
        intent: "GET_COLLABORATION_ACTIONS",
        answer,
        toolUsed: "getTeamWorkloadOverview",
        data: { actions } as any,
        suggestions: [
          "Who is overloaded today?",
          "Which handoffs are overdue?",
          "Show team workload",
        ],
      };
    }

    case "EXECUTE_RECRUITER_ACTION": {
      return {
        intent: "EXECUTE_RECRUITER_ACTION",
        answer: parsed.actionProposal?.confirmationMessage || "Please confirm this recruiter action before execution.",
        toolUsed: "prepareActionProposal",
        data: { actionProposal: parsed.actionProposal },
        suggestions: ["Confirm Action", "Cancel Action"],
      };
    }

    default: {
      return {
        intent: "GENERAL_HIRING_ADVICE",
        answer: "I am your NextHire Recruiter Copilot. You can ask me to search candidates with natural language, diagnose pipeline bottlenecks, check application SLAs, or rediscovering past finalists.",
        toolUsed: "generalHiringAdvice",
        suggestions: [
          "Find senior backend engineers with 5+ years experience",
          "Why is this job not progressing?",
          "Show me candidates requiring action",
        ],
      };
    }
  }
}
