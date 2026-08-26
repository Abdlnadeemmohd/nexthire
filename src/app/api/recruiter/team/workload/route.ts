import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getTeamWorkloadOverview } from "@/lib/collaboration";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  try {
    const workload = await getTeamWorkloadOverview(companyId);
    return NextResponse.json({ success: true, data: workload });
  } catch (error: any) {
    console.error("Error fetching team workload:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch team workload" }, { status: 500 });
  }
}
