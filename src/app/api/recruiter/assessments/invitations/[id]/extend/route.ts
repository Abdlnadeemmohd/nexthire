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
      include: {
        assessment: true,
      },
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

    const body = await request.json();
    const { additionalDays = 7 } = body;

    const currentDeadline = new Date(invitation.deadline).getTime();
    const baseTime = currentDeadline > Date.now() ? currentDeadline : Date.now();
    const newDeadline = new Date(baseTime + additionalDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.assessmentInvitation.update({
      where: { id: params.id },
      data: {
        deadline: newDeadline,
        status: invitation.status === "EXPIRED" ? "PENDING" : invitation.status,
      },
    });

    await logAuditEvent(
      authUser.id,
      "ASSESSMENT_DEADLINE_EXTENDED",
      "AssessmentInvitation",
      invitation.id,
      {
        assessmentId: invitation.assessmentId,
        previousDeadline: invitation.deadline.toISOString(),
        newDeadline: newDeadline.toISOString(),
        companyId: invitation.companyId,
      }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to extend assessment deadline" },
      { status: 500 }
    );
  }
}
