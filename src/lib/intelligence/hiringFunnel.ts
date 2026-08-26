/**
 * NextHire Phase 11 — Hiring Funnel Calculation & Health Engine
 * Server-side engine for calculating funnel metrics, stage transitions, and deterministic health scores.
 */

import { prisma } from "@/lib/prisma";
import {
  FunnelStageName,
  JobFunnelMetrics,
  StageMetric,
  FunnelHealthScore,
  FunnelHealthSignal,
  GroundedEvidenceItem,
  HealthStatus,
} from "./types";

function calculateMedian(numbers: number[]): number | null {
  if (!numbers.length) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateAverage(numbers: number[]): number | null {
  if (!numbers.length) return null;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / numbers.length) * 10) / 10;
}

/**
 * Calculates complete funnel metrics and health score for a specific job.
 * Scoped strictly by companyId.
 */
export async function calculateJobFunnel(jobId: string, companyId: string): Promise<JobFunnelMetrics | null> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    include: {
      company: true,
      applications: {
        include: {
          applicant: {
            include: {
              assessmentSubmissions: true,
            },
          },
          events: {
            orderBy: { timestamp: "asc" },
          },
          interviews: {
            include: {
              scorecards: true,
            },
          },
          offer: true,
          rejection: true,
          assessmentInvitations: true,
        },
      },
    },
  });

  if (!job) {
    return null;
  }

  const applications = job.applications;
  const totalApplications = applications.length;

  // Track counts per stage
  let countSubmitted = 0;
  let countReviewing = 0;
  let countShortlisted = 0;
  let countAssessment = 0;
  let countInterview = 0;
  let countOffer = 0;
  let countHired = 0;
  let countRejected = 0;
  let countWithdrawn = 0;

  let qualifiedCount = 0;

  const timeToFirstReviewList: number[] = [];
  const timeToShortlistList: number[] = [];
  const timeToInterviewList: number[] = [];
  const timeToOfferList: number[] = [];
  const timeToHireList: number[] = [];

  const now = Date.now();
  const slaDays = job.company?.slaDays || 7;
  const slaMs = slaDays * 24 * 60 * 60 * 1000;

  let overdueApplicationsCount = 0;
  let incompleteScorecardsCount = 0;

  for (const app of applications) {
    const appliedTime = new Date(app.appliedAt).getTime();
    const updatedTime = new Date(app.updatedAt).getTime();
    const status = app.status;

    // Check candidate quality
    const hasHighAssessment = app.applicant?.assessmentSubmissions?.some((s) => (s.overallScore || 0) >= 75);
    if (app.matchScore >= 75 || hasHighAssessment) {
      qualifiedCount++;
    }

    // Check SLA breach
    if ((status === "SUBMITTED" || status === "UNDER_REVIEW") && now - appliedTime > slaMs) {
      overdueApplicationsCount++;
    }

    // Check interview scorecards for completed rounds
    for (const interview of app.interviews) {
      const isCompleted = interview.status === "PASSED" || interview.status === "FAILED";
      if (isCompleted && (!interview.scorecards.length || interview.scorecards.some((s) => !s.isComplete))) {
        incompleteScorecardsCount++;
      }
    }

    // Classify current stage
    const isHired = status === "OFFER_EXTENDED" && app.offer?.status === "ACCEPTED";
    const isOfferPending = status === "OFFER_EXTENDED" && app.offer?.status === "PENDING";
    const isOfferDeclined = app.offer?.status === "DECLINED";

    switch (status) {
      case "SUBMITTED":
        countSubmitted++;
        break;
      case "UNDER_REVIEW":
        countReviewing++;
        break;
      case "INTERVIEW_SCHEDULED":
      case "INTERVIEW_ROUND_1":
      case "INTERVIEW_ROUND_2":
      case "INTERVIEW_ROUND_3":
      case "FINAL_DECISION":
        countInterview++;
        break;
      case "OFFER_EXTENDED":
        if (isHired) {
          countHired++;
        } else {
          countOffer++;
        }
        break;
      case "REJECTED":
        countRejected++;
        break;
      case "APPLICATION_CLOSED":
        countWithdrawn++;
        break;
      default:
        countSubmitted++;
        break;
    }

    if (isOfferDeclined) {
      countRejected++;
    }

    // Time calculations using application events
    const firstReviewEvent = app.events.find((e) => e.type === "STATUS_CHANGED" && (e.notes?.includes("UNDER_REVIEW") || e.notes?.includes("REVIEWING")));
    if (firstReviewEvent) {
      timeToFirstReviewList.push((new Date(firstReviewEvent.timestamp).getTime() - appliedTime) / (1000 * 60 * 60));
    }

    const shortlistEvent = app.events.find((e) => e.type === "STATUS_CHANGED" && (e.notes?.includes("SHORTLIST") || e.notes?.includes("UNDER_REVIEW")));
    if (shortlistEvent) {
      timeToShortlistList.push((new Date(shortlistEvent.timestamp).getTime() - appliedTime) / (1000 * 60 * 60));
    }

    if (app.interviews.length > 0) {
      const firstInterview = app.interviews[0];
      timeToInterviewList.push((new Date(firstInterview.scheduledAt).getTime() - appliedTime) / (1000 * 60 * 60));
    }

    if (app.offer) {
      timeToOfferList.push((new Date(app.offer.expiryDate).getTime() - appliedTime) / (1000 * 60 * 60));
    }

    if (isHired) {
      timeToHireList.push((updatedTime - appliedTime) / (1000 * 60 * 60));
    }
  }

  // Calculate stage-by-stage entrants and exits
  // Funnel progression flow:
  // 1. APPLICATION (Total entrants = totalApplications)
  // 2. REVIEWING (Entrants = reviewing + shortlisted + assessment + interview + offer + hired)
  // 3. SHORTLISTED (Entrants = shortlisted + assessment + interview + offer + hired)
  // 4. INTERVIEW / ASSESSMENT (Entrants = assessment + interview + offer + hired)
  // 5. OFFER (Entrants = offer + hired)
  // 6. HIRED (Entrants = hired)

  const entrantsApplication = totalApplications;
  const entrantsReviewing = countReviewing + countShortlisted + countAssessment + countInterview + countOffer + countHired;
  const entrantsShortlisted = countShortlisted + countAssessment + countInterview + countOffer + countHired;
  const entrantsInterview = countAssessment + countInterview + countOffer + countHired;
  const entrantsOffer = countOffer + countHired;
  const entrantsHired = countHired;

  const stages: StageMetric[] = [
    {
      stage: "APPLICATION",
      entrants: entrantsApplication,
      exits: entrantsApplication - entrantsReviewing,
      activeCount: countSubmitted,
      conversionRate: entrantsApplication > 0 ? Math.round((entrantsReviewing / entrantsApplication) * 100) : null,
      dropOffRate: entrantsApplication > 0 ? Math.round(((entrantsApplication - entrantsReviewing) / entrantsApplication) * 100) : null,
      medianTimeHours: calculateMedian(timeToFirstReviewList),
      avgTimeHours: calculateAverage(timeToFirstReviewList),
    },
    {
      stage: "REVIEWING",
      entrants: entrantsReviewing,
      exits: entrantsReviewing - entrantsShortlisted,
      activeCount: countReviewing,
      conversionRate: entrantsReviewing > 0 ? Math.round((entrantsShortlisted / entrantsReviewing) * 100) : null,
      dropOffRate: entrantsReviewing > 0 ? Math.round(((entrantsReviewing - entrantsShortlisted) / entrantsReviewing) * 100) : null,
      medianTimeHours: calculateMedian(timeToShortlistList),
      avgTimeHours: calculateAverage(timeToShortlistList),
    },
    {
      stage: "SHORTLISTED",
      entrants: entrantsShortlisted,
      exits: entrantsShortlisted - entrantsInterview,
      activeCount: countShortlisted,
      conversionRate: entrantsShortlisted > 0 ? Math.round((entrantsInterview / entrantsShortlisted) * 100) : null,
      dropOffRate: entrantsShortlisted > 0 ? Math.round(((entrantsShortlisted - entrantsInterview) / entrantsShortlisted) * 100) : null,
      medianTimeHours: calculateMedian(timeToInterviewList),
      avgTimeHours: calculateAverage(timeToInterviewList),
    },
    {
      stage: "ASSESSMENT",
      entrants: countAssessment + countInterview + countOffer + countHired,
      exits: 0,
      activeCount: countAssessment,
      conversionRate: (countAssessment + countInterview + countOffer + countHired) > 0 ? 100 : null,
      dropOffRate: 0,
      medianTimeHours: null,
      avgTimeHours: null,
    },
    {
      stage: "INTERVIEW",
      entrants: entrantsInterview,
      exits: entrantsInterview - entrantsOffer,
      activeCount: countInterview,
      conversionRate: entrantsInterview > 0 ? Math.round((entrantsOffer / entrantsInterview) * 100) : null,
      dropOffRate: entrantsInterview > 0 ? Math.round(((entrantsInterview - entrantsOffer) / entrantsInterview) * 100) : null,
      medianTimeHours: calculateMedian(timeToOfferList),
      avgTimeHours: calculateAverage(timeToOfferList),
    },
    {
      stage: "OFFER",
      entrants: entrantsOffer,
      exits: entrantsOffer - entrantsHired,
      activeCount: countOffer,
      conversionRate: entrantsOffer > 0 ? Math.round((entrantsHired / entrantsOffer) * 100) : null,
      dropOffRate: entrantsOffer > 0 ? Math.round(((entrantsOffer - entrantsHired) / entrantsOffer) * 100) : null,
      medianTimeHours: calculateMedian(timeToHireList),
      avgTimeHours: calculateAverage(timeToHireList),
    },
    {
      stage: "HIRED",
      entrants: entrantsHired,
      exits: 0,
      activeCount: countHired,
      conversionRate: 100,
      dropOffRate: 0,
      medianTimeHours: null,
      avgTimeHours: null,
    },
  ];

  // ---------------------------------------------------------------------------
  // DETERMINISTIC HEALTH SCORE CALCULATION
  // ---------------------------------------------------------------------------
  let healthScore = 100;
  const signals: FunnelHealthSignal[] = [];
  const evidence: GroundedEvidenceItem[] = [];

  evidence.push({
    key: "total_applications",
    label: "Total Applications",
    value: totalApplications,
    source: "PostgreSQL Application Table",
  });

  evidence.push({
    key: "qualified_candidates",
    label: "Qualified Candidates",
    value: qualifiedCount,
    source: "PostgreSQL Application & Assessment Records",
  });

  // Signal 1: Overdue Application Backlog
  if (overdueApplicationsCount > 0) {
    const penalty = Math.min(30, overdueApplicationsCount * 5);
    healthScore -= penalty;
    signals.push({
      id: "sig_overdue_apps",
      type: overdueApplicationsCount >= 5 ? "CRITICAL" : "WARNING",
      title: "Overdue Application Review SLA",
      description: `${overdueApplicationsCount} applications have exceeded the ${slaDays}-day initial review SLA.`,
      metric: "Overdue Applications",
      threshold: `> 0 (SLA: ${slaDays} days)`,
      observedValue: overdueApplicationsCount,
    });
    evidence.push({
      key: "overdue_apps",
      label: "Applications Exceeding SLA",
      value: overdueApplicationsCount,
      source: "PostgreSQL Application appliedAt SLA Check",
    });
  }

  // Signal 2: Incomplete Interview Scorecards
  if (incompleteScorecardsCount > 0) {
    const penalty = Math.min(25, incompleteScorecardsCount * 8);
    healthScore -= penalty;
    signals.push({
      id: "sig_scorecards_missing",
      type: "WARNING",
      title: "Incomplete Interview Scorecards",
      description: `${incompleteScorecardsCount} completed interviews are awaiting structured scorecards from interviewers.`,
      metric: "Incomplete Scorecards",
      threshold: "= 0",
      observedValue: incompleteScorecardsCount,
    });
    evidence.push({
      key: "missing_scorecards",
      label: "Incomplete Scorecards",
      value: incompleteScorecardsCount,
      source: "PostgreSQL InterviewScorecard Table",
    });
  }

  // Signal 3: Low Qualified Candidate Supply
  const qualifiedRate = totalApplications > 0 ? Math.round((qualifiedCount / totalApplications) * 100) : null;
  if (totalApplications >= 10 && qualifiedRate !== null && qualifiedRate < 20) {
    healthScore -= 15;
    signals.push({
      id: "sig_low_qualified_supply",
      type: "WARNING",
      title: "Low Qualified Candidate Ratio",
      description: `Only ${qualifiedRate}% of applicants meet core competency thresholds (${qualifiedCount}/${totalApplications}).`,
      metric: "Qualified Applicant Rate",
      threshold: ">= 20%",
      observedValue: `${qualifiedRate}%`,
    });
  }

  // Signal 4: High Withdrawal Rate
  const withdrawalRate = totalApplications > 0 ? Math.round((countWithdrawn / totalApplications) * 100) : null;
  if (countWithdrawn >= 3 && withdrawalRate !== null && withdrawalRate > 15) {
    healthScore -= 15;
    signals.push({
      id: "sig_high_withdrawal",
      type: "WARNING",
      title: "Elevated Candidate Withdrawal Rate",
      description: `${countWithdrawn} candidates (${withdrawalRate}%) withdrew from the process before offer decision.`,
      metric: "Withdrawal Rate",
      threshold: "<= 15%",
      observedValue: `${withdrawalRate}%`,
    });
    evidence.push({
      key: "withdrawn_count",
      label: "Candidate Withdrawals",
      value: countWithdrawn,
      source: "PostgreSQL Application status WITHDRAWN",
    });
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  let healthStatus: HealthStatus = "HEALTHY";
  if (healthScore < 40) healthStatus = "CRITICAL";
  else if (healthScore < 65) healthStatus = "AT_RISK";
  else if (healthScore < 85) healthStatus = "WATCH";

  const calculationSummary = `Funnel health evaluated at ${healthScore}/100 (${healthStatus}) with ${signals.length} active signal(s) grounded across ${totalApplications} PostgreSQL application records.`;

  const health: FunnelHealthScore = {
    score: healthScore,
    status: healthStatus,
    signals,
    evidence,
    calculationSummary,
  };

  const activeApplications = totalApplications - countRejected - countWithdrawn - countHired;

  return {
    jobId: job.id,
    jobTitle: job.title,
    totalApplications,
    activeApplications,
    stages,
    qualifiedCount,
    qualifiedRate,
    timeToFirstReviewHours: calculateMedian(timeToFirstReviewList),
    timeToShortlistHours: calculateMedian(timeToShortlistList),
    timeToInterviewHours: calculateMedian(timeToInterviewList),
    timeToOfferHours: calculateMedian(timeToOfferList),
    timeToHireHours: calculateMedian(timeToHireList),
    overallConversionRate: totalApplications > 0 ? Math.round((countHired / totalApplications) * 100) : null,
    rejectionRate: totalApplications > 0 ? Math.round((countRejected / totalApplications) * 100) : null,
    withdrawalRate,
    offerAcceptanceRate: countOffer + countHired > 0 ? Math.round((countHired / (countOffer + countHired)) * 100) : null,
    health,
  };
}

/**
 * Aggregates company-wide funnel summary across all active jobs.
 */
export async function calculateCompanyFunnelSummary(companyId: string) {
  const jobs = await prisma.job.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true, title: true },
  });

  const jobFunnelPromises = jobs.map((j) => calculateJobFunnel(j.id, companyId));
  const results = await Promise.all(jobFunnelPromises);
  const validFunnels = results.filter((f): f is JobFunnelMetrics => f !== null);

  const totalApplications = validFunnels.reduce((acc, f) => acc + f.totalApplications, 0);
  const totalActive = validFunnels.reduce((acc, f) => acc + f.activeApplications, 0);
  const totalQualified = validFunnels.reduce((acc, f) => acc + f.qualifiedCount, 0);

  const healthScores = validFunnels.map((f) => f.health.score);
  const averageHealthScore = healthScores.length ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) : 100;

  let overallHealth: HealthStatus = "HEALTHY";
  if (averageHealthScore < 40) overallHealth = "CRITICAL";
  else if (averageHealthScore < 65) overallHealth = "AT_RISK";
  else if (averageHealthScore < 85) overallHealth = "WATCH";

  return {
    companyId,
    activeJobsCount: jobs.length,
    totalApplications,
    totalActive,
    totalQualified,
    averageHealthScore,
    overallHealth,
    jobFunnels: validFunnels,
  };
}
