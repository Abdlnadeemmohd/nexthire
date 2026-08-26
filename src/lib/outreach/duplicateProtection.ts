import { prisma } from "@/lib/prisma";
import { DuplicateContactWarning } from "./types";

/**
 * Evaluates duplicate contact risk, active interview states, and candidate communication preferences.
 */
export async function checkCandidateDuplicateContact(
  companyId: string,
  candidateId: string
): Promise<DuplicateContactWarning> {
  const candidate = await prisma.user.findUnique({
    where: { id: candidateId },
    include: {
      candidateCommunicationPreference: true,
    },
  });

  if (!candidate) {
    return {
      candidateId,
      candidateName: "Unknown Candidate",
      isDuplicate: false,
      hasRecentContact: false,
      hasActiveInterview: false,
      hasActiveCampaign: false,
      isOptedOut: false,
      warningSeverity: "NONE",
      recommendation: "Candidate record not found.",
    };
  }

  const isOptedOut = Boolean(candidate.candidateCommunicationPreference?.optedOutOutreach);

  if (isOptedOut) {
    return {
      candidateId,
      candidateName: candidate.name,
      isDuplicate: false,
      hasRecentContact: false,
      hasActiveInterview: false,
      hasActiveCampaign: false,
      isOptedOut: true,
      warningSeverity: "BLOCKING",
      warningMessage: "Candidate has explicitly opted out of recruiter outreach communications.",
      recommendation: "Do not send outreach. Candidate preferences must be strictly respected.",
    };
  }

  // 1. Check existing active outreach campaigns for this candidate in this company
  const activeRecipient = await prisma.outreachRecipient.findFirst({
    where: {
      candidateId,
      campaign: { companyId, status: { in: ["ACTIVE", "SCHEDULED", "DRAFT"] } },
      status: { in: ["DRAFT", "APPROVED", "QUEUED", "SENT", "DELIVERED"] },
    },
    include: {
      campaign: { select: { name: true, id: true } },
    },
  });

  const hasActiveCampaign = Boolean(activeRecipient);
  const activeCampaignName = activeRecipient?.campaign.name;

  // 2. Check active interview applications for this candidate in this company
  const activeApplication = await prisma.application.findFirst({
    where: {
      applicantId: candidateId,
      job: { companyId },
      status: {
        in: [
          "INTERVIEW_SCHEDULED",
          "INTERVIEW_ROUND_1",
          "INTERVIEW_ROUND_2",
          "INTERVIEW_ROUND_3",
          "FINAL_DECISION",
          "OFFER_EXTENDED",
        ],
      },
    },
    include: {
      job: { select: { title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const hasActiveInterview = Boolean(activeApplication);
  const activeInterviewStage = activeApplication
    ? `${activeApplication.status.replace(/_/g, " ")} (${activeApplication.job.title})`
    : undefined;

  // 3. Check recent in-app messages or outreach messages within last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentMessage = await prisma.message.findFirst({
    where: {
      sender: { companyId },
      receiverId: candidateId,
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  const recentOutreach = await prisma.outreachMessage.findFirst({
    where: {
      recipient: { candidateId, campaign: { companyId } },
      status: { in: ["SENT", "DELIVERED"] },
      sentAt: { gte: sevenDaysAgo },
    },
    orderBy: { sentAt: "desc" },
  });

  const hasRecentContact = Boolean(recentMessage || recentOutreach);
  const lastContactDate = recentMessage?.createdAt.toISOString() || recentOutreach?.sentAt?.toISOString();
  const lastMessageSnippet =
    recentMessage?.content.slice(0, 100) || recentOutreach?.body.slice(0, 100);

  // Calculate severity and recommendation
  if (hasActiveInterview) {
    return {
      candidateId,
      candidateName: candidate.name,
      isDuplicate: true,
      hasRecentContact,
      lastContactDate,
      lastMessageSnippet,
      hasActiveInterview: true,
      activeInterviewStage,
      hasActiveCampaign,
      activeCampaignName,
      isOptedOut: false,
      warningSeverity: "HIGH",
      warningMessage: `Candidate is currently in an active hiring process: ${activeInterviewStage}.`,
      recommendation: "Coordinate with the primary hiring team before sending cold outreach.",
    };
  }

  if (hasActiveCampaign) {
    return {
      candidateId,
      candidateName: candidate.name,
      isDuplicate: true,
      hasRecentContact,
      lastContactDate,
      lastMessageSnippet,
      hasActiveInterview: false,
      hasActiveCampaign: true,
      activeCampaignName,
      isOptedOut: false,
      warningSeverity: "HIGH",
      warningMessage: `Candidate is already enrolled in active campaign "${activeCampaignName}".`,
      recommendation: "Avoid duplicate outreach sequences to prevent messaging fatigue.",
    };
  }

  if (hasRecentContact) {
    const daysAgo = lastContactDate
      ? Math.floor((Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      candidateId,
      candidateName: candidate.name,
      isDuplicate: true,
      hasRecentContact: true,
      lastContactDate,
      lastMessageSnippet,
      hasActiveInterview: false,
      hasActiveCampaign: false,
      isOptedOut: false,
      warningSeverity: daysAgo < 3 ? "HIGH" : "MODERATE",
      warningMessage: `Candidate was contacted ${daysAgo === 0 ? "today" : `${daysAgo} day(s) ago`}.`,
      recommendation: "Allow sufficient response window before initiating another outreach.",
    };
  }

  return {
    candidateId,
    candidateName: candidate.name,
    isDuplicate: false,
    hasRecentContact: false,
    hasActiveInterview: false,
    hasActiveCampaign: false,
    isOptedOut: false,
    warningSeverity: "NONE",
    recommendation: "Candidate is eligible for new outreach sequence.",
  };
}
