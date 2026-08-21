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
      const isAlreadyUnlocked = await prisma.candidateUnlock.findUnique({
        where: {
          recruiterId_candidateId: {
            recruiterId: authUser.id,
            candidateId,
          },
        },
      });

      const hasApplied = authUser.companyId
        ? await prisma.application.findFirst({
            where: {
              applicantId: candidateId,
              job: { companyId: authUser.companyId },
            },
          })
        : null;

      if (!isAlreadyUnlocked && !hasApplied) {
        await consumeResumeUnlock(authUser.id, candidateId);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        resumeUrl: `/api/documents/download?userId=${candidateId}`,
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
