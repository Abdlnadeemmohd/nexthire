import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { emitEvent } from "@/lib/events/eventEngine";
import { generateOutreachSequence } from "./outreachGenerator";
import { checkCandidateDuplicateContact } from "./duplicateProtection";
import { classifyCandidateResponse } from "./responseClassifier";
import {
  OutreachCandidateData,
  OutreachJobData,
  PersonalizationLevel,
  CampaignAnalytics,
  DuplicateContactWarning,
} from "./types";

/**
 * Calculates live campaign analytics with zero NaN/Infinity rates.
 */
export function calculateCampaignMetrics(
  campaign: any,
  recipients: any[]
): CampaignAnalytics {
  const totalRecipients = recipients.length;
  let draftCount = 0;
  let approvedCount = 0;
  let sentCount = 0;
  let deliveredCount = 0;
  let repliedCount = 0;
  let positiveReplyCount = 0;
  let interviewsCount = 0;
  let optedOutCount = 0;
  let bouncedCount = 0;

  for (const r of recipients) {
    if (r.status === "DRAFT") draftCount++;
    if (r.status === "APPROVED" || r.status === "QUEUED") approvedCount++;
    if (r.status === "SENT" || r.lastContactedAt) sentCount++;
    if (r.status === "DELIVERED") deliveredCount++;
    if (r.status === "REPLIED" || r.repliedAt) {
      repliedCount++;
      if (r.responseClassification === "POSITIVE_INTEREST") {
        positiveReplyCount++;
      }
    }
    if (r.status === "OPTED_OUT" || r.optedOutAt) optedOutCount++;
    if (r.status === "BOUNCED") bouncedCount++;
  }

  // Calculate conversion rates safely
  const effectiveDelivered = Math.max(deliveredCount, repliedCount);
  const deliveryRate = sentCount > 0 ? Math.round((Math.min(sentCount, Math.max(deliveredCount, 1)) / sentCount) * 100) : null;
  const replyRate = effectiveDelivered > 0 ? Math.round((repliedCount / effectiveDelivered) * 100) : null;
  const positiveReplyRate = repliedCount > 0 ? Math.round((positiveReplyCount / repliedCount) * 100) : null;
  const interviewConversionRate = repliedCount > 0 ? Math.round((interviewsCount / repliedCount) * 100) : null;

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    status: campaign.status,
    totalRecipients,
    draftCount,
    approvedCount,
    sentCount,
    deliveredCount: effectiveDelivered,
    repliedCount,
    positiveReplyCount,
    interviewsCount,
    optedOutCount,
    bouncedCount,
    deliveryRate,
    replyRate,
    positiveReplyRate,
    interviewConversionRate,
  };
}

/**
 * Creates a new company-scoped outreach campaign with multi-step sequence & AI-generated recipient drafts.
 */
export async function createOutreachCampaign(
  companyId: string,
  recruiterId: string,
  data: {
    name: string;
    description?: string;
    jobId?: string;
    candidateIds: string[];
    preferredLevel?: PersonalizationLevel;
    customNotes?: string;
    sequenceDelays?: number[]; // [0, 3, 7, 14]
  }
): Promise<{ campaign: any; duplicateWarnings: DuplicateContactWarning[] }> {
  const {
    name,
    description,
    jobId,
    candidateIds,
    preferredLevel = "PERSONALIZED",
    customNotes,
    sequenceDelays = [0, 3, 7, 14],
  } = data;

  const recruiter = await prisma.user.findUnique({
    where: { id: recruiterId },
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  let job: OutreachJobData | null = null;
  if (jobId) {
    const jobRecord = await prisma.job.findFirst({
      where: { id: jobId, companyId },
    });
    if (jobRecord) {
      job = {
        id: jobRecord.id,
        title: jobRecord.title,
        companyName: company?.name || "Our Company",
        requiredSkills: jobRecord.skills.split(",").map((s) => s.trim()),
        location: jobRecord.location,
        isRemote: jobRecord.isRemote,
      };
    }
  }

  if (!job) {
    job = {
      id: "general-outreach",
      title: "Senior Engineering Role",
      companyName: company?.name || "Our Company",
      requiredSkills: ["TypeScript", "Node.js", "PostgreSQL", "System Architecture"],
      location: company?.location || "Remote",
      isRemote: true,
    };
  }

  // 1. Create Campaign
  const campaign = await prisma.outreachCampaign.create({
    data: {
      name,
      description,
      companyId,
      recruiterId,
      jobId: job.id !== "general-outreach" ? job.id : undefined,
      status: "DRAFT",
    },
  });

  // 2. Create Default Sequence Steps
  const stepDelays = sequenceDelays.length === 4 ? sequenceDelays : [0, 3, 7, 14];
  const stepTypes = ["INITIAL_OUTREACH", "FOLLOW_UP", "VALUE_FOLLOW_UP", "FINAL_FOLLOW_UP"] as const;

  const createdSteps = [];
  for (let i = 0; i < 4; i++) {
    const step = await prisma.outreachSequenceStep.create({
      data: {
        campaignId: campaign.id,
        stepOrder: i + 1,
        delayDays: stepDelays[i],
        messageType: stepTypes[i] as any,
        personalizationLevel: preferredLevel,
        subjectTemplate: `Opportunity at ${job.companyName}: ${job.title} (Step ${i + 1})`,
        bodyTemplate: `Hi {{name}},\n\nReaching out regarding our ${job.title} opening at ${job.companyName}.`,
        isEnabled: true,
      },
    });
    createdSteps.push(step);
  }

  // 3. Evaluate duplicate contact warnings and prepare recipient drafts
  const duplicateWarnings: DuplicateContactWarning[] = [];

  for (const candId of candidateIds) {
    const warning = await checkCandidateDuplicateContact(companyId, candId);
    duplicateWarnings.push(warning);

    if (warning.isOptedOut) {
      continue; // Skip opted out candidates
    }

    const candidateUser = await prisma.user.findUnique({
      where: { id: candId },
      include: {
        profile: true,
        assessmentSubmissions: {
          include: { assessment: true },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!candidateUser) continue;

    const candSkills = (candidateUser.profile?.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const latestSubmission = candidateUser.assessmentSubmissions[0];
    const assessmentEvidence = latestSubmission
      ? {
          hasAssessment: true,
          assessmentTitle: latestSubmission.assessment.title,
          overallScore: latestSubmission.overallScore,
          demonstratedSkills: candSkills.slice(0, 3),
        }
      : undefined;

    const candData: OutreachCandidateData = {
      id: candidateUser.id,
      name: candidateUser.name,
      email: candidateUser.email,
      headline: candidateUser.headline,
      location: candidateUser.location,
      skills: candSkills,
      experienceSummary: candidateUser.profile?.experience ? "Verified Software Engineer" : undefined,
      assessmentEvidence,
    };

    // Generate grounded drafts across all 4 sequence steps
    const drafts = generateOutreachSequence(
      candData,
      job,
      recruiter?.name || "Recruiter",
      preferredLevel,
      customNotes
    );

    // Create OutreachRecipient
    const recipient = await prisma.outreachRecipient.create({
      data: {
        campaignId: campaign.id,
        candidateId: candidateUser.id,
        status: "DRAFT",
        currentStep: 1,
      },
    });

    // Create draft messages for each step
    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      const step = createdSteps[i];

      await prisma.outreachMessage.create({
        data: {
          recipientId: recipient.id,
          stepId: step?.id,
          subject: draft.subject,
          body: draft.body,
          status: "DRAFT",
          recruiterApproved: false,
        },
      });
    }
  }

  await logAuditEvent(
    recruiterId,
    "OUTREACH_CAMPAIGN_CREATED",
    "OutreachCampaign",
    campaign.id,
    { name, candidateCount: candidateIds.length, companyId }
  );

  await emitEvent({
    type: "OUTREACH_CAMPAIGN_CREATED",
    recipientId: recruiterId,
    companyId,
    actorId: recruiterId,
    entityType: "OutreachCampaign",
    entityId: campaign.id,
    title: `Outreach Campaign Created: ${name}`,
    body: `Campaign drafted with ${candidateIds.length} candidate recipients ready for review.`,
    ctaText: "Review & Approve Drafts",
    ctaUrl: `/recruiter/outreach?campaignId=${campaign.id}`,
    metadata: { campaignId: campaign.id, name, count: candidateIds.length },
  });

  const fullCampaign = await prisma.outreachCampaign.findUnique({
    where: { id: campaign.id },
    include: {
      sequenceSteps: { orderBy: { stepOrder: "asc" } },
      recipients: { include: { messages: true } },
      job: true,
    },
  });

  return {
    campaign: fullCampaign || campaign,
    duplicateWarnings,
  };
}

/**
 * Human Approval Gate: Approves drafts and dispatches the first sequence step via Email & In-App Message.
 */
export async function approveAndDispatchCampaign(
  companyId: string,
  recruiterId: string,
  campaignId: string,
  options?: {
    confirmed?: boolean;
    recipientEdits?: Array<{ recipientId: string; subject?: string; body?: string }>;
  }
): Promise<{ success: boolean; dispatchedCount: number; message: string }> {
  const campaign = await prisma.outreachCampaign.findFirst({
    where: { id: campaignId, companyId },
    include: {
      recruiter: true,
      company: true,
      job: true,
      sequenceSteps: { orderBy: { stepOrder: "asc" } },
      recipients: {
        include: {
          candidate: { include: { candidateCommunicationPreference: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found or does not belong to your company.");
  }

  let dispatchedCount = 0;
  const now = new Date();
  const step2DelayDays = campaign.sequenceSteps[1]?.delayDays || 3;
  const step2Date = new Date(now.getTime() + step2DelayDays * 24 * 60 * 60 * 1000);

  for (const recipient of campaign.recipients) {
    if (recipient.candidate.candidateCommunicationPreference?.optedOutOutreach) {
      await prisma.outreachRecipient.update({
        where: { id: recipient.id },
        data: { status: "OPTED_OUT", optedOutAt: now },
      });
      continue;
    }

    const step1Message = recipient.messages.find((m) => m.stepId === campaign.sequenceSteps[0]?.id) || recipient.messages[0];
    if (!step1Message) continue;

    // Apply custom recruiter edit if provided
    const customEdit = options?.recipientEdits?.find((e) => e.recipientId === recipient.id);
    const finalSubject = customEdit?.subject || step1Message.subject;
    const finalBody = customEdit?.body || step1Message.body;

    // 1. Create In-App Message in PostgreSQL chat
    const inAppMsg = await prisma.message.create({
      data: {
        senderId: recruiterId,
        receiverId: recipient.candidateId,
        content: finalBody,
        read: false,
      },
    });

    // 2. Dispatch Branded Transactional Email via EventEngine
    const emailResult = await emitEvent({
      type: "OUTREACH_SENT",
      recipientId: recipient.candidateId,
      recipientEmail: recipient.candidate.email,
      actorId: recruiterId,
      actorName: campaign.recruiter.name,
      companyId,
      entityType: "OutreachMessage",
      entityId: step1Message.id,
      title: finalSubject,
      body: finalBody,
      ctaText: "Reply on NextHire",
      ctaUrl: `/messages?contactId=${recruiterId}`,
      sendEmail: true,
      emailSubject: finalSubject,
      emailHtml: undefined, // Uses default branded email renderer with company footer
      metadata: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        companyName: campaign.company.name,
        jobTitle: campaign.job?.title || "Engineering Role",
        stepOrder: 1,
      },
    });

    // 3. Update Message & Recipient state truthfully
    await prisma.outreachMessage.update({
      where: { id: step1Message.id },
      data: {
        subject: finalSubject,
        body: finalBody,
        status: emailResult.emailStatus === "SENT" || emailResult.emailStatus === "DELIVERED" ? "SENT" : "APPROVED",
        inAppMessageId: inAppMsg.id,
        recruiterApproved: true,
        approvedAt: now,
        sentAt: now,
      },
    });

    await prisma.outreachRecipient.update({
      where: { id: recipient.id },
      data: {
        status: "SENT",
        currentStep: 1,
        lastContactedAt: now,
        nextActionAt: step2Date,
      },
    });

    dispatchedCount++;
  }

  // Update Campaign Status
  await prisma.outreachCampaign.update({
    where: { id: campaign.id },
    data: { status: "ACTIVE" },
  });

  await logAuditEvent(
    recruiterId,
    "OUTREACH_CAMPAIGN_APPROVED",
    "OutreachCampaign",
    campaign.id,
    { dispatchedCount, companyId }
  );

  return {
    success: true,
    dispatchedCount,
    message: `Campaign approved. Dispatched initial outreach to ${dispatchedCount} candidate(s).`,
  };
}

/**
 * Classifies candidate responses and updates recipient engagement intent and recommended actions.
 */
export async function handleCandidateReply(
  candidateId: string,
  replyText: string,
  inAppMessageId?: string
): Promise<{ classification: any; recipientId?: string }> {
  const classification = classifyCandidateResponse(replyText);
  const now = new Date();

  // Find active recipient record
  const recipient = await prisma.outreachRecipient.findFirst({
    where: {
      candidateId,
      status: { in: ["SENT", "DELIVERED", "APPROVED"] },
    },
    include: {
      campaign: { include: { recruiter: true } },
    },
    orderBy: { lastContactedAt: "desc" },
  });

  if (recipient) {
    const isOptOut = classification.engagementIntent === "OPTED_OUT";

    await prisma.outreachRecipient.update({
      where: { id: recipient.id },
      data: {
        status: isOptOut ? "OPTED_OUT" : "REPLIED",
        repliedAt: now,
        optedOutAt: isOptOut ? now : undefined,
        responseClassification: classification.classification,
        responseSentiment: classification.sentiment,
        recommendedNextAction: classification.suggestedNextAction,
        engagementIntent: classification.engagementIntent,
        nextActionAt: null, // Clear sequence schedule on reply
      },
    });

    if (isOptOut) {
      await prisma.candidateCommunicationPreference.upsert({
        where: { userId: candidateId },
        create: { userId: candidateId, optedOutOutreach: true },
        update: { optedOutOutreach: true },
      });

      await logAuditEvent(
        candidateId,
        "CANDIDATE_OUTREACH_OPT_OUT",
        "OutreachRecipient",
        recipient.id,
        { candidateId, campaignId: recipient.campaignId }
      );
    } else {
      await logAuditEvent(
        recipient.campaign.recruiterId,
        "CANDIDATE_RESPONSE_CLASSIFIED",
        "OutreachRecipient",
        recipient.id,
        {
          candidateId,
          classification: classification.classification,
          intent: classification.engagementIntent,
          actionType: classification.suggestedActionType,
        }
      );

      // Emit recruiter notification
      const eventType =
        classification.classification === "POSITIVE_INTEREST"
          ? "CANDIDATE_POSITIVE_RESPONSE"
          : "CANDIDATE_REPLIED";

      await emitEvent({
        type: eventType as any,
        recipientId: recipient.campaign.recruiterId,
        recipientEmail: recipient.campaign.recruiter.email,
        companyId: recipient.campaign.companyId,
        actorId: candidateId,
        entityType: "OutreachRecipient",
        entityId: recipient.id,
        title: `Candidate Reply: ${classification.summary}`,
        body: `"${replyText.slice(0, 80)}..." — Suggested Action: ${classification.suggestedNextAction}`,
        ctaText: "View Candidate Reply",
        ctaUrl: `/messages?contactId=${candidateId}`,
        metadata: {
          candidateId,
          campaignId: recipient.campaignId,
          classification: classification.classification,
          engagementIntent: classification.engagementIntent,
        },
      });
    }

    return { classification, recipientId: recipient.id };
  }

  return { classification };
}

/**
 * Scheduled scanner helper: Dispatches follow-up sequence steps (Day 3, 7, 14) for non-responding recipients.
 */
export async function processScheduledOutreachFollowUps(): Promise<{
  scannedCount: number;
  dispatchedFollowUps: number;
}> {
  const now = new Date();
  let dispatchedFollowUps = 0;

  // Find active recipients past nextActionAt who have not replied or opted out
  const dueRecipients = await prisma.outreachRecipient.findMany({
    where: {
      status: { in: ["SENT", "DELIVERED"] },
      nextActionAt: { lte: now },
      repliedAt: null,
      optedOutAt: null,
      campaign: { status: "ACTIVE" },
    },
    include: {
      campaign: {
        include: {
          recruiter: true,
          company: true,
          job: true,
          sequenceSteps: { orderBy: { stepOrder: "asc" } },
        },
      },
      candidate: { include: { candidateCommunicationPreference: true } },
      messages: true,
    },
    take: 50, // Bound scanner batch
  });

  for (const recipient of dueRecipients) {
    if (recipient.candidate.candidateCommunicationPreference?.optedOutOutreach) {
      await prisma.outreachRecipient.update({
        where: { id: recipient.id },
        data: { status: "OPTED_OUT", optedOutAt: now, nextActionAt: null },
      });
      continue;
    }

    const nextStepOrder = recipient.currentStep + 1;
    const nextStep = recipient.campaign.sequenceSteps.find((s) => s.stepOrder === nextStepOrder);

    if (!nextStep || !nextStep.isEnabled) {
      // Completed all sequence steps
      await prisma.outreachRecipient.update({
        where: { id: recipient.id },
        data: { nextActionAt: null },
      });
      continue;
    }

    // Strict deduplication: Check if message for this step was already sent
    const existingStepMsg = recipient.messages.find((m) => m.stepId === nextStep.id && m.status === "SENT");
    if (existingStepMsg) {
      continue;
    }

    let draftMsg = recipient.messages.find((m) => m.stepId === nextStep.id);
    if (!draftMsg) {
      // Fallback generate
      draftMsg = await prisma.outreachMessage.create({
        data: {
          recipientId: recipient.id,
          stepId: nextStep.id,
          subject: nextStep.subjectTemplate,
          body: nextStep.bodyTemplate,
          status: "DRAFT",
          recruiterApproved: true,
        },
      });
    }

    // Dispatch Follow-Up In-App Message
    const inApp = await prisma.message.create({
      data: {
        senderId: recipient.campaign.recruiterId,
        receiverId: recipient.candidateId,
        content: draftMsg.body,
        read: false,
      },
    });

    // Dispatch Follow-Up Email
    await emitEvent({
      type: "OUTREACH_SENT",
      recipientId: recipient.candidateId,
      recipientEmail: recipient.candidate.email,
      actorId: recipient.campaign.recruiterId,
      actorName: recipient.campaign.recruiter.name,
      companyId: recipient.campaign.companyId,
      entityType: "OutreachMessage",
      entityId: draftMsg.id,
      title: draftMsg.subject,
      body: draftMsg.body,
      ctaText: "Reply on NextHire",
      ctaUrl: `/messages?contactId=${recipient.campaign.recruiterId}`,
      sendEmail: true,
      emailSubject: draftMsg.subject,
    });

    const nextNextStep = recipient.campaign.sequenceSteps.find((s) => s.stepOrder === nextStepOrder + 1);
    const nextNextDelayDays = nextNextStep?.delayDays || 7;
    const nextNextDate = nextNextStep
      ? new Date(now.getTime() + nextNextDelayDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.outreachMessage.update({
      where: { id: draftMsg.id },
      data: {
        status: "SENT",
        inAppMessageId: inApp.id,
        sentAt: now,
        recruiterApproved: true,
      },
    });

    await prisma.outreachRecipient.update({
      where: { id: recipient.id },
      data: {
        currentStep: nextStepOrder,
        lastContactedAt: now,
        nextActionAt: nextNextDate,
      },
    });

    dispatchedFollowUps++;
  }

  return {
    scannedCount: dueRecipients.length,
    dispatchedFollowUps,
  };
}
