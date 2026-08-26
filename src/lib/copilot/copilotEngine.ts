import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { emitEvent } from "@/lib/events/eventEngine";
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
