/**
 * NextHire Phase 13 — Contextual Hiring Tasks Engine
 * Lightweight, hiring-specific operational task management for recruiting teams.
 */

import { prisma } from "@/lib/prisma";
import { emitEvent as emitAppEvent } from "@/lib/events/eventEngine";
import {
  HiringTaskRecord,
  HiringTaskPriority,
  HiringTaskStatus,
} from "./types";

export interface CreateHiringTaskInput {
  companyId: string;
  title: string;
  description?: string | null;
  priority?: HiringTaskPriority;
  assigneeId: string;
  creatorId: string;
  candidateId?: string | null;
  applicationId?: string | null;
  jobId?: string | null;
  dueAt?: Date | null;
}

export interface UpdateHiringTaskInput {
  taskId: string;
  companyId: string;
  updaterId: string;
  title?: string;
  description?: string | null;
  priority?: HiringTaskPriority;
  status?: HiringTaskStatus;
  assigneeId?: string;
  dueAt?: Date | null;
}

/**
 * Creates a hiring-contextual task assigned to a recruiter.
 */
export async function createHiringTask(input: CreateHiringTaskInput): Promise<HiringTaskRecord> {
  const {
    companyId,
    title,
    description,
    priority = "NORMAL",
    assigneeId,
    creatorId,
    candidateId,
    applicationId,
    jobId,
    dueAt,
  } = input;

  const [assignee, creator] = await Promise.all([
    prisma.user.findFirst({
      where: { id: assigneeId, companyId, role: { in: ["RECRUITER", "COMPANY_ADMIN"] } },
      select: { id: true, name: true, email: true },
    }),
    prisma.user.findFirst({
      where: { id: creatorId, companyId },
      select: { id: true, name: true },
    }),
  ]);

  if (!assignee || !creator) {
    throw new Error("Assignee and creator must belong to the specified company.");
  }

  let candidateName: string | null = null;
  if (candidateId) {
    const cand = await prisma.user.findUnique({ where: { id: candidateId }, select: { name: true } });
    candidateName = cand?.name || null;
  }

  const task = await prisma.hiringTask.create({
    data: {
      companyId,
      title,
      description: description || null,
      priority,
      status: "TODO",
      assigneeId,
      creatorId,
      candidateId: candidateId || null,
      applicationId: applicationId || null,
      jobId: jobId || null,
      dueAt: dueAt || null,
    },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
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
      actorId: creatorId,
      action: "HIRING_TASK_CREATED",
      resourceType: "HIRING_TASK",
      resourceId: task.id,
      metadata: JSON.stringify({
        title,
        assigneeId,
        priority,
        candidateId,
        candidateName,
        jobId,
      }),
    },
  });

  // Notification
  if (assigneeId !== creatorId) {
    await emitAppEvent({
      type: "RECRUITER_TASK_ASSIGNED",
      recipientId: assigneeId,
      actorId: creatorId,
      companyId,
      entityType: "TASK",
      entityId: task.id,
      title: `Task Assigned: ${title}`,
      body: `${creator.name} assigned a ${priority.toLowerCase()}-priority task to you: "${title}".`,
      ctaText: "View Tasks",
      ctaUrl: "/recruiter/team",
      metadata: {
        taskId: task.id,
        title,
        priority,
        candidateId,
        candidateName,
        jobId,
        jobTitle,
      },
    });
  }

  const isOverdue = !!task.dueAt && new Date(task.dueAt).getTime() < Date.now();

  return {
    id: task.id,
    companyId: task.companyId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee.name,
    creatorId: task.creatorId,
    creatorName: task.creator.name,
    candidateId: task.candidateId,
    candidateName,
    applicationId: task.applicationId,
    jobId: task.jobId,
    jobTitle,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    completedAt: null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    isOverdue,
  };
}

/**
 * Updates a hiring task's status, priority, or assignment.
 */
export async function updateHiringTask(input: UpdateHiringTaskInput): Promise<HiringTaskRecord> {
  const { taskId, companyId, updaterId, title, description, priority, status, assigneeId, dueAt } = input;

  const task = await prisma.hiringTask.findFirst({
    where: { id: taskId, companyId },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
  });

  if (!task) {
    throw new Error("Task not found for this company.");
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (priority !== undefined) updateData.priority = priority;
  if (dueAt !== undefined) updateData.dueAt = dueAt;
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
  if (status !== undefined) {
    updateData.status = status;
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  const updated = await prisma.hiringTask.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorId: updaterId,
      action: status === "COMPLETED" ? "HIRING_TASK_COMPLETED" : "HIRING_TASK_UPDATED",
      resourceType: "HIRING_TASK",
      resourceId: taskId,
      metadata: JSON.stringify({ status, priority, assigneeId }),
    },
  });

  let candidateName: string | null = null;
  if (updated.candidateId) {
    const cand = await prisma.user.findUnique({ where: { id: updated.candidateId }, select: { name: true } });
    candidateName = cand?.name || null;
  }

  let jobTitle: string | null = null;
  if (updated.jobId) {
    const job = await prisma.job.findUnique({ where: { id: updated.jobId }, select: { title: true } });
    jobTitle = job?.title || null;
  }

  const isOverdue = updated.status !== "COMPLETED" && !!updated.dueAt && new Date(updated.dueAt).getTime() < Date.now();

  return {
    id: updated.id,
    companyId: updated.companyId,
    title: updated.title,
    description: updated.description,
    priority: updated.priority,
    status: updated.status,
    assigneeId: updated.assigneeId,
    assigneeName: updated.assignee.name,
    creatorId: updated.creatorId,
    creatorName: updated.creator.name,
    candidateId: updated.candidateId,
    candidateName,
    applicationId: updated.applicationId,
    jobId: updated.jobId,
    jobTitle,
    dueAt: updated.dueAt ? updated.dueAt.toISOString() : null,
    completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    isOverdue,
  };
}

/**
 * Retrieves hiring tasks with optional filters.
 */
export async function getHiringTasks(
  companyId: string,
  filters?: { assigneeId?: string; status?: HiringTaskStatus; candidateId?: string; jobId?: string }
): Promise<HiringTaskRecord[]> {
  const whereClause: any = { companyId };
  if (filters?.assigneeId) whereClause.assigneeId = filters.assigneeId;
  if (filters?.status) whereClause.status = filters.status;
  if (filters?.candidateId) whereClause.candidateId = filters.candidateId;
  if (filters?.jobId) whereClause.jobId = filters.jobId;

  const tasks = await prisma.hiringTask.findMany({
    where: whereClause,
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [
      { priority: "asc" },
      { dueAt: "asc" },
      { createdAt: "desc" },
    ],
  });

  const candidateIds = tasks.map((t) => t.candidateId).filter((id): id is string => !!id);
  const candidates = candidateIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: candidateIds } }, select: { id: true, name: true } })
    : [];
  const candMap = new Map(candidates.map((c) => [c.id, c.name]));

  const jobIds = tasks.map((t) => t.jobId).filter((id): id is string => !!id);
  const jobs = jobIds.length > 0
    ? await prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true } })
    : [];
  const jobMap = new Map(jobs.map((j) => [j.id, j.title]));

  const now = Date.now();

  return tasks.map((t) => {
    const isOverdue = t.status !== "COMPLETED" && !!t.dueAt && new Date(t.dueAt).getTime() < now;
    return {
      id: t.id,
      companyId: t.companyId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      assigneeId: t.assigneeId,
      assigneeName: t.assignee.name,
      creatorId: t.creatorId,
      creatorName: t.creator.name,
      candidateId: t.candidateId,
      candidateName: t.candidateId ? candMap.get(t.candidateId) || null : null,
      applicationId: t.applicationId,
      jobId: t.jobId,
      jobTitle: t.jobId ? jobMap.get(t.jobId) || null : null,
      dueAt: t.dueAt ? t.dueAt.toISOString() : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      isOverdue,
    };
  });
}
