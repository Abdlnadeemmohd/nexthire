import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Owner permission required" },
      { status: 403 }
    );
  }

  try {
    const auditLogs = await prisma.auditEvent.findMany({
      take: 50,
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ success: true, count: auditLogs.length, data: auditLogs });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch audit trail" },
      { status: 500 }
    );
  }
}
