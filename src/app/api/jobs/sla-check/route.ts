import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  detectApiFailureSpikes,
  detectPaymentFailureSpikes,
  generateWeeklyPlatformDigest,
  recordCronFailure,
} from "@/lib/admin/adminMonitoring";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const configuredSecret = process.env.CRON_SECRET;

  const isCronAuthorized =
    configuredSecret &&
    ((authHeader && authHeader === `Bearer ${configuredSecret}`) ||
      cronSecretHeader === configuredSecret);

  if (!isCronAuthorized) {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session or valid CRON_SECRET required" },
        { status: 403 }
      );
    }
  }

  try {
    const now = new Date();
    
    // 1. Query applications past SLA deadline (7 days default)
    const overdueApps = await prisma.application.findMany({
      where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        slaDeadline: { lt: now },
      },
      include: { job: { include: { company: true } } },
    });

    // 2. Process 20-day auto-closure policy
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const autoCloseApps = await prisma.application.findMany({
      where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        appliedAt: { lt: twentyDaysAgo },
      },
    });

    for (const app of autoCloseApps) {
      await prisma.application.update({
        where: { id: app.id },
        data: {
          status: "APPLICATION_CLOSED",
          events: {
            create: {
              type: "AUTO_CLOSED",
              actorId: "SYSTEM_SLA_WORKER",
              notes: "Application automatically closed after exceeding 20-day inactivity SLA threshold.",
            },
          },
        },
      });
    }

    const { emitEvent } = await import("@/lib/events/eventEngine");

    // 3. Scan Expired Saved Jobs -> SEEKER_SAVED_JOB_EXPIRED
    const expiredSavedJobs = await prisma.savedJob.findMany({
      where: {
        job: { status: "CLOSED" },
      },
      include: {
        job: { include: { company: true } },
        user: true,
      },
      take: 50,
    });

    for (const saved of expiredSavedJobs) {
      if (saved.user.role === "JOB_SEEKER") {
        emitEvent({
          type: "SEEKER_SAVED_JOB_EXPIRED",
          recipientId: saved.user.id,
          recipientEmail: saved.user.email,
          entityType: "Job",
          entityId: saved.jobId,
          title: `Saved Job Closed: ${saved.job.title}`,
          body: `The position for "${saved.job.title}" at ${saved.job.company.name} is no longer accepting applications.`,
          ctaText: "Browse Open Jobs",
          ctaUrl: "/jobs",
          metadata: { jobId: saved.jobId, jobTitle: saved.job.title },
        }).catch(() => {});
      }
    }

    // 4. Scan 24-Hour & 1-Hour Upcoming Interviews -> SEEKER_INTERVIEW_REMINDER_24H & SEEKER_INTERVIEW_REMINDER_1H
    const next24hStart = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const next24hEnd = new Date(Date.now() + 25 * 60 * 60 * 1000);

    const upcoming24hInterviews = await prisma.interview.findMany({
      where: {
        scheduledAt: { gte: next24hStart, lte: next24hEnd },
        application: { status: { notIn: ["APPLICATION_CLOSED", "REJECTED"] } },
      },
      include: {
        application: {
          include: {
            applicant: true,
            job: { include: { company: true } },
          },
        },
      },
    });

    for (const interview of upcoming24hInterviews) {
      emitEvent({
        type: "SEEKER_INTERVIEW_REMINDER_24H",
        recipientId: interview.application.applicantId,
        recipientEmail: interview.application.applicant.email,
        entityType: "Interview",
        entityId: interview.id,
        title: `Reminder: Interview Tomorrow for ${interview.application.job.title}`,
        body: `Your interview session is scheduled for tomorrow at ${interview.scheduledAt.toLocaleTimeString()}. Review your meeting link and preparation materials.`,
        ctaText: "View Interview Details",
        ctaUrl: "/applications",
        metadata: {
          interviewId: interview.id,
          platform: interview.platform,
          meetingLink: interview.meetingLink,
          scheduledAt: interview.scheduledAt.toISOString(),
        },
      }).catch(() => {});
    }

    const next1hStart = new Date(Date.now() + 45 * 60 * 1000);
    const next1hEnd = new Date(Date.now() + 75 * 60 * 1000);

    const upcoming1hInterviews = await prisma.interview.findMany({
      where: {
        scheduledAt: { gte: next1hStart, lte: next1hEnd },
        application: { status: { notIn: ["APPLICATION_CLOSED", "REJECTED"] } },
      },
      include: {
        application: {
          include: {
            applicant: true,
            job: { include: { company: true } },
          },
        },
      },
    });

    for (const interview of upcoming1hInterviews) {
      emitEvent({
        type: "SEEKER_INTERVIEW_REMINDER_1H",
        recipientId: interview.application.applicantId,
        recipientEmail: interview.application.applicant.email,
        entityType: "Interview",
        entityId: interview.id,
        title: `🚨 Interview in 1 Hour: ${interview.application.job.title}`,
        body: `Your interview session begins in 1 hour. Please join on time via ${interview.platform}.`,
        ctaText: "Join Interview Room",
        ctaUrl: interview.meetingLink || "/applications",
        metadata: {
          interviewId: interview.id,
          platform: interview.platform,
          meetingLink: interview.meetingLink,
        },
      }).catch(() => {});
    }

    // 5. Scan Unanswered Recruiter Messages -> SEEKER_UNANSWERED_MESSAGE_REMINDER
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const unreadMessages = await prisma.message.findMany({
      where: {
        read: false,
        createdAt: { lte: oneDayAgo },
        receiver: { role: "JOB_SEEKER" },
      },
      include: {
        sender: true,
        receiver: true,
      },
      take: 50,
    });

    for (const msg of unreadMessages) {
      emitEvent({
        type: "SEEKER_UNANSWERED_MESSAGE_REMINDER",
        recipientId: msg.receiverId,
        recipientEmail: msg.receiver.email,
        entityType: "Message",
        entityId: msg.id,
        title: `Unread Message Reminder from ${msg.sender.name}`,
        body: `You have an unread recruiter message from ${msg.sender.name}. Reply to maintain a fast response score.`,
        ctaText: "Reply to Recruiter",
        ctaUrl: `/messages?contactId=${msg.senderId}`,
        metadata: { senderId: msg.senderId, senderName: msg.sender.name },
      }).catch(() => {});
    }

    // 6. Scan Approaching Offer Deadlines -> SEEKER_OFFER_DEADLINE_APPROACHING
    const approachingOffers = await prisma.application.findMany({
      where: {
        status: "OFFER_EXTENDED",
      },
      include: {
        applicant: true,
        job: { include: { company: true } },
      },
      take: 50,
    });

    for (const app of approachingOffers) {
      emitEvent({
        type: "SEEKER_OFFER_DEADLINE_APPROACHING",
        recipientId: app.applicantId,
        recipientEmail: app.applicant.email,
        entityType: "Application",
        entityId: app.id,
        title: `⚠️ Offer Response Reminder: ${app.job.title}`,
        body: `Your offer from ${app.job.company.name} requires your formal response. Please review terms before it lapses.`,
        ctaText: "Review Offer Terms",
        ctaUrl: "/applications",
        metadata: { jobId: app.jobId, companyName: app.job.company.name },
      }).catch(() => {});
    }

    // 7. Recruiter SLA Warnings (3 days unreviewed) & Breaches (7 days unreviewed)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pendingReviewApps = await prisma.application.findMany({
      where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
      include: {
        job: { include: { company: true, recruiter: true } },
        applicant: true,
      },
      take: 50,
    });

    for (const app of pendingReviewApps) {
      const isBreached = app.appliedAt <= sevenDaysAgo;
      const isWarning = app.appliedAt <= threeDaysAgo && !isBreached;

      if (app.job.recruiterId && app.job.recruiter) {
        if (isBreached) {
          emitEvent({
            type: "RECRUITER_SLA_BREACHED",
            recipientId: app.job.recruiterId,
            recipientEmail: app.job.recruiter.email,
            companyId: app.job.companyId,
            entityType: "Application",
            entityId: app.id,
            title: `🚨 Response SLA Breached: ${app.applicant.name}`,
            body: `${app.applicant.name} has waited 7+ days for a review on "${app.job.title}". Update status to protect hiring brand.`,
            ctaText: "Review Applicant Now",
            ctaUrl: "/recruiter/applicants",
            metadata: { jobId: app.jobId, applicantId: app.applicantId },
          }).catch(() => {});
        } else if (isWarning) {
          emitEvent({
            type: "RECRUITER_SLA_WARNING",
            recipientId: app.job.recruiterId,
            recipientEmail: app.job.recruiter.email,
            companyId: app.job.companyId,
            entityType: "Application",
            entityId: app.id,
            title: `⚠️ Review Approaching SLA Deadline: ${app.job.title}`,
            body: `Application from ${app.applicant.name} is approaching the 7-day review SLA target.`,
            ctaText: "Review Applicant",
            ctaUrl: "/recruiter/applicants",
            metadata: { jobId: app.jobId, applicantId: app.applicantId },
          }).catch(() => {});
        }
      }
    }

    // 8. Recruiter Candidate Backlog Alert (Recruiters with >= 5 pending applications)
    const recruitersWithBacklog = await prisma.user.findMany({
      where: { role: "RECRUITER" },
      include: {
        jobs: {
          include: {
            applications: {
              where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
            },
          },
        },
      },
      take: 20,
    });

    for (const rec of recruitersWithBacklog) {
      const totalPending = rec.jobs.reduce((acc, j) => acc + j.applications.length, 0);
      if (totalPending >= 5) {
        emitEvent({
          type: "RECRUITER_CANDIDATE_BACKLOG_ALERT",
          recipientId: rec.id,
          recipientEmail: rec.email,
          companyId: rec.companyId || undefined,
          title: `Candidate Backlog Alert: ${totalPending} Applications Pending Review`,
          body: `You have ${totalPending} unreviewed applications across your active openings. Review candidates to maintain high hiring velocity.`,
          ctaText: "Review Candidates",
          ctaUrl: "/recruiter/applicants",
          metadata: { totalPending },
        }).catch(() => {});
      }
    }

    // 9. Recruiter Unanswered Message Reminder (Unread candidate messages > 24h)
    const unreadCandidateMsgs = await prisma.message.findMany({
      where: {
        read: false,
        createdAt: { lte: oneDayAgo },
        receiver: { role: "RECRUITER" },
      },
      include: {
        sender: true,
        receiver: true,
      },
      take: 50,
    });

    for (const msg of unreadCandidateMsgs) {
      emitEvent({
        type: "RECRUITER_UNANSWERED_MESSAGE_REMINDER",
        recipientId: msg.receiverId,
        recipientEmail: msg.receiver.email,
        companyId: msg.receiver.companyId || undefined,
        entityType: "Message",
        entityId: msg.id,
        title: `Unanswered Message from ${msg.sender.name}`,
        body: `Candidate ${msg.sender.name} is waiting for your reply on NextHire chat.`,
        ctaText: "Reply in Chat",
        ctaUrl: `/messages?contactId=${msg.senderId}`,
        metadata: { senderId: msg.senderId, senderName: msg.sender.name },
      }).catch(() => {});
    }

    // 10. Recruiter Interview Feedback Overdue (Interviews held > 24h ago without closure)
    const pastInterviews = await prisma.interview.findMany({
      where: {
        scheduledAt: { lte: oneDayAgo },
        application: { status: { in: ["INTERVIEW_SCHEDULED", "INTERVIEW_ROUND_1", "INTERVIEW_ROUND_2"] } },
      },
      include: {
        application: {
          include: {
            applicant: true,
            job: { include: { company: true, recruiter: true } },
          },
        },
      },
      take: 20,
    });

    for (const interview of pastInterviews) {
      if (interview.application.job.recruiterId && interview.application.job.recruiter) {
        emitEvent({
          type: "RECRUITER_INTERVIEW_FEEDBACK_OVERDUE",
          recipientId: interview.application.job.recruiterId,
          recipientEmail: interview.application.job.recruiter.email,
          companyId: interview.application.job.companyId,
          entityType: "Interview",
          entityId: interview.id,
          title: `Interview Scorecard Overdue: ${interview.application.applicant.name}`,
          body: `Please submit evaluation notes for the completed interview round with ${interview.application.applicant.name} (${interview.application.job.title}).`,
          ctaText: "Submit Scorecard",
          ctaUrl: "/recruiter/applicants",
          metadata: { interviewId: interview.id, applicantId: interview.application.applicantId },
        }).catch(() => {});
      }
    }

    // 11. Recruiter Job Expiring (27+ days) & Job Expired (30+ days)
    const twentySevenDaysAgo = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const activeJobsExpiring = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        createdAt: { lte: twentySevenDaysAgo },
      },
      include: { company: true, recruiter: true },
      take: 20,
    });

    for (const job of activeJobsExpiring) {
      if (job.recruiterId && job.recruiter) {
        const isExpired = job.createdAt <= thirtyDaysAgo;
        if (isExpired) {
          await prisma.job.update({
            where: { id: job.id },
            data: { status: "CLOSED" },
          });

          emitEvent({
            type: "RECRUITER_JOB_EXPIRED",
            recipientId: job.recruiterId,
            recipientEmail: job.recruiter.email,
            companyId: job.companyId,
            entityType: "Job",
            entityId: job.id,
            title: `Job Posting Expired: ${job.title}`,
            body: `The 30-day active window for "${job.title}" has ended. Reopen the posting if you are still hiring.`,
            ctaText: "Reopen Job",
            ctaUrl: "/recruiter",
            metadata: { jobId: job.id, jobTitle: job.title },
          }).catch(() => {});
        } else {
          emitEvent({
            type: "RECRUITER_JOB_EXPIRING",
            recipientId: job.recruiterId,
            recipientEmail: job.recruiter.email,
            companyId: job.companyId,
            entityType: "Job",
            entityId: job.id,
            title: `Job Opening Expiring Soon: ${job.title}`,
            body: `Your job posting "${job.title}" will expire in 3 days. Extend the duration to keep receiving applicants.`,
            ctaText: "Extend Posting",
            ctaUrl: "/recruiter",
            metadata: { jobId: job.id, jobTitle: job.title },
          }).catch(() => {});
        }
      }
    }

    // 12. Recruiter Trial Reminders & Ended
    const activeTrials = await prisma.recruiterTrial.findMany({
      where: { status: "ACTIVE" },
      include: { recruiter: true },
      take: 20,
    });

    for (const trial of activeTrials) {
      if (!trial.recruiter) continue;
      const isExhausted = trial.candidateSearchesUsed >= trial.candidateSearchLimit;
      if (isExhausted) {
        emitEvent({
          type: "RECRUITER_TRIAL_ENDED",
          recipientId: trial.recruiterId,
          recipientEmail: trial.recruiter.email,
          companyId: trial.companyId,
          title: "Recruiter Trial Completed",
          body: "You have used your 5 free candidate searches. Upgrade to a paid plan for unlimited sourcing and verified resume downloads.",
          ctaText: "View Subscription Plans",
          ctaUrl: "/recruiter/billing",
          metadata: { searchesUsed: trial.candidateSearchesUsed },
        }).catch(() => {});
      } else {
        emitEvent({
          type: "RECRUITER_TRIAL_REMINDER",
          recipientId: trial.recruiterId,
          recipientEmail: trial.recruiter.email,
          companyId: trial.companyId,
          title: "Trial Searches Remaining",
          body: `You have ${trial.candidateSearchLimit - trial.candidateSearchesUsed} trial candidate searches available in your recruiter workspace.`,
          ctaText: "Source Candidates",
          ctaUrl: "/recruiter/candidates",
          metadata: { remaining: trial.candidateSearchLimit - trial.candidateSearchesUsed },
        }).catch(() => {});
      }
    }

    // 13. Talent Supply Trend & Weekly Intelligence Digest
    const { calculateTalentSupplyTrends, generateWeeklyIntelligenceDigest } = await import("@/lib/talent/talentIntelligence");
    const trend = await calculateTalentSupplyTrends("Engineering");

    if (trend.trendDirection !== "INSUFFICIENT_DATA") {
      const sampleRecruiter = await prisma.user.findFirst({ where: { role: "RECRUITER" } });
      if (sampleRecruiter) {
        emitEvent({
          type: "TALENT_SUPPLY_TREND_ALERT",
          recipientId: sampleRecruiter.id,
          recipientEmail: sampleRecruiter.email,
          companyId: sampleRecruiter.companyId || undefined,
          title: "📈 Talent Supply Shift Alert",
          body: trend.description,
          ctaText: "Open Talent Radar",
          ctaUrl: "/recruiter",
          metadata: { trend },
        }).catch(() => {});
      }
    }

    for (const rec of recruitersWithBacklog) {
      await generateWeeklyIntelligenceDigest(rec.id, rec.companyId);
    }

    // 11. Admin Operational Background Checks
    await detectApiFailureSpikes();
    await detectPaymentFailureSpikes();
    if (now.getDay() === 0) {
      await generateWeeklyPlatformDigest();
    }

    return NextResponse.json({
      success: true,
      scannedAt: now.toISOString(),
      overdueSlaCount: overdueApps.length,
      autoClosedCount: autoCloseApps.length,
      expiredSavedJobsCount: expiredSavedJobs.length,
      upcoming24hInterviewsCount: upcoming24hInterviews.length,
      upcoming1hInterviewsCount: upcoming1hInterviews.length,
      unreadMessagesCount: unreadMessages.length,
      approachingOffersCount: approachingOffers.length,
    });
  } catch (err: any) {
    console.error("[POST /api/jobs/sla-check Error]:", err);
    await recordCronFailure("SLA_SCANNER", err?.message || "Unhandled SLA scanning failure");
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute SLA scanning" },
      { status: 500 }
    );
  }
}
