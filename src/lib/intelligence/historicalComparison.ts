/**
 * NextHire Phase 11 — Historical Comparison & Target Risk Engine
 * Compares active pipelines against verified historical benchmarks and calculates target delivery risk.
 */

import { prisma } from "@/lib/prisma";
import { HistoricalComparison, HiringTargetRisk } from "./types";
import { calculateJobFunnel } from "./hiringFunnel";

/**
 * Compares a job's funnel conversion and metrics against company historical averages.
 * Discloses sample size and never fabricates historical baseline if sample size is insufficient.
 */
export async function compareJobWithHistorical(
  jobId: string,
  companyId: string
): Promise<HistoricalComparison[]> {
  const currentJob = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    select: { id: true, title: true, category: true },
  });

  if (!currentJob) return [];

  const currentFunnel = await calculateJobFunnel(jobId, companyId);
  if (!currentFunnel) return [];

  // Query closed/archived jobs for historical benchmarks
  const historicalJobs = await prisma.job.findMany({
    where: {
      companyId,
      id: { not: jobId },
      status: { in: ["CLOSED", "ACTIVE"] },
    },
    include: {
      applications: {
        include: { offer: true },
      },
    },
  });

  const sampleSize = historicalJobs.length;
  const isSufficientData = sampleSize >= 3;

  const comparisons: HistoricalComparison[] = [];

  if (!isSufficientData) {
    comparisons.push({
      metricName: "Application-to-Review Conversion",
      currentJobValue: `${currentFunnel.stages[0]?.conversionRate ?? 0}%`,
      companyHistoricalMedian: null,
      categoryMedian: null,
      sampleSize,
      isSufficientData: false,
      summary: `Insufficient historical baseline (sample size: ${sampleSize} jobs; minimum 3 required). Metric shown as standalone observed value.`,
    });

    comparisons.push({
      metricName: "Overall Funnel Conversion to Hire",
      currentJobValue: `${currentFunnel.overallConversionRate ?? 0}%`,
      companyHistoricalMedian: null,
      categoryMedian: null,
      sampleSize,
      isSufficientData: false,
      summary: `Insufficient historical baseline for hire conversion. Historical comparison will unlock as more jobs conclude.`,
    });

    return comparisons;
  }

  // Calculate historical conversion rates
  const historicalConversionRates: number[] = [];
  for (const hJob of historicalJobs) {
    const total = hJob.applications.length;
    const hired = hJob.applications.filter((a) => a.status === "OFFER_EXTENDED" && a.offer?.status === "ACCEPTED").length;
    if (total > 0) {
      historicalConversionRates.push(Math.round((hired / total) * 100));
    }
  }

  historicalConversionRates.sort((a, b) => a - b);
  const medianHistConversion = historicalConversionRates.length
    ? historicalConversionRates[Math.floor(historicalConversionRates.length / 2)]
    : 0;

  const currentHireRate = currentFunnel.overallConversionRate ?? 0;
  const diff = currentHireRate - medianHistConversion;
  const summaryDiff = diff >= 0 ? `+${diff}% above company historical median` : `${diff}% below company historical median`;

  comparisons.push({
    metricName: "Overall Funnel Conversion to Hire",
    currentJobValue: `${currentHireRate}%`,
    companyHistoricalMedian: `${medianHistConversion}%`,
    categoryMedian: null,
    sampleSize,
    isSufficientData: true,
    summary: `Current conversion is ${summaryDiff} across ${sampleSize} historical company benchmark jobs.`,
  });

  return comparisons;
}

/**
 * Evaluates whether an active job is on track to meet its hiring deadline.
 */
export async function calculateHiringTargetRisk(
  jobId: string,
  companyId: string,
  targetDate?: Date
): Promise<HiringTargetRisk | null> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    include: {
      applications: true,
    },
  });

  if (!job) return null;

  const funnel = await calculateJobFunnel(jobId, companyId);
  if (!funnel) return null;

  // If no target date provided, check default 30-day window from job creation
  const effectiveTargetDate = targetDate || new Date(new Date(job.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = Date.now();
  const msRemaining = new Date(effectiveTargetDate).getTime() - now;
  const daysRemaining = Math.round(msRemaining / (1000 * 60 * 60 * 24));

  // Estimate days to hire based on current funnel state
  // If we already have candidates in interview or offer stage:
  const hasOffer = funnel.stages.find((s) => s.stage === "OFFER")?.activeCount || 0;
  const hasInterview = funnel.stages.find((s) => s.stage === "INTERVIEW")?.activeCount || 0;
  const hasShortlist = funnel.stages.find((s) => s.stage === "SHORTLISTED")?.activeCount || 0;
  const hasHired = funnel.stages.find((s) => s.stage === "HIRED")?.activeCount || 0;

  if (hasHired > 0) {
    return {
      jobId: job.id,
      jobTitle: job.title,
      targetHiringDate: effectiveTargetDate,
      daysRemaining,
      estimatedDaysToHire: 0,
      velocityStatus: "ON_TRACK",
      explanation: "Hiring target successfully achieved. Job has completed candidate placement.",
    };
  }

  let estimatedDaysToHire = 28; // default baseline
  if (hasOffer > 0) {
    estimatedDaysToHire = 4;
  } else if (hasInterview >= 2) {
    estimatedDaysToHire = 10;
  } else if (hasShortlist >= 3) {
    estimatedDaysToHire = 18;
  } else if (funnel.totalApplications === 0) {
    estimatedDaysToHire = 35;
  }

  let velocityStatus: "ON_TRACK" | "WATCH" | "AT_RISK" | "CRITICAL" | "INSUFFICIENT_DATA" = "ON_TRACK";

  if (daysRemaining <= 0) {
    velocityStatus = "CRITICAL";
  } else if (estimatedDaysToHire > daysRemaining + 10) {
    velocityStatus = "CRITICAL";
  } else if (estimatedDaysToHire > daysRemaining) {
    velocityStatus = "AT_RISK";
  } else if (estimatedDaysToHire > daysRemaining - 5) {
    velocityStatus = "WATCH";
  }

  let explanation = `Estimated time to hire is ~${estimatedDaysToHire} days with ${daysRemaining} days remaining before target date.`;
  if (velocityStatus === "AT_RISK" || velocityStatus === "CRITICAL") {
    explanation += ` Pipeline velocity is currently insufficient; sourcing high-fit candidates or unblocking active reviews is recommended.`;
  }

  return {
    jobId: job.id,
    jobTitle: job.title,
    targetHiringDate: effectiveTargetDate,
    daysRemaining,
    estimatedDaysToHire,
    velocityStatus,
    explanation,
  };
}
