import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/NotificationService";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active session required." },
      { status: 401 }
    );
  }

  try {
    if (authUser.role === "JOB_SEEKER") {
      const dbApps = await prisma.application.findMany({
        where: { applicantId: authUser.id },
        include: {
          job: { include: { company: true } },
          events: { orderBy: { timestamp: "desc" } },
          rejection: true,
          interviews: true,
        },
        orderBy: { appliedAt: "desc" },
      });

      const formatted = (dbApps || []).map((a) => {
        const daysDiff = Math.floor(
          (Date.now() - new Date(a.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const slaStatus =
          daysDiff > 7 ? "SLA_BREACHED" : daysDiff > 5 ? "NEAR_SLA" : "HEALTHY";
        return {
          id: a.id,
          jobId: a.jobId,
          jobTitle: a.job.title,
          companyName: a.job.company.name,
          companyLogo:
            a.job.company.logo ||
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
          candidateName: authUser.name,
          candidateAvatar: authUser.avatar,
          candidateTitle: authUser.headline || "Candidate Specialist",
          matchScore: a.matchScore,
          status: a.status,
          appliedAt: a.appliedAt.toISOString().split("T")[0],
          daysAwaitingUpdate: daysDiff,
          slaStatus,
          updatedAt: a.updatedAt.toISOString().split("T")[0],
          resumeUrl: a.resumeUrl || null,
          location: a.job.location,
          skills: a.job.skills ? a.job.skills.split(",").map((s) => s.trim()) : [],
          events: a.events,
          rejection: a.rejection,
          interviews: a.interviews,
        };
      });

      return NextResponse.json({
        success: true,
        count: formatted.length,
        data: formatted,
      });
    }

    // For recruiters or admins query applications by company
    if (authUser.role === "RECRUITER" && authUser.companyId) {
      const companyApps = await prisma.application.findMany({
        where: {
          job: {
            companyId: authUser.companyId,
          },
        },
        include: {
          applicant: { include: { profile: true } },
          job: { include: { company: true } },
          events: { orderBy: { timestamp: "desc" } },
          rejection: true,
          interviews: true,
        },
        orderBy: { appliedAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        count: companyApps.length,
        data: companyApps,
      });
    }

    if (authUser.role === "PLATFORM_ADMIN") {
      const allApps = await prisma.application.findMany({
        include: {
          applicant: { include: { profile: true } },
          job: { include: { company: true } },
          events: { orderBy: { timestamp: "desc" } },
          rejection: true,
          interviews: true,
        },
        orderBy: { appliedAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        count: allApps.length,
        data: allApps,
      });
    }

    return NextResponse.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    console.error("[Applications GET Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Database service temporarily unavailable",
        category: "DATABASE_UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "JOB_SEEKER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Candidates only may submit job applications" },
      { status: 403 }
    );
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const { jobId, coverLetter, resumeUrl } = body || {};

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { success: false, error: "Job ID is required to apply." },
        { status: 400 }
      );
    }

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Position not found or no longer available." },
        { status: 404 }
      );
    }

    // Resolve candidate's verified resume reference
    const profile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });

    const effectiveResumeUrl = resumeUrl || profile?.resumeUrl || null;

    if (!effectiveResumeUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Please upload your resume to your profile before submitting an application.",
          category: "RESUME_REQUIRED",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate active applications
    const existingApp = await prisma.application.findFirst({
      where: {
        jobId,
        applicantId: authUser.id,
      },
    });

    if (existingApp) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already submitted an application for this position.",
          category: "DUPLICATE_APPLICATION",
        },
        { status: 409 }
      );
    }

    const slaDeadline = new Date(Date.now() + (job.company.slaDays || 7) * 24 * 60 * 60 * 1000);

    const app = await prisma.application.create({
      data: {
        jobId,
        applicantId: authUser.id,
        status: "SUBMITTED",
        matchScore: 92,
        resumeUrl: effectiveResumeUrl,
        coverLetter: coverLetter || null,
        slaDeadline,
        events: {
          create: {
            type: "STATUS_CHANGED",
            actorId: authUser.id,
            notes: "Application submitted by candidate via NextHire Web Portal",
          },
        },
      },
      include: {
        job: { include: { company: true } },
      },
    });

    // 1. Notify Recruiter in Neon PostgreSQL
    const recruiterRecipientId = job.recruiterId;
    if (recruiterRecipientId) {
      await notificationService.sendNotification({
        userId: recruiterRecipientId,
        title: "New Application Received",
        body: `${authUser.name} applied for "${job.title}". Review their verified profile and resume in your candidate pipeline.`,
        type: "APPLICATION_STATUS",
        ctaText: "Review Applicant",
        ctaUrl: "/recruiter/applicants",
      });
    }

    // 2. Notify Candidate in Neon PostgreSQL & email
    await notificationService.sendNotification({
      userId: authUser.id,
      userEmail: authUser.email,
      title: "Application Submitted Successfully",
      body: `Your application for "${job.title}" at ${job.company.name} was successfully submitted. The hiring team has a 7-day review target.`,
      type: "APPLICATION_STATUS",
      ctaText: "Track Status",
      ctaUrl: "/applications",
    });

    // 3. Log Audit Trail
    await logAuditEvent(authUser.id, "APPLICATION_CREATED", "Application", app.id, {
      jobId: app.jobId,
      jobTitle: job.title,
      companyId: job.companyId,
    });

    return NextResponse.json({ success: true, data: app }, { status: 201 });
  } catch (err: any) {
    console.error("[Applications POST Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit application due to database error.",
        category: "DATABASE_UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}
