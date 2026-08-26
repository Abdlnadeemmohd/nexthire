/**
 * NextHire Phase 12 — Location Talent Supply Engine
 * Calculates geographic candidate concentration and density per hub.
 * Enforces privacy: only city/country aggregations are exposed without private street addresses.
 */

import { prisma } from "@/lib/prisma";
import { LocationSupplyMetric } from "./types";

function normalizeCity(location: string): { city: string; country: string } {
  if (!location) return { city: "Remote / Unspecified", country: "India" };
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1] };
  }
  return { city: parts[0], country: "India" };
}

/**
 * Calculates candidate supply distribution across geographic hubs.
 */
export async function calculateLocationSupply(
  jobId?: string
): Promise<LocationSupplyMetric[]> {
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

  let targetSkills: string[] = [];
  if (jobId) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { skills: true },
    });
    if (job && job.skills) {
      targetSkills = job.skills.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const hubMap: Record<
    string,
    {
      city: string;
      country: string;
      total: number;
      qualified: number;
      verified: number;
    }
  > = {};

  for (const cand of allDiscoverable) {
    const { city, country } = normalizeCity(cand.location || "");
    const hubKey = `${city}|${country}`;

    if (!hubMap[hubKey]) {
      hubMap[hubKey] = { city, country, total: 0, qualified: 0, verified: 0 };
    }

    const candSkills = (cand.profile?.skills || "").toLowerCase();
    const isMatching =
      targetSkills.length === 0 ||
      targetSkills.some((s) => candSkills.includes(s));

    if (!isMatching) continue;

    hubMap[hubKey].total++;

    // Qualification check
    const matchingCount = targetSkills.filter((s) => candSkills.includes(s)).length;
    const isQualified =
      targetSkills.length === 0
        ? (cand.profile?.completeness || 0) >= 70
        : matchingCount >= 2 || (matchingCount >= 1 && (cand.profile?.completeness || 0) >= 80);

    if (isQualified) {
      hubMap[hubKey].qualified++;
    }

    // Verification check
    if (cand.assessmentSubmissions.length > 0 && cand.assessmentSubmissions[0].overallScore >= 75) {
      hubMap[hubKey].verified++;
    }
  }

  const totalMatchingInAllHubs = Object.values(hubMap).reduce((acc, h) => acc + h.total, 0);

  const metrics: LocationSupplyMetric[] = Object.values(hubMap)
    .map((h) => ({
      city: h.city,
      country: h.country,
      totalCandidates: h.total,
      qualifiedCandidates: h.qualified,
      verifiedCandidates: h.verified,
      percentageOfPool:
        totalMatchingInAllHubs > 0
          ? Math.round((h.total / totalMatchingInAllHubs) * 100)
          : 0,
    }))
    .filter((h) => h.totalCandidates > 0)
    .sort((a, b) => b.totalCandidates - a.totalCandidates);

  return metrics;
}
