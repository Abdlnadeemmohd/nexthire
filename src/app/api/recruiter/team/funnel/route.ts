import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getTeamFunnelMetrics } from "@/lib/collaboration";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const recruiterId = searchParams.get("recruiterId") || undefined;
  const jobId = searchParams.get("jobId") || undefined;
  const teamId = searchParams.get("teamId") || undefined;

  try {
    const funnel = await getTeamFunnelMetrics(companyId, { recruiterId, jobId, teamId });
    return NextResponse.json({ success: true, data: funnel });
  } catch (error: any) {
    console.error("Error calculating team funnel:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate team funnel" }, { status: 500 });
  }
}
