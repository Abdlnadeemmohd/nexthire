import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { emitEvent } from "@/lib/events/eventEngine";
import { validateStatusTransition } from "@/lib/ats/stateMachine";
import {
  InterviewScorecardPayload,
  InterviewDecisionType,
} from "./types";
import { generateInterviewSummary } from "./decisionEngine";
import { ApplicationStatus } from "@prisma/client";

/**
 * Submits or updates an interviewer's structured scorecard for an interview session.
 */
export async function submitInterviewScorecard(
  payload: InterviewScorecardPayload,
  interviewerId: string,
  companyId: string,
  userIp?: string
) {
  const interview = await prisma.interview.findUnique({
    where: { id: payload.interviewId },
    include: {
      application: {
        include: {
          job: true,
          applicant: true,
        },
      },
    },
  });

  if (!interview) {
    throw new Error(`Interview not found: ${payload.interviewId}`);
  }

  if (interview.application.job.companyId !== companyId) {
    throw new Error("Unauthorized: multi-tenant company mismatch.");
  }

  const app = interview.application;

  // 1. Create or update scorecard
  const scorecard = await prisma.interviewScorecard.upsert({
    where: {
      interviewId_interviewerId: {
        interviewId: payload.interviewId,
        interviewerId,
      },
    },
    create: {
      interviewId: payload.interviewId,
      companyId,
      applicationId: app.id,
      candidateId: app.applicantId,
      interviewerId,
      overallRecommendation: payload.overallRecommendation,
      strongestEvidence: payload.strongestEvidence,
      biggestConcern: payload.biggestConcern,
      rawNotes: payload.rawNotes,
      structuredNotes: payload.structuredNotes ? JSON.stringify(payload.structuredNotes) : "{}",
      isComplete: payload.isComplete,
      submittedAt: payload.isComplete ? new Date() : null,
    },
    update: {
      overallRecommendation: payload.overallRecommendation,
      strongestEvidence: payload.strongestEvidence,
      biggestConcern: payload.biggestConcern,
      rawNotes: payload.rawNotes,
      structuredNotes: payload.structuredNotes ? JSON.stringify(payload.structuredNotes) : undefined,
      isComplete: payload.isComplete,
      submittedAt: payload.isComplete ? new Date() : undefined,
    },
  });

  // 2. Clear previous scores and recreate with fresh submitted scores
  if (payload.scores && payload.scores.length > 0) {
    await prisma.interviewScore.deleteMany({
      where: { scorecardId: scorecard.id },
    });

    await prisma.interviewScore.createMany({
      data: payload.scores.map(s => ({
        scorecardId: scorecard.id,
        competency: s.competency,
        score: s.score,
        observedEvidence: s.observedEvidence || null,
        interviewerOpinion: s.interviewerOpinion || null,
        aiInference: s.aiInference || null,
        confidence: s.confidence || "MEDIUM",
        recommendation: s.recommendation || null,
      })),
    });
  }

  // 3. Log authoritative audit event
  await logAuditEvent(
    interviewerId,
    "INTERVIEW_SCORECARD_SUBMITTED",
    "InterviewScorecard",
    scorecard.id,
    {
      interviewId: payload.interviewId,
      applicationId: app.id,
      candidateId: app.applicantId,
      recommendation: payload.overallRecommendation,
      isComplete: payload.isComplete,
      companyId,
    }
  );

  // 4. If complete, generate/update interview summary and emit event
  if (payload.isComplete) {
    const summary = await generateInterviewSummary(payload.interviewId, companyId).catch(() => null);

    emitEvent({
      type: "INTERVIEW_FEEDBACK_SUBMITTED",
      recipientId: interviewerId,
      companyId,
      entityType: "Interview",
      entityId: payload.interviewId,
      title: `Interview Scorecard Submitted: ${app.applicant.name}`,
      body: `Scorecard with recommendation "${payload.overallRecommendation}" has been recorded for "${app.job.title}".`,
      ctaText: "View Interview Intelligence",
      ctaUrl: `/recruiter/interviews?interviewId=${payload.interviewId}`,
      metadata: {
        interviewId: payload.interviewId,
        candidateName: app.applicant.name,
        recommendation: payload.overallRecommendation,
      },
    }).catch(() => {});
  }

  return scorecard;
}

/**
 * Records an authoritative human hiring decision and updates the ATS pipeline status accordingly.
 */
export async function recordInterviewDecision(params: {
  applicationId: string;
  decision: InterviewDecisionType;
  decisionReason: string;
  evidenceSummary: string;
  conflictingNotes?: string;
  decisionMakerId: string;
  companyId: string;
  userIp?: string;
}) {
  const {
    applicationId,
    decision,
    decisionReason,
    evidenceSummary,
    conflictingNotes,
    decisionMakerId,
    companyId,
    userIp,
  } = params;

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      applicant: true,
    },
  });

  if (!app) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  if (app.job.companyId !== companyId) {
    throw new Error("Unauthorized: multi-tenant company mismatch.");
  }

  // Map decision to target ATS ApplicationStatus
  let targetStatus: ApplicationStatus = app.status;
  if (decision === "ADVANCE") {
    if (app.status === "INTERVIEW_SCHEDULED") targetStatus = "INTERVIEW_ROUND_1";
    else if (app.status === "INTERVIEW_ROUND_1") targetStatus = "INTERVIEW_ROUND_2";
    else if (app.status === "INTERVIEW_ROUND_2") targetStatus = "FINAL_DECISION";
    else targetStatus = "FINAL_DECISION";
  } else if (decision === "OFFER") {
    targetStatus = "OFFER_EXTENDED";
  } else if (decision === "REJECT") {
    targetStatus = "REJECTED";
  }

  // Validate state machine transition if changing
  if (targetStatus !== app.status) {
    const transitionCheck = validateStatusTransition(app.status, targetStatus, "RECRUITER");
    if (!transitionCheck.valid) {
      throw new Error(`Invalid stage transition: ${transitionCheck.error}`);
    }
  }

  // 1. Create Decision Record
  const decisionRecord = await prisma.interviewDecision.create({
    data: {
      applicationId,
      candidateId: app.applicantId,
      jobId: app.jobId,
      companyId,
      decisionMakerId,
      decision,
      decisionReason,
      evidenceSummary,
      conflictingNotes: conflictingNotes || null,
      confirmedAt: new Date(),
    },
  });

  // 2. Update Application Status & Event History
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: targetStatus,
      events: {
        create: {
          type: decision === "REJECT" ? "REJECTION_SUBMITTED" : "STATUS_CHANGED",
          actorId: decisionMakerId,
          notes: `Decision '${decision}' confirmed by recruiter. Reason: ${decisionReason}`,
        },
      },
    },
  });

  // 3. Log Audit Event
  await logAuditEvent(
    decisionMakerId,
    "INTERVIEW_DECISION_RECORDED",
    "InterviewDecision",
    decisionRecord.id,
    {
      applicationId,
      candidateId: app.applicantId,
      jobId: app.jobId,
      decision,
      targetStatus,
      companyId,
    }
  );

  // 4. Emit notifications
  emitEvent({
    type: "INTERVIEW_DECISION_CONFIRMED",
    recipientId: decisionMakerId,
    companyId,
    entityType: "Application",
    entityId: applicationId,
    title: `Decision Confirmed: ${decision} for ${app.applicant.name}`,
    body: `Application has been updated to '${targetStatus}'. Decision reason: ${decisionReason}`,
    ctaText: "View Candidate Pipeline",
    ctaUrl: `/recruiter/applicants`,
    metadata: {
      applicationId,
      candidateId: app.applicantId,
      decision,
      targetStatus,
    },
  }).catch(() => {});

  return decisionRecord;
}
