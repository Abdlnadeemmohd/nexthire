import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getRecruiterEntitlements,
  consumeCandidateSearch,
  EntitlementLimitError,
} from "@/lib/billing/entitlements";
import { maskEmail, maskPhone } from "@/lib/privacy/contactProtection";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Sign in required." },
      { status: 401 }
    );
  }

  if (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Recruiter access required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const filterSkill = (searchParams.get("skill") || searchParams.get("skills") || "").trim();
  const filterTitle = (searchParams.get("title") || searchParams.get("role") || "").trim();
  const filterCompany = (searchParams.get("company") || "").trim();
  const filterStatus = (searchParams.get("status") || searchParams.get("employmentStatus") || "").trim();

  // 1. Enforce candidate search quota / trial limit consumption via Entitlements
  if (authUser.role === "RECRUITER") {
    try {
      await consumeCandidateSearch(authUser.id);
    } catch (err: any) {
      if (err instanceof EntitlementLimitError || err.name === "EntitlementLimitError") {
        return NextResponse.json(
          {
            success: false,
            error: err.message,
            code: err.code,
            metadata: err.metadata,
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
      throw err;
    }
  }

  try {
    // 2. Query discoverable candidates from PostgreSQL
    const candidates = await prisma.user.findMany({
      where: {
        role: "JOB_SEEKER",
        isDiscoverable: true,
      },
      include: {
        profile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch recruiter's unlocked candidates
    const unlockedRecords = await prisma.candidateUnlock.findMany({
      where: { recruiterId: authUser.id },
      select: { candidateId: true },
    });
    const unlockedCandidateIds = new Set(unlockedRecords.map((u) => u.candidateId));

    // 4. Fetch entitlements for client UI
    const entitlements = await getRecruiterEntitlements(authUser.id);

    // Helper to normalize search text
    const normalize = (txt: string) =>
      txt.toLowerCase().replace(/[-_./,\t]/g, " ").replace(/\s+/g, " ").trim();

    const SYNONYMS: Record<string, string[]> = {
      "fullstack": ["full stack", "full-stack"],
      "full stack": ["fullstack", "full-stack"],
      "full-stack": ["fullstack", "full stack"],
      "frontend": ["front end", "front-end"],
      "front end": ["frontend", "front-end"],
      "front-end": ["frontend", "front end"],
      "backend": ["back end", "back-end"],
      "back end": ["backend", "back-end"],
      "back-end": ["backend", "back end"],
      "react": ["react.js", "reactjs"],
      "reactjs": ["react", "react.js"],
      "react.js": ["react", "reactjs"],
      "node": ["node.js", "nodejs"],
      "nodejs": ["node", "node.js"],
      "node.js": ["node", "nodejs"],
      "next": ["next.js", "nextjs"],
      "nextjs": ["next", "next.js"],
      "js": ["javascript", "typescript", "ts"],
      "javascript": ["js", "typescript", "ts", "react"],
      "ts": ["typescript", "javascript", "js"],
      "typescript": ["ts", "javascript", "js"],
      "cloud": ["aws", "azure", "gcp", "devops", "cloud computing"],
      "aws": ["cloud", "amazon web services"],
      "azure": ["cloud", "microsoft azure"],
      "gcp": ["cloud", "google cloud platform"],
      "ui/ux": ["ui ux", "ui", "ux", "designer"],
      "ui ux": ["ui/ux", "ui", "ux", "designer"],
      "engineer": ["developer", "engineering"],
      "developer": ["engineer", "engineering"],
      "engineering": ["engineer", "developer"],
      "tech": ["technical", "technology"],
      "technical": ["tech", "technology"],
      "professional": ["specialist", "practitioner"],
    };

    // 5. Post-process candidates for multi-criteria matching & contact protection
    const formatted = candidates
      .map((cand) => {
        let skillsArray: string[] = [];
        if (cand.profile?.skills) {
          skillsArray = cand.profile.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        let preferences: any = {};
        try {
          if (cand.profile?.preferences && cand.profile.preferences !== "{}") {
            preferences = JSON.parse(cand.profile.preferences);
          }
        } catch {}

        let experience: any[] = [];
        try {
          if (cand.profile?.experience && cand.profile.experience !== "[]") {
            experience = JSON.parse(cand.profile.experience);
          }
        } catch {}

        let education: any[] = [];
        try {
          if (cand.profile?.education && cand.profile.education !== "[]") {
            education = JSON.parse(cand.profile.education);
          }
        } catch {}

        let projects: any[] = [];
        try {
          if (cand.profile?.projects && cand.profile.projects !== "[]") {
            projects = JSON.parse(cand.profile.projects);
          }
        } catch {}

        let certs: any[] = [];
        try {
          if (cand.profile?.certifications && cand.profile.certifications !== "[]") {
            certs = JSON.parse(cand.profile.certifications);
          }
        } catch {}

        const previousCompanies = experience.map((e) => e.company).filter(Boolean);
        const roles = experience.map((e) => e.role || e.title).filter(Boolean);
        const degrees = education.map((e) => `${e.degree || ""} ${e.school || ""} ${e.fieldOfStudy || ""}`).filter(Boolean);
        const projectNames = projects.map((p) => p.title || p.name).filter(Boolean);
        const certNames = certs.map((c) => c.name || c.title).filter(Boolean);

        const employmentStatus =
          preferences.employmentStatus ||
          (preferences.openToWorkStatus === "ACTIVELY_LOOKING"
            ? "Available for Work"
            : preferences.openToWorkStatus === "NOT_LOOKING"
            ? "Not Looking"
            : "Open to Opportunities");

        const cleanHeadline =
          cand.headline && !cand.headline.includes("Verified via Firebase")
            ? cand.headline
            : "Technical Professional";

        // Construct complete normalized searchable corpus for the candidate
        const searchableCorpus = normalize(
          `${cand.name} ${cleanHeadline} ${cand.bio || ""} ${cand.location || ""} ${skillsArray.join(" ")} ${cand.profile?.skills || ""} ${previousCompanies.join(" ")} ${roles.join(" ")} ${degrees.join(" ")} ${projectNames.join(" ")} ${certNames.join(" ")}`
        );

        // Compute matching criteria explanations
        const matchedReasons: string[] = [];
        if (q) {
          const normQ = normalize(q);
          const rawTokens = normQ.split(/\s+/).filter(Boolean);

          // Expand query with synonyms
          const allQueryVariants = new Set<string>([normQ, ...rawTokens]);
          rawTokens.forEach((t) => {
            if (SYNONYMS[t]) SYNONYMS[t].forEach((syn) => allQueryVariants.add(syn));
          });
          if (SYNONYMS[normQ]) {
            SYNONYMS[normQ].forEach((syn) => allQueryVariants.add(syn));
          }

          const hasMatch = Array.from(allQueryVariants).some((v) =>
            searchableCorpus.includes(normalize(v))
          );

          if (!hasMatch) return null;

          if (normalize(cand.name).includes(normQ) || rawTokens.some((t) => normalize(cand.name).includes(t))) {
            matchedReasons.push("Name match");
          }
          if (normalize(cleanHeadline).includes(normQ) || rawTokens.some((t) => normalize(cleanHeadline).includes(t))) {
            matchedReasons.push(`Role: ${cleanHeadline}`);
          }
          const matchedSkills = skillsArray.filter((s) =>
            Array.from(allQueryVariants).some((v) => normalize(s).includes(normalize(v)))
          );
          if (matchedSkills.length > 0) {
            matchedReasons.push(`Skill: ${matchedSkills.slice(0, 2).join(", ")}`);
          }
          const matchedComp = previousCompanies.find((c) =>
            Array.from(allQueryVariants).some((v) => normalize(c).includes(normalize(v)))
          );
          if (matchedComp) {
            matchedReasons.push(`Experience: ${matchedComp}`);
          }
          if (matchedReasons.length === 0) {
            matchedReasons.push("Search Match");
          }
        }

        if (filterTitle) {
          const normTitle = normalize(filterTitle);
          const hasTitle =
            normalize(cleanHeadline).includes(normTitle) ||
            roles.some((r) => normalize(r).includes(normTitle));
          if (hasTitle) {
            matchedReasons.push(`Title: ${filterTitle}`);
          } else {
            return null;
          }
        }

        if (filterSkill) {
          const reqSkills = filterSkill.split(",").map((s) => normalize(s)).filter(Boolean);
          const hasMatchingSkill = reqSkills.some((rs) =>
            skillsArray.some((s) => normalize(s).includes(rs))
          );
          if (hasMatchingSkill) {
            matchedReasons.push(`Skill: ${filterSkill}`);
          } else if (reqSkills.length > 0) {
            return null;
          }
        }

        if (filterCompany) {
          const normComp = normalize(filterCompany);
          const hasCompany = previousCompanies.some((c) =>
            normalize(c).includes(normComp)
          );
          if (hasCompany) {
            matchedReasons.push(`Previous Company: ${filterCompany}`);
          } else {
            return null;
          }
        }

        if (filterStatus && filterStatus !== "ALL") {
          if (employmentStatus.toLowerCase() === filterStatus.toLowerCase()) {
            matchedReasons.push(`Status: ${employmentStatus}`);
          } else {
            return null;
          }
        }

        const isUnlocked = unlockedCandidateIds.has(cand.id);

        return {
          id: cand.id,
          name: cand.name,
          headline: cleanHeadline,
          location: cand.location || "Location not specified",
          skills: skillsArray,
          employmentStatus,
          previousCompanies,
          matchedReasons: matchedReasons.length > 0 ? matchedReasons : ["Talent Marketplace Match"],
          bio: cand.bio || null,
          avatar: cand.avatar || null,
          resumeScore: cand.profile?.resumeScore || null,
          resumeUrl: isUnlocked && entitlements.canDownloadResume ? `/api/documents/download?userId=${cand.id}` : null,
          hasResume: Boolean(cand.profile?.resumeUrl),
          email: isUnlocked ? cand.email : maskEmail(cand.email),
          phone: isUnlocked ? cand.phone || null : maskPhone(cand.phone),
          isUnlocked,
          isVerified: Boolean(cand.companyId) || false,
          canDownloadResume: entitlements.canDownloadResume,
          joinedDate: cand.createdAt.toISOString().split("T")[0],
        };
      })
      .filter(Boolean);

    // Asynchronously dispatch Search Intent and Talent Demand intelligence alerts if search query was provided
    const searchQuery = q || filterSkill || filterTitle;
    if (searchQuery && formatted.length > 0 && authUser.role === "RECRUITER") {
      import("@/lib/talent/talentIntelligence").then(({ emitSearchIntentIntelligence }) => {
        emitSearchIntentIntelligence(
          authUser.id,
          authUser.email,
          authUser.companyId,
          searchQuery,
          formatted.length
        ).catch(() => {});
      });

      // If high candidate count is found, also emit TALENT_DEMAND_ALERT
      if (formatted.length >= 3) {
        import("@/lib/events/eventEngine").then(({ emitEvent }) => {
          emitEvent({
            type: "TALENT_DEMAND_ALERT",
            recipientId: authUser.id,
            recipientEmail: authUser.email,
            companyId: authUser.companyId || undefined,
            title: `🔥 High Talent Availability: ${searchQuery}`,
            body: `${formatted.length} discoverable candidates match your talent search criteria for "${searchQuery}".`,
            ctaText: "Explore Talent",
            ctaUrl: `/recruiter/candidates?q=${encodeURIComponent(searchQuery)}`,
            metadata: { query: searchQuery, count: formatted.length },
          }).catch(() => {});
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
      entitlements: {
        isTrial: entitlements.isTrial,
        trialStatus: entitlements.trialStatus,
        trialSearchesUsed: entitlements.trialSearchesUsed,
        trialSearchesLimit: entitlements.trialSearchesLimit,
        planId: entitlements.planId,
        planName: entitlements.planName,
        planTier: entitlements.planTier,
        candidateUnlocksRemainingToday: entitlements.candidateUnlocksRemainingToday,
        resumeUnlocksRemainingToday: entitlements.resumeUnlocksRemainingToday,
        canDownloadResume: entitlements.canDownloadResume,
        canRequestContact: entitlements.canRequestContact,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/recruiter/candidates Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to search candidates" },
      { status: 500 }
    );
  }
}
