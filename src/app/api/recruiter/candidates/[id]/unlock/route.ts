import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";
import { consumeCandidateUnlock, EntitlementLimitError } from "@/lib/billing/entitlements";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  const { id: candidateId } = params;

  if (authUser.role === "RECRUITER") {
    try {
      await assertUserVerified(authUser, "unlocking candidate talent profiles");
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

  try {
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId, role: "JOB_SEEKER" },
      include: { profile: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    if (authUser.role === "RECRUITER") {
      await consumeCandidateUnlock(authUser.id, candidateId);
    }

    return NextResponse.json({
      success: true,
      message: `Candidate profile unlocked successfully.`,
      data: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        headline: candidate.headline,
        location: candidate.location,
        bio: candidate.bio,
        skills: candidate.profile?.skills ? candidate.profile.skills.split(",").map((s) => s.trim()) : [],
        experience: candidate.profile?.experience,
        education: candidate.profile?.education,
        portfolio: candidate.profile?.portfolio,
        resumeScore: candidate.profile?.resumeScore,
      },
    });
  } catch (err: any) {
    if (err instanceof EntitlementLimitError || err.name === "EntitlementLimitError") {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code, upgradeRequired: true },
        { status: 403 }
      );
    }
    console.error("[Candidate Unlock Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to unlock candidate" },
      { status: 500 }
    );
  }
}
