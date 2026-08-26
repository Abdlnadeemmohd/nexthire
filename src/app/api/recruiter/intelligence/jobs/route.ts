import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateCompanyFunnelSummary } from "@/lib/intelligence/hiringFunnel";

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
    const summary = await calculateCompanyFunnelSummary(companyId);
    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error("Error generating company jobs funnel summary:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch jobs funnel summary" }, { status: 500 });
  }
}
