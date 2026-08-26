import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { analyzeSourcingChannelRoi, computeInternalBenchmarks } from "@/lib/executive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Forbidden: Executive access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedCompanyId = searchParams.get("companyId");
  const companyId = authUser.role === "PLATFORM_ADMIN" ? (requestedCompanyId || authUser.companyId) : authUser.companyId;

  if (!companyId) {
    return NextResponse.json({ success: false, error: "Company context missing" }, { status: 400 });
  }

  if (requestedCompanyId && requestedCompanyId !== authUser.companyId && authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden: Cross-tenant executive access blocked" }, { status: 403 });
  }

  try {
    const sourcingChannels = await analyzeSourcingChannelRoi(companyId);
    const benchmarks = await computeInternalBenchmarks(companyId);

    return NextResponse.json({
      success: true,
      data: {
        sourcingChannels,
        benchmarks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch funnel ROI intelligence" }, { status: 500 });
  }
}
