import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { diagnoseSupplyVsFunnel } from "@/lib/market";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ success: false, error: "Missing required jobId parameter" }, { status: 400 });
  }

  try {
    const result = await diagnoseSupplyVsFunnel(jobId);
    if (!result) {
      return NextResponse.json({ success: false, error: "Job requisition not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error diagnosing supply vs funnel:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to diagnose supply vs funnel" }, { status: 500 });
  }
}
