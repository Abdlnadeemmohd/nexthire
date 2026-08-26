import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getIntelligenceOverview } from "@/lib/intelligence/strategyEngine";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "Company association required" }, { status: 400 });
  }

  try {
    const overview = await getIntelligenceOverview(companyId, authUser.id);
    return NextResponse.json({ success: true, data: overview });
  } catch (error: any) {
    console.error("Error generating hiring intelligence overview:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate intelligence overview" }, { status: 500 });
  }
}
