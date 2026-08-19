import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertCompanyAccess } from "@/lib/auth/multiTenant";
import { validateStatusTransition } from "@/lib/ats/stateMachine";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { notificationService } from "@/lib/notifications/NotificationService";
import { ApplicationStatus, RejectionReason } from "@prisma/client";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";

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

  // Enforce strict explicit recruiter verification check (PENDING, REJECTED, and SUSPENDED are blocked)
  if (authUser.role === "RECRUITER") {
    try {
      await assertUserVerified(authUser, "updating candidate pipeline status");
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
    const body = await request.json();
    const {
      status,
      notes,
      rejectionReason,
      recruiterComments,
      missingSkills,
      suggestedCertifications,
      resumeImprovementAdvice,
      suggestions,
      closingMessage,
      interviewDate,
    } = body;
    const validStatus = status as ApplicationStatus;

    // 1. Fetch current application & enforce multi-tenant isolation using companyId UUID
    const existingApp = await prisma.application.findUnique({
      where: { id },
      include: { job: { include: { company: true } }, applicant: true },
    });

    if (!existingApp) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    if (existingApp.job?.companyId) {
      assertCompanyAccess(authUser, existingApp.job.companyId);
    }

    // 2. Validate State Machine transition
    const currentStatusStr = existingApp.status;
    const transitionCheck = validateStatusTransition(currentStatusStr, validStatus, authUser.role);
    if (!transitionCheck.valid) {
      return NextResponse.json(
        { success: false, error: transitionCheck.error },
        { status: 422 }
      );
    }

    const eventType = validStatus === "REJECTED" ? "REJECTION_SUBMITTED" : "STATUS_CHANGED";
    const eventNotes =
      validStatus === "REJECTED"
        ? `Application rejected by recruiter ${authUser.name}. Reason: ${rejectionReason || "OTHER"}`
        : `Pipeline transition to '${validStatus}' by ${authUser.name}`;

    // 3. Update application in database
    const updatedApp = await prisma.application.update({
      where: { id },
      data: {
        status: validStatus,
        notes: notes || undefined,
        events: {
          create: {
            type: eventType,
            actorId: authUser.id,
            notes: eventNotes,
          },
        },
      },
      include: {
        job: { include: { company: true } },
        applicant: { include: { profile: true } },
        rejection: true,
        events: { orderBy: { timestamp: "desc" } },
      },
    });

    // 4. Handle rejection feedback
    if (validStatus === "REJECTED") {
      const combinedSuggestions: string[] = Array.isArray(suggestions)
        ? suggestions
        : [
            ...(Array.isArray(missingSkills) ? missingSkills.map((s: string) => `Missing skill: ${s}`) : []),
            ...(Array.isArray(suggestedCertifications) ? suggestedCertifications.map((c: string) => `Recommended certification: ${c}`) : []),
            ...(resumeImprovementAdvice ? [`Improvement advice: ${resumeImprovementAdvice}`] : []),
          ].filter(Boolean);

      const effectiveClosingMessage =
        closingMessage ||
        recruiterComments ||
        "Thank you for taking the time to apply with our hiring team.";

      const effectiveReason = (rejectionReason as RejectionReason) || "OTHER";

      await prisma.rejection.upsert({
        where: { applicationId: id },
        create: {
          applicationId: id,
          reason: effectiveReason,
          suggestions: combinedSuggestions,
          closingMessage: effectiveClosingMessage,
        },
        update: {
          reason: effectiveReason,
          suggestions: combinedSuggestions,
          closingMessage: effectiveClosingMessage,
        },
      });

      // Send rejection notification with feedback link
      await notificationService.sendNotification({
        userId: existingApp.applicantId,
        title: `Application Update: ${existingApp.job.title}`,
        body: `Your application for "${existingApp.job.title}" at ${existingApp.job.company.name} has been updated to Rejected. Recruiter feedback is now available in your application dashboard.`,
        type: "APPLICATION_STATUS",
        ctaText: "View Feedback",
        ctaUrl: `/applications/${id}/feedback`,
      });
    } else {
      // 5. Send status change notification to candidate
      await notificationService.sendNotification({
        userId: existingApp.applicantId,
        title: `Application Update: ${existingApp.job.title}`,
        body: `Your application for "${existingApp.job.title}" at ${existingApp.job.company.name} has advanced to ${validStatus.replace(/_/g, " ")}.`,
        type: "APPLICATION_STATUS",
        ctaText: "View Application",
        ctaUrl: "/applications",
      });
    }

    // 6. Handle interview scheduling
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

    // 7. Log Audit Event
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
        companyId: existingApp.job?.companyId,
      }
    );

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
