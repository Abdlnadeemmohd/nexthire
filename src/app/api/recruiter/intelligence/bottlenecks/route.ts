import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { detectCompanyBottlenecks } from "@/lib/intelligence/bottleneckDetector";

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
    const bottlenecks = await detectCompanyBottlenecks(companyId);
    return NextResponse.json({ success: true, data: { bottlenecks } });
  } catch (error: any) {
    console.error("Error discovering company bottlenecks:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch bottlenecks" }, { status: 500 });
  }
}
