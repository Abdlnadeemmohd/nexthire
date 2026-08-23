import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { checkPlatformHealth } from "@/lib/admin/adminMonitoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin role required" },
      { status: 403 }
    );
  }

  try {
    const health = await checkPlatformHealth();

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
        uptimeSeconds: Math.floor(process.uptime()),
        ...health,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/health Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Health check execution failed" },
      { status: 500 }
    );
  }
}
