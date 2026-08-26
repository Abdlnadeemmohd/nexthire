import { prisma } from "@/lib/prisma";
import { ExecutiveReportData, ExecutiveReportPeriod } from "./types";
import { getExecutiveOverview } from "./executiveOverview";
import { detectOrganizationalRisks } from "./riskEngine";
import { analyzeTimeToHire } from "./hiringPerformance";
import { forecastRecruiterCapacity } from "./capacityForecast";

export async function generateExecutiveReport(
  companyId: string,
  generatedById: string,
  period: ExecutiveReportPeriod = "MONTHLY",
  customTitle?: string
): Promise<ExecutiveReportData> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const now = new Date();
  let daysBack = 30;
  if (period === "WEEKLY") daysBack = 7;
  if (period === "QUARTERLY") daysBack = 90;

  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  // Fetch sub-engine metrics
  const overview = await getExecutiveOverview(companyId);
  const timeToHire = await analyzeTimeToHire(companyId);
  const capacity = await forecastRecruiterCapacity(companyId);
  const risks = await detectOrganizationalRisks(companyId);

  const title = customTitle || `${period} Executive Hiring Intelligence Report — ${company.name}`;

  const reportData: ExecutiveReportData = {
    companyId,
    companyName: company.name,
    title,
    period,
    startDate: startDate.toISOString().split("T")[0],
    endDate: now.toISOString().split("T")[0],
    generatedAt: now.toISOString(),
    executiveSummary: `Executive Hiring Summary for ${company.name}: Currently managing ${overview.openRequisitions} open requisition(s) with ${overview.activeCandidates} active pipeline candidates. Target progress stands at ${overview.hiringTargetProgressPercentage ?? 0}%. Identified ${risks.length} organizational risk item(s) and ${overview.criticalBottlenecksCount} critical stage bottleneck(s).`,
    hiringProgress: {
      targetHires: overview.openRequisitions,
      completedHires: overview.hiresCompleted,
      progressPercentage: overview.hiringTargetProgressPercentage ?? 0,
      openRequisitions: overview.openRequisitions,
    },
    funnelPerformance: {
      totalApplications: overview.activeCandidates + overview.hiresCompleted,
      totalInterviews: overview.interviewsScheduled,
      totalOffers: overview.offersOutstanding + overview.hiresCompleted,
      totalHires: overview.hiresCompleted,
      overallConversionRate: overview.applicationToInterviewConversion ?? 0,
    },
    timeToHire: {
      averageDays: overview.averageTimeToHireDays,
      medianDays: overview.medianTimeToHireDays,
      primaryBottleneck: timeToHire.primaryBottleneckStage,
    },
    recruiterCapacity: {
      totalRecruiters: capacity.totalRecruiters,
      averageLoadPercentage: capacity.averageCapacityLoadPercentage,
      status: capacity.projectedStaffingBottleneck ? "OVERLOADED" : "BALANCED",
    },
    risksSummary: risks,
    talentSupplySummary: `Platform observed candidate supply contains ${overview.activeCandidates} discoverable active seekers matching company requisition parameters.`,
    completedHiresCount: overview.hiresCompleted,
    outstandingOffersCount: overview.offersOutstanding,
    recommendations: [
      {
        priority: risks.some((r) => r.riskLevel === "CRITICAL") ? "CRITICAL" : "HIGH",
        action: risks.length > 0 ? risks[0].recommendedAction : "Maintain current candidate screening velocity.",
        rationale: risks.length > 0 ? risks[0].reason : "Hiring operations are performing within standard velocity guidelines.",
        expectedImpact: "Prevents candidate pipeline stagnation and reduces requisition cycle time.",
      },
      {
        priority: capacity.projectedStaffingBottleneck ? "HIGH" : "MEDIUM",
        action: capacity.projectedStaffingBottleneck
          ? `Reallocate active candidate assignments; current load is ${capacity.averageCapacityLoadPercentage}% of capacity.`
          : "Keep recruiter workload assignments evenly distributed.",
        rationale: "Ensures responsive recruiter SLA compliance across active candidates.",
        expectedImpact: "Improves candidate response times and handoff acceptance SLA.",
      },
    ],
    dataLimitations: [
      overview.limitations.reason || `Metrics grounded on ${overview.limitations.sampleSize} application records over ${daysBack} days.`,
      "Zero values represent observed zero counts; uncomputed metrics are explicitly reported as null.",
      "Executive report output contains zero synthetic data or unverified external labor benchmarks.",
    ],
  };

  // Save report to database
  const savedReport = await prisma.executiveReport.create({
    data: {
      companyId,
      title,
      period,
      startDate,
      endDate: now,
      summaryJson: JSON.stringify({ executiveSummary: reportData.executiveSummary }),
      metricsJson: JSON.stringify({ hiringProgress: reportData.hiringProgress, funnelPerformance: reportData.funnelPerformance, timeToHire: reportData.timeToHire }),
      risksJson: JSON.stringify(reportData.risksSummary),
      recommendationsJson: JSON.stringify(reportData.recommendations),
      generatedById,
    },
  });

  reportData.reportId = savedReport.id;
  return reportData;
}

export async function listExecutiveReports(companyId: string): Promise<any[]> {
  const reports = await prisma.executiveReport.findMany({
    where: { companyId },
    include: { generatedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return reports.map((r) => ({
    reportId: r.id,
    title: r.title,
    period: r.period,
    startDate: r.startDate.toISOString().split("T")[0],
    endDate: r.endDate.toISOString().split("T")[0],
    generatedAt: r.createdAt.toISOString(),
    generatedByName: r.generatedBy?.name || "System Admin",
    summary: JSON.parse(r.summaryJson).executiveSummary || "",
  }));
}
