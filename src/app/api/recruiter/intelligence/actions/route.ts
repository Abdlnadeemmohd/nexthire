import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { generateStrategicRecommendations } from "@/lib/intelligence/strategyEngine";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "Company association required" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId") || undefined;

  try {
    const actions = await generateStrategicRecommendations(companyId, authUser.id, jobId);
    return NextResponse.json({ success: true, data: { actions } });
  } catch (error: any) {
    console.error("Error generating strategic recommendations:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate recommendations" }, { status: 500 });
  }
}
