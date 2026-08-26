import { prisma } from "@/lib/prisma";
import { ForecastResult, ExecutiveRiskLevel } from "./types";

export async function forecastHiringCompletion(
  companyId: string,
  targetHiresRemaining: number = 5,
  targetDate?: Date | string
): Promise<ForecastResult> {
  const windowDays = 180;
  const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  // Fetch past 180 days completed hires
  const pastHires = await prisma.application.findMany({
    where: {
      job: { companyId },
      status: { in: ["OFFER_EXTENDED", "FINAL_DECISION"] },
      updatedAt: { gte: cutoffDate },
    },
    select: { id: true, updatedAt: true },
  });

  const sampleSize = pastHires.length;
  const monthsInWindow = windowDays / 30; // 6 months
  const monthlyVelocity = Math.max(0.1, Number((sampleSize / monthsInWindow).toFixed(2)));

  let expectedCompletionDate: string | null = null;
  let riskScore = 50; // default medium risk
  let riskLevel: ExecutiveRiskLevel = "MEDIUM";
  let confidenceLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (sampleSize >= 15) {
    confidenceLevel = "HIGH";
  } else if (sampleSize >= 3) {
    confidenceLevel = "MEDIUM";
  } else {
    confidenceLevel = "LOW";
  }

  if (sampleSize === 0) {
    return {
      expectedCompletionDate: null,
      projectedOpenRequisitions: targetHiresRemaining,
      expectedHiringVelocityPerMonth: 0,
      riskOfMissingTargetScore: 90,
      targetBreachRiskLevel: "HIGH",
      confidenceLevel: "LOW",
      sampleSize: 0,
      historicalWindowDays: windowDays,
      assumptions: [
        "Historical placement data for the last 180 days is empty.",
        "Velocity cannot be calculated without past hire records.",
      ],
      dataLimitations: `Insufficient historical sample size (0 observed hires in past 180 days). Cannot generate a high-confidence completion date.`,
    };
  }

  const monthsRequired = targetHiresRemaining / monthlyVelocity;
  const daysRequired = Math.round(monthsRequired * 30);
  const projectedCompletion = new Date(Date.now() + daysRequired * 24 * 60 * 60 * 1000);
  expectedCompletionDate = projectedCompletion.toISOString().split("T")[0];

  // Evaluate against target date if provided
  if (targetDate) {
    const targetTime = new Date(targetDate).getTime();
    const projectedTime = projectedCompletion.getTime();
    if (projectedTime > targetTime) {
      const delayDays = Math.round((projectedTime - targetTime) / (1000 * 60 * 60 * 24));
      riskScore = Math.min(100, Math.round(50 + (delayDays / 30) * 25));
      riskLevel = riskScore >= 80 ? "CRITICAL" : riskScore >= 60 ? "HIGH" : "MEDIUM";
    } else {
      riskScore = Math.max(10, Math.round(30 - ((targetTime - projectedTime) / (1000 * 60 * 60 * 24))));
      riskLevel = "LOW";
    }
  } else {
    riskScore = Math.max(10, Math.min(90, Math.round(100 - (monthlyVelocity * 20))));
    riskLevel = riskScore >= 75 ? "HIGH" : riskScore >= 45 ? "MEDIUM" : "LOW";
  }

  const openJobsCount = await prisma.job.count({
    where: { companyId, status: "ACTIVE" },
  });

  return {
    expectedCompletionDate,
    projectedOpenRequisitions: openJobsCount,
    expectedHiringVelocityPerMonth: monthlyVelocity,
    riskOfMissingTargetScore: riskScore,
    targetBreachRiskLevel: riskLevel,
    confidenceLevel,
    sampleSize,
    historicalWindowDays: windowDays,
    assumptions: [
      `Velocity assumes current observed placement rate (${monthlyVelocity} hires/month) remains stable.`,
      `Projection is grounded on ${sampleSize} actual hire records over the last 180 days.`,
      `No synthetic industry trend factors or unverified external market velocity multipliers are applied.`,
    ],
    dataLimitations: sampleSize < 5
      ? `Sample size of ${sampleSize} placement(s) over 180 days produces a ${confidenceLevel}-confidence forecast.`
      : `Forecast based on ${sampleSize} historical hires across ${openJobsCount} active job requisitions.`,
  };
}
