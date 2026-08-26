/**
 * NextHire Phase 13 — Team Activity Stream Engine
 * Chronological, company-isolated activity feed for recruiting operations.
 */

import { prisma } from "@/lib/prisma";
import { TeamActivityItem } from "./types";

/**
 * Retrieves summarized team recruiting activity stream for a company.
 */
export async function getTeamActivityStream(
  companyId: string,
  limit: number = 30
): Promise<TeamActivityItem[]> {
  const companyRecruiters = await prisma.user.findMany({
    where: { companyId, role: { in: ["RECRUITER", "COMPANY_ADMIN"] } },
    select: { id: true, name: true },
  });

  const recruiterIds = companyRecruiters.map((r) => r.id);
  const recruiterMap = new Map(companyRecruiters.map((r) => [r.id, r.name]));

  // 1. Fetch Audit Events by company recruiters
  const auditEvents = await prisma.auditEvent.findMany({
    where: { actorId: { in: recruiterIds } },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  const items: TeamActivityItem[] = [];

  for (const event of auditEvents) {
    const actorName = recruiterMap.get(event.actorId) || "Team Member";
    let metadata: Record<string, any> = {};
    try {
      if (event.metadata) metadata = JSON.parse(event.metadata);
    } catch {}

    let targetType: TeamActivityItem["targetType"] = "CANDIDATE";
    let targetName = metadata.candidateName || metadata.jobTitle || "Resource";

    if (event.resourceType === "JOB") targetType = "JOB";
    else if (event.resourceType === "RECRUITER_HANDOFF") targetType = "HANDOFF";
    else if (event.resourceType === "HIRING_TASK") targetType = "TASK";
    else if (event.resourceType === "COLLABORATION_NOTE") targetType = "NOTE";
    else if (event.resourceType === "SCORECARD") targetType = "SCORECARD";

    let summary = "";
    switch (event.action) {
      case "CANDIDATE_ASSIGNED":
        summary = `${actorName} assigned candidate ${metadata.candidateName || "a candidate"} to a recruiter.`;
        break;
      case "CANDIDATE_REASSIGNED":
        summary = `${actorName} reassigned candidate ${metadata.candidateName || "a candidate"}.`;
        break;
      case "HANDOFF_CREATED":
        summary = `${actorName} created a candidate handoff for ${metadata.candidateName || "a candidate"}.`;
        break;
      case "HANDOFF_ACCEPTED":
        summary = `${actorName} accepted a candidate handoff.`;
        break;
      case "HANDOFF_REJECTED":
        summary = `${actorName} declined a candidate handoff.`;
        break;
      case "COLLABORATION_NOTE_CREATED":
        summary = `${actorName} added an internal collaboration note on ${metadata.candidateName || "a candidate"}.`;
        break;
      case "HIRING_TASK_CREATED":
        summary = `${actorName} created a new task: "${metadata.title || "Hiring Task"}".`;
        break;
      case "HIRING_TASK_COMPLETED":
        summary = `${actorName} completed a hiring task.`;
        break;
      case "JOB_OWNERSHIP_CHANGED":
        summary = `${actorName} updated primary ownership for job "${metadata.jobTitle || "Requisition"}".`;
        break;
      default:
        summary = `${actorName} performed ${event.action.replace(/_/g, " ").toLowerCase()}.`;
    }

    items.push({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      actorId: event.actorId,
      actorName,
      action: event.action,
      targetType,
      targetId: event.resourceId || event.id,
      targetName,
      summary,
      metadata,
    });
  }

  return items.slice(0, limit);
}
