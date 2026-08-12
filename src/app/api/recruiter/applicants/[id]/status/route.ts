import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertCompanyAccess } from "@/lib/auth/multiTenant";
import { validateStatusTransition } from "@/lib/ats/stateMachine";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { notificationService } from "@/lib/notifications/NotificationService";
import { ApplicationStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter or Admin access required" },
      { status: 403 }
    );
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { status, notes, rejectionReason, suggestions, closingMessage, interviewDate } = body;
    const validStatus = status as ApplicationStatus;

    // 1. Fetch current application & enforce multi-tenant isolation using companyId UUID
    const existingApp = await prisma.application.findUnique({
      where: { id },
      include: { job: { include: { company: true } }, applicant: true },
    });

    if (existingApp && existingApp.job?.companyId) {
      assertCompanyAccess(authUser, existingApp.job.companyId);
    }

    // 2. Validate State Machine transition
    const currentStatusStr = existingApp ? existingApp.status : "SUBMITTED";
    const transitionCheck = validateStatusTransition(currentStatusStr, validStatus, authUser.role);
    if (!transitionCheck.valid) {
      return NextResponse.json(
        { success: false, error: transitionCheck.error },
        { status: 422 }
      );
    }

    // 3. Update application in database
    const updatedApp = await prisma.application.update({
      where: { id },
      data: {
        status: validStatus,
        notes: notes || undefined,
        events: {
          create: {
            type: "STATUS_CHANGED",
            actorId: authUser.id,
            notes: `Pipeline transition to '${status}' by ${authUser.name}`,
          },
        },
      },
    });

    // 4. Log Audit Event (including ADMIN_OVERRIDE check)
    const isOverride = authUser.role === "PLATFORM_ADMIN";
    await logAuditEvent(
      authUser.id,
      isOverride ? "ADMIN_OVERRIDE_STATUS_CHANGE" : "APPLICATION_STATUS_UPDATED",
      "Application",
      id,
      {
        previousStatus: currentStatusStr,
        newStatus: validStatus,
        isPlatformAdminOverride: isOverride,
        companyId: existingApp?.job?.companyId,
      }
    );

    // 5. Send Notification to candidate
    if (existingApp) {
      await notificationService.sendNotification({
        userId: existingApp.applicantId,
        title: `Application Update: ${existingApp.job.title}`,
        body: `Your application status at ${existingApp.job.company.name} has been updated to ${validStatus.replace(/_/g, " ")}.`,
        type: "APPLICATION_STATUS",
      });
    }

    // 6. Handle rejection feedback
    if (validStatus === "REJECTED" && rejectionReason) {
      await prisma.rejection.upsert({
        where: { applicationId: id },
        create: {
          applicationId: id,
          reason: rejectionReason || "OTHER",
          suggestions: suggestions || ["Enhance project deliverables", "Practice technical interview systems"],
          closingMessage: closingMessage || "Thank you for interviewing with NextHire network partner.",
        },
        update: {
          reason: rejectionReason || "OTHER",
          suggestions: suggestions || [],
          closingMessage: closingMessage || "Updated rejection feedback.",
        },
      });
    }

    // 7. Handle interview scheduling
    if ((validStatus === "INTERVIEW_SCHEDULED" || validStatus === "INTERVIEW_ROUND_1") && interviewDate) {
      await prisma.interview.create({
        data: {
          applicationId: id,
          round: 1,
          scheduledAt: new Date(interviewDate),
          timezone: "PST (UTC-8)",
          type: "Technical Systems Architecture",
          platform: "Google Meet",
          meetingLink: "https://meet.google.com/nexthire-interview-room",
          agenda: "Technical architecture evaluation and systems design overview.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Applicant pipeline status updated to ${status}`,
      data: updatedApp,
    });
  } catch (err: any) {
    if (err.name === "CompanyAccessError") {
      return NextResponse.json({ success: false, error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update applicant status" },
      { status: 500 }
    );
  }
}
