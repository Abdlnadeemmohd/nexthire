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
        applicant: true,
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

      // Asynchronously notify candidate via EventEngine
      const { emitEvent } = await import("@/lib/events/eventEngine");
      emitEvent({
        type: "SEEKER_APPLICATION_REJECTED",
        recipientId: existingApp.applicantId,
        recipientEmail: existingApp.applicant?.email,
        entityType: "Application",
        entityId: id,
        title: `Application Update: ${existingApp.job.title}`,
        body: `Your application for "${existingApp.job.title}" at ${existingApp.job.company.name} was not selected. Constructive feedback has been provided by the recruiter.`,
        ctaText: "View Feedback",
        ctaUrl: `/applications/${id}/feedback`,
        metadata: {
          jobTitle: existingApp.job.title,
          companyName: existingApp.job.company.name,
          rejectionReason: effectiveReason,
          suggestionsCount: combinedSuggestions.length,
        },
      }).catch(() => {});
    } else {
      // 5. Send status change / interview / offer notification to candidate
      const { emitEvent } = await import("@/lib/events/eventEngine");

      if (validStatus === "UNDER_REVIEW") {
        emitEvent({
          type: "SEEKER_APPLICATION_VIEWED",
          recipientId: existingApp.applicantId,
          recipientEmail: existingApp.applicant?.email,
          entityType: "Application",
          entityId: id,
          title: `Application Under Review: ${existingApp.job.title}`,
          body: `The hiring team at ${existingApp.job.company.name} is actively reviewing your application.`,
          ctaText: "Track Application",
          ctaUrl: "/applications",
          metadata: { jobTitle: existingApp.job.title, companyName: existingApp.job.company.name },
        }).catch(() => {});
      } else if (validStatus === "FINAL_DECISION") {
        emitEvent({
          type: "SEEKER_APPLICATION_SHORTLISTED",
          recipientId: existingApp.applicantId,
          recipientEmail: existingApp.applicant?.email,
          entityType: "Application",
          entityId: id,
          title: `🎉 You've Advanced to Final Decision for ${existingApp.job.title}!`,
          body: `Congratulations! ${existingApp.job.company.name} has advanced your profile to final decision.`,
          ctaText: "View Application",
          ctaUrl: "/applications",
          metadata: { jobTitle: existingApp.job.title, companyName: existingApp.job.company.name },
        }).catch(() => {});

        // If candidate completed an interview round
        if (existingApp.status.startsWith("INTERVIEW")) {
          emitEvent({
            type: "SEEKER_INTERVIEW_COMPLETED",
            recipientId: existingApp.applicantId,
            recipientEmail: existingApp.applicant?.email,
            entityType: "Application",
            entityId: id,
            title: `Interview Round Completed: ${existingApp.job.title}`,
            body: `Your interview for "${existingApp.job.title}" is marked complete. The hiring team is preparing final evaluations.`,
            ctaText: "Track Application",
            ctaUrl: "/applications",
            metadata: { jobTitle: existingApp.job.title, companyName: existingApp.job.company.name },
          }).catch(() => {});

          emitEvent({
            type: "RECRUITER_INTERVIEW_COMPLETED",
            recipientId: authUser.id,
            recipientEmail: authUser.email,
            companyId: existingApp.job.companyId,
            entityType: "Application",
            entityId: id,
            title: `Interview Completed: ${existingApp.applicant?.name || "Candidate"}`,
            body: `The interview session with ${existingApp.applicant?.name || "the candidate"} for "${existingApp.job.title}" is complete. Please record your scorecard evaluation.`,
            ctaText: "Submit Scorecard",
            ctaUrl: "/recruiter/applicants",
            metadata: { jobTitle: existingApp.job.title, applicantId: existingApp.applicantId },
          }).catch(() => {});

          emitEvent({
            type: "SEEKER_INTERVIEW_FEEDBACK_REQUESTED",
            recipientId: existingApp.applicantId,
            recipientEmail: existingApp.applicant?.email,
            entityType: "Application",
            entityId: id,
            title: `How was your interview experience?`,
            body: `Help us improve! Share your interview feedback for ${existingApp.job.company.name}.`,
            ctaText: "Give Feedback",
            ctaUrl: `/applications/${id}`,
            metadata: { jobTitle: existingApp.job.title, companyName: existingApp.job.company.name },
          }).catch(() => {});
        }
      } else if (validStatus === "OFFER_EXTENDED") {
        const isOfferUpdate = existingApp.status === "OFFER_EXTENDED";
        const offerEventType = isOfferUpdate ? "SEEKER_OFFER_UPDATED" : "SEEKER_OFFER_RECEIVED";
        emitEvent({
          type: offerEventType,
          recipientId: existingApp.applicantId,
          recipientEmail: existingApp.applicant?.email,
          entityType: "Application",
          entityId: id,
          title: isOfferUpdate ? `Updated Offer Terms: ${existingApp.job.title}` : `🎉 Formal Job Offer: ${existingApp.job.title}`,
          body: isOfferUpdate
            ? `${existingApp.job.company.name} has updated your formal job offer terms.`
            : `Congratulations! ${existingApp.job.company.name} has extended a formal job offer for "${existingApp.job.title}".`,
          ctaText: "Review Offer",
          ctaUrl: "/applications",
          metadata: { jobTitle: existingApp.job.title, companyName: existingApp.job.company.name },
        }).catch(() => {});
      } else if (validStatus === "APPLICATION_CLOSED") {
        emitEvent({
          type: "SEEKER_APPLICATION_WITHDRAWN",
          recipientId: existingApp.applicantId,
          recipientEmail: existingApp.applicant?.email,
          entityType: "Application",
          entityId: id,
          title: `Application Closed: ${existingApp.job.title}`,
          body: `Your application for "${existingApp.job.title}" has been closed.`,
          ctaText: "View Applications",
          ctaUrl: "/applications",
        }).catch(() => {});
      } else if (validStatus === "INTERVIEW_SCHEDULED" || validStatus === "INTERVIEW_ROUND_1") {
        const isReschedule = existingApp.status.startsWith("INTERVIEW");
        const interviewEventType = isReschedule ? "SEEKER_INTERVIEW_RESCHEDULED" : "SEEKER_INTERVIEW_SCHEDULED";
        emitEvent({
          type: interviewEventType,
          recipientId: existingApp.applicantId,
          recipientEmail: existingApp.applicant?.email,
          entityType: "Application",
          entityId: id,
          title: isReschedule ? `📅 Interview Rescheduled: ${existingApp.job.title}` : `📅 Interview Scheduled: ${existingApp.job.title}`,
          body: isReschedule
            ? `Your interview session with ${existingApp.job.company.name} has been rescheduled to ${interviewDate ? new Date(interviewDate).toLocaleString() : "a new time"}.`
            : `An interview session has been scheduled with the hiring team at ${existingApp.job.company.name}.`,
          ctaText: "View Interview Details",
          ctaUrl: "/applications",
          metadata: {
            jobTitle: existingApp.job.title,
            companyName: existingApp.job.company.name,
            interviewDate: interviewDate || new Date().toISOString(),
            platform: "Google Meet",
            timezone: "PST (UTC-8)",
          },
        }).catch(() => {});

        emitEvent({
          type: isReschedule ? "RECRUITER_INTERVIEW_RESCHEDULE_REQUESTED" : "RECRUITER_INTERVIEW_SCHEDULED",
          recipientId: authUser.id,
          recipientEmail: authUser.email,
          companyId: existingApp.job.companyId,
          entityType: "Application",
          entityId: id,
          title: isReschedule ? `Interview Rescheduled: ${existingApp.applicant?.name}` : `Interview Scheduled with ${existingApp.applicant?.name || "Candidate"}`,
          body: `Interview for "${existingApp.job.title}" is confirmed on your calendar for ${interviewDate ? new Date(interviewDate).toLocaleString() : "scheduled time"}.`,
          ctaText: "View Pipeline",
          ctaUrl: "/recruiter/applicants",
          metadata: { jobTitle: existingApp.job.title, applicantId: existingApp.applicantId },
        }).catch(() => {});

        emitEvent({
          type: "SEEKER_INTERVIEW_CONFIRMED",
          recipientId: existingApp.applicantId,
          recipientEmail: existingApp.applicant?.email,
          entityType: "Application",
          entityId: id,
          title: `Interview Confirmed: ${existingApp.job.title}`,
          body: `Your interview session has been confirmed on the calendar.`,
          ctaText: "View Details",
          ctaUrl: "/applications",
          metadata: { jobTitle: existingApp.job.title },
        }).catch(() => {});

        emitEvent({
          type: "RECRUITER_INTERVIEW_CONFIRMED",
          recipientId: authUser.id,
          recipientEmail: authUser.email,
          companyId: existingApp.job.companyId,
          entityType: "Application",
          entityId: id,
          title: `Interview Confirmed on Schedule`,
          body: `The interview session for "${existingApp.job.title}" has been confirmed on the recruiter calendar.`,
          ctaText: "View Schedule",
          ctaUrl: "/recruiter/applicants",
          metadata: { jobTitle: existingApp.job.title },
        }).catch(() => {});
      } else {
        emitEvent({
          type: "SEEKER_APPLICATION_STAGE_CHANGED",
          recipientId: existingApp.applicantId,
          recipientEmail: existingApp.applicant?.email,
          entityType: "Application",
          entityId: id,
          title: `Application Update: ${existingApp.job.title}`,
          body: `Your application for "${existingApp.job.title}" at ${existingApp.job.company.name} has advanced to ${validStatus.replace(/_/g, " ")}.`,
          ctaText: "View Application",
          ctaUrl: "/applications",
          metadata: { newStatus: validStatus, jobTitle: existingApp.job.title, companyName: existingApp.job.company.name },
        }).catch(() => {});

        emitEvent({
          type: "RECRUITER_CANDIDATE_STAGE_MOVED",
          recipientId: authUser.id,
          recipientEmail: authUser.email,
          companyId: existingApp.job.companyId,
          entityType: "Application",
          entityId: id,
          title: `Candidate Stage Updated: ${existingApp.applicant?.name || "Candidate"}`,
          body: `${existingApp.applicant?.name || "Applicant"} moved to ${validStatus.replace(/_/g, " ")} for "${existingApp.job.title}".`,
          ctaText: "View Pipeline",
          ctaUrl: "/recruiter/applicants",
          metadata: { newStatus: validStatus, jobTitle: existingApp.job.title },
        }).catch(() => {});
      }
    }

    // 6. Handle interview scheduling persistence
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

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  return POST(request, context);
}
