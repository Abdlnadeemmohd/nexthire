/**
 * NextHire Phase 12 — Skill Scarcity & Adjacent Skill Engine
 * Calculates deterministic relative scarcity levels and discovers adjacent skill patterns from real candidate data.
 */

import { prisma } from "@/lib/prisma";
import { MarketConfidence, SkillScarcityLevel, SkillSupplyMetric } from "./types";

function normalizeText(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .replace(/[-_./,\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates skill supply metrics for a list of skills or for a specific job.
 */
export async function calculateSkillScarcity(
  skillsToAnalyze: string[] = [],
  jobId?: string
): Promise<SkillSupplyMetric[]> {
  // If jobId provided and skills not specified, load from Job
  if (jobId && skillsToAnalyze.length === 0) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { skills: true },
    });
    if (job && job.skills) {
      skillsToAnalyze = job.skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const allDiscoverable = await prisma.user.findMany({
    where: {
      role: "JOB_SEEKER",
      isDiscoverable: true,
    },
    include: {
      profile: true,
      assessmentSubmissions: {
        where: { status: { in: ["EVALUATED", "VERIFIED"] } },
        take: 3,
      },
    },
  });

  const totalPool = allDiscoverable.length;

  if (totalPool < 3 && skillsToAnalyze.length === 0) {
    return [];
  }

  // Pre-parse candidate skill sets for fast co-occurrence and matching
  const candidateSkillSets: Array<{
    skills: string[];
    verifiedSkills: string[];
  }> = allDiscoverable.map((c) => {
    const rawSkills = (c.profile?.skills || "")
      .split(",")
      .map((s) => normalizeText(s))
      .filter(Boolean);

    const verifiedSkills: string[] = [];
    for (const sub of c.assessmentSubmissions) {
      try {
        const matrix = JSON.parse(sub.skillVerificationMatrix || "[]");
        if (Array.isArray(matrix)) {
          for (const item of matrix) {
            if (item.assessmentEvidence === "VERIFIED" && item.skill) {
              verifiedSkills.push(normalizeText(item.skill));
            }
          }
        }
      } catch {}
    }

    return {
      skills: Array.from(new Set(rawSkills)),
      verifiedSkills: Array.from(new Set(verifiedSkills)),
    };
  });

  // If no specific skills requested, evaluate top skills in candidate pool
  if (skillsToAnalyze.length === 0) {
    const skillFreq: Record<string, number> = {};
    for (const cand of candidateSkillSets) {
      for (const s of cand.skills) {
        skillFreq[s] = (skillFreq[s] || 0) + 1;
      }
    }
    // Pick top 10 most frequent skills
    skillsToAnalyze = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s]) => s);
  }

  const results: SkillSupplyMetric[] = [];

  for (const rawSkill of skillsToAnalyze) {
    const targetNorm = normalizeText(rawSkill);
    if (!targetNorm) continue;

    let matchingCount = 0;
    let verifiedCount = 0;
    const coOccurrenceCounts: Record<string, number> = {};

    for (const cand of candidateSkillSets) {
      const hasSkill = cand.skills.some(
        (s) => s.includes(targetNorm) || targetNorm.includes(s)
      );

      if (hasSkill) {
        matchingCount++;

        // Track co-occurring skills
        for (const otherSkill of cand.skills) {
          if (!otherSkill.includes(targetNorm) && !targetNorm.includes(otherSkill)) {
            coOccurrenceCounts[otherSkill] = (coOccurrenceCounts[otherSkill] || 0) + 1;
          }
        }
      }

      const isVerified = cand.verifiedSkills.some(
        (vs) => vs.includes(targetNorm) || targetNorm.includes(vs)
      );
      if (isVerified) {
        verifiedCount++;
      }
    }

    // Calculate pool percentage
    const poolPercentage = totalPool > 0 ? Math.round((matchingCount / totalPool) * 100) : 0;

    // Classify Scarcity Level deterministically
    let relativeScarcity: SkillScarcityLevel = "INSUFFICIENT_DATA";
    if (totalPool < 5) {
      relativeScarcity = "INSUFFICIENT_DATA";
    } else if (matchingCount <= 2 || poolPercentage < 1) {
      relativeScarcity = "CRITICALLY_SCARCE";
    } else if (poolPercentage <= 3) {
      relativeScarcity = "SCARCE";
    } else if (poolPercentage <= 9) {
      relativeScarcity = "LIMITED";
    } else if (poolPercentage <= 24) {
      relativeScarcity = "HEALTHY";
    } else {
      relativeScarcity = "ABUNDANT";
    }

    // Determine Confidence
    let confidence: MarketConfidence = "HIGH";
    if (totalPool < 5) confidence = "INSUFFICIENT";
    else if (totalPool < 15) confidence = "MEDIUM";

    // Evidence statements
    const evidence: string[] = [
      `Found ${matchingCount} discoverable candidate(s) possessing '${rawSkill}' out of ${totalPool} total profiles (${poolPercentage}% pool share).`,
      `${verifiedCount} candidate(s) have verified assessment evidence for this skill.`,
    ];

    if (relativeScarcity === "SCARCE" || relativeScarcity === "CRITICALLY_SCARCE") {
      evidence.push(
        `High scarcity index: Fewer than 4% of the active platform talent pool lists this skill.`
      );
    }

    // Extract top 4 adjacent co-occurring skills
    const adjacentSkills = Object.entries(coOccurrenceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([s]) => s);

    results.push({
      skill: rawSkill,
      matchingCount,
      verifiedCount,
      poolPercentage,
      relativeScarcity,
      confidence,
      evidence,
      adjacentSkills,
    });
  }

  return results;
}
