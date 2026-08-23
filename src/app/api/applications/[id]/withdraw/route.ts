import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "JOB_SEEKER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Candidates only" },
      { status: 403 }
    );
  }

  const { id } = params;

  try {
    const existing = await prisma.application.findUnique({ where: { id } });

    if (existing && existing.applicantId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only withdraw your own applications" },
        { status: 403 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "APPLICATION_CLOSED",
        events: {
          create: {
            type: "AUTO_CLOSED",
            actorId: authUser.id,
            notes: "Application voluntarily withdrawn by candidate.",
          },
        },
      },
      include: {
        job: { select: { title: true, recruiterId: true, companyId: true } },
      },
    });

    // Asynchronously dispatch application withdrawal events
    const { emitEvent } = await import("@/lib/events/eventEngine");

    // Notify candidate
    emitEvent({
      type: "SEEKER_APPLICATION_WITHDRAWN",
      recipientId: authUser.id,
      recipientEmail: authUser.email,
      entityType: "Application",
      entityId: id,
      metadata: { jobTitle: updated.job?.title },
    }).catch(() => {});

    // Notify recruiter
    if (updated.job?.recruiterId) {
      emitEvent({
        type: "RECRUITER_CANDIDATE_WITHDREW",
        recipientId: updated.job.recruiterId,
        actorId: authUser.id,
        actorName: authUser.name,
        entityType: "Application",
        entityId: id,
        metadata: {
          candidateName: authUser.name,
          jobTitle: updated.job.title,
          companyId: updated.job.companyId,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Application withdrawn successfully",
      data: updated,
    });
  } catch (err: any) {
    console.error("[Application Withdraw DB Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to withdraw application." },
      { status: 500 }
    );
  }
}
