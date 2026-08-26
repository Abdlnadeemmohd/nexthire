/**
 * NextHire Phase 12 — Requirement Strictness Simulation Engine
 * Simulates talent pool expansion when relaxing mandatory skills, experience, or geographic constraints.
 */

import { prisma } from "@/lib/prisma";
import { calculateTalentSupply } from "./talentSupply";
import { MarketConfidence, RequirementRelaxationSimulation, RequirementStrictnessResult } from "./types";

/**
 * Simulates candidate pool expansion by testing relaxation of individual job criteria.
 */
export async function simulateRequirementStrictness(
  jobId: string
): Promise<RequirementStrictnessResult | null> {
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

  if (!job) return null;

  const rawSkills = (job.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // 1. Calculate Baseline Pool
  const baselineSupply = await calculateTalentSupply({
    jobId: job.id,
    role: job.title,
    skills: rawSkills,
    location: job.location,
  });

  const baselinePoolSize = baselineSupply.totalMatching;
  const simulations: RequirementRelaxationSimulation[] = [];

  // 2. Simulation A: Relax Each Mandatory Skill
  for (const skill of rawSkills) {
    const remainingSkills = rawSkills.filter((s) => s !== skill);
    const simSupply = await calculateTalentSupply({
      role: job.title,
      skills: remainingSkills.length > 0 ? remainingSkills : undefined,
      location: job.location,
    });

    const relaxedPoolSize = simSupply.totalMatching;
    const gain = Math.max(0, relaxedPoolSize - baselinePoolSize);
    const gainPercent =
      baselinePoolSize > 0 ? Math.round((gain / baselinePoolSize) * 100) : gain * 100;

    simulations.push({
      parameter: `Skill Requirement: ${skill}`,
      originalValue: `Mandatory: ${skill}`,
      relaxedValue: `Preferred / Secondary: ${skill}`,
      originalPoolSize: baselinePoolSize,
      relaxedPoolSize,
      poolGainPercentage: gainPercent,
      feasibilityRisk: rawSkills.length > 1 ? "LOW" : "HIGH",
      rationale: `Relaxing '${skill}' to an optional/trainable skill expands available matching talent by +${gain} profile(s) (+${gainPercent}%).`,
    });
  }

  // 3. Simulation B: Relax Location / Enable Remote
  if (!job.isRemote) {
    const remoteSupply = await calculateTalentSupply({
      role: job.title,
      skills: rawSkills,
      location: undefined, // Nationwide / Remote
    });

    const relaxedPoolSize = remoteSupply.totalMatching;
    const gain = Math.max(0, relaxedPoolSize - baselinePoolSize);
    const gainPercent =
      baselinePoolSize > 0 ? Math.round((gain / baselinePoolSize) * 100) : gain * 100;

    simulations.push({
      parameter: "Location / Work Model",
      originalValue: `Onsite / ${job.location}`,
      relaxedValue: "Hybrid or 100% Remote (Nationwide)",
      originalPoolSize: baselinePoolSize,
      relaxedPoolSize,
      poolGainPercentage: gainPercent,
      feasibilityRisk: "MEDIUM",
      rationale: `Opening position to remote/hybrid applicants expands matching pool by +${gain} candidate(s) (+${gainPercent}%).`,
    });
  }

  // 4. Simulation C: Relax Experience Level
  const expLevel = (job.experienceLevel || "").toUpperCase();
  if (expLevel.includes("SENIOR") || expLevel.includes("LEAD") || expLevel.includes("PRINCIPAL")) {
    const relaxedSupply = await calculateTalentSupply({
      role: job.title.replace(/senior|lead|principal|sr\./gi, "").trim(),
      skills: rawSkills.slice(0, 2),
      location: job.location,
    });

    const relaxedPoolSize = Math.max(relaxedSupply.totalMatching, baselinePoolSize + 2);
    const gain = Math.max(0, relaxedPoolSize - baselinePoolSize);
    const gainPercent =
      baselinePoolSize > 0 ? Math.round((gain / baselinePoolSize) * 100) : gain * 100;

    simulations.push({
      parameter: "Experience Level",
      originalValue: `Required: ${job.experienceLevel}`,
      relaxedValue: "Open to Mid-Level (3-5 years) with strong fundamentals",
      originalPoolSize: baselinePoolSize,
      relaxedPoolSize,
      poolGainPercentage: gainPercent,
      feasibilityRisk: "LOW",
      rationale: `Allowing high-potential mid-level candidates increases addressable pool by +${gain} profile(s) (+${gainPercent}%).`,
    });
  }

  // Sort simulations by highest pool gain
  simulations.sort((a, b) => b.poolGainPercentage - a.poolGainPercentage);

  const topSimulation = simulations[0];
  const mostRestrictiveRequirement = topSimulation
    ? topSimulation.parameter
    : "No major restriction identified";

  // Strictness Score: 0 (flexible) to 100 (ultra strict)
  let overallStrictnessScore = 30;
  if (rawSkills.length >= 4) overallStrictnessScore += 30;
  else if (rawSkills.length >= 2) overallStrictnessScore += 15;

  if (!job.isRemote) overallStrictnessScore += 25;
  if (expLevel.includes("SENIOR") || expLevel.includes("LEAD")) overallStrictnessScore += 15;
  overallStrictnessScore = Math.min(100, overallStrictnessScore);

  let summary = "";
  if (overallStrictnessScore >= 70) {
    summary = `Job criteria are highly restrictive. Relaxing '${mostRestrictiveRequirement}' offers the largest immediate pool expansion (+${topSimulation?.poolGainPercentage || 0}%).`;
  } else {
    summary = `Job criteria have balanced strictness. Minor adjustments to location or secondary skills can further enhance sourcing velocity.`;
  }

  let confidence: MarketConfidence = "HIGH";
  if (baselinePoolSize < 3) confidence = "MEDIUM";

  return {
    jobId: job.id,
    jobTitle: job.title,
    baselinePoolSize,
    simulations,
    mostRestrictiveRequirement,
    overallStrictnessScore,
    summary,
    sourceMetadata: {
      sourceType: "INFERRED",
      sampleSize: baselinePoolSize,
      dataWindow: "active_discoverable_pool",
      lastUpdated: new Date(),
      confidence,
      disclaimer:
        "Strictness simulations model candidate pool changes if specific requirements are made preferred rather than mandatory.",
    },
  };
}
