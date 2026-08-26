/**
 * NextHire Phase 13 — Workload Balancer & Smart Assignment Engine
 * Extends Phase 11 workload calculations to provide team-wide capacity analysis
 * and deterministic, explainable candidate assignment recommendations.
 */

import { prisma } from "@/lib/prisma";
import { calculateRecruiterWorkload } from "@/lib/intelligence/workloadEngine";
import {
  RecruiterMember,
  TeamWorkloadOverview,
  SmartAssignmentRecommendation,
  AssignmentStrategy,
  WorkloadLevel,
} from "./types";

/**
 * Calculates complete team members list with active workloads and team assignments.
 */
export async function getTeamMembers(companyId: string): Promise<RecruiterMember[]> {
  const recruiters = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ["RECRUITER", "COMPANY_ADMIN"] },
    },
    include: {
      teamMemberships: {
        where: { companyId },
        include: { team: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const members: RecruiterMember[] = [];

  for (const r of recruiters) {
    const workload = await calculateRecruiterWorkload(r.id, companyId);
    const membership = r.teamMemberships[0];

    const assignedCandidatesCount = await prisma.candidateAssignment.count({
      where: { recruiterId: r.id, companyId, status: "ACTIVE" },
    });

    const activeTasksCount = await prisma.hiringTask.count({
      where: { assigneeId: r.id, companyId, status: { in: ["TODO", "IN_PROGRESS"] } },
    });

    const workloadStatus: WorkloadLevel = workload ? (workload.status as WorkloadLevel) : "NORMAL";
    const workloadScore = workload ? workload.workloadScore : 0;
    const pendingReviewsCount = workload ? workload.pendingReviewsCount : 0;
    const pendingScorecardsCount = workload ? workload.pendingScorecardsCount : 0;
    const overdueTasksCount = workload ? workload.overdueTasksCount : 0;
    const assignedJobsCount = workload ? workload.activeJobsCount : 0;

    members.push({
      id: r.id,
      name: r.name,
      email: r.email,
      avatar: r.avatar,
      headline: r.headline,
      role: r.role,
      teamRole: membership ? membership.role : "TEAM_MEMBER",
      teamId: membership ? membership.teamId : null,
      teamName: membership ? membership.team.name : null,
      assignedCandidatesCount,
      assignedJobsCount,
      activeTasksCount,
      pendingReviewsCount,
      pendingScorecardsCount,
      overdueTasksCount,
      workloadScore,
      workloadStatus,
    });
  }

  return members;
}

/**
 * Calculates team-wide workload overview including distribution and unassigned work.
 */
export async function getTeamWorkloadOverview(companyId: string): Promise<TeamWorkloadOverview> {
  const members = await getTeamMembers(companyId);

  // Count unassigned applications (applicants to company jobs with no active CandidateAssignment)
  const activeJobs = await prisma.job.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true },
  });
  const activeJobIds = activeJobs.map((j) => j.id);

  const applications = await prisma.application.findMany({
    where: {
      jobId: { in: activeJobIds },
      status: { notIn: ["REJECTED", "APPLICATION_CLOSED"] },
    },
    select: { applicantId: true },
  });

  const uniqueApplicantIds = Array.from(new Set(applications.map((a) => a.applicantId)));
  const assignedCandidateRecords = await prisma.candidateAssignment.findMany({
    where: {
      companyId,
      candidateId: { in: uniqueApplicantIds },
      status: "ACTIVE",
    },
    select: { candidateId: true },
  });
  const assignedCandidateIds = new Set(assignedCandidateRecords.map((a) => a.candidateId));
  const unassignedCandidatesCount = uniqueApplicantIds.filter((id) => !assignedCandidateIds.has(id)).length;

  // Unassigned jobs (active jobs where recruiterId is inactive or has > 10 active jobs)
  const unassignedJobsCount = await prisma.job.count({
    where: { companyId, status: "PAUSED" },
  });

  const distribution = {
    normal: members.filter((m) => m.workloadStatus === "NORMAL").length,
    busy: members.filter((m) => m.workloadStatus === "BUSY").length,
    overloaded: members.filter((m) => m.workloadStatus === "OVERLOADED").length,
    critical: members.filter((m) => m.workloadStatus === "CRITICAL").length,
  };

  const overloadedRecruiters = members.filter(
    (m) => m.workloadStatus === "OVERLOADED" || m.workloadStatus === "CRITICAL"
  );

  return {
    companyId,
    totalRecruiters: members.length,
    distribution,
    members,
    unassignedCandidatesCount,
    unassignedJobsCount,
    overloadedRecruiters,
  };
}

/**
 * Computes deterministic, explainable smart assignment recommendation for a candidate.
 */
export async function getSmartAssignmentRecommendation(
  candidateId: string,
  companyId: string,
  jobId?: string | null
): Promise<SmartAssignmentRecommendation> {
  const candidate = await prisma.user.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, profile: true },
  });
  if (!candidate) {
    throw new Error("Candidate not found.");
  }

  const members = await getTeamMembers(companyId);
  if (members.length === 0) {
    throw new Error("No recruiters available in company.");
  }

  // Check if candidate currently has an active assignment
  const currentAssignment = await prisma.candidateAssignment.findFirst({
    where: { candidateId, companyId, status: "ACTIVE" },
    include: { recruiter: { select: { name: true } } },
  });

  let targetJob: any = null;
  if (jobId) {
    targetJob = await prisma.job.findFirst({
      where: { id: jobId, companyId },
    });
  }

  // 1. If Job has a primary recruiter who has capacity (NORMAL or BUSY), recommend job owner
  if (targetJob && targetJob.recruiterId) {
    const jobOwner = members.find((m) => m.id === targetJob.recruiterId);
    if (jobOwner && (jobOwner.workloadStatus === "NORMAL" || jobOwner.workloadStatus === "BUSY")) {
      return {
        candidateId,
        candidateName: candidate.name,
        jobId: targetJob.id,
        jobTitle: targetJob.title,
        recommendedRecruiterId: jobOwner.id,
        recommendedRecruiterName: jobOwner.name,
        recommendedRecruiterEmail: jobOwner.email,
        strategy: "ASSIGN_BY_JOB_EXPERTISE",
        confidence: "HIGH",
        reasonSummary: `${jobOwner.name} is the primary owner for "${targetJob.title}" and currently has available capacity (${jobOwner.workloadStatus} load, ${jobOwner.assignedCandidatesCount} active candidate(s)).`,
        evidence: [
          `Primary job owner for ${targetJob.title}`,
          `Current workload score: ${jobOwner.workloadScore}/100 (${jobOwner.workloadStatus})`,
          `Pending reviews in queue: ${jobOwner.pendingReviewsCount}`,
        ],
        candidateCurrentWorkload: jobOwner.assignedCandidatesCount,
        currentOwnerName: currentAssignment?.recruiter.name || null,
      };
    }
  }

  // 2. Select the least loaded recruiter
  const sortedByLoad = [...members].sort((a, b) => {
    if (a.workloadScore !== b.workloadScore) return a.workloadScore - b.workloadScore;
    return a.assignedCandidatesCount - b.assignedCandidatesCount;
  });

  const leastLoaded = sortedByLoad[0];
  const strategy: AssignmentStrategy = leastLoaded.teamRole === "TEAM_LEAD"
    ? "ESCALATE_TO_TEAM_LEAD"
    : "ASSIGN_TO_LEAST_LOADED";

  const evidence: string[] = [
    `Lowest relative workload score on team: ${leastLoaded.workloadScore}/100`,
    `Currently managing ${leastLoaded.assignedCandidatesCount} active candidate(s) and ${leastLoaded.assignedJobsCount} job(s)`,
    `Overdue SLA tasks: ${leastLoaded.overdueTasksCount}`,
  ];

  if (currentAssignment) {
    const currentOwner = members.find((m) => m.id === currentAssignment.recruiterId);
    if (currentOwner && (currentOwner.workloadStatus === "OVERLOADED" || currentOwner.workloadStatus === "CRITICAL")) {
      evidence.push(
        `Current owner ${currentOwner.name} is ${currentOwner.workloadStatus} (workload score ${currentOwner.workloadScore}/100)`
      );
    }
  }

  return {
    candidateId,
    candidateName: candidate.name,
    jobId: targetJob?.id || null,
    jobTitle: targetJob?.title || null,
    recommendedRecruiterId: leastLoaded.id,
    recommendedRecruiterName: leastLoaded.name,
    recommendedRecruiterEmail: leastLoaded.email,
    strategy,
    confidence: leastLoaded.workloadStatus === "NORMAL" ? "HIGH" : "MEDIUM",
    reasonSummary: `Recommended ${leastLoaded.name} to balance team capacity. They have the lowest current operational load (${leastLoaded.workloadScore}/100, ${leastLoaded.pendingReviewsCount} pending review(s)).`,
    evidence,
    candidateCurrentWorkload: leastLoaded.assignedCandidatesCount,
    currentOwnerName: currentAssignment?.recruiter.name || null,
  };
}
