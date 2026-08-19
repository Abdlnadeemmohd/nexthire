import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/NotificationService";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Sign in required." },
      { status: 401 }
    );
  }

  if (authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Platform Admin access required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  try {
    const users = await prisma.user.findMany({
      where: role && role !== "ALL" ? { role: role as any } : {},
      include: {
        company: true,
        profile: true,
        _count: {
          select: {
            applications: true,
            jobs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Query verification audit events to resolve user verification status
    const auditLogs = await prisma.auditEvent.findMany({
      where: {
        resourceType: "User",
        action: { in: ["USER_VERIFIED", "USER_REJECTED", "USER_SUSPENDED"] },
      },
      orderBy: { timestamp: "desc" },
    });

    const statusMap = new Map<string, string>();
    for (const log of auditLogs) {
      if (log.resourceId && !statusMap.has(log.resourceId)) {
        if (log.action === "USER_VERIFIED") statusMap.set(log.resourceId, "VERIFIED");
        else if (log.action === "USER_REJECTED") statusMap.set(log.resourceId, "REJECTED");
        else if (log.action === "USER_SUSPENDED") statusMap.set(log.resourceId, "SUSPENDED");
      }
    }

    const formatted = users.map((u) => {
      const verificationStatus =
        statusMap.get(u.id) ||
        (u.role === "PLATFORM_ADMIN" ? "VERIFIED" : "PENDING"); // Safe authoritative default: PENDING

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: verificationStatus,
        verificationStatus: verificationStatus,
        avatar: u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
        headline: u.headline || "",
        companyName: u.company?.name || "",
        companyId: u.companyId || null,
        isCompanyVerified: u.company?.isVerified ?? false,
        createdAt: u.createdAt.toISOString(),
        joinedDate: u.createdAt.toISOString(),
        applicationsCount: u._count.applications,
        jobsCount: u._count.jobs,
      };
    });

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: any) {
    console.error("[GET /api/admin/users Database Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve user directory from database" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, status, reason } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { success: false, error: "userId and status ('VERIFIED' | 'REJECTED' | 'SUSPENDED') are required." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User record not found" }, { status: 404 });
    }

    const actionName =
      status === "VERIFIED"
        ? "USER_VERIFIED"
        : status === "REJECTED"
        ? "USER_REJECTED"
        : "USER_SUSPENDED";

    // 1. Log Audit Event
    await logAuditEvent(authUser.id, actionName, "User", userId, {
      previousStatus: "PENDING",
      newStatus: status,
      reason: reason || "Administrative verification review",
      userEmail: targetUser.email,
      role: targetUser.role,
    });

    // 2. Send Automated In-App Notification to User
    await notificationService.sendNotification({
      userId: targetUser.id,
      userEmail: targetUser.email,
      title: `Account Verification Status: ${status}`,
      body:
        status === "VERIFIED"
          ? "Congratulations! Your NextHire account has been verified by platform administrators. You now have full access to platform features."
          : `Your account verification status has been updated to ${status}. Reason: ${reason || "Administrative review"}`,
      type: "SYSTEM",
      ctaText: "Go to Portal",
      ctaUrl: targetUser.role === "RECRUITER" ? "/recruiter" : "/dashboard",
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} status updated to ${status}`,
      data: {
        userId,
        status,
      },
    });
  } catch (err: any) {
    console.error("[PATCH /api/admin/users Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update user verification status" },
      { status: 500 }
    );
  }
}
