import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateLocationSupply } from "@/lib/market";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId") || undefined;

  try {
    const locations = await calculateLocationSupply(jobId);
    return NextResponse.json({ success: true, data: locations });
  } catch (error: any) {
    console.error("Error calculating location supply:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate location supply" }, { status: 500 });
  }
}
