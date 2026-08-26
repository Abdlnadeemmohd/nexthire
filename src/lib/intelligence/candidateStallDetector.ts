/**
 * NextHire Phase 11 — Candidate Stall Detection Engine
 * Identifies candidates who have stopped progressing across active hiring pipelines.
 */

import { prisma } from "@/lib/prisma";
import { StalledCandidate, PriorityLevel } from "./types";

/**
 * Discovers stalled candidates across a company or a specific job.
 */
export async function detectStalledCandidates(
  companyId: string,
  jobId?: string
): Promise<StalledCandidate[]> {
  const whereClause: any = {
    job: {
      companyId,
      status: "ACTIVE",
    },
    status: {
      notIn: ["REJECTED", "APPLICATION_CLOSED"],
    },
  };

  if (jobId) {
    whereClause.jobId = jobId;
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              slaDays: true,
            },
          },
        },
      },
      interviews: {
        orderBy: { scheduledAt: "desc" },
        take: 1,
        include: { scorecards: true },
      },
      offer: true,
      assessmentInvitations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const now = Date.now();
  const stalled: StalledCandidate[] = [];

  for (const app of applications) {
    if (app.status === "OFFER_EXTENDED" && app.offer?.status === "ACCEPTED") {
      continue;
    }

    const lastActivityTime = new Date(app.updatedAt).getTime();
    const daysInStage = Math.max(1, Math.round((now - lastActivityTime) / (1000 * 60 * 60 * 24)));
    const slaDays = app.job.company?.slaDays || 7;

    let thresholdDays = 7;
    let riskLevel: PriorityLevel = "LOW";
    let isStalled = false;
    let recommendedAction = "";

    switch (app.status) {
      case "SUBMITTED":
        thresholdDays = slaDays;
        if (daysInStage > thresholdDays) {
          isStalled = true;
          riskLevel = daysInStage >= thresholdDays * 2 ? "CRITICAL" : "HIGH";
          recommendedAction = `Review application (${app.applicant.name}) and either advance or log initial screening.`;
        }
        break;

      case "UNDER_REVIEW":
        thresholdDays = 5;
        if (daysInStage > thresholdDays) {
          isStalled = true;
          riskLevel = daysInStage >= 10 ? "HIGH" : "MEDIUM";
          recommendedAction = `Complete review evaluation and advance ${app.applicant.name} or schedule interview.`;
        }
        break;

      case "INTERVIEW_SCHEDULED":
      case "INTERVIEW_ROUND_1":
      case "INTERVIEW_ROUND_2":
      case "INTERVIEW_ROUND_3":
      case "FINAL_DECISION":
        thresholdDays = 5;
        const lastInterview = app.interviews[0];
        const isInterviewDone = lastInterview && (lastInterview.status === "PASSED" || lastInterview.status === "FAILED" || new Date(lastInterview.scheduledAt).getTime() < now);
        if (lastInterview && isInterviewDone) {
          const hasScorecard = lastInterview.scorecards.some((s) => s.isComplete);
          if (!hasScorecard && daysInStage >= 1) {
            isStalled = true;
            riskLevel = "HIGH";
            recommendedAction = `Collect missing interview scorecard for ${app.applicant.name} to unblock next round decision.`;
          }
        } else if (daysInStage > thresholdDays) {
          isStalled = true;
          riskLevel = daysInStage >= 10 ? "HIGH" : "MEDIUM";
          recommendedAction = `Update interview status or schedule next round for ${app.applicant.name}.`;
        }
        break;

      case "OFFER_EXTENDED":
        thresholdDays = 4;
        if (daysInStage > thresholdDays && app.offer?.status === "PENDING") {
          isStalled = true;
          riskLevel = "HIGH";
          recommendedAction = `Follow up directly on active offer letter with ${app.applicant.name}.`;
        }
        break;
    }

    if (isStalled) {
      stalled.push({
        applicationId: app.id,
        candidateId: app.applicant.id,
        candidateName: app.applicant.name,
        candidateEmail: app.applicant.email,
        jobId: app.job.id,
        jobTitle: app.job.title,
        currentStage: app.status,
        daysInStage,
        expectedThresholdDays: thresholdDays,
        riskLevel,
        lastActivityAt: app.updatedAt,
        matchScore: app.matchScore,
        recommendedAction,
      });
    }
  }

  // Sort by risk priority (CRITICAL -> HIGH -> MEDIUM -> LOW) and days in stage
  const priorityMap: Record<PriorityLevel, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return stalled.sort((a, b) => {
    const pDiff = priorityMap[a.riskLevel] - priorityMap[b.riskLevel];
    if (pDiff !== 0) return pDiff;
    return b.daysInStage - a.daysInStage;
  });
}
