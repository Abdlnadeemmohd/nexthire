import { prisma } from "@/lib/prisma";
import { InternalBenchmarkItem } from "./types";

export async function computeInternalBenchmarks(companyId: string): Promise<InternalBenchmarkItem[]> {
  const benchmarks: InternalBenchmarkItem[] = [];

  // Fetch closed jobs for historical baseline comparison
  const closedJobs = await prisma.job.findMany({
    where: { companyId, status: { in: ["CLOSED", "PAUSED"] } },
  });

  const closedApps = await prisma.application.findMany({
    where: {
      job: { companyId, status: { in: ["CLOSED", "PAUSED"] } },
    },
  });

  const currentApps = await prisma.application.findMany({
    where: {
      job: { companyId, status: "ACTIVE" },
    },
  });

  const sampleSize = closedJobs.length;
  const isSufficient = sampleSize >= 3;

  // 1. Time to Fill Benchmark
  let currentAvgTimeToFill: number | null = null;
  let historicalMedianTimeToFill: number | null = null;

  if (isSufficient) {
    const fillDurations = closedJobs.map((j) => {
      const start = new Date(j.createdAt).getTime();
      const end = new Date(j.updatedAt).getTime();
      return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }).sort((a, b) => a - b);

    const mid = Math.floor(fillDurations.length / 2);
    historicalMedianTimeToFill = fillDurations.length % 2 !== 0 ? fillDurations[mid] : Math.round((fillDurations[mid - 1] + fillDurations[mid]) / 2);
  }

  benchmarks.push({
    metricName: "Time to Fill (Days)",
    currentCompanyValue: currentAvgTimeToFill,
    companyHistoricalMedian: historicalMedianTimeToFill,
    sampleSize,
    isSufficientData: isSufficient,
    variancePercentage: null,
    explanation: isSufficient
      ? `Grounded against ${sampleSize} historical closed requisitions.`
      : `Sample size of ${sampleSize} closed job(s) is below the required baseline threshold of 3. Historical median is uncomputed.`,
  });

  // 2. Application to Interview Conversion Benchmark
  let historicalMedianConversion: number | null = null;
  if (isSufficient && closedApps.length > 0) {
    const hiredCount = closedApps.filter((a) => a.status === "OFFER_EXTENDED" || a.status === "FINAL_DECISION").length;
    historicalMedianConversion = Math.round((hiredCount / Math.max(1, closedApps.length)) * 100);
  }

  benchmarks.push({
    metricName: "Historical Conversion to Hire (%)",
    currentCompanyValue: currentApps.length > 0 ? Math.round((currentApps.filter((a) => a.status === "OFFER_EXTENDED" || a.status === "FINAL_DECISION").length / currentApps.length) * 100) : null,
    companyHistoricalMedian: historicalMedianConversion,
    sampleSize: closedApps.length,
    isSufficientData: isSufficient,
    variancePercentage: null,
    explanation: isSufficient
      ? `Grounded against ${closedApps.length} historical closed application records.`
      : `Insufficient historical closed application records to establish baseline median.`,
  });

  return benchmarks;
}
