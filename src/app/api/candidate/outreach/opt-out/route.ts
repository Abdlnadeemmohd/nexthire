import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export const dynamic = "force-dynamic";

/**
 * POST /api/candidate/outreach/opt-out
 * Candidate 1-click opt-out from recruiter outreach communications.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    const body = await request.json().catch(() => ({}));
    const candidateId = authUser?.id || body.candidateId || body.userId;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "Candidate ID required to opt out" },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Update communication preference
    await prisma.candidateCommunicationPreference.upsert({
      where: { userId: candidateId },
      create: {
        userId: candidateId,
        optedOutOutreach: true,
        allowEmailOutreach: false,
        allowInAppOutreach: false,
      },
      update: {
        optedOutOutreach: true,
        allowEmailOutreach: false,
        allowInAppOutreach: false,
      },
    });

    // 2. Cancel any active outreach recipient sequences
    await prisma.outreachRecipient.updateMany({
      where: {
        candidateId,
        status: { in: ["DRAFT", "APPROVED", "QUEUED", "SENT", "DELIVERED", "PAUSED"] },
      },
      data: {
        status: "OPTED_OUT",
        optedOutAt: now,
        nextActionAt: null,
      },
    });

    await logAuditEvent(
      candidateId,
      "CANDIDATE_OUTREACH_OPT_OUT",
      "CandidateCommunicationPreference",
      candidateId,
      { optedOutAt: now.toISOString() }
    );

    return NextResponse.json({
      success: true,
      message: "You have been opted out of recruiter outreach communications successfully.",
    });
  } catch (err: any) {
    console.error("[POST /api/candidate/outreach/opt-out Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process opt-out" },
      { status: 500 }
    );
  }
}
