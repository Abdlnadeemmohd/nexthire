import { prisma } from "@/lib/prisma";
import { OrganizationalRiskItem, ExecutiveRiskLevel } from "./types";
import { calculateJobFunnel } from "@/lib/intelligence/hiringFunnel";
import { detectCompanyBottlenecks } from "@/lib/intelligence/bottleneckDetector";

export async function detectOrganizationalRisks(companyId: string): Promise<OrganizationalRiskItem[]> {
  const risks: OrganizationalRiskItem[] = [];

  const openJobs = await prisma.job.findMany({
    where: { companyId, status: "ACTIVE" },
    include: {
      applications: {
        include: { interviews: true, interviewScorecards: true },
      },
    },
  });

  const hiringPlans = await prisma.hiringPlan.findMany({
    where: { companyId },
  });

  // 1. HIRING_PLAN_RISK & HIRING_TARGET_RISK
  for (const plan of hiringPlans) {
    if (plan.targetHires > 0) {
      const progress = (plan.filledHires / plan.targetHires) * 100;
      if (progress < 50 && new Date(plan.targetDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000) {
        risks.push({
          riskId: `risk-plan-${plan.id}`,
          category: "HIRING_TARGET_RISK",
          riskLevel: "CRITICAL",
          observedFacts: [
            `Department plan '${plan.department}' is at ${Math.round(progress)}% progress (${plan.filledHires}/${plan.targetHires} hires).`,
            `Target completion date is ${new Date(plan.targetDate).toISOString().split("T")[0]}.`,
          ],
          reason: `Department hiring plan is severely lagging milestone target date with <50% filled positions.`,
          affectedJobsCount: 1,
          affectedCandidatesCount: plan.targetHires - plan.filledHires,
          affectedJobIds: [],
          recommendedAction: `Reallocate recruiting capacity or adjust candidate sourcing channels for ${plan.department}.`,
          confidence: "HIGH",
          dataLimitations: "Grounded on active PostgreSQL HiringPlan table data.",
        });
      }
    }
  }

  // 2. REQUISITION_RISK & STALLED_PIPELINE
  for (const job of openJobs) {
    if (job.applications.length === 0) {
      risks.push({
        riskId: `risk-job-zero-apps-${job.id}`,
        category: "PIPELINE_RISK",
        riskLevel: "HIGH",
        observedFacts: [
          `Requisition '${job.title}' has 0 applications received since creation.`,
          `Created on ${new Date(job.createdAt).toISOString().split("T")[0]}.`,
        ],
        reason: `Requisition has zero top-of-funnel candidate traffic.`,
        affectedJobsCount: 1,
        affectedCandidatesCount: 0,
        affectedJobIds: [job.id],
        recommendedAction: `Launch Talent Radar discovery search or trigger an automated recruiter outreach campaign.`,
        confidence: "HIGH",
        dataLimitations: "Grounded on 0 active PostgreSQL application records for job.",
      });
    }

    try {
      const funnel = await calculateJobFunnel(job.id, companyId);
      if (funnel && funnel.health && (funnel.health.status === "CRITICAL" || funnel.health.status === "AT_RISK")) {
        risks.push({
          riskId: `risk-funnel-${job.id}`,
          category: "REQUISITION_RISK",
          riskLevel: funnel.health.status === "CRITICAL" ? "CRITICAL" : "HIGH",
          observedFacts: [
            `Job '${job.title}' funnel health score is ${funnel.health.score}/100 (${funnel.health.status}).`,
            `Total applications: ${funnel.totalApplications}, Conversion to Hire: ${funnel.overallConversionRate !== null ? funnel.overallConversionRate : 0}%.`,
          ],
          reason: `Funnel health score is below threshold (${funnel.health.score}/100) due to stage conversion drop-offs.`,
          affectedJobsCount: 1,
          affectedCandidatesCount: job.applications.length,
          affectedJobIds: [job.id],
          recommendedAction: `Review candidate progression bottlenecks and expedite pending screening reviews.`,
          confidence: "HIGH",
          dataLimitations: "Evaluated using deterministic job funnel health scoring rules.",
        });
      }
    } catch {
      // Ignore
    }
  }

  // 3. CAPACITY_RISK & TEAM_OVERLOAD
  const teamMembers = await prisma.teamMembership.findMany({
    where: { team: { companyId } },
  });

  const totalActiveApps = openJobs.reduce((acc, j) => acc + j.applications.filter((a) => !["REJECTED", "APPLICATION_CLOSED"].includes(a.status)).length, 0);

  if (teamMembers.length > 0) {
    const avgLoad = totalActiveApps / teamMembers.length;
    if (avgLoad > 35) {
      risks.push({
        riskId: `risk-capacity-overload`,
        category: "TEAM_OVERLOAD",
        riskLevel: "HIGH",
        observedFacts: [
          `Recruiting team has ${teamMembers.length} member(s) managing ${totalActiveApps} active candidate pipelines.`,
          `Average candidate load is ${Math.round(avgLoad)} candidates per recruiter (Optimal threshold: 25).`,
        ],
        reason: `Recruiter team capacity is overloaded, risking candidate SLA breaches and extended cycle times.`,
        affectedJobsCount: openJobs.length,
        affectedCandidatesCount: totalActiveApps,
        affectedJobIds: openJobs.map((j) => j.id),
        recommendedAction: `Rebalance candidate assignments across team members or add coordinator support.`,
        confidence: "HIGH",
        dataLimitations: "Grounded on active candidate counts divided by active team memberships.",
      });
    }
  }

  // 4. SLA_RISK & INTERVIEW_RISK
  const bottlenecks = await detectCompanyBottlenecks(companyId);
  for (const b of bottlenecks) {
    if (b.severity === "CRITICAL" || b.severity === "HIGH") {
      risks.push({
        riskId: `risk-bottleneck-${b.id}`,
        category: b.type === "SCORECARD_BACKLOG" ? "INTERVIEW_RISK" : "SLA_RISK",
        riskLevel: b.severity as ExecutiveRiskLevel,
        observedFacts: [
          `Detected operational bottleneck '${b.type}' affecting ${b.affectedCount} item(s).`,
          `Oldest age: ${b.oldestAgeDays} day(s).`,
        ],
        reason: b.evidence,
        affectedJobsCount: 1,
        affectedCandidatesCount: b.affectedCount,
        affectedJobIds: [b.jobId],
        recommendedAction: b.recommendedAction,
        confidence: "HIGH",
        dataLimitations: "Grounded on real candidate application SLA age calculations.",
      });
    }
  }

  // 5. DATA_QUALITY_RISK (Fallback if sample size is tiny)
  const totalAppsCount = openJobs.reduce((acc, j) => acc + j.applications.length, 0);
  if (totalAppsCount < 5) {
    risks.push({
      riskId: `risk-data-quality`,
      category: "DATA_QUALITY_RISK",
      riskLevel: "LOW",
      observedFacts: [
        `Company has a total of ${totalAppsCount} application record(s) stored in database.`,
        `Minimum recommended statistical sample is 5 application records.`,
      ],
      reason: `Statistical forecasts and time-to-hire trends have elevated margin of error due to low volume of raw candidate data.`,
      affectedJobsCount: openJobs.length,
      affectedCandidatesCount: totalAppsCount,
      affectedJobIds: openJobs.map((j) => j.id),
      recommendedAction: `Import candidate historical application records or allow system to accumulate organic applicant data.`,
      confidence: "MEDIUM",
      dataLimitations: "Low record volume disclaimer.",
    });
  }

  return risks;
}
