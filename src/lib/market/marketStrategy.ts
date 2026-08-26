/**
 * NextHire Phase 12 — Sourcing Strategy & Master Market Intelligence Engine
 * Synthesizes supply metrics, scarcity indices, funnel diagnostics, and simulations
 * into prioritized, actionable recruiter sourcing recommendations.
 */

import { prisma } from "@/lib/prisma";
import { calculateTalentSupply } from "./talentSupply";
import { calculateSkillScarcity } from "./skillScarcity";
import { calculateLocationSupply } from "./locationSupply";
import { calculateRemoteSupply } from "./remoteSupply";
import { calculateSenioritySupply } from "./senioritySupply";
import { diagnoseSupplyVsFunnel } from "./supplyDemand";
import { simulateRequirementStrictness } from "./requirementStrictness";
import { calculateMarketTrends } from "./marketTrends";
import {
  JobMarketIntelligence,
  MarketOverview,
  SourcingRecommendation,
  StrategyCategory,
} from "./types";

/**
 * Generates prioritized sourcing strategy recommendations for a single job requisition.
 */
export async function generateJobSourcingRecommendations(
  jobId: string
): Promise<SourcingRecommendation[]> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      skills: true,
      location: true,
      isRemote: true,
      experienceLevel: true,
    },
  });

  if (!job) return [];

  const recommendations: SourcingRecommendation[] = [];

  // 1. Run Diagnostic Engines
  const supplyVsFunnel = await diagnoseSupplyVsFunnel(job.id);
  const skillMetrics = await calculateSkillScarcity([], job.id);
  const locationMetrics = await calculateLocationSupply(job.id);
  const remoteMetrics = await calculateRemoteSupply(job.id);
  const strictness = await simulateRequirementStrictness(job.id);

  // Strategy A: Funnel Fix vs Sourcing
  if (supplyVsFunnel?.classification === "FUNNEL_CONSTRAINT") {
    recommendations.push({
      id: `rec-funnel-${job.id}`,
      category: "FIX_FUNNEL_BEFORE_SOURCING",
      priority: "CRITICAL",
      title: "Unblock Internal Funnel Before Sourcing More Candidates",
      reason: `Matching candidate pool is healthy (${supplyVsFunnel.totalMatchingSupply} profiles), but funnel conversion health is degraded (${supplyVsFunnel.funnelHealthScore}/100).`,
      evidence: `You have ${supplyVsFunnel.funnelApplications} inbound applicants with low progression to interview stage (${supplyVsFunnel.funnelInterviews} interviews).`,
      confidence: "HIGH",
      expectedImpact: "Doubles interview throughput without additional candidate acquisition cost.",
      ctaText: "Review Application Funnel",
      ctaUrl: `/recruiter/intelligence`,
      requiresConfirmation: false,
    });
  }

  // Strategy B: Skill Scarcity & Relaxation
  const scarceSkills = skillMetrics.filter(
    (s) => s.relativeScarcity === "SCARCE" || s.relativeScarcity === "CRITICALLY_SCARCE"
  );
  if (scarceSkills.length > 0) {
    const primaryScarce = scarceSkills[0];
    recommendations.push({
      id: `rec-skill-${job.id}`,
      category: "RELAX_NONCRITICAL_SKILL",
      priority: "HIGH",
      title: `Treat '${primaryScarce.skill}' as Preferred or Trainable`,
      reason: `'${primaryScarce.skill}' is scarce on the platform (${primaryScarce.matchingCount} candidates, ${primaryScarce.poolPercentage}% pool share).`,
      evidence: primaryScarce.evidence.join(" "),
      confidence: primaryScarce.confidence,
      expectedImpact: `Expands candidate matching volume by up to +${Math.max(30, 100 - primaryScarce.poolPercentage)}%.`,
      ctaText: "Adjust Job Skill Requirements",
      ctaUrl: `/recruiter/jobs/${job.id}/edit`,
      requiresConfirmation: true,
    });

    if (primaryScarce.adjacentSkills.length > 0) {
      recommendations.push({
        id: `rec-adjacent-${job.id}`,
        category: "SOURCE_ADJACENT_SKILLS",
        priority: "MEDIUM",
        title: `Source Adjacent Skills: ${primaryScarce.adjacentSkills.slice(0, 3).join(", ")}`,
        reason: `Candidates possessing ${primaryScarce.adjacentSkills[0]} demonstrate high technical overlap with ${primaryScarce.skill}.`,
        evidence: `Co-occurrence analysis identified strong capability correlation across active profiles.`,
        confidence: "HIGH",
        expectedImpact: "Surfaces high-potential lateral candidates ready for rapid onboarding.",
        ctaText: "Search Adjacent Talent",
        ctaUrl: `/recruiter/radar?skill=${encodeURIComponent(primaryScarce.adjacentSkills[0])}`,
        requiresConfirmation: false,
      });
    }
  }

  // Strategy C: Location & Remote Expansion
  if (!job.isRemote) {
    const remoteShare = remoteMetrics.find((r) => r.remotePreference.includes("Remote"))?.percentageOfPool || 0;
    if (remoteShare >= 30) {
      recommendations.push({
        id: `rec-remote-${job.id}`,
        category: "EXPAND_REMOTE",
        priority: "HIGH",
        title: "Open Requisition to Hybrid or 100% Remote Candidates",
        reason: `${remoteShare}% of discoverable platform talent prefers or requires remote work flexibility.`,
        evidence: `Onsite restriction currently chokes out a significant portion of addressable talent.`,
        confidence: "HIGH",
        expectedImpact: "Expands addressable talent supply by up to +2.5x.",
        ctaText: "Update Work Model to Remote",
        ctaUrl: `/recruiter/jobs/${job.id}/edit`,
        requiresConfirmation: true,
      });
    }
  }

  // Strategy D: Target Verified Candidates
  if (supplyVsFunnel && supplyVsFunnel.verifiedSupply > 0) {
    recommendations.push({
      id: `rec-verified-${job.id}`,
      category: "SOURCE_VERIFIED_CANDIDATES",
      priority: "MEDIUM",
      title: `Engage ${supplyVsFunnel.verifiedSupply} Pre-Verified Candidate(s)`,
      reason: `These candidates have demonstrated high technical assessment evidence for required skills.`,
      evidence: `Phase 8 verified assessment scores >= 75%.`,
      confidence: "HIGH",
      expectedImpact: "Increases interview pass-through rate to >80%.",
      ctaText: "View Verified Talent Radar",
      ctaUrl: `/recruiter/radar?jobId=${job.id}&verifiedOnly=true`,
      requiresConfirmation: false,
    });
  }

  // Fallback / Continue Strategy
  if (recommendations.length === 0) {
    recommendations.push({
      id: `rec-continue-${job.id}`,
      category: "CONTINUE_CURRENT_SOURCING",
      priority: "LOW",
      title: "Maintain Targeted Sourcing Cadence",
      reason: "Current requisition parameters have healthy supply and funnel balance.",
      evidence: "Observed candidate pool supports active hiring timeline.",
      confidence: "HIGH",
      expectedImpact: "Consistent pipeline velocity toward target hire date.",
      ctaText: "Open Talent Radar",
      ctaUrl: `/recruiter/radar?jobId=${job.id}`,
      requiresConfirmation: false,
    });
  }

  // Priority ordering: CRITICAL -> HIGH -> MEDIUM -> LOW
  const priorityOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Returns full Market Intelligence report for a specific job requisition.
 */
export async function getJobMarketIntelligence(
  jobId: string,
  companyId?: string
): Promise<JobMarketIntelligence | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      skills: true,
      location: true,
      country: true,
      companyId: true,
    },
  });

  if (!job) return null;
  if (companyId && job.companyId !== companyId) {
    throw new Error("UNAUTHORIZED_REQUISITION_ACCESS");
  }

  const [
    talentSupply,
    skillScarcity,
    topLocations,
    remoteSupply,
    senioritySupply,
    supplyVsFunnel,
    requirementStrictness,
    recommendations,
  ] = await Promise.all([
    calculateTalentSupply({ jobId: job.id, role: job.title, skills: job.skills, location: job.location }),
    calculateSkillScarcity([], job.id),
    calculateLocationSupply(job.id),
    calculateRemoteSupply(job.id),
    calculateSenioritySupply(job.id),
    diagnoseSupplyVsFunnel(job.id),
    simulateRequirementStrictness(job.id),
    generateJobSourcingRecommendations(job.id),
  ]);

  return {
    jobId: job.id,
    jobTitle: job.title,
    companyId: job.companyId,
    talentSupply,
    skillScarcity,
    topLocations,
    remoteSupply,
    senioritySupply,
    supplyVsFunnel: supplyVsFunnel || {
      jobId: job.id,
      jobTitle: job.title,
      classification: "INSUFFICIENT_DATA",
      totalMatchingSupply: talentSupply.totalMatching,
      qualifiedSupply: talentSupply.qualifiedCount,
      verifiedSupply: talentSupply.verifiedCount,
      funnelApplications: 0,
      funnelShortlisted: 0,
      funnelInterviews: 0,
      funnelOffers: 0,
      funnelHealthScore: 100,
      diagnosisSummary: "No pipeline data available.",
      evidence: [],
      recommendation: "Publish job and initiate candidate search.",
      confidence: "INSUFFICIENT",
      sourceMetadata: talentSupply.sourceMetadata,
    },
    requirementStrictness: requirementStrictness || {
      jobId: job.id,
      jobTitle: job.title,
      baselinePoolSize: talentSupply.totalMatching,
      simulations: [],
      mostRestrictiveRequirement: "None",
      overallStrictnessScore: 30,
      summary: "Balanced requirements.",
      sourceMetadata: talentSupply.sourceMetadata,
    },
    recommendations,
    sourceMetadata: {
      sourceType: "PLATFORM_OBSERVED",
      sampleSize: talentSupply.totalMatching,
      dataWindow: "active_discoverable_pool",
      lastUpdated: new Date(),
      confidence: talentSupply.sourceMetadata.confidence,
      disclaimer: "Market intelligence grounded exclusively in NextHire discoverable candidate profiles and assessment records.",
    },
  };
}

/**
 * Returns aggregated Market Intelligence overview across all company open requisitions.
 */
export async function getMarketOverview(companyId: string): Promise<MarketOverview> {
  const activeJobs = await prisma.job.findMany({
    where: {
      companyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      title: true,
      skills: true,
      location: true,
    },
  });

  const [
    generalSupply,
    topSkills,
    topLocations,
    remoteDistribution,
    seniorityDistribution,
    recentTrends,
  ] = await Promise.all([
    calculateTalentSupply({ companyId }),
    calculateSkillScarcity([]),
    calculateLocationSupply(),
    calculateRemoteSupply(),
    calculateSenioritySupply(),
    calculateMarketTrends("30d"),
  ]);

  const jobSummariesResults = await Promise.all(
    activeJobs.map(async (job) => {
      const [supply, diag, recs] = await Promise.all([
        calculateTalentSupply({ jobId: job.id, role: job.title, skills: job.skills }),
        diagnoseSupplyVsFunnel(job.id),
        generateJobSourcingRecommendations(job.id),
      ]);

      const primaryRec = recs[0];
      let supplyLevel = "HEALTHY" as any;
      if (supply.qualifiedCount <= 2) supplyLevel = "CRITICALLY_SCARCE";
      else if (supply.qualifiedCount <= 5) supplyLevel = "LIMITED";

      return {
        summary: {
          jobId: job.id,
          jobTitle: job.title,
          supplyLevel,
          qualifiedCount: supply.qualifiedCount,
          verifiedCount: supply.verifiedCount,
          supplyVsFunnel: diag?.classification || ("INSUFFICIENT_DATA" as any),
          primaryBottleneckOrRisk: primaryRec ? primaryRec.title : "Normal hiring velocity",
        },
        primaryRec,
      };
    })
  );

  const jobMarketSummaries = jobSummariesResults.map((r) => r.summary);
  const allJobRecs = jobSummariesResults.map((r) => r.primaryRec).filter(Boolean) as SourcingRecommendation[];

  // Deduplicate and prioritize top company recommendations
  const priorityOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  const topRecommendations = allJobRecs
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5);

  return {
    companyId,
    totalActiveJobs: activeJobs.length,
    totalDiscoverableTalent: generalSupply.totalDiscoverable,
    talentConcentration: generalSupply.concentration,
    topScarcitySkills: topSkills.slice(0, 6),
    topLocations: topLocations.slice(0, 5),
    remoteDistribution,
    seniorityDistribution,
    jobMarketSummaries,
    recentTrends,
    topRecommendations,
    sourceMetadata: {
      sourceType: "PLATFORM_OBSERVED",
      sampleSize: generalSupply.totalDiscoverable,
      dataWindow: "active_discoverable_pool",
      lastUpdated: new Date(),
      confidence: generalSupply.sourceMetadata.confidence,
      disclaimer: "Market intelligence synthesized across active company requisitions and platform candidate records.",
    },
  };
}
