/**
 * NextHire Phase 11 — Recruiter Strategy & Strategic Recommendation Engine
 * Transforms operational data into actionable, evidence-grounded hiring recommendations.
 */

import { prisma } from "@/lib/prisma";
import {
  StrategicRecommendation,
  IntelligenceOverview,
  PriorityLevel,
  HealthStatus,
  JobFunnelMetrics,
} from "./types";
import { calculateJobFunnel } from "./hiringFunnel";
import { detectJobBottlenecks, detectCompanyBottlenecks } from "./bottleneckDetector";
import { detectStalledCandidates } from "./candidateStallDetector";
import { calculateCompanyWorkloadDistribution, calculateRecruiterWorkload } from "./workloadEngine";
import { calculateHiringTargetRisk } from "./historicalComparison";

/**
 * Generates prioritized, evidence-grounded strategic recommendations.
 * Scoped strictly by companyId.
 */
export async function generateStrategicRecommendations(
  companyId: string,
  recruiterId?: string,
  jobId?: string
): Promise<StrategicRecommendation[]> {
  const recommendations: StrategicRecommendation[] = [];

  // 1. Fetch Bottlenecks
  const bottlenecks = jobId
    ? await detectJobBottlenecks(jobId, companyId)
    : await detectCompanyBottlenecks(companyId);

  for (const bn of bottlenecks) {
    let category: any = "REVIEW_BACKLOG";
    let ctaText = "Review Applications";
    let ctaUrl = `/recruiter/applicants?jobId=${bn.jobId}`;

    if (bn.type === "APPLICATION_BACKLOG" || bn.type === "REVIEW_BACKLOG") {
      category = "REVIEW_BACKLOG";
      ctaText = "Review Overdue Applications";
      ctaUrl = `/recruiter/applicants?jobId=${bn.jobId}&filter=overdue`;
    } else if (bn.type === "SHORTLIST_BACKLOG") {
      category = "SCHEDULE_INTERVIEW";
      ctaText = "Schedule Interviews";
      ctaUrl = `/recruiter/interviews?jobId=${bn.jobId}`;
    } else if (bn.type === "SCORECARD_BACKLOG") {
      category = "COMPLETE_SCORECARD";
      ctaText = "Review Pending Scorecards";
      ctaUrl = `/recruiter/interviews?jobId=${bn.jobId}&filter=missing_scorecards`;
    } else if (bn.type === "OFFER_BACKLOG") {
      category = "FOLLOW_UP_OFFER";
      ctaText = "View Active Offers";
      ctaUrl = `/recruiter/applicants?jobId=${bn.jobId}&stage=OFFER`;
    } else if (bn.type === "OUTREACH_BACKLOG") {
      category = "CONTACT_HIGH_FIT";
      ctaText = "Review Outreach Drafts";
      ctaUrl = `/recruiter/outreach?jobId=${bn.jobId}`;
    }

    recommendations.push({
      id: `rec_bn_${bn.id}`,
      category,
      priority: bn.severity,
      title: `Unblock ${bn.jobTitle}: ${bn.affectedCount} item(s) in ${bn.type.replace(/_/g, " ").toLowerCase()}`,
      reason: bn.evidence,
      evidence: `Observed ${bn.affectedCount} records exceeding ${bn.thresholdDays}-day SLA threshold (oldest age: ${bn.oldestAgeDays} days).`,
      expectedImpact: `Likely to reduce pipeline latency and prevent candidate drop-off for ${bn.jobTitle}.`,
      confidence: "HIGH",
      entityType: "JOB",
      entityId: bn.jobId,
      entityName: bn.jobTitle,
      ctaText,
      ctaUrl,
    });
  }

  // 2. Fetch Stalled Candidates
  const stalledCandidates = await detectStalledCandidates(companyId, jobId);
  const criticalStalled = stalledCandidates.filter((c) => c.riskLevel === "CRITICAL" || c.riskLevel === "HIGH").slice(0, 5);

  for (const sc of criticalStalled) {
    recommendations.push({
      id: `rec_stall_${sc.applicationId}`,
      category: sc.currentStage === "SUBMITTED" ? "REVIEW_BACKLOG" : "FOLLOW_UP_CANDIDATE",
      priority: sc.riskLevel,
      title: `Candidate Stalled: ${sc.candidateName} (${sc.jobTitle})`,
      reason: `Candidate has been in ${sc.currentStage} stage for ${sc.daysInStage} days with no stage progression.`,
      evidence: `Last activity recorded ${sc.daysInStage} days ago (SLA limit: ${sc.expectedThresholdDays} days). Match score: ${sc.matchScore}%.`,
      expectedImpact: "Re-engaging candidate may prevent disengagement or offer rejection.",
      confidence: "HIGH",
      entityType: "APPLICATION",
      entityId: sc.applicationId,
      entityName: sc.candidateName,
      ctaText: "Open Candidate Record",
      ctaUrl: `/recruiter/applicants/${sc.applicationId}`,
    });
  }

  // 3. Sourcing vs Funnel Quality Check
  const activeJobs = await prisma.job.findMany({
    where: { companyId, status: "ACTIVE", ...(jobId ? { id: jobId } : {}) },
    select: { id: true, title: true },
  });

  for (const j of activeJobs) {
    const funnel = await calculateJobFunnel(j.id, companyId);
    if (!funnel) continue;

    // If total applications is low and no qualified candidates, recommend sourcing
    if (funnel.totalApplications < 5 && funnel.qualifiedCount === 0) {
      recommendations.push({
        id: `rec_source_${j.id}`,
        category: "SOURCE_MORE_CANDIDATES",
        priority: "MEDIUM",
        title: `Source Candidates for ${j.title}`,
        reason: `Job has low total applicant volume (${funnel.totalApplications}) and 0 qualified candidates in pipeline.`,
        evidence: `Pipeline shows ${funnel.totalApplications} total applicants and 0 meeting 75%+ match score.`,
        expectedImpact: "Sourcing via Talent Radar may increase qualified pipeline entrants.",
        confidence: "MEDIUM",
        entityType: "JOB",
        entityId: j.id,
        entityName: j.title,
        ctaText: "Search Talent Radar",
        ctaUrl: `/recruiter/talent-radar?jobId=${j.id}`,
      });
    }

    // If total applications is high (> 20) but qualified count is low (< 3), recommend improving job description / requirements
    if (funnel.totalApplications >= 20 && funnel.qualifiedCount < 3) {
      recommendations.push({
        id: `rec_job_desc_${j.id}`,
        category: "IMPROVE_JOB_DESCRIPTION",
        priority: "LOW",
        title: `Refine Requirements for ${j.title}`,
        reason: `High applicant volume (${funnel.totalApplications}) but low qualified applicant ratio (${funnel.qualifiedCount} qualified).`,
        evidence: `Only ${Math.round((funnel.qualifiedCount / funnel.totalApplications) * 100)}% of applicants match job requirements.`,
        expectedImpact: "Clarifying mandatory requirements in job posting may filter unqualified inbound volume.",
        confidence: "MEDIUM",
        entityType: "JOB",
        entityId: j.id,
        entityName: j.title,
        ctaText: "Edit Job Posting",
        ctaUrl: `/recruiter/jobs/${j.id}`,
      });
    }
  }

  // Sort by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
  const priorityRank: Record<PriorityLevel, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return recommendations.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}

/**
 * Builds the Master Hiring Intelligence Overview for the Recruiter Dashboard.
 */
export async function getIntelligenceOverview(
  companyId: string,
  recruiterId?: string
): Promise<IntelligenceOverview> {
  const activeJobs = await prisma.job.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true, title: true },
  });

  const funnelPromises = activeJobs.map((j) => calculateJobFunnel(j.id, companyId));
  const rawFunnels = await Promise.all(funnelPromises);
  const funnels: JobFunnelMetrics[] = rawFunnels.filter((f): f is JobFunnelMetrics => f !== null);

  const totalActiveCandidates = funnels.reduce((acc, f) => acc + (f.activeApplications || 0), 0);
  const totalApplications = funnels.reduce((acc, f) => acc + (f.totalApplications || 0), 0);
  const totalQualified = funnels.reduce((acc, f) => acc + (f.qualifiedCount || 0), 0);

  const bottlenecks = await detectCompanyBottlenecks(companyId);
  const stalledCandidates = await detectStalledCandidates(companyId);
  const workloadDist = await calculateCompanyWorkloadDistribution(companyId);
  const strategicRecommendations = await generateStrategicRecommendations(companyId, recruiterId);

  const targetRiskPromises = activeJobs.map((j) => calculateHiringTargetRisk(j.id, companyId));
  const rawTargetRisks = await Promise.all(targetRiskPromises);
  const hiringTargetRisks = rawTargetRisks.filter((r) => r !== null) as any[];

  let myWorkload = null;
  if (recruiterId) {
    myWorkload = await calculateRecruiterWorkload(recruiterId, companyId);
  }

  const criticalBottlenecksCount = bottlenecks.filter((b) => b.severity === "CRITICAL").length;
  const overdueTasksCount = bottlenecks.reduce((acc, b) => acc + b.affectedCount, 0);

  const healthScores = funnels.map((f) => f.health.score);
  const avgHealth = healthScores.length ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) : 100;

  let overallFunnelHealth: HealthStatus = "HEALTHY";
  if (avgHealth < 40 || criticalBottlenecksCount >= 2) overallFunnelHealth = "CRITICAL";
  else if (avgHealth < 65 || criticalBottlenecksCount >= 1) overallFunnelHealth = "AT_RISK";
  else if (avgHealth < 85) overallFunnelHealth = "WATCH";

  const jobsHealthList = funnels.map((f) => {
    const jobBottlenecks = bottlenecks.filter((b) => b.jobId === f.jobId);
    const primaryBottleneck = jobBottlenecks.length > 0 ? jobBottlenecks[0].type.replace(/_/g, " ") : null;

    return {
      jobId: f.jobId,
      jobTitle: f.jobTitle,
      healthStatus: f.health.status,
      healthScore: f.health.score,
      totalApplications: f.totalApplications,
      primaryBottleneck,
      qualifiedCount: f.qualifiedCount,
    };
  });

  return {
    companyId,
    totalActiveJobs: activeJobs.length,
    totalActiveCandidates,
    overallFunnelHealth,
    criticalBottlenecksCount,
    stalledCandidatesCount: stalledCandidates.length,
    overdueTasksCount,
    workloadDistribution: workloadDist.distribution,
    jobsSummary: {
      overallHealth: overallFunnelHealth,
      averageHealthScore: avgHealth,
      activeJobsCount: activeJobs.length,
      totalApplications,
      totalActive: totalActiveCandidates,
      totalQualified,
      jobFunnels: funnels,
    },
    bottlenecks,
    stalledCandidates,
    strategicRecommendations,
    topUrgentActions: strategicRecommendations.slice(0, 10),
    hiringTargetRisks,
    myWorkload,
    jobsHealthList,
    generatedAt: new Date(),
  };
}
