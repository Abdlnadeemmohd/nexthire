/**
 * NextHire Phase 13 — Recruiter Handoff Engine
 * Structured candidate handoffs with context transfer, audit logs, and acceptance workflows.
 */

import { prisma } from "@/lib/prisma";
import { emitEvent as emitAppEvent } from "@/lib/events/eventEngine";
import { assignCandidate } from "./assignmentEngine";
import { RecruiterHandoffRecord, HandoffStatus } from "./types";

export interface CreateHandoffInput {
  companyId: string;
  fromRecruiterId: string;
  toRecruiterId: string;
  candidateId: string;
  applicationId?: string | null;
  jobId?: string | null;
  reason: string;
  currentStage: string;
  completedWork?: string[];
  pendingWork?: string[];
  importantEvidence?: string | null;
  nextRecommendedAction?: string | null;
  dueAt?: Date | null;
}

/**
 * Creates a structured candidate handoff request between two recruiters in the same company.
 */
export async function createHandoff(input: CreateHandoffInput): Promise<RecruiterHandoffRecord> {
  const {
    companyId,
    fromRecruiterId,
    toRecruiterId,
    candidateId,
    applicationId,
    jobId,
    reason,
    currentStage,
    completedWork = [],
    pendingWork = [],
    importantEvidence,
    nextRecommendedAction,
    dueAt,
  } = input;

  // Validate both recruiters
  const [fromRecruiter, toRecruiter] = await Promise.all([
    prisma.user.findFirst({
      where: { id: fromRecruiterId, companyId, role: { in: ["RECRUITER", "COMPANY_ADMIN"] } },
      select: { id: true, name: true },
    }),
    prisma.user.findFirst({
      where: { id: toRecruiterId, companyId, role: { in: ["RECRUITER", "COMPANY_ADMIN"] } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!fromRecruiter || !toRecruiter) {
    throw new Error("Both sending and receiving recruiters must belong to the specified company.");
  }

  const candidate = await prisma.user.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true },
  });
  if (!candidate) {
    throw new Error("Candidate not found.");
  }

  const handoff = await prisma.recruiterHandoff.create({
    data: {
      companyId,
      fromRecruiterId,
      toRecruiterId,
      candidateId,
      applicationId: applicationId || null,
      jobId: jobId || null,
      reason,
      currentStage,
      completedWork: JSON.stringify(completedWork),
      pendingWork: JSON.stringify(pendingWork),
      importantEvidence: importantEvidence || null,
      nextRecommendedAction: nextRecommendedAction || null,
      status: "PENDING",
      dueAt: dueAt || new Date(Date.now() + 48 * 60 * 60 * 1000), // Default 48h SLA
    },
    include: {
      fromRecruiter: { select: { name: true } },
      toRecruiter: { select: { name: true } },
      candidate: { select: { name: true } },
    },
  });

  let jobTitle: string | null = null;
  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { title: true } });
    jobTitle = job?.title || null;
  }

  // Audit event
  await prisma.auditEvent.create({
    data: {
      actorId: fromRecruiterId,
      action: "HANDOFF_CREATED",
      resourceType: "RECRUITER_HANDOFF",
      resourceId: handoff.id,
      metadata: JSON.stringify({
        candidateId,
        candidateName: candidate.name,
        fromRecruiterId,
        toRecruiterId,
        reason,
        currentStage,
      }),
    },
  });

  // Notification
  await emitAppEvent({
    type: "RECRUITER_HANDOFF_RECEIVED",
    recipientId: toRecruiterId,
    actorId: fromRecruiterId,
    companyId,
    entityType: "HANDOFF",
    entityId: handoff.id,
    title: `Candidate Handoff from ${fromRecruiter.name}: ${candidate.name}`,
    body: `${fromRecruiter.name} handed off ${candidate.name} (${currentStage}) to you: "${reason}".`,
    ctaText: "Review Handoff",
    ctaUrl: "/recruiter/team",
    metadata: {
      handoffId: handoff.id,
      candidateId,
      candidateName: candidate.name,
      jobId,
      jobTitle,
    },
  });

  return {
    id: handoff.id,
    companyId: handoff.companyId,
    fromRecruiterId: handoff.fromRecruiterId,
    fromRecruiterName: handoff.fromRecruiter.name,
    toRecruiterId: handoff.toRecruiterId,
    toRecruiterName: handoff.toRecruiter.name,
    candidateId: handoff.candidateId,
    candidateName: handoff.candidate.name,
    applicationId: handoff.applicationId,
    jobId: handoff.jobId,
    jobTitle,
    reason: handoff.reason,
    currentStage: handoff.currentStage,
    completedWork,
    pendingWork,
    importantEvidence: handoff.importantEvidence,
    nextRecommendedAction: handoff.nextRecommendedAction,
    status: handoff.status as HandoffStatus,
    dueAt: handoff.dueAt ? handoff.dueAt.toISOString() : null,
    acceptedAt: null,
    createdAt: handoff.createdAt.toISOString(),
    updatedAt: handoff.updatedAt.toISOString(),
    isOverdue: false,
  };
}

/**
 * Accepts a pending handoff, transferring active candidate ownership to the receiving recruiter.
 */
export async function acceptHandoff(
  handoffId: string,
  recruiterId: string,
  companyId: string
): Promise<RecruiterHandoffRecord> {
  const handoff = await prisma.recruiterHandoff.findFirst({
    where: { id: handoffId, companyId },
    include: {
      fromRecruiter: { select: { name: true } },
      toRecruiter: { select: { name: true } },
      candidate: { select: { name: true } },
    },
  });

  if (!handoff) {
    throw new Error("Handoff not found for this company.");
  }
  if (handoff.toRecruiterId !== recruiterId) {
    throw new Error("Only the assigned receiving recruiter can accept this handoff.");
  }
  if (handoff.status !== "PENDING") {
    throw new Error(`Cannot accept handoff with status: ${handoff.status}`);
  }

  const now = new Date();
  const updated = await prisma.recruiterHandoff.update({
    where: { id: handoffId },
    data: {
      status: "ACCEPTED",
      acceptedAt: now,
    },
  });

  // Automatically assign candidate to the receiving recruiter
  await assignCandidate({
    companyId,
    candidateId: handoff.candidateId,
    applicationId: handoff.applicationId,
    jobId: handoff.jobId,
    recruiterId: handoff.toRecruiterId,
    assignedById: recruiterId,
    reason: `Accepted handoff from ${handoff.fromRecruiter.name}`,
  });

  await prisma.auditEvent.create({
    data: {
      actorId: recruiterId,
      action: "HANDOFF_ACCEPTED",
      resourceType: "RECRUITER_HANDOFF",
      resourceId: handoffId,
      metadata: JSON.stringify({
        candidateId: handoff.candidateId,
        fromRecruiterId: handoff.fromRecruiterId,
        toRecruiterId: handoff.toRecruiterId,
      }),
    },
  });

  let jobTitle: string | null = null;
  if (handoff.jobId) {
    const job = await prisma.job.findUnique({ where: { id: handoff.jobId }, select: { title: true } });
    jobTitle = job?.title || null;
  }

  let completedWork: string[] = [];
  let pendingWork: string[] = [];
  try { completedWork = JSON.parse(handoff.completedWork); } catch {}
  try { pendingWork = JSON.parse(handoff.pendingWork); } catch {}

  return {
    id: updated.id,
    companyId: updated.companyId,
    fromRecruiterId: updated.fromRecruiterId,
    fromRecruiterName: handoff.fromRecruiter.name,
    toRecruiterId: updated.toRecruiterId,
    toRecruiterName: handoff.toRecruiter.name,
    candidateId: updated.candidateId,
    candidateName: handoff.candidate.name,
    applicationId: updated.applicationId,
    jobId: updated.jobId,
    jobTitle,
    reason: updated.reason,
    currentStage: updated.currentStage,
    completedWork,
    pendingWork,
    importantEvidence: updated.importantEvidence,
    nextRecommendedAction: updated.nextRecommendedAction,
    status: "ACCEPTED",
    dueAt: updated.dueAt ? updated.dueAt.toISOString() : null,
    acceptedAt: now.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    isOverdue: false,
  };
}

/**
 * Rejects a handoff request.
 */
export async function rejectHandoff(
  handoffId: string,
  recruiterId: string,
  companyId: string,
  reason?: string
): Promise<boolean> {
  const handoff = await prisma.recruiterHandoff.findFirst({
    where: { id: handoffId, companyId },
  });

  if (!handoff) {
    throw new Error("Handoff not found.");
  }
  if (handoff.toRecruiterId !== recruiterId) {
    throw new Error("Only the assigned receiving recruiter can reject this handoff.");
  }

  await prisma.recruiterHandoff.update({
    where: { id: handoffId },
    data: {
      status: "REJECTED",
      reason: reason ? `${handoff.reason} [Rejected: ${reason}]` : handoff.reason,
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorId: recruiterId,
      action: "HANDOFF_REJECTED",
      resourceType: "RECRUITER_HANDOFF",
      resourceId: handoffId,
      metadata: JSON.stringify({ handoffId, recruiterId, reason }),
    },
  });

  return true;
}

/**
 * Retrieves handoff records filtered by company and optional query parameters.
 */
export async function getHandoffs(
  companyId: string,
  filters?: { recruiterId?: string; status?: HandoffStatus; candidateId?: string }
): Promise<RecruiterHandoffRecord[]> {
  const now = Date.now();

  const whereClause: any = { companyId };
  if (filters?.status) whereClause.status = filters.status;
  if (filters?.candidateId) whereClause.candidateId = filters.candidateId;
  if (filters?.recruiterId) {
    whereClause.OR = [
      { fromRecruiterId: filters.recruiterId },
      { toRecruiterId: filters.recruiterId },
    ];
  }

  const handoffs = await prisma.recruiterHandoff.findMany({
    where: whereClause,
    include: {
      fromRecruiter: { select: { name: true } },
      toRecruiter: { select: { name: true } },
      candidate: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const jobIds = handoffs.map((h) => h.jobId).filter((id): id is string => !!id);
  const jobs = jobIds.length > 0
    ? await prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true } })
    : [];
  const jobMap = new Map(jobs.map((j) => [j.id, j.title]));

  return handoffs.map((h) => {
    let completedWork: string[] = [];
    let pendingWork: string[] = [];
    try { completedWork = JSON.parse(h.completedWork); } catch {}
    try { pendingWork = JSON.parse(h.pendingWork); } catch {}

    const isOverdue = h.status === "PENDING" && !!h.dueAt && new Date(h.dueAt).getTime() < now;

    return {
      id: h.id,
      companyId: h.companyId,
      fromRecruiterId: h.fromRecruiterId,
      fromRecruiterName: h.fromRecruiter.name,
      toRecruiterId: h.toRecruiterId,
      toRecruiterName: h.toRecruiter.name,
      candidateId: h.candidateId,
      candidateName: h.candidate.name,
      applicationId: h.applicationId,
      jobId: h.jobId,
      jobTitle: h.jobId ? jobMap.get(h.jobId) || null : null,
      reason: h.reason,
      currentStage: h.currentStage,
      completedWork,
      pendingWork,
      importantEvidence: h.importantEvidence,
      nextRecommendedAction: h.nextRecommendedAction,
      status: h.status as HandoffStatus,
      dueAt: h.dueAt ? h.dueAt.toISOString() : null,
      acceptedAt: h.acceptedAt ? h.acceptedAt.toISOString() : null,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
      isOverdue,
    };
  });
}
