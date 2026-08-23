import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { emitEvent } from "@/lib/events/eventEngine";
import { getAdminRecipients } from "@/lib/admin/adminMonitoring";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports
 * Fetches moderation reports (Admin only).
 */
export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin role required" },
      { status: 403 }
    );
  }

  try {
    const reportAudits = await prisma.auditEvent.findMany({
      where: {
        action: { in: ["REPORT_SUBMITTED", "REPORT_RESOLVED", "REPORT_DISMISSED"] },
      },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    const formatted = reportAudits.map((item) => {
      let meta: any = {};
      try {
        if (item.metadata) meta = JSON.parse(item.metadata);
      } catch {}

      return {
        id: item.id,
        action: item.action,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        actorId: item.actorId,
        reason: meta.reason || "Policy Violation",
        details: meta.details || "",
        status: meta.status || (item.action === "REPORT_SUBMITTED" ? "OPEN" : "RESOLVED"),
        timestamp: item.timestamp.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/reports Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch moderation reports" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/reports
 * Submits a report for a Job or User profile. Emits ADMIN_JOB_REPORTED or ADMIN_USER_REPORTED.
 */
export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active session required to file a report" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { targetType, targetId, reason, details } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: targetType, targetId, reason" },
        { status: 400 }
      );
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Record report in AuditEvent
    await prisma.auditEvent.create({
      data: {
        id: reportId,
        actorId: authUser.id,
        action: "REPORT_SUBMITTED",
        resourceType: targetType === "JOB" ? "Job" : "User",
        resourceId: targetId,
        metadata: JSON.stringify({
          reason,
          details: details || "",
          status: "OPEN",
          reporterEmail: authUser.email,
        }),
      },
    });

    const admins = await getAdminRecipients();

    if (targetType === "JOB") {
      const job = await prisma.job.findUnique({
        where: { id: targetId },
        select: { id: true, title: true, company: { select: { name: true } } },
      });

      for (const admin of admins) {
        await emitEvent({
          type: "ADMIN_JOB_REPORTED",
          recipientId: admin.id,
          recipientEmail: admin.email,
          entityType: "Job",
          entityId: targetId,
          title: `🚩 Job Reported: "${job?.title || targetId}"`,
          body: `Job posting reported for: ${reason}. ${details ? `Details: ${details.slice(0, 100)}` : ""}`,
          ctaText: "Review Job",
          ctaUrl: `/jobs/${targetId}`,
          metadata: { jobId: targetId, reason, details, status: "OPEN" },
        }).catch(() => {});
      }
    } else {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, name: true, role: true },
      });

      for (const admin of admins) {
        await emitEvent({
          type: "ADMIN_USER_REPORTED",
          recipientId: admin.id,
          recipientEmail: admin.email,
          entityType: "User",
          entityId: targetId,
          title: `🚩 User Profile Reported: ${targetUser?.name || targetId}`,
          body: `${targetUser?.role || "User"} reported for: ${reason}.`,
          ctaText: "Inspect User",
          ctaUrl: `/admin/users`,
          metadata: { userId: targetId, reason, details, status: "OPEN" },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      reportId,
      message: "Report submitted for administrator review.",
    });
  } catch (err: any) {
    console.error("[POST /api/admin/reports Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to submit moderation report" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/reports
 * Resolves or dismisses a report (Admin only).
 */
export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin role required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { reportId, status, resolutionNotes } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: reportId, status" },
        { status: 400 }
      );
    }

    await prisma.auditEvent.create({
      data: {
        actorId: authUser.id,
        action: status === "RESOLVED" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
        resourceType: "ModerationReport",
        resourceId: reportId,
        metadata: JSON.stringify({
          status,
          resolutionNotes: resolutionNotes || "",
          resolvedBy: authUser.email,
          resolvedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Report status updated to ${status}.`,
    });
  } catch (err: any) {
    console.error("[PATCH /api/admin/reports Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update report status" },
      { status: 500 }
    );
  }
}
