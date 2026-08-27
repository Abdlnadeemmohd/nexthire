/**
 * NextHire Phase 13 — Assignment Engine
 * Deterministic candidate and job ownership, history preservation, and audit logging.
 */

import { prisma } from "@/lib/prisma";
import { emitEvent as emitAppEvent } from "@/lib/events/eventEngine";
import { CandidateAssignmentRecord } from "./types";

export interface AssignCandidateInput {
  companyId: string;
  candidateId: string;
  applicationId?: string | null;
  jobId?: string | null;
  recruiterId: string;
  assignedById: string;
  reason?: string | null;
  teamId?: string | null;
}

export interface ReassignCandidateInput {
  companyId: string;
  assignmentId?: string;
  candidateId?: string;
  newRecruiterId: string;
  assignedById: string;
  reason?: string | null;
}

export interface AssignJobOwnerInput {
  companyId: string;
  jobId: string;
  newRecruiterId: string;
  assignedById: string;
  reason?: string | null;
}

/**
 * Validates that an actor has permission to perform team assignments within a company.
 */
export async function validateAssignmentPermission(actorId: string, companyId: string): Promise<boolean> {
  const actor = await prisma.user.findFirst({
    where: {
      id: actorId,
      companyId,
      role: { in: ["RECRUITER", "RECRUITER_MANAGER", "COMPANY_ADMIN", "PLATFORM_ADMIN"] },
    },
  });
  return !!actor;
}

/**
 * Assigns a candidate to a recruiter within a company.
 * Automatically marks previous active assignments as TRANSFERRED to preserve history.
 */
export async function assignCandidate(input: AssignCandidateInput): Promise<CandidateAssignmentRecord> {
  const { companyId, candidateId, applicationId, jobId, recruiterId, assignedById, reason, teamId } = input;

  // 1. Verify actor has permissions within this company
  const actor = await prisma.user.findUnique({
    where: { id: assignedById },
    select: { id: true, companyId: true, role: true },
  });

  if (!actor || (actor.role !== "PLATFORM_ADMIN" && actor.companyId !== companyId)) {
    throw new Error("Unauthorized: Assignment actor does not belong to this company organization.");
  }

  // Standard recruiters cannot manage/assign other recruiters unless they are a manager or admin
  if (actor.role === "RECRUITER" && recruiterId !== actor.id) {
    // Check if actor has manager role or team lead role
    const isTeamLead = await prisma.teamMembership.findFirst({
      where: { userId: actor.id, companyId, role: { in: ["HIRING_MANAGER", "TEAM_LEAD"] } },
    });
    if (!isTeamLead) {
      throw new Error("Forbidden: Recruiter lacks manager permissions to assign work to other recruiters.");
    }
  }

  // 2. Verify target recruiter belongs to the EXACT SAME company (Cross-company strict block)
  const targetRecruiter = await prisma.user.findUnique({
    where: { id: recruiterId },
    select: { id: true, name: true, email: true, companyId: true, role: true, managerId: true },
  });

  if (!targetRecruiter) {
    throw new Error("Target recruiter not found.");
  }

  if (targetRecruiter.companyId !== companyId) {
    throw new Error("Cross-company assignment forbidden: Target recruiter belongs to a different company.");
  }

  if (!["RECRUITER", "RECRUITER_MANAGER", "COMPANY_ADMIN"].includes(targetRecruiter.role)) {
    throw new Error("Target user lacks recruiter permissions.");
  }

  // 3. Verify candidate exists
  const candidate = await prisma.user.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, email: true },
  });
  if (!candidate) {
    throw new Error("Candidate not found.");
  }

  // 3. Mark existing active assignment as TRANSFERRED
  const existingActive = await prisma.candidateAssignment.findFirst({
    where: { candidateId, companyId, status: "ACTIVE" },
  });

  const now = new Date();
  if (existingActive) {
    await prisma.candidateAssignment.update({
      where: { id: existingActive.id },
      data: {
        status: "TRANSFERRED",
        unassignedAt: now,
      },
    });
  }

  // 4. Create new active assignment
  const newAssignment = await prisma.candidateAssignment.create({
    data: {
      companyId,
      candidateId,
      applicationId: applicationId || null,
      jobId: jobId || null,
      recruiterId,
      teamId: teamId || null,
      assignedById,
      reason: reason || (existingActive ? "Reassigned candidate" : "Initial candidate assignment"),
      status: "ACTIVE",
      assignedAt: now,
    },
    include: {
      candidate: { select: { name: true, email: true } },
      recruiter: { select: { name: true, email: true } },
      assignedBy: { select: { name: true } },
      team: { select: { name: true } },
    },
  });

  // 5. Fetch job title if present
  let jobTitle: string | null = null;
  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { title: true } });
    jobTitle = job?.title || null;
  }

  // 6. Write Audit Event
  await prisma.auditEvent.create({
    data: {
      actorId: assignedById,
      action: existingActive ? "CANDIDATE_REASSIGNED" : "CANDIDATE_ASSIGNED",
      resourceType: "CANDIDATE_ASSIGNMENT",
      resourceId: newAssignment.id,
      metadata: JSON.stringify({
        candidateId,
        candidateName: candidate.name,
        previousRecruiterId: existingActive?.recruiterId || null,
        newRecruiterId: recruiterId,
        jobId: jobId || null,
        reason: reason || null,
      }),
    },
  });

  // 7. Emit Notification Event
  await emitAppEvent({
    type: existingActive ? "RECRUITER_CANDIDATE_REASSIGNED" : "RECRUITER_CANDIDATE_ASSIGNED",
    recipientId: recruiterId,
    actorId: assignedById,
    companyId,
    entityType: "CANDIDATE",
    entityId: candidateId,
    title: existingActive ? `Candidate Reassigned: ${candidate.name}` : `Candidate Assigned: ${candidate.name}`,
    body: `${candidate.name} has been assigned to your recruiting queue${jobTitle ? ` for ${jobTitle}` : ""}.`,
    ctaText: "View Candidate Queue",
    ctaUrl: "/recruiter/team",
    metadata: {
      candidateId,
      candidateName: candidate.name,
      jobId,
      jobTitle,
      assignmentId: newAssignment.id,
    },
  });

  return {
    id: newAssignment.id,
    companyId: newAssignment.companyId,
    candidateId: newAssignment.candidateId,
    candidateName: newAssignment.candidate.name,
    candidateEmail: newAssignment.candidate.email,
    applicationId: newAssignment.applicationId,
    jobId: newAssignment.jobId,
    jobTitle,
    recruiterId: newAssignment.recruiterId,
    recruiterName: newAssignment.recruiter.name,
    teamId: newAssignment.teamId,
    teamName: newAssignment.team?.name || null,
    assignedById: newAssignment.assignedById,
    assignedByName: newAssignment.assignedBy.name,
    reason: newAssignment.reason,
    status: newAssignment.status,
    assignedAt: newAssignment.assignedAt.toISOString(),
    unassignedAt: null,
  };
}

/**
 * Reassigns an existing candidate assignment to a new recruiter.
 */
export async function reassignCandidate(input: ReassignCandidateInput): Promise<CandidateAssignmentRecord> {
  const { companyId, assignmentId, candidateId, newRecruiterId, assignedById, reason } = input;

  let targetCandidateId = candidateId;
  let targetAppId: string | null = null;
  let targetJobId: string | null = null;
  let targetTeamId: string | null = null;

  if (assignmentId) {
    const existing = await prisma.candidateAssignment.findFirst({
      where: { id: assignmentId, companyId },
    });
    if (!existing) {
      throw new Error("Assignment record not found for this company.");
    }
    targetCandidateId = existing.candidateId;
    targetAppId = existing.applicationId;
    targetJobId = existing.jobId;
    targetTeamId = existing.teamId;
  }

  if (!targetCandidateId) {
    throw new Error("Candidate ID is required for reassignment.");
  }

  return assignCandidate({
    companyId,
    candidateId: targetCandidateId,
    applicationId: targetAppId,
    jobId: targetJobId,
    recruiterId: newRecruiterId,
    assignedById,
    reason: reason || "Reassigned to balance workload",
    teamId: targetTeamId,
  });
}

/**
 * Unassigns a candidate, moving their status to UNASSIGNED.
 */
export async function unassignCandidate(
  candidateId: string,
  companyId: string,
  unassignedById: string,
  reason?: string
): Promise<boolean> {
  const activeAssignment = await prisma.candidateAssignment.findFirst({
    where: { candidateId, companyId, status: "ACTIVE" },
  });

  if (!activeAssignment) return false;

  const now = new Date();
  await prisma.candidateAssignment.update({
    where: { id: activeAssignment.id },
    data: {
      status: "UNASSIGNED",
      unassignedAt: now,
      reason: reason || "Candidate unassigned",
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorId: unassignedById,
      action: "CANDIDATE_UNASSIGNED",
      resourceType: "CANDIDATE_ASSIGNMENT",
      resourceId: activeAssignment.id,
      metadata: JSON.stringify({ candidateId, previousRecruiterId: activeAssignment.recruiterId, reason }),
    },
  });

  return true;
}

/**
 * Reassigns job ownership to a new primary recruiter.
 */
export async function assignJobOwner(input: AssignJobOwnerInput): Promise<boolean> {
  const { companyId, jobId, newRecruiterId, assignedById, reason } = input;

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
  });
  if (!job) {
    throw new Error("Job not found for this company.");
  }

  const newRecruiter = await prisma.user.findFirst({
    where: { id: newRecruiterId, companyId, role: { in: ["RECRUITER", "RECRUITER_MANAGER", "COMPANY_ADMIN"] } },
  });
  if (!newRecruiter) {
    throw new Error("Target recruiter does not belong to this company.");
  }

  const previousRecruiterId = job.recruiterId;

  await prisma.job.update({
    where: { id: jobId },
    data: { recruiterId: newRecruiterId },
  });

  await prisma.auditEvent.create({
    data: {
      actorId: assignedById,
      action: "JOB_OWNERSHIP_CHANGED",
      resourceType: "JOB",
      resourceId: jobId,
      metadata: JSON.stringify({
        jobId,
        jobTitle: job.title,
        previousRecruiterId,
        newRecruiterId,
        reason: reason || "Ownership transfer",
      }),
    },
  });

  await emitAppEvent({
    type: "RECRUITER_JOB_ASSIGNED",
    recipientId: newRecruiterId,
    actorId: assignedById,
    companyId,
    entityType: "JOB",
    entityId: jobId,
    title: `Job Ownership Assigned: ${job.title}`,
    body: `You are now the primary recruiter for ${job.title}.`,
    ctaText: "View Job Pipeline",
    ctaUrl: `/recruiter/jobs/${jobId}`,
    metadata: { jobId, jobTitle: job.title, previousRecruiterId },
  });

  return true;
}

/**
 * Retrieves full chronological assignment history for a candidate within a company.
 */
export async function getCandidateAssignmentHistory(
  candidateId: string,
  companyId: string
): Promise<CandidateAssignmentRecord[]> {
  const assignments = await prisma.candidateAssignment.findMany({
    where: { candidateId, companyId },
    include: {
      candidate: { select: { name: true, email: true } },
      recruiter: { select: { name: true, email: true } },
      assignedBy: { select: { name: true } },
      team: { select: { name: true } },
    },
    orderBy: { assignedAt: "desc" },
  });

  const jobIds = assignments.map((a) => a.jobId).filter((id): id is string => !!id);
  const jobs = jobIds.length > 0
    ? await prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true } })
    : [];
  const jobMap = new Map(jobs.map((j) => [j.id, j.title]));

  return assignments.map((a) => ({
    id: a.id,
    companyId: a.companyId,
    candidateId: a.candidateId,
    candidateName: a.candidate.name,
    candidateEmail: a.candidate.email,
    applicationId: a.applicationId,
    jobId: a.jobId,
    jobTitle: a.jobId ? jobMap.get(a.jobId) || null : null,
    recruiterId: a.recruiterId,
    recruiterName: a.recruiter.name,
    teamId: a.teamId,
    teamName: a.team?.name || null,
    assignedById: a.assignedById,
    assignedByName: a.assignedBy.name,
    reason: a.reason,
    status: a.status,
    assignedAt: a.assignedAt.toISOString(),
    unassignedAt: a.unassignedAt ? a.unassignedAt.toISOString() : null,
  }));
}

/**
 * Retrieves currently active assignment for a candidate.
 */
export async function getActiveCandidateAssignment(
  candidateId: string,
  companyId: string
): Promise<CandidateAssignmentRecord | null> {
  const history = await getCandidateAssignmentHistory(candidateId, companyId);
  return history.find((a) => a.status === "ACTIVE") || null;
}
