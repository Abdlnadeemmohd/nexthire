import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getTeamActivityStream } from "@/lib/collaboration";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (
    !authUser ||
    (authUser.role !== "RECRUITER_MANAGER" &&
      authUser.role !== "COMPANY_ADMIN" &&
      authUser.role !== "PLATFORM_ADMIN" &&
      !authUser.isTester)
  ) {
    return NextResponse.json({ success: false, error: "Forbidden: Management permissions required" }, { status: 403 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  try {
    const activity = await getTeamActivityStream(companyId, limit);
    return NextResponse.json({ success: true, data: activity });
  } catch (error: any) {
    console.error("Error fetching team activity:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch team activity" }, { status: 500 });
  }
}
