/**
 * NextHire Phase 12 — Seniority & Experience Distribution Engine
 * Classifies talent pool by experience years and seniority tiers.
 */

import { prisma } from "@/lib/prisma";
import { SeniorityLevel, SenioritySupplyMetric } from "./types";

function extractExperienceYears(experienceJson: string, headline: string): number {
  let expYears = 0;
  try {
    const expList = JSON.parse(experienceJson || "[]");
    if (Array.isArray(expList) && expList.length > 0) {
      expYears = expList.length * 1.5; // Estimated duration per role if dates missing
    }
  } catch {}

  const hl = (headline || "").toLowerCase();
  if (hl.includes("lead") || hl.includes("principal") || hl.includes("architect")) {
    expYears = Math.max(expYears, 8);
  } else if (hl.includes("senior") || hl.includes("sr.")) {
    expYears = Math.max(expYears, 5);
  } else if (hl.includes("director") || hl.includes("vp") || hl.includes("head of") || hl.includes("cto")) {
    expYears = Math.max(expYears, 12);
  } else if (hl.includes("junior") || hl.includes("jr.") || hl.includes("intern")) {
    expYears = Math.min(expYears || 1, 2);
  } else if (expYears === 0) {
    expYears = 3; // default mid-level estimate
  }

  return expYears;
}

function classifySeniority(years: number, headline: string): SeniorityLevel {
  const hl = (headline || "").toLowerCase();
  if (hl.includes("director") || hl.includes("vp") || hl.includes("head of") || hl.includes("cto") || hl.includes("cio") || hl.includes("founder")) {
    return "EXECUTIVE";
  }
  if (hl.includes("principal") || hl.includes("staff") || hl.includes("distinguished") || years >= 12) {
    return "PRINCIPAL";
  }
  if (hl.includes("lead") || hl.includes("tech lead") || hl.includes("manager") || (years >= 8 && years < 12)) {
    return "LEAD";
  }
  if (hl.includes("senior") || hl.includes("sr.") || (years >= 5 && years < 8)) {
    return "SENIOR";
  }
  if (years >= 3 && years < 5) {
    return "MID";
  }
  if (years >= 1 && years < 3) {
    return "JUNIOR";
  }
  return "ENTRY";
}

/**
 * Calculates candidate seniority distribution across the talent pool.
 */
export async function calculateSenioritySupply(jobId?: string): Promise<SenioritySupplyMetric[]> {
  const allDiscoverable = await prisma.user.findMany({
    where: {
      role: "JOB_SEEKER",
      isDiscoverable: true,
    },
    include: {
      profile: true,
      assessmentSubmissions: {
        where: { status: { in: ["EVALUATED", "VERIFIED"] } },
        take: 1,
      },
    },
  });

  const totalPool = allDiscoverable.length;
  if (totalPool === 0) return [];

  const tierMap: Record<
    SeniorityLevel,
    { total: number; qualified: number; verified: number; totalYears: number }
  > = {
    ENTRY: { total: 0, qualified: 0, verified: 0, totalYears: 0 },
    JUNIOR: { total: 0, qualified: 0, verified: 0, totalYears: 0 },
    MID: { total: 0, qualified: 0, verified: 0, totalYears: 0 },
    SENIOR: { total: 0, qualified: 0, verified: 0, totalYears: 0 },
    LEAD: { total: 0, qualified: 0, verified: 0, totalYears: 0 },
    PRINCIPAL: { total: 0, qualified: 0, verified: 0, totalYears: 0 },
    EXECUTIVE: { total: 0, qualified: 0, verified: 0, totalYears: 0 },
  };

  for (const cand of allDiscoverable) {
    const years = extractExperienceYears(cand.profile?.experience || "", cand.headline || "");
    const level = classifySeniority(years, cand.headline || "");

    tierMap[level].total++;
    tierMap[level].totalYears += years;

    const isQualified = (cand.profile?.completeness || 0) >= 70;
    if (isQualified) tierMap[level].qualified++;

    if (cand.assessmentSubmissions.length > 0 && cand.assessmentSubmissions[0].overallScore >= 75) {
      tierMap[level].verified++;
    }
  }

  const levels: SeniorityLevel[] = [
    "ENTRY",
    "JUNIOR",
    "MID",
    "SENIOR",
    "LEAD",
    "PRINCIPAL",
    "EXECUTIVE",
  ];

  const metrics: SenioritySupplyMetric[] = levels.map((lvl) => {
    const data = tierMap[lvl];
    const avgYears = data.total > 0 ? Math.round((data.totalYears / data.total) * 10) / 10 : 0;
    return {
      level: lvl,
      totalCount: data.total,
      qualifiedCount: data.qualified,
      verifiedCount: data.verified,
      avgExperienceYears: avgYears,
      percentageOfPool: totalPool > 0 ? Math.round((data.total / totalPool) * 100) : 0,
    };
  });

  return metrics;
}
