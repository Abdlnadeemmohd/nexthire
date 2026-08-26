import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getTeamProductivity } from "@/lib/collaboration";

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

  try {
    const metrics = await getTeamProductivity(companyId, recruiterId);
    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    console.error("Error calculating team productivity:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate productivity" }, { status: 500 });
  }
}
