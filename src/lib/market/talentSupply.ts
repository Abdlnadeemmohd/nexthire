/**
 * NextHire Phase 12 — Observed Talent Supply Engine
 * Calculates discoverable candidate ecosystem supply from PostgreSQL.
 * Distinguishes Total Matching, Qualified, and Verified candidate tiers.
 */

import { prisma } from "@/lib/prisma";
import { ConcentrationLevel, MarketConfidence, TalentSupplySummary } from "./types";

function normalizeText(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .replace(/[-_./,\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface TalentSupplyQuery {
  role?: string;
  skills?: string[] | string;
  location?: string;
  country?: string;
  minExperience?: number;
  jobId?: string;
  companyId?: string;
}

/**
 * Calculates candidate supply for a given role, skills, or job requisition.
 * Strictly enforces isDiscoverable = true and role = JOB_SEEKER.
 */
export async function calculateTalentSupply(
  query: TalentSupplyQuery = {}
): Promise<TalentSupplySummary> {
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
        orderBy: { overallScore: "desc" },
      },
    },
  });

  const totalDiscoverable = allDiscoverable.length;

  // If a jobId is provided, retrieve job details
  let targetTitle = query.role || "";
  let targetSkills: string[] = [];
  let targetLocation = query.location || "";
  let targetMinExp = query.minExperience || 0;

  if (query.jobId) {
    const job = await prisma.job.findUnique({
      where: { id: query.jobId },
      select: {
        title: true,
        skills: true,
        location: true,
        country: true,
        experienceLevel: true,
      },
    });

    if (job) {
      if (!targetTitle) targetTitle = job.title;
      if (!targetLocation) targetLocation = job.location;
      if (!query.skills && job.skills) {
        targetSkills = job.skills.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  if (typeof query.skills === "string") {
    targetSkills = query.skills.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(query.skills)) {
    targetSkills = query.skills.filter(Boolean);
  }

  const normalizedTitle = normalizeText(targetTitle);
  const normalizedSkills = targetSkills.map((s) => normalizeText(s));
  const normalizedLoc = normalizeText(targetLocation);

  let totalMatching = 0;
  let qualifiedCount = 0;
  let verifiedCount = 0;
  let partiallyVerifiedCount = 0;
  let unverifiedCount = 0;

  const cityCounts: Record<string, number> = {};

  for (const cand of allDiscoverable) {
    const candHeadline = normalizeText(cand.headline || "");
    const candBio = normalizeText(cand.bio || "");
    const candSkills = (cand.profile?.skills || "")
      .split(",")
      .map((s) => normalizeText(s))
      .filter(Boolean);
    const candLocation = cand.location || "Unspecified";

    // 1. Check Skill & Title Matching
    const matchingSkills = normalizedSkills.filter((reqSkill) =>
      candSkills.some((cs) => cs.includes(reqSkill) || reqSkill.includes(cs))
    );

    const titleWords = normalizedTitle.split(" ").filter((w) => w.length > 2);
    const hasTitleOverlap =
      titleWords.length > 0 &&
      titleWords.some((w) => candHeadline.includes(w) || candBio.includes(w));

    const isMatch =
      normalizedSkills.length > 0
        ? matchingSkills.length > 0 || hasTitleOverlap
        : normalizedTitle.length > 0
        ? hasTitleOverlap || candSkills.length > 0
        : true; // If empty query, returns all discoverable

    if (!isMatch) continue;

    totalMatching++;

    // Track geographic count for concentration
    cityCounts[candLocation] = (cityCounts[candLocation] || 0) + 1;

    // 2. Determine Qualification Tier
    // Qualified requires: at least 2 matching skills OR (1 matching skill + title overlap) OR strong profile completeness (> 80%)
    const isQualified =
      matchingSkills.length >= 2 ||
      (matchingSkills.length >= 1 && hasTitleOverlap) ||
      (cand.profile?.completeness || 0) >= 80;

    if (isQualified) {
      qualifiedCount++;
    }

    // 3. Determine Verification Tier (Phase 8 integration)
    const topSubmission = cand.assessmentSubmissions[0];
    if (topSubmission) {
      if (topSubmission.overallScore >= 75) {
        verifiedCount++;
      } else if (topSubmission.overallScore >= 50) {
        partiallyVerifiedCount++;
      } else {
        unverifiedCount++;
      }
    } else {
      unverifiedCount++;
    }
  }

  // 4. Calculate Talent Concentration Index
  let concentration: ConcentrationLevel = "INSUFFICIENT_DATA";
  if (totalMatching >= 3) {
    const maxInSingleCity = Math.max(...Object.values(cityCounts), 0);
    const topCityShare = maxInSingleCity / totalMatching;

    if (topCityShare >= 0.6) {
      concentration = "HIGH_CONCENTRATION";
    } else if (topCityShare >= 0.35) {
      concentration = "MODERATE_CONCENTRATION";
    } else {
      concentration = "DISTRIBUTED";
    }
  }

  // 5. Determine Confidence
  let confidence: MarketConfidence = "HIGH";
  if (totalDiscoverable < 5) confidence = "INSUFFICIENT";
  else if (totalMatching < 3) confidence = "LOW";
  else if (totalMatching < 10) confidence = "MEDIUM";

  return {
    totalDiscoverable,
    totalMatching,
    qualifiedCount,
    verifiedCount,
    partiallyVerifiedCount,
    unverifiedCount,
    concentration,
    sourceMetadata: {
      sourceType: "PLATFORM_OBSERVED",
      sampleSize: totalMatching,
      dataWindow: "active_discoverable_pool",
      lastUpdated: new Date(),
      confidence,
      disclaimer:
        "Talent supply reflects NextHire's observed discoverable candidate ecosystem and verified assessment records.",
    },
  };
}
