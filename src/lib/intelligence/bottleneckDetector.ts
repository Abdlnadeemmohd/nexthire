/**
 * NextHire Phase 11 — Deterministic Bottleneck Detection Engine
 * Discovers and classifies operational bottlenecks across hiring workflows.
 */

import { prisma } from "@/lib/prisma";
import { BottleneckItem, PriorityLevel } from "./types";

/**
 * Detects bottlenecks for a specific job within a company.
 */
export async function detectJobBottlenecks(jobId: string, companyId: string): Promise<BottleneckItem[]> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    include: {
      company: true,
      applications: {
        include: {
          applicant: true,
          interviews: {
            include: {
              scorecards: true,
            },
          },
          offer: true,
          assessmentInvitations: true,
        },
      },
      outreachCampaigns: {
        include: {
          recipients: true,
        },
      },
    },
  });

  if (!job) return [];

  const bottlenecks: BottleneckItem[] = [];
  const now = Date.now();
  const slaDays = job.company?.slaDays || 7;
  const slaMs = slaDays * 24 * 60 * 60 * 1000;

  // 1. APPLICATION_BACKLOG: New applications exceeding review SLA
  const unreviewedApps = job.applications.filter(
    (a) => a.status === "SUBMITTED" && now - new Date(a.appliedAt).getTime() > slaMs
  );

  if (unreviewedApps.length > 0) {
    const oldestMs = Math.max(...unreviewedApps.map((a) => now - new Date(a.appliedAt).getTime()));
    const oldestDays = Math.round(oldestMs / (1000 * 60 * 60 * 24));
    const severity: PriorityLevel = unreviewedApps.length >= 8 || oldestDays >= 14 ? "CRITICAL" : "HIGH";

    bottlenecks.push({
      id: `bn_app_backlog_${job.id}`,
      type: "APPLICATION_BACKLOG",
      severity,
      jobId: job.id,
      jobTitle: job.title,
      affectedCount: unreviewedApps.length,
      oldestAgeDays: oldestDays,
      thresholdDays: slaDays,
      evidence: `${unreviewedApps.length} applications have remained in SUBMITTED state for over ${slaDays} days (oldest: ${oldestDays} days ago).`,
      recommendedAction: `Review and screen ${unreviewedApps.length} overdue applications to prevent candidate drop-off.`,
    });
  }

  // 2. SHORTLIST_BACKLOG: Reviewed candidates waiting for interview scheduling
  const shortlistedWaiting = job.applications.filter(
    (a) => a.status === "UNDER_REVIEW" && (!a.interviews || a.interviews.length === 0) && now - new Date(a.updatedAt).getTime() > 4 * 24 * 60 * 60 * 1000
  );

  if (shortlistedWaiting.length > 0) {
    const oldestMs = Math.max(...shortlistedWaiting.map((a) => now - new Date(a.updatedAt).getTime()));
    const oldestDays = Math.round(oldestMs / (1000 * 60 * 60 * 24));
    const severity: PriorityLevel = shortlistedWaiting.length >= 5 ? "HIGH" : "MEDIUM";

    bottlenecks.push({
      id: `bn_shortlist_backlog_${job.id}`,
      type: "SHORTLIST_BACKLOG",
      severity,
      jobId: job.id,
      jobTitle: job.title,
      affectedCount: shortlistedWaiting.length,
      oldestAgeDays: oldestDays,
      thresholdDays: 4,
      evidence: `${shortlistedWaiting.length} reviewed candidates have not been invited to an interview for > 4 days (oldest: ${oldestDays} days).`,
      recommendedAction: `Send interview invitations to ${shortlistedWaiting.length} reviewed candidates.`,
    });
  }

  // 3. SCORECARD_BACKLOG: Completed interviews missing scorecards
  let missingScorecardsCount = 0;
  let oldestScorecardMs = 0;

  for (const app of job.applications) {
    for (const interview of app.interviews) {
      const isPastOrFinished = interview.status === "PASSED" || interview.status === "FAILED" || new Date(interview.scheduledAt).getTime() < now;
      if (isPastOrFinished) {
        const hasCompleteScorecard = interview.scorecards?.some((s) => s.isComplete);
        if (!hasCompleteScorecard) {
          const age = now - new Date(interview.scheduledAt).getTime();
          if (age > 24 * 60 * 60 * 1000) {
            missingScorecardsCount++;
            if (age > oldestScorecardMs) oldestScorecardMs = age;
          }
        }
      }
    }
  }

  if (missingScorecardsCount > 0) {
    const oldestDays = Math.round(oldestScorecardMs / (1000 * 60 * 60 * 24));
    const severity: PriorityLevel = missingScorecardsCount >= 4 || oldestDays >= 3 ? "CRITICAL" : "HIGH";

    bottlenecks.push({
      id: `bn_scorecard_backlog_${job.id}`,
      type: "SCORECARD_BACKLOG",
      severity,
      jobId: job.id,
      jobTitle: job.title,
      affectedCount: missingScorecardsCount,
      oldestAgeDays: oldestDays,
      thresholdDays: 1,
      evidence: `${missingScorecardsCount} completed interviews are missing structured scorecards for > 24 hours (oldest: ${oldestDays} days).`,
      recommendedAction: `Prompt interview panel members to submit missing scorecards so hiring decisions can proceed.`,
    });
  }

  // 4. ASSESSMENT_BACKLOG: Pending assessment invitations exceeding deadline
  const overdueAssessments = job.applications.flatMap((a) =>
    a.assessmentInvitations.filter(
      (inv) => inv.status === "PENDING" && new Date(inv.deadline).getTime() < now
    )
  );

  if (overdueAssessments.length > 0) {
    bottlenecks.push({
      id: `bn_assessment_backlog_${job.id}`,
      type: "ASSESSMENT_BACKLOG",
      severity: "MEDIUM",
      jobId: job.id,
      jobTitle: job.title,
      affectedCount: overdueAssessments.length,
      oldestAgeDays: 7,
      thresholdDays: 7,
      evidence: `${overdueAssessments.length} candidate assessments have expired or passed deadline without submission.`,
      recommendedAction: `Review expired assessment invitations and decide whether to grant a deadline extension or follow up.`,
    });
  }

  // 5. OFFER_BACKLOG: Offers extended and awaiting candidate decision > 5 days
  const pendingOffers = job.applications.filter(
    (a) => a.offer && a.offer.status === "PENDING" && now - new Date(a.updatedAt).getTime() > 5 * 24 * 60 * 60 * 1000
  );

  if (pendingOffers.length > 0) {
    bottlenecks.push({
      id: `bn_offer_backlog_${job.id}`,
      type: "OFFER_BACKLOG",
      severity: "HIGH",
      jobId: job.id,
      jobTitle: job.title,
      affectedCount: pendingOffers.length,
      oldestAgeDays: 5,
      thresholdDays: 5,
      evidence: `${pendingOffers.length} candidate offers have been pending response for over 5 days.`,
      recommendedAction: `Follow up directly with candidate(s) to address questions and finalize offer decision.`,
    });
  }

  // 6. OUTREACH_BACKLOG: Campaigns in draft with uncontacted candidates
  const draftCampaigns = job.outreachCampaigns.filter((c) => c.status === "DRAFT");
  const pendingOutreachRecipients = draftCampaigns.reduce((acc, c) => acc + c.recipients.length, 0);

  if (draftCampaigns.length > 0 && pendingOutreachRecipients > 0) {
    bottlenecks.push({
      id: `bn_outreach_backlog_${job.id}`,
      type: "OUTREACH_BACKLOG",
      severity: "MEDIUM",
      jobId: job.id,
      jobTitle: job.title,
      affectedCount: pendingOutreachRecipients,
      oldestAgeDays: 2,
      thresholdDays: 2,
      evidence: `${draftCampaigns.length} outreach campaign(s) with ${pendingOutreachRecipients} candidate(s) are awaiting recruiter review and approval.`,
      recommendedAction: `Approve or edit draft outreach sequences in Outreach Studio to begin engagement.`,
    });
  }

  return bottlenecks;
}

/**
 * Discovers all company-wide bottlenecks across all active jobs.
 */
export async function detectCompanyBottlenecks(companyId: string): Promise<BottleneckItem[]> {
  const jobs = await prisma.job.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true },
  });

  const promises = jobs.map((j) => detectJobBottlenecks(j.id, companyId));
  const results = await Promise.all(promises);

  const allBottlenecks = results.flat();

  // Sort by severity (CRITICAL first, then HIGH, MEDIUM, LOW)
  const severityRank: Record<PriorityLevel, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return allBottlenecks.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
