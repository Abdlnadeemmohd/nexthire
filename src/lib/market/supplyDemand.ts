/**
 * NextHire Phase 12 — Supply vs. Funnel Constraint Diagnosis Engine
 * Determines whether a hiring blocker is caused by candidate shortages (Supply) or internal pipeline conversion bottlenecks (Funnel).
 */

import { prisma } from "@/lib/prisma";
import { calculateJobFunnel } from "@/lib/intelligence/hiringFunnel";
import { calculateTalentSupply } from "./talentSupply";
import { MarketConfidence, SupplyConstraintType, SupplyVsFunnelResult } from "./types";

/**
 * Diagnoses whether a job requisition is experiencing a Supply Constraint, a Funnel Constraint, or Both.
 */
export async function diagnoseSupplyVsFunnel(jobId: string): Promise<SupplyVsFunnelResult | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      skills: true,
      location: true,
      companyId: true,
      createdAt: true,
    },
  });

  if (!job) return null;

  // 1. Calculate Observed Candidate Supply
  const talentSupply = await calculateTalentSupply({
    jobId: job.id,
    role: job.title,
    skills: job.skills,
    location: job.location,
  });

  // 2. Calculate Internal Hiring Funnel Metrics (Phase 11 Engine)
  const funnel = await calculateJobFunnel(job.id, job.companyId);

  const totalMatchingSupply = talentSupply.totalMatching;
  const qualifiedSupply = talentSupply.qualifiedCount;
  const verifiedSupply = talentSupply.verifiedCount;

  const funnelApplications = funnel ? funnel.totalApplications : 0;
  const funnelShortlisted = funnel
    ? funnel.stages.find((s) => s.stage === "SHORTLISTED")?.entrants || 0
    : 0;
  const funnelInterviews = funnel
    ? funnel.stages.find((s) => s.stage === "INTERVIEW")?.entrants || 0
    : 0;
  const funnelOffers = funnel
    ? funnel.stages.find((s) => s.stage === "OFFER")?.entrants || 0
    : 0;
  const funnelHealthScore = funnel ? funnel.health.score : 100;

  // 3. Evaluate Supply & Funnel Indicators
  const isSupplyScarce = qualifiedSupply < 5 && totalMatchingSupply < 8;
  const isSupplyAbundant = qualifiedSupply >= 10 || totalMatchingSupply >= 15;
  const isFunnelBroken =
    funnelApplications >= 10 &&
    (funnelHealthScore < 50 || (funnelShortlisted / Math.max(funnelApplications, 1)) < 0.15);

  let classification: SupplyConstraintType = "INSUFFICIENT_DATA";
  let diagnosisSummary = "";
  const evidence: string[] = [];
  let recommendation = "";

  if (funnelApplications < 2 && totalMatchingSupply < 3) {
    classification = "INSUFFICIENT_DATA";
    diagnosisSummary = "Insufficient applicant volume and candidate pool sample to form a reliable constraint diagnosis.";
    evidence.push(`Requisition has only ${funnelApplications} application(s) and ${totalMatchingSupply} matching profile(s) on platform.`);
    recommendation = "Allow job posting to run for at least 7 days or initiate active candidate discovery.";
  } else if (isSupplyScarce && isFunnelBroken) {
    classification = "BOTH";
    diagnosisSummary = "Critical dual bottleneck: both candidate supply is limited and internal conversion is dropping candidates.";
    evidence.push(`Qualified candidate pool is scarce (${qualifiedSupply} qualified candidate(s) observed).`);
    evidence.push(`Funnel health score is low (${funnelHealthScore}/100) with severe stage drop-off.`);
    recommendation = "Address internal review delays immediately while simultaneously widening job location/skills criteria.";
  } else if (isSupplyScarce) {
    classification = "SUPPLY_CONSTRAINT";
    diagnosisSummary = "Primary bottleneck is Talent Supply. High candidate scarcity restricts inbound applicants.";
    evidence.push(`Platform observed only ${qualifiedSupply} qualified candidate(s) matching exact criteria.`);
    evidence.push(`Inbound applications (${funnelApplications}) are insufficient to fill requisition pipeline.`);
    recommendation = "Focus recruiter efforts on proactive candidate outreach, relaxing non-critical secondary skills, or expanding to remote candidates.";
  } else if (isFunnelBroken || (isSupplyAbundant && funnelInterviews <= 1 && funnelApplications >= 8)) {
    classification = "FUNNEL_CONSTRAINT";
    diagnosisSummary = "Primary bottleneck is Funnel Conversion. Qualified talent exists, but candidates are stalling or being screened out internally.";
    evidence.push(`Adequate matching talent exists (${totalMatchingSupply} matching profiles, ${qualifiedSupply} qualified).`);
    evidence.push(`Applicant volume is strong (${funnelApplications} applicants), but only ${funnelInterviews} reached interview stage.`);
    evidence.push(`Internal funnel conversion health score is ${funnelHealthScore}/100.`);
    recommendation = "Do NOT spend additional budget on sourcing. Unblock application reviews, review screening criteria strictness, and schedule interviews promptly.";
  } else {
    classification = "SUPPLY_CONSTRAINT";
    diagnosisSummary = "Talent supply is moderate; ongoing active sourcing will accelerate pipeline.";
    evidence.push(`Observed ${qualifiedSupply} qualified candidate(s) and ${funnelApplications} application(s).`);
    recommendation = "Continue targeted candidate outreach to verified profiles.";
  }

  let confidence: MarketConfidence = "HIGH";
  if (totalMatchingSupply < 3 && funnelApplications < 3) confidence = "INSUFFICIENT";
  else if (totalMatchingSupply < 10 && funnelApplications < 10) confidence = "MEDIUM";

  return {
    jobId: job.id,
    jobTitle: job.title,
    classification,
    totalMatchingSupply,
    qualifiedSupply,
    verifiedSupply,
    funnelApplications,
    funnelShortlisted,
    funnelInterviews,
    funnelOffers,
    funnelHealthScore,
    diagnosisSummary,
    evidence,
    recommendation,
    confidence,
    sourceMetadata: {
      sourceType: "PLATFORM_OBSERVED",
      sampleSize: totalMatchingSupply + funnelApplications,
      dataWindow: "active_requisition_and_pool",
      lastUpdated: new Date(),
      confidence,
      disclaimer: "Diagnostic grounds internal pipeline metrics against observed platform candidate availability.",
    },
  };
}
