/**
 * NextHire Phase 13 — Duplicate Work & Concurrent Outreach Detector
 * Proactively flags redundant recruiter actions: simultaneous outreach campaigns,
 * competing application stage reviews, and overlapping hiring tasks.
 */

import { prisma } from "@/lib/prisma";
import { DuplicateWorkAlert, DuplicateWorkType } from "./types";

/**
 * Detect all duplicate work issues within a company or for a specific candidate.
 */
export async function detectDuplicateWork(
  companyId: string,
  candidateId?: string
): Promise<DuplicateWorkAlert[]> {
  const alerts: DuplicateWorkAlert[] = [];
  const now = Date.now();

  // 1. Detect Concurrent Outreach Campaigns on the same candidate
  const outreachRecipients = await prisma.outreachRecipient.findMany({
    where: {
      campaign: { companyId },
      ...(candidateId ? { candidateId } : {}),
      status: { in: ["DELIVERED", "QUEUED"] },
    },
    include: {
      campaign: {
        include: { recruiter: { select: { id: true, name: true } } },
      },
      candidate: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by candidateId
  const outreachByCandidate = new Map<string, typeof outreachRecipients>();
  for (const r of outreachRecipients) {
    const list = outreachByCandidate.get(r.candidateId) || [];
    list.push(r);
    outreachByCandidate.set(r.candidateId, list);
  }

  const outreachEntries = Array.from(outreachByCandidate.entries());
  for (const [cId, recipients] of outreachEntries) {
    const distinctRecruiters = new Map<string, { id: string; name: string }>();
    for (const r of recipients) {
      distinctRecruiters.set(r.campaign.recruiter.id, r.campaign.recruiter);
    }

    if (distinctRecruiters.size > 1) {
      const candidateName = recipients[0].candidate.name;
      const participants = Array.from(distinctRecruiters.values()).map((r) => ({
        recruiterId: r.id,
        recruiterName: r.name,
        role: "Outreach Sender",
      }));

      alerts.push({
        id: `dup-outreach-${cId}`,
        type: "CONCURRENT_OUTREACH",
        severity: "CRITICAL",
        candidateId: cId,
        candidateName,
        jobId: recipients[0].campaign.jobId,
        jobTitle: null,
        participants,
        description: `Multiple recruiters (${participants.map((p) => p.recruiterName).join(", ")}) are actively running outreach campaigns targeting ${candidateName}.`,
        existingActivity: `${recipients.length} active outreach recipient messages across ${distinctRecruiters.size} campaigns.`,
        recommendedResolution: `Consolidate outreach under one primary recruiter to prevent redundant candidate communications.`,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  // 2. Detect Simultaneous Reviews / Competing Application Events on the same candidate
  const recentEvents = await prisma.applicationEvent.findMany({
    where: {
      application: {
        job: { companyId },
        ...(candidateId ? { applicantId: candidateId } : {}),
      },
      timestamp: { gte: new Date(now - 48 * 60 * 60 * 1000) },
    },
    include: {
      application: {
        include: {
          applicant: { select: { id: true, name: true } },
          job: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });

  const eventsByApplicant = new Map<string, typeof recentEvents>();
  for (const ev of recentEvents) {
    const list = eventsByApplicant.get(ev.application.applicantId) || [];
    list.push(ev);
    eventsByApplicant.set(ev.application.applicantId, list);
  }

  const applicantEntries = Array.from(eventsByApplicant.entries());
  for (const [aId, events] of applicantEntries) {
    const actorIds: string[] = Array.from(new Set(events.map((e: any) => e.actorId as string)));
    if (actorIds.length > 1) {
      const actors = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true },
      });
      const candidateName = events[0].application.applicant.name;

      alerts.push({
        id: `dup-review-${aId}`,
        type: "SIMULTANEOUS_REVIEW",
        severity: "HIGH",
        candidateId: aId,
        candidateName,
        jobId: events[0].application.job.id,
        jobTitle: events[0].application.job.title,
        participants: actors.map((a) => ({ recruiterId: a.id, recruiterName: a.name, role: "Reviewer" })),
        description: `Multiple recruiters independently updated application stages for ${candidateName} in the past 48 hours.`,
        existingActivity: `${events.length} pipeline actions logged by ${actors.map((a) => a.name).join(" and ")}.`,
        recommendedResolution: `Check active candidate assignment to ensure one recruiter owns decision-making for this application.`,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  // 3. Detect Overlapping / Competing Open Hiring Tasks on the same candidate
  const openTasks = await prisma.hiringTask.findMany({
    where: {
      companyId,
      candidateId: candidateId ? candidateId : { not: null },
      status: { in: ["TODO", "IN_PROGRESS"] },
    },
    include: {
      assignee: { select: { id: true, name: true } },
    },
  });

  const tasksByCandidate = new Map<string, typeof openTasks>();
  for (const task of openTasks) {
    if (!task.candidateId) continue;
    const list = tasksByCandidate.get(task.candidateId) || [];
    list.push(task);
    tasksByCandidate.set(task.candidateId, list);
  }

  const taskEntries = Array.from(tasksByCandidate.entries());
  for (const [cId, tasks] of taskEntries) {
    const distinctAssignees = Array.from(new Set(tasks.map((t: any) => t.assigneeId as string)));
    if (distinctAssignees.length > 1) {
      const candidate = await prisma.user.findUnique({
        where: { id: cId },
        select: { name: true },
      });
      const candidateName = candidate?.name || "Candidate";

      alerts.push({
        id: `dup-task-${cId}`,
        type: "OVERLAPPING_NOTES",
        severity: "MEDIUM",
        candidateId: cId,
        candidateName,
        jobId: tasks[0].jobId,
        jobTitle: null,
        participants: tasks.map((t: any) => ({
          recruiterId: t.assignee.id,
          recruiterName: t.assignee.name,
          role: "Task Assignee",
        })),
        description: `${tasks.length} overlapping hiring tasks assigned to different recruiters for ${candidateName}.`,
        existingActivity: `Tasks: ${tasks.map((t: any) => `"${t.title}" (${t.assignee.name})`).join(", ")}.`,
        recommendedResolution: `Review open tasks and assign a single lead recruiter to coordinate candidate tasks.`,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return alerts;
}
