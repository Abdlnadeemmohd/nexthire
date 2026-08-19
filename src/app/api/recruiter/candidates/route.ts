import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";
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
  const q = searchParams.get("q") || "";

  // 1. Enforce strict explicit recruiter verification check
  if (authUser.role === "RECRUITER") {
    try {
      await assertUserVerified(authUser, "searching candidates and viewing talent profiles");
    } catch (err: any) {
      if (err instanceof VerificationRequiredError || err.name === "VerificationRequiredError") {
        return NextResponse.json(
          { success: false, error: err.message, status: err.status },
          { status: 403 }
        );
      }
      throw err;
    }
  }

  // 2. Enforce candidate search quota / trial limit consumption
  let searchResultQuota: any = null;
  if (authUser.role === "RECRUITER") {
    try {
      searchResultQuota = await consumeCandidateSearch(authUser.id);
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
    // 3. Query candidates who are discoverable (isDiscoverable === true)
    const candidates = await prisma.user.findMany({
      where: {
        role: "JOB_SEEKER",
        isDiscoverable: true,
        OR: q
          ? [
              { name: { contains: q, mode: "insensitive" } },
              { headline: { contains: q, mode: "insensitive" } },
              { bio: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
              { profile: { skills: { contains: q, mode: "insensitive" } } },
            ]
          : undefined,
      },
      include: {
        profile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Fetch recruiter's unlocked candidates
    const unlockedRecords = await prisma.candidateUnlock.findMany({
      where: { recruiterId: authUser.id },
      select: { candidateId: true },
    });
    const unlockedCandidateIds = new Set(unlockedRecords.map((u) => u.candidateId));

    // 5. Fetch entitlements for client UI
    const entitlements = await getRecruiterEntitlements(authUser.id);

    const formatted = candidates.map((cand) => {
      let skillsArray: string[] = [];
      if (cand.profile?.skills) {
        skillsArray = cand.profile.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const isUnlocked = unlockedCandidateIds.has(cand.id);

      return {
        id: cand.id,
        name: cand.name,
        headline: cand.headline || null,
        location: cand.location || null,
        skills: skillsArray,
        employmentStatus: "OPEN_TO_OPPORTUNITIES",
        bio: cand.bio || null,
        avatar: cand.avatar || null,
        resumeScore: cand.profile?.resumeScore || null,
        // Resume download link is only exposed if unlocked and recruiter is on a paid plan
        resumeUrl: isUnlocked && entitlements.canDownloadResume ? cand.profile?.resumeUrl : null,
        hasResume: Boolean(cand.profile?.resumeUrl),
        email: isUnlocked ? cand.email : maskEmail(cand.email),
        phone: isUnlocked ? (cand.phone || null) : maskPhone(cand.phone),
        isUnlocked,
        canDownloadResume: entitlements.canDownloadResume,
        joinedDate: cand.createdAt.toISOString().split("T")[0],
      };
    });

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
