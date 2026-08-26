/**
 * NextHire Phase 13 — Defensible Recruiter Productivity & SLA Adherence
 * Computes evidence-backed recruiting productivity metrics with sample size disclosures.
 * Never ranks recruiters on raw numbers alone; enforces sufficient data thresholds.
 */

import { prisma } from "@/lib/prisma";
import { TeamProductivityMetrics } from "./types";

/**
 * Calculate evidence-based productivity metrics for team recruiters.
 */
export async function getTeamProductivity(
  companyId: string,
  recruiterId?: string
): Promise<TeamProductivityMetrics[]> {
  const recruiters = await prisma.user.findMany({
    where: {
      companyId,
      role: "RECRUITER",
      ...(recruiterId ? { id: recruiterId } : {}),
    },
    select: { id: true, name: true },
  });

  const metricsList: TeamProductivityMetrics[] = [];

  for (const r of recruiters) {
    // 1. Applications reviewed by this recruiter (via application events or audit events)
    const reviewEvents = await prisma.applicationEvent.findMany({
      where: {
        actorId: r.id,
        application: { job: { companyId } },
        type: { in: ["STATUS_CHANGED", "NOTE_ADDED"] },
      },
      include: {
        application: true,
      },
    });

    const applicationsReviewed = reviewEvents.length;

    // 2. Candidates progressed (moved to INTERVIEW, OFFER, etc.)
    const progressedEvents = reviewEvents.filter(
      (e) =>
        e.notes?.includes("INTERVIEW") ||
        e.notes?.includes("OFFER") ||
        e.notes?.includes("SHORTLISTED")
    );
    const candidatesProgressed = progressedEvents.length;

    // 3. Interviews completed & Scorecards completed
    const scorecards = await prisma.interviewScorecard.findMany({
      where: {
        interviewerId: r.id,
        companyId,
        isComplete: true,
      },
    });
    const scorecardsCompleted = scorecards.length;
    const interviewsCompleted = scorecards.length;

    // 4. Outreach completed
    const outreachCampaigns = await prisma.outreachCampaign.findMany({
      where: {
        recruiterId: r.id,
        companyId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
    });
    const outreachCompleted = outreachCampaigns.length;

    // 5. Tasks completed
    const tasksCompleted = await prisma.hiringTask.count({
      where: {
        assigneeId: r.id,
        companyId,
        status: "COMPLETED",
      },
    });

    // 6. Review time and SLA adherence
    const reviewTimes: number[] = [];
    let onTimeReviews = 0;
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { slaDays: true } });
    const slaMs = (company?.slaDays || 7) * 24 * 60 * 60 * 1000;

    for (const ev of reviewEvents) {
      const appAppliedAt = new Date(ev.application.appliedAt).getTime();
      const eventTime = new Date(ev.timestamp).getTime();
      const diffHours = Math.max(0, (eventTime - appAppliedAt) / (1000 * 60 * 60));
      reviewTimes.push(diffHours);
      if (eventTime - appAppliedAt <= slaMs) {
        onTimeReviews++;
      }
    }

    const avgReviewTimeHours = reviewTimes.length > 0
      ? Math.round((reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length) * 10) / 10
      : null;

    const slaAdherenceRate = reviewEvents.length > 0
      ? Math.round((onTimeReviews / reviewEvents.length) * 100)
      : null;

    // 7. Handoff time
    const acceptedHandoffs = await prisma.recruiterHandoff.findMany({
      where: {
        toRecruiterId: r.id,
        companyId,
        status: "ACCEPTED",
        acceptedAt: { not: null },
      },
    });

    const handoffTimes: number[] = acceptedHandoffs.map((h) => {
      const created = new Date(h.createdAt).getTime();
      const accepted = new Date(h.acceptedAt!).getTime();
      return Math.max(0, (accepted - created) / (1000 * 60 * 60));
    });

    const avgHandoffTimeHours = handoffTimes.length > 0
      ? Math.round((handoffTimes.reduce((a, b) => a + b, 0) / handoffTimes.length) * 10) / 10
      : null;

    const sampleSize = applicationsReviewed + scorecardsCompleted + outreachCompleted + tasksCompleted;
    const isSufficientData = sampleSize >= 5;

    let contextualNote = "";
    if (!isSufficientData) {
      contextualNote = `Insufficient historical operational actions (sample size: ${sampleSize}).`;
    } else {
      contextualNote = `Recorded ${applicationsReviewed} application reviews and ${scorecardsCompleted} completed scorecards with ${slaAdherenceRate !== null ? slaAdherenceRate : 100}% SLA adherence.`;
    }

    metricsList.push({
      recruiterId: r.id,
      recruiterName: r.name,
      applicationsReviewed,
      candidatesProgressed,
      interviewsCompleted,
      scorecardsCompleted,
      outreachCompleted,
      tasksCompleted,
      avgReviewTimeHours,
      avgHandoffTimeHours,
      slaAdherenceRate,
      sampleSize,
      isSufficientData,
      contextualNote,
    });
  }

  return metricsList;
}
