/**
 * NextHire Phase 11 — Recruiter Workload Intelligence Engine
 * Computes objective capacity, active pipelines, and operational load per recruiter.
 */

import { prisma } from "@/lib/prisma";
import { RecruiterWorkload, WorkloadStatus } from "./types";

/**
 * Calculates workload metrics for a specific recruiter within a company.
 */
export async function calculateRecruiterWorkload(
  recruiterId: string,
  companyId: string
): Promise<RecruiterWorkload | null> {
  const recruiter = await prisma.user.findFirst({
    where: {
      id: recruiterId,
      companyId,
      role: { in: ["RECRUITER", "COMPANY_ADMIN"] },
    },
  });

  if (!recruiter) return null;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  const jobs = await prisma.job.findMany({
    where: {
      companyId,
      recruiterId,
      status: "ACTIVE",
    },
    include: {
      applications: {
        where: {
          status: {
            notIn: ["REJECTED", "APPLICATION_CLOSED"],
          },
        },
        include: {
          interviews: {
            include: { scorecards: true },
          },
          offer: true,
        },
      },
      outreachCampaigns: {
        where: { status: "DRAFT" },
      },
    },
  });

  const now = Date.now();
  const slaDays = company?.slaDays || 7;
  const slaMs = slaDays * 24 * 60 * 60 * 1000;

  const activeJobsCount = jobs.length;

  let activeCandidatesCount = 0;
  let pendingReviewsCount = 0;
  let pendingScorecardsCount = 0;
  let upcomingInterviewsCount = 0;
  let overdueTasksCount = 0;

  for (const job of jobs) {
    for (const app of job.applications) {
      if (app.status === "OFFER_EXTENDED" && app.offer?.status === "ACCEPTED") {
        continue;
      }

      activeCandidatesCount++;

      // Pending initial review
      if (app.status === "SUBMITTED") {
        pendingReviewsCount++;
        if (now - new Date(app.appliedAt).getTime() > slaMs) {
          overdueTasksCount++;
        }
      }

      // Check interviews
      for (const interview of app.interviews) {
        const interviewTime = new Date(interview.scheduledAt).getTime();
        const isCompleted = interview.status === "PASSED" || interview.status === "FAILED";
        if (interview.status === "PENDING") {
          if (interviewTime > now) {
            upcomingInterviewsCount++;
          }
        } else if (isCompleted) {
          const hasScorecard = interview.scorecards.some((s: any) => s.isComplete);
          if (!hasScorecard && now - interviewTime > 24 * 60 * 60 * 1000) {
            pendingScorecardsCount++;
            overdueTasksCount++;
          }
        }
      }
    }
  }

  const pendingOutreachApprovalsCount = jobs.reduce(
    (acc: number, j: any) => acc + (j.outreachCampaigns?.length || 0),
    0
  );

  // Calculate weighted workload score (0 to 100)
  // Weights:
  // - activeJobs (3 pts each, max 30)
  // - pendingReviews (2 pts each, max 30)
  // - pendingScorecards (4 pts each, max 20)
  // - overdueTasks (5 pts each, max 20)
  const jobScore = Math.min(30, activeJobsCount * 3);
  const reviewScore = Math.min(30, pendingReviewsCount * 2);
  const scorecardScore = Math.min(20, pendingScorecardsCount * 4);
  const overdueScore = Math.min(20, overdueTasksCount * 5);

  const workloadScore = Math.min(100, jobScore + reviewScore + scorecardScore + overdueScore);

  let status: WorkloadStatus = "NORMAL";
  if (workloadScore >= 75 || overdueTasksCount >= 8) {
    status = "CRITICAL";
  } else if (workloadScore >= 55 || overdueTasksCount >= 4) {
    status = "OVERLOADED";
  } else if (workloadScore >= 35) {
    status = "BUSY";
  }

  const explanation = `${recruiter.name} currently manages ${activeJobsCount} active job(s) and ${activeCandidatesCount} candidate(s), with ${pendingReviewsCount} pending review(s) and ${overdueTasksCount} overdue SLA task(s).`;

  return {
    recruiterId: recruiter.id,
    recruiterName: recruiter.name,
    recruiterEmail: recruiter.email,
    activeJobsCount,
    activeCandidatesCount,
    pendingReviewsCount,
    pendingScorecardsCount,
    pendingOutreachApprovalsCount,
    upcomingInterviewsCount,
    overdueTasksCount,
    workloadScore,
    status,
    explanation,
  };
}

/**
 * Calculates workload distribution across all recruiters in a company.
 */
export async function calculateCompanyWorkloadDistribution(companyId: string) {
  const recruiters = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ["RECRUITER", "COMPANY_ADMIN"] },
    },
    select: { id: true },
  });

  const promises = recruiters.map((r) => calculateRecruiterWorkload(r.id, companyId));
  const results = await Promise.all(promises);
  const workloads = results.filter((w): w is RecruiterWorkload => w !== null);

  const distribution = {
    normal: workloads.filter((w) => w.status === "NORMAL").length,
    busy: workloads.filter((w) => w.status === "BUSY").length,
    overloaded: workloads.filter((w) => w.status === "OVERLOADED").length,
    critical: workloads.filter((w) => w.status === "CRITICAL").length,
  };

  return {
    companyId,
    totalRecruiters: workloads.length,
    distribution,
    workloads,
  };
}
