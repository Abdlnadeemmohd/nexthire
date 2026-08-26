import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertCompanyAccess } from "@/lib/auth/multiTenant";
import { assertUserVerified } from "@/lib/auth/verification";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "all";
  const search = searchParams.get("search") || "";

  try {
    const companyId = authUser.companyId;
    if (!companyId && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ success: false, error: "Company association required" }, { status: 400 });
    }

    const whereClause: any = {};
    if (companyId) {
      whereClause.application = {
        job: { companyId },
      };
    }

    if (search) {
      whereClause.OR = [
        { application: { applicant: { name: { contains: search, mode: "insensitive" } } } },
        { application: { job: { title: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const interviews = await prisma.interview.findMany({
      where: whereClause,
      include: {
        application: {
          include: {
            job: { include: { company: true } },
            applicant: {
              include: {
                profile: true,
                assessmentSubmissions: {
                  include: { assessment: true },
                  take: 1,
                  orderBy: { submittedAt: "desc" },
                },
              },
            },
          },
        },
        plan: true,
        scorecards: {
          include: {
            scores: true,
            interviewer: true,
          },
        },
        summary: true,
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Compute Telemetry Metrics
    let upcomingCount = 0;
    let todayCount = 0;
    let awaitingFeedbackCount = 0;
    let overdueCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const formattedList = interviews.map(i => {
      const isPast = new Date(i.scheduledAt) < now;
      const isToday = new Date(i.scheduledAt) >= startOfToday && new Date(i.scheduledAt) <= endOfToday;
      const isComplete = i.scorecards.some(sc => sc.isComplete) || i.status === "PASSED" || i.status === "FAILED";
      const isOverdue = isPast && !isComplete && new Date(i.scheduledAt) <= oneDayAgo;

      if (i.status === "PASSED" || i.status === "FAILED" || (isPast && isComplete)) {
        completedCount++;
      } else if (isOverdue) {
        overdueCount++;
        awaitingFeedbackCount++;
      } else if (isPast && !isComplete) {
        awaitingFeedbackCount++;
      } else if (isToday) {
        todayCount++;
      } else if (!isPast) {
        upcomingCount++;
      }

      return {
        id: i.id,
        round: i.round,
        scheduledAt: i.scheduledAt,
        timezone: i.timezone,
        type: i.type,
        platform: i.platform,
        meetingLink: i.meetingLink,
        agenda: i.agenda,
        panelMembers: i.panelMembers,
        notes: i.notes,
        status: i.status,
        createdAt: i.createdAt,
        applicationId: i.applicationId,
        candidate: {
          id: i.application.applicant.id,
          name: i.application.applicant.name,
          email: i.application.applicant.email,
          avatar: i.application.applicant.avatar,
          headline: i.application.applicant.headline,
          location: i.application.applicant.location,
        },
        job: {
          id: i.application.job.id,
          title: i.application.job.title,
          companyName: i.application.job.company.name,
        },
        applicationStatus: i.application.status,
        matchScore: i.application.matchScore,
        hasPlan: !!i.plan,
        scorecardsCount: i.scorecards.length,
        hasCompletedScorecard: i.scorecards.some(sc => sc.isComplete),
        isOverdue,
        isToday,
        isPast,
      };
    });

    // Filter by tab
    let filtered = formattedList;
    if (tab === "today") {
      filtered = formattedList.filter(i => i.isToday && !i.hasCompletedScorecard);
    } else if (tab === "upcoming") {
      filtered = formattedList.filter(i => !i.isPast);
    } else if (tab === "awaiting_feedback") {
      filtered = formattedList.filter(i => i.isPast && !i.hasCompletedScorecard);
    } else if (tab === "completed") {
      filtered = formattedList.filter(i => i.hasCompletedScorecard || i.status === "PASSED" || i.status === "FAILED");
    }

    return NextResponse.json({
      success: true,
      data: {
        interviews: filtered,
        metrics: {
          totalCount: interviews.length,
          upcomingCount,
          todayCount,
          awaitingFeedbackCount,
          overdueCount,
          completedCount,
          cancelledCount,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch interviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      applicationId,
      round = 1,
      scheduledAt,
      timezone = "UTC",
      type = "TECHNICAL",
      platform = "GOOGLE_MEET",
      meetingLink,
      agenda,
      panelMembers = [],
      notes,
    } = body;

    if (!applicationId || !scheduledAt) {
      return NextResponse.json({ success: false, error: "Missing required fields: applicationId, scheduledAt" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true, applicant: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    if (authUser.companyId && application.job.companyId !== authUser.companyId && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized: Multi-tenant company mismatch" }, { status: 403 });
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId,
        round: Number(round) || 1,
        scheduledAt: new Date(scheduledAt),
        timezone,
        type,
        platform,
        meetingLink: meetingLink || null,
        agenda: agenda || null,
        panelMembers: Array.isArray(panelMembers) ? panelMembers : [panelMembers],
        notes: notes || null,
        status: "PENDING",
      },
    });

    await logAuditEvent(
      authUser.id,
      "INTERVIEW_SCHEDULED",
      "Interview",
      interview.id,
      { applicationId, round, type, scheduledAt, companyId: application.job.companyId }
    );

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to schedule interview" }, { status: 500 });
  }
}
