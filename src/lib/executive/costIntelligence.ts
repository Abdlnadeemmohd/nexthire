import { prisma } from "@/lib/prisma";
import { CostAndRoiIntelligence } from "./types";

export async function getCostAndRoiIntelligence(companyId: string): Promise<CostAndRoiIntelligence> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscriptions: true,
    },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // Check subscription and job budgets for monetary spend inputs
  const activeSubscription = company.subscriptions.find((s) => s.status === "ACTIVE");
  const platformCostTotal = activeSubscription && activeSubscription.amountPaid ? Number(activeSubscription.amountPaid) : null;

  const jobs = await prisma.job.findMany({
    where: { companyId },
    select: { salaryMin: true, salaryMax: true },
  });

  const applications = await prisma.application.findMany({
    where: { job: { companyId } },
    include: { interviews: true },
  });

  const totalHires = applications.filter((app) => app.status === "OFFER_EXTENDED" || app.status === "FINAL_DECISION").length;
  const totalInterviews = applications.reduce((acc, app) => acc + (app.interviews?.length || 0), 0);
  const totalQualified = applications.filter((app) => app.status !== "REJECTED").length;

  const outreachCampaigns = await prisma.outreachCampaign.findMany({
    where: { companyId },
    include: { recipients: true },
  });

  const totalOutreachSent = outreachCampaigns.reduce(
    (acc, c) => acc + c.recipients.filter((r) => r.status === "SENT" || r.status === "REPLIED").length,
    0
  );

  const totalOutreachReplies = outreachCampaigns.reduce(
    (acc, c) => acc + c.recipients.filter((r) => r.status === "REPLIED").length,
    0
  );

  // If no monetary input data exists, return DATA_NOT_AVAILABLE
  if (!platformCostTotal || platformCostTotal === 0) {
    return {
      platformCostTotal: null,
      jobSpendTotal: null,
      costPerHire: null,
      costPerInterview: null,
      costPerQualifiedCandidate: null,
      costPerSuccessfulOutreach: null,
      recruiterProductivityScore: applications.length > 0 ? Math.min(100, Math.round((totalHires / Math.max(1, applications.length)) * 100 * 5)) : null,
      pipelineEfficiencyRatio: totalAppsEfficiencyRatio(applications.length, totalQualified, totalHires),
      dataStatus: "DATA_NOT_AVAILABLE",
      explanation: "Monetary subscription and platform spend inputs are not configured for this tenant. Cost per hire metrics are suppressed to prevent data fabrication.",
    };
  }

  // Calculate actual cost metrics when monetary spend exists
  const costPerHire = totalHires > 0 ? Math.round(platformCostTotal / totalHires) : null;
  const costPerInterview = totalInterviews > 0 ? Math.round(platformCostTotal / totalInterviews) : null;
  const costPerQualifiedCandidate = totalQualified > 0 ? Math.round(platformCostTotal / totalQualified) : null;
  const costPerSuccessfulOutreach = totalOutreachReplies > 0 ? Math.round(platformCostTotal / totalOutreachReplies) : null;

  return {
    platformCostTotal,
    jobSpendTotal: null,
    costPerHire,
    costPerInterview,
    costPerQualifiedCandidate,
    costPerSuccessfulOutreach,
    recruiterProductivityScore: Math.min(100, Math.round((totalHires / Math.max(1, applications.length)) * 100 * 5)),
    pipelineEfficiencyRatio: totalAppsEfficiencyRatio(applications.length, totalQualified, totalHires),
    dataStatus: "AVAILABLE",
    explanation: `Cost metrics calculated from active platform subscription spend of $${platformCostTotal}.`,
  };
}

function totalAppsEfficiencyRatio(total: number, qualified: number, hires: number): number | null {
  if (total === 0) return null;
  const qualifiedRatio = qualified / total;
  const hireRatio = hires / Math.max(1, qualified);
  return Number(((qualifiedRatio * 0.4 + hireRatio * 0.6) * 100).toFixed(1));
}
