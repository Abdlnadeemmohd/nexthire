import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";
import { consumeResumeUnlock, EntitlementLimitError } from "@/lib/billing/entitlements";

export async function GET(
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
      await assertUserVerified(authUser, "downloading verified candidate resumes");
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

    if (!candidate || !candidate.profile?.resumeUrl) {
      return NextResponse.json(
        { success: false, error: "Candidate resume not found or not uploaded." },
        { status: 404 }
      );
    }

    if (authUser.role === "RECRUITER") {
      await consumeResumeUnlock(authUser.id, candidateId);
    }

    return NextResponse.json({
      success: true,
      data: {
        resumeUrl: candidate.profile.resumeUrl,
        candidateName: candidate.name,
        accessedAt: new Date().toISOString(),
        audited: true,
      },
    });
  } catch (err: any) {
    if (err instanceof EntitlementLimitError || err.name === "EntitlementLimitError") {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code, upgradeRequired: true },
        { status: 403 }
      );
    }
    console.error("[Resume Access Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to access candidate resume" },
      { status: 500 }
    );
  }
}
