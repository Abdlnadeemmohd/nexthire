import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/events/eventEngine";

/**
 * Normalizes text for matching and search index tokens.
 */
function normalizeText(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .replace(/[-_./,\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface JobTalentMatchResult {
  jobId: string;
  jobTitle: string;
  totalMatches: number;
  strongMatches: number;
  remoteMatches: number;
  sampleCandidates: Array<{ id: string; name: string; headline: string }>;
}

/**
 * Evaluates the actual discoverable candidate pool in PostgreSQL against a published job.
 * Emits JOB_TO_TALENT_MATCH_ALERT to the job's recruiter with real counts.
 */
export async function calculateJobTalentMatches(
  jobId: string,
  recruiterId?: string
): Promise<JobTalentMatchResult | null> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: { select: { id: true, name: true } },
        recruiter: { select: { id: true, email: true, name: true } },
      },
    });

    if (!job) return null;

    const targetRecruiterId = recruiterId || job.recruiterId;
    const targetRecruiterEmail = job.recruiter?.email;

    // 1. Fetch only discoverable candidates from PostgreSQL
    const candidates = await prisma.user.findMany({
      where: {
        role: "JOB_SEEKER",
        isDiscoverable: true,
      },
      include: {
        profile: true,
      },
    });

    const jobTitleNorm = normalizeText(job.title);
    const jobSkills = (job.skills || "")
      .split(",")
      .map((s) => normalizeText(s))
      .filter(Boolean);

    let totalMatches = 0;
    let strongMatches = 0;
    let remoteMatches = 0;
    const sampleCandidates: Array<{ id: string; name: string; headline: string }> = [];

    for (const cand of candidates) {
      const candSkills = (cand.profile?.skills || "")
        .split(",")
        .map((s) => normalizeText(s))
        .filter(Boolean);

      const headlineNorm = normalizeText(cand.headline || "");

      // Check skill overlap
      const sharedSkills = jobSkills.filter((js) =>
        candSkills.some((cs) => cs.includes(js) || js.includes(cs))
      );

      const titleOverlap =
        jobTitleNorm.split(" ").some((w) => w.length > 2 && headlineNorm.includes(w)) ||
        headlineNorm.split(" ").some((w) => w.length > 2 && jobTitleNorm.includes(w));

      if (sharedSkills.length > 0 || titleOverlap) {
        totalMatches++;
        if (sharedSkills.length >= 2 || (sharedSkills.length >= 1 && titleOverlap)) {
          strongMatches++;
        }

        let prefs: any = {};
        try {
          if (cand.profile?.preferences) prefs = JSON.parse(cand.profile.preferences);
        } catch {}

        if (prefs.remotePreference === "REMOTE_ONLY" || prefs.remotePreference === "HYBRID_OR_REMOTE" || !cand.location) {
          remoteMatches++;
        }

        if (sampleCandidates.length < 3) {
          sampleCandidates.push({
            id: cand.id,
            name: cand.name,
            headline: cand.headline || "Technical Professional",
          });
        }
      }
    }

    // 2. Emit real database-backed Talent Intelligence notification if matches exist
    if (totalMatches > 0 && targetRecruiterId) {
      const skillsQuery = jobSkills.slice(0, 3).join(",");
      await emitEvent({
        type: "JOB_TO_TALENT_MATCH_ALERT",
        recipientId: targetRecruiterId,
        recipientEmail: targetRecruiterEmail,
        companyId: job.companyId,
        entityType: "Job",
        entityId: job.id,
        title: `🎯 ${totalMatches} Discoverable Candidates Match "${job.title}"`,
        body: `We identified ${totalMatches} discoverable candidates (${strongMatches} strong skill matches) in NextHire talent marketplace matching your job requirements.`,
        ctaText: "Review Matching Candidates",
        ctaUrl: `/recruiter/candidates?title=${encodeURIComponent(job.title)}&skills=${encodeURIComponent(skillsQuery)}`,
        metadata: {
          jobId: job.id,
          jobTitle: job.title,
          totalMatches,
          strongMatches,
          remoteMatches,
        },
      }).catch(() => {});
    }

    return {
      jobId: job.id,
      jobTitle: job.title,
      totalMatches,
      strongMatches,
      remoteMatches,
      sampleCandidates,
    };
  } catch (err) {
    console.error("[calculateJobTalentMatches Error]:", err);
    return null;
  }
}

/**
 * Emits SEARCH_INTENT_TALENT_ALERT when a recruiter searches with queries that match discoverable talent.
 */
export async function emitSearchIntentIntelligence(
  recruiterId: string,
  recruiterEmail: string | undefined,
  companyId: string | null | undefined,
  query: string,
  matchCount: number
): Promise<void> {
  if (!query || matchCount <= 0) return;

  const normalizedQuery = normalizeText(query);

  await emitEvent({
    type: "SEARCH_INTENT_TALENT_ALERT",
    recipientId: recruiterId,
    recipientEmail: recruiterEmail,
    companyId: companyId || undefined,
    title: `🧠 ${matchCount} Candidates Match "${query}"`,
    body: `Your search for "${query}" matched ${matchCount} active discoverable candidates in the marketplace.`,
    ctaText: "View Matching Talent",
    ctaUrl: `/recruiter/candidates?q=${encodeURIComponent(query)}`,
    metadata: {
      query: normalizedQuery,
      matchCount,
    },
  }).catch(() => {});
}

/**
 * Computes talent supply trend based on discoverable candidate growth in PostgreSQL.
 */
export async function calculateTalentSupplyTrends(category = "Engineering"): Promise<{
  trendPercentage: number | null;
  trendDirection: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  description: string;
}> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentWeekCount = await prisma.user.count({
      where: {
        role: "JOB_SEEKER",
        isDiscoverable: true,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const previousWeekCount = await prisma.user.count({
      where: {
        role: "JOB_SEEKER",
        isDiscoverable: true,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    if (previousWeekCount === 0 && currentWeekCount === 0) {
      return {
        trendPercentage: null,
        trendDirection: "INSUFFICIENT_DATA",
        description: "Not enough data to calculate trend.",
      };
    }

    const baseline = previousWeekCount > 0 ? previousWeekCount : 1;
    const diff = currentWeekCount - previousWeekCount;
    const pct = Math.round((diff / baseline) * 100);

    const trendDirection = pct > 0 ? "UP" : pct < 0 ? "DOWN" : "STABLE";
    const description = `${category} talent supply ${pct >= 0 ? "increased" : "decreased"} by ${Math.abs(pct)}% this week.`;

    return {
      trendPercentage: pct,
      trendDirection,
      description,
    };
  } catch (err) {
    return {
      trendPercentage: null,
      trendDirection: "INSUFFICIENT_DATA",
      description: "Not enough data to calculate trend.",
    };
  }
}

/**
 * Generates and dispatches the Weekly Talent Intelligence Digest for a recruiter.
 */
export async function generateWeeklyIntelligenceDigest(
  recruiterId: string,
  companyId?: string | null
): Promise<boolean> {
  try {
    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterId },
      include: { company: true },
    });

    if (!recruiter || recruiter.role !== "RECRUITER") return false;

    const targetCompanyId = companyId || recruiter.companyId;

    // Real metrics from PostgreSQL
    const activeJobsCount = await prisma.job.count({
      where: { companyId: targetCompanyId || "", status: "ACTIVE" },
    });

    const pendingApplicantsCount = await prisma.application.count({
      where: {
        job: { companyId: targetCompanyId || "" },
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
    });

    const discoverableCandidatesCount = await prisma.user.count({
      where: { role: "JOB_SEEKER", isDiscoverable: true },
    });

    await emitEvent({
      type: "RECRUITER_WEEKLY_INTELLIGENCE_DIGEST",
      recipientId: recruiter.id,
      recipientEmail: recruiter.email,
      companyId: targetCompanyId || undefined,
      title: "📊 NextHire Weekly Talent Intelligence Digest",
      body: `Your weekly hiring digest: ${pendingApplicantsCount} pending applications across ${activeJobsCount} active positions. ${discoverableCandidatesCount} discoverable candidates available in talent pool.`,
      ctaText: "Open Talent Radar",
      ctaUrl: "/recruiter",
      metadata: {
        activeJobsCount,
        pendingApplicantsCount,
        discoverableCandidatesCount,
      },
    }).catch(() => {});

    return true;
  } catch (err) {
    console.error("[generateWeeklyIntelligenceDigest Error]:", err);
    return false;
  }
}
