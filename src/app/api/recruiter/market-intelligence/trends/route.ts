import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateMarketTrends } from "@/lib/market";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "30d") as "7d" | "30d" | "90d" | "180d";

  try {
    const trends = await calculateMarketTrends(period);
    return NextResponse.json({ success: true, data: trends });
  } catch (error: any) {
    console.error("Error calculating market trends:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate market trends" }, { status: 500 });
  }
}
