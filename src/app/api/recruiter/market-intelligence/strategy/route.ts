import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { generateJobSourcingRecommendations, getMarketOverview } from "@/lib/market";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  try {
    if (jobId) {
      const recommendations = await generateJobSourcingRecommendations(jobId);
      return NextResponse.json({ success: true, data: { recommendations } });
    }

    if (!authUser.companyId) {
      return NextResponse.json({ success: false, error: "Company association required" }, { status: 400 });
    }

    const overview = await getMarketOverview(authUser.companyId);
    return NextResponse.json({ success: true, data: { recommendations: overview.topRecommendations } });
  } catch (error: any) {
    console.error("Error generating sourcing recommendations:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate sourcing recommendations" }, { status: 500 });
  }
}
