import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSmartAssignmentRecommendation } from "@/lib/collaboration";

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
  const candidateId = searchParams.get("candidateId");
  const jobId = searchParams.get("jobId") || undefined;

  if (!candidateId) {
    return NextResponse.json({ success: false, error: "candidateId is required" }, { status: 400 });
  }

  try {
    const recommendation = await getSmartAssignmentRecommendation(candidateId, companyId, jobId);
    return NextResponse.json({ success: true, data: recommendation });
  } catch (error: any) {
    console.error("Error generating assignment recommendation:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate recommendation" }, { status: 500 });
  }
}
