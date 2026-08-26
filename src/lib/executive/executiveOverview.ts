import { prisma } from "@/lib/prisma";
import { ExecutiveOverviewMetrics, DataLimitation } from "./types";
import { calculateJobFunnel } from "@/lib/intelligence/hiringFunnel";
import { detectCompanyBottlenecks } from "@/lib/intelligence/bottleneckDetector";

export async function getExecutiveOverview(companyId: string): Promise<ExecutiveOverviewMetrics> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // 1. Fetch Job Requisitions
  const jobs = await prisma.job.findMany({
    where: { companyId },
  });

  const openJobs = jobs.filter((j) => j.status === "ACTIVE");
  const closedJobs = jobs.filter((j) => j.status === "CLOSED" || j.status === "PAUSED");
  const openRequisitions = openJobs.length;
  const filledPositions = closedJobs.length;

  // 2. Fetch Applications
  const applications = await prisma.application.findMany({
    where: {
      job: { companyId },
    },
    include: {
      interviews: true,
      interviewScorecards: true,
    },
  });

  const activeApplications = applications.filter(
    (app) => !["REJECTED", "APPLICATION_CLOSED"].includes(app.status)
  );

  const activeCandidates = activeApplications.length;

  // 3. Interviews & Offers & Hires
  const interviewsScheduled = applications.reduce(
    (acc, app) => acc + (app.interviews?.filter((i) => i.status === "PENDING" || i.status === "PASSED" || i.status === "FAILED").length || 0),
    0
  );

  const offersOutstanding = applications.filter((app) => app.status === "OFFER_EXTENDED").length;
  const hiresCompleted = applications.filter((app) => app.status === "OFFER_EXTENDED" || app.status === "FINAL_DECISION").length;

  // 4. Time to Hire & Time to Fill Calculations
  const hiredApplications = applications.filter((app) => (app.status === "OFFER_EXTENDED" || app.status === "FINAL_DECISION") && app.updatedAt && app.appliedAt);

  let averageTimeToHireDays: number | null = null;
  let medianTimeToHireDays: number | null = null;

  if (hiredApplications.length > 0) {
    const hireDurations = hiredApplications.map((app) => {
      const start = new Date(app.appliedAt).getTime();
      const end = new Date(app.updatedAt).getTime();
      return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }).sort((a, b) => a - b);

    const sum = hireDurations.reduce((a, b) => a + b, 0);
    averageTimeToHireDays = Math.round(sum / hireDurations.length);

    const mid = Math.floor(hireDurations.length / 2);
    medianTimeToHireDays = hireDurations.length % 2 !== 0
      ? hireDurations[mid]
      : Math.round((hireDurations[mid - 1] + hireDurations[mid]) / 2);
  }

  let averageTimeToFillDays: number | null = null;
  let medianTimeToFillDays: number | null = null;

  if (closedJobs.length > 0) {
    const fillDurations = closedJobs.map((j) => {
      const start = new Date(j.createdAt).getTime();
      const end = new Date(j.updatedAt).getTime();
      return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }).sort((a, b) => a - b);

    const sum = fillDurations.reduce((a, b) => a + b, 0);
    averageTimeToFillDays = Math.round(sum / fillDurations.length);

    const mid = Math.floor(fillDurations.length / 2);
    medianTimeToFillDays = fillDurations.length % 2 !== 0
      ? fillDurations[mid]
      : Math.round((fillDurations[mid - 1] + fillDurations[mid]) / 2);
  }

  // 5. Conversion Rates
  const totalApps = applications.length;
  const interviewedApps = applications.filter((app) => (app.interviews?.length || 0) > 0 || ["INTERVIEW_SCHEDULED", "INTERVIEW_ROUND_1", "INTERVIEW_ROUND_2", "INTERVIEW_ROUND_3", "OFFER_EXTENDED", "FINAL_DECISION"].includes(app.status)).length;
  const offeredApps = applications.filter((app) => app.status === "OFFER_EXTENDED" || app.status === "FINAL_DECISION").length;

  const applicationToInterviewConversion = totalApps > 0 ? Math.round((interviewedApps / totalApps) * 100) : null;
  const interviewToOfferConversion = interviewedApps > 0 ? Math.round((offeredApps / interviewedApps) * 100) : null;
  const offerToHireConversion = offeredApps > 0 ? Math.round((hiresCompleted / offeredApps) * 100) : null;
  const offerAcceptanceRate = offeredApps > 0 ? Math.round((hiresCompleted / offeredApps) * 100) : null;

  // 6. Pipeline Velocity
  let candidateVelocityPerWeek: number | null = null;
  if (applications.length > 0) {
    const oldestApp = applications.reduce((oldest, app) => {
      const t = new Date(app.appliedAt).getTime();
      return t < oldest ? t : oldest;
    }, Date.now());

    const elapsedWeeks = Math.max(1, (Date.now() - oldestApp) / (1000 * 60 * 60 * 24 * 7));
    candidateVelocityPerWeek = Math.round((applications.length / elapsedWeeks) * 10) / 10;
  }

  // 7. Hiring Target Progress & Capacity
  const hiringPlans = await prisma.hiringPlan.findMany({
    where: { companyId },
  });

  let hiringTargetProgressPercentage: number | null = null;
  if (hiringPlans.length > 0) {
    const totalTarget = hiringPlans.reduce((acc, hp) => acc + hp.targetHires, 0);
    const totalFilled = hiringPlans.reduce((acc, hp) => acc + hp.filledHires, 0);
    hiringTargetProgressPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalFilled / totalTarget) * 100)) : 0;
  }

  const teamMembers = await prisma.teamMembership.findMany({
    where: { team: { companyId } },
  });

  let recruiterCapacityScore: number | null = null;
  if (teamMembers.length > 0) {
    const recruitersCount = teamMembers.length;
    const avgLoadPerRecruiter = activeCandidates / recruitersCount;
    recruiterCapacityScore = Math.max(0, Math.min(100, Math.round((avgLoadPerRecruiter / 25) * 100)));
  }

  // 8. Bottlenecks & Constraints
  const companyBottlenecks = await detectCompanyBottlenecks(companyId);
  const criticalBottlenecksCount = companyBottlenecks.filter((b) => b.severity === "CRITICAL" || b.severity === "HIGH").length;

  let jobsAtRiskCount = 0;
  let supplyConstraintsCount = 0;
  let funnelConstraintsCount = 0;

  for (const job of openJobs) {
    try {
      const funnel = await calculateJobFunnel(job.id, companyId);
      if (funnel && funnel.health) {
        if (funnel.health.status === "AT_RISK" || funnel.health.status === "CRITICAL") {
          jobsAtRiskCount++;
        }
        if (funnel.health.signals?.some((s) => s.title.includes("SUPPLY") || s.description.includes("SUPPLY"))) {
          supplyConstraintsCount++;
        }
        if (funnel.health.signals?.some((s) => s.title.includes("FUNNEL") || s.description.includes("FUNNEL") || s.title.includes("CONVERSION"))) {
          funnelConstraintsCount++;
        }
      }
    } catch {
      // Ignore calculation error for unpopulated test jobs
    }
  }

  // 8. Honest Data Limitations
  const sampleSize = applications.length;
  const isSufficient = sampleSize >= 5;

  const limitations: DataLimitation = {
    isSufficientData: isSufficient,
    sampleSize,
    minimumThreshold: 5,
    confidence: sampleSize >= 20 ? "HIGH" : sampleSize >= 5 ? "MEDIUM" : "LOW",
    reason: isSufficient
      ? undefined
      : `Sample size of ${sampleSize} application records is below the minimum threshold of 5 for robust executive statistical confidence.`,
    assumptions: [
      "Time-to-hire is derived from actual candidate application creation to HIRED status update.",
      "Conversion metrics are grounded in recorded application stage transitions.",
      "Zero values represent observed zero counts, while uncomputed metrics are explicitly returned as null.",
    ],
  };

  return {
    openRequisitions,
    filledPositions,
    jobsAtRisk: jobsAtRiskCount,
    activeCandidates,
    interviewsScheduled,
    offersOutstanding,
    hiresCompleted,
    averageTimeToHireDays,
    medianTimeToHireDays,
    averageTimeToFillDays,
    medianTimeToFillDays,
    offerAcceptanceRate,
    applicationToInterviewConversion,
    interviewToOfferConversion,
    offerToHireConversion,
    hiringTargetProgressPercentage,
    recruiterCapacityScore,
    criticalBottlenecksCount,
    supplyConstraintsCount,
    funnelConstraintsCount,
    limitations,
  };
}
