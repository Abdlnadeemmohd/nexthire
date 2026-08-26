import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export const dynamic = "force-dynamic";

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

  try {
    const invitation = await prisma.assessmentInvitation.findUnique({
      where: { id: params.id },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Assessment invitation not found" },
        { status: 404 }
      );
    }

    if (authUser.role !== "PLATFORM_ADMIN" && invitation.companyId !== authUser.companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Invitation belongs to another company" },
        { status: 403 }
      );
    }

    const updated = await prisma.assessmentInvitation.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
      },
    });

    await logAuditEvent(
      authUser.id,
      "ASSESSMENT_CANCELLED",
      "AssessmentInvitation",
      invitation.id,
      {
        assessmentId: invitation.assessmentId,
        candidateId: invitation.candidateId,
        companyId: invitation.companyId,
      }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to cancel assessment invitation" },
      { status: 500 }
    );
  }
}
