import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function POST() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Admin authorization required to trigger SLA scanning" },
      { status: 403 }
    );
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

    return NextResponse.json({
      success: true,
      scannedAt: now.toISOString(),
      overdueSlaCount: overdueApps.length,
      autoClosedCount: autoCloseApps.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute SLA scanning" },
      { status: 500 }
    );
  }
}
