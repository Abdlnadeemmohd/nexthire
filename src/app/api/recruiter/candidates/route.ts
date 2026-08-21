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
  const authUser = await getAuthenticatedUser(request);
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
    // 2. Query candidates who are discoverable (isDiscoverable === true)
    const whereConditions: any = {
      role: "JOB_SEEKER",
      isDiscoverable: true,
    };

    if (q) {
      whereConditions.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { headline: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { profile: { skills: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (filterTitle) {
      whereConditions.headline = { contains: filterTitle, mode: "insensitive" };
    }

    const candidates = await prisma.user.findMany({
      where: whereConditions,
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

        const previousCompanies = experience.map((e) => e.company).filter(Boolean);

        const employmentStatus =
          preferences.employmentStatus ||
          (preferences.openToWorkStatus === "ACTIVELY_LOOKING"
            ? "Available for Work"
            : preferences.openToWorkStatus === "NOT_LOOKING"
            ? "Not Looking"
            : "Open to Opportunities");

        // Compute matching criteria explanations
        const matchedReasons: string[] = [];
        if (q) {
          if (cand.name.toLowerCase().includes(q.toLowerCase())) matchedReasons.push("Name match");
          if (cand.headline?.toLowerCase().includes(q.toLowerCase())) matchedReasons.push("Role match");
          if (skillsArray.some((s) => s.toLowerCase().includes(q.toLowerCase()))) matchedReasons.push("Skill match");
        }
        if (filterSkill) {
          const reqSkills = filterSkill.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
          const hasMatchingSkill = reqSkills.some((rs) =>
            skillsArray.some((s) => s.toLowerCase().includes(rs))
          );
          if (hasMatchingSkill) matchedReasons.push(`Skill: ${filterSkill}`);
          else if (reqSkills.length > 0) return null; // Exclude if skill filter specified but not matched
        }
        if (filterCompany) {
          const hasCompany = previousCompanies.some((c) =>
            c.toLowerCase().includes(filterCompany.toLowerCase())
          );
          if (hasCompany) matchedReasons.push(`Previous Company: ${filterCompany}`);
          else return null; // Exclude if company filter specified but not matched
        }
        if (filterStatus) {
          if (employmentStatus.toLowerCase() === filterStatus.toLowerCase()) {
            matchedReasons.push(`Status: ${employmentStatus}`);
          } else {
            return null; // Exclude if status specified but not matched
          }
        }

        const isUnlocked = unlockedCandidateIds.has(cand.id);

        return {
          id: cand.id,
          name: cand.name,
          headline: cand.headline || "Technical Professional",
          location: cand.location || "Location not specified",
          skills: skillsArray,
          employmentStatus,
          previousCompanies,
          matchedReasons: matchedReasons.length > 0 ? matchedReasons : ["Talent Marketplace Match"],
          bio: cand.bio || null,
          avatar: cand.avatar || null,
          resumeScore: cand.profile?.resumeScore || null,
          resumeUrl: isUnlocked && entitlements.canDownloadResume ? cand.profile?.resumeUrl : null,
          hasResume: Boolean(cand.profile?.resumeUrl),
          email: isUnlocked ? cand.email : maskEmail(cand.email),
          phone: isUnlocked ? cand.phone || null : maskPhone(cand.phone),
          isUnlocked,
          canDownloadResume: entitlements.canDownloadResume,
          joinedDate: cand.createdAt.toISOString().split("T")[0],
        };
      })
      .filter(Boolean);

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
