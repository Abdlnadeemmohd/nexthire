import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { emitEvent } from "@/lib/events/eventEngine";

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
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: {
        job: true,
        company: true,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Multi-tenant check
    if (authUser.role !== "PLATFORM_ADMIN" && assessment.companyId !== authUser.companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Assessment belongs to another company" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { candidateId, applicationId, deadlineDays = 7 } = body;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "Candidate ID is required" },
        { status: 400 }
      );
    }

    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if pending/in-progress invitation already exists
    const existingInvitation = await prisma.assessmentInvitation.findFirst({
      where: {
        assessmentId: assessment.id,
        candidateId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    if (existingInvitation) {
      return NextResponse.json({
        success: true,
        message: "Candidate already has an active invitation for this assessment.",
        data: existingInvitation,
      });
    }

    const deadlineDate = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);

    const invitation = await prisma.assessmentInvitation.create({
      data: {
        assessmentId: assessment.id,
        candidateId,
        applicationId: applicationId || null,
        companyId: assessment.companyId,
        deadline: deadlineDate,
        status: "PENDING",
      },
      include: {
        assessment: true,
        candidate: { select: { id: true, name: true, email: true } },
      },
    });

    await logAuditEvent(
      authUser.id,
      "ASSESSMENT_SENT",
      "AssessmentInvitation",
      invitation.id,
      {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        candidateId,
        companyId: assessment.companyId,
        deadline: deadlineDate.toISOString(),
      }
    );

    // Dispatch event to candidate
    await emitEvent({
      type: "ASSESSMENT_SENT",
      recipientId: candidate.id,
      actorId: authUser.id,
      actorName: authUser.name,
      companyId: assessment.companyId,
      entityType: "ASSESSMENT_INVITATION",
      entityId: invitation.id,
      title: `Skills Assessment Invitation: ${assessment.title}`,
      body: `${assessment.company.name} has invited you to complete a ${assessment.durationMinutes}-minute skills verification assessment for ${assessment.job?.title || "your application"}.`,
      ctaText: "Start Assessment",
      ctaUrl: "/candidate/assessments",
      metadata: {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        companyName: assessment.company.name,
        durationMinutes: assessment.durationMinutes,
        deadline: deadlineDate.toISOString(),
      },
    });

    return NextResponse.json({ success: true, data: invitation }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send assessment invitation" },
      { status: 500 }
    );
  }
}
