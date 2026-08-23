import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active session required" },
      { status: 401 }
    );
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    const formatted = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      category: n.category || "SYSTEM",
      priority: n.priority || "NORMAL",
      read: n.read,
      ctaText: n.ctaText || "View Details",
      ctaUrl: n.ctaUrl || getNotificationLink(n.type, authUser.role),
      link: n.ctaUrl || getNotificationLink(n.type, authUser.role),
      metadata: n.metadata ? (typeof n.metadata === "string" ? JSON.parse(n.metadata) : n.metadata) : null,
      emailStatus: n.emailStatus || "NOT_QUEUED",
      deliveredAt: n.deliveredAt ? n.deliveredAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
      time: formatRelativeTime(n.createdAt),
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      unreadCount,
      data: formatted,
    });
  } catch (err: any) {
    console.error("[GET /api/notifications Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active session required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: authUser.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: authUser.id },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    // Default: mark all as read
    await prisma.notification.updateMany({
      where: { userId: authUser.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true, message: "Notifications updated" });
  } catch (err: any) {
    console.error("[PATCH /api/notifications Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update notification state" },
      { status: 500 }
    );
  }
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

function getNotificationLink(type: string, role: string): string {
  if (type === "MESSAGE") return "/messages";
  if (role === "RECRUITER") return "/recruiter/applicants";
  if (role === "PLATFORM_ADMIN") return "/admin";
  return "/applications";
}
