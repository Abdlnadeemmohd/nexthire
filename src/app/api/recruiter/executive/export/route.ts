import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getExecutiveOverview, listCompanyHiringPlans } from "@/lib/executive";

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
    return NextResponse.json({ success: false, error: "Forbidden: Cross-tenant export blocked" }, { status: 403 });
  }

  try {
    const overview = await getExecutiveOverview(companyId);
    const plans = await listCompanyHiringPlans(companyId);

    let csvContent = "Category,Metric,Value,Status,Limitations\n";
    csvContent += `Overview,Open Requisitions,${overview.openRequisitions},ACTIVE,Grounded in open job records\n`;
    csvContent += `Overview,Filled Positions,${overview.filledPositions},COMPLETED,Grounded in closed job records\n`;
    csvContent += `Overview,Active Candidates,${overview.activeCandidates},ACTIVE,Active pipeline applicants\n`;
    csvContent += `Overview,Interviews Scheduled,${overview.interviewsScheduled},SCHEDULED,Scheduled interview sessions\n`;
    csvContent += `Overview,Average Time to Hire (Days),${overview.averageTimeToHireDays ?? "N/A"},CALCULATED,Historical cycle time\n`;
    csvContent += `Overview,Offer Acceptance Rate (%),${overview.offerAcceptanceRate ?? "N/A"},CALCULATED,Offer to hire conversion\n`;

    for (const plan of plans) {
      csvContent += `Hiring Plan,"${plan.title} (${plan.department})",${plan.completedHires}/${plan.targetHires},${plan.status},${plan.progressPercentage}% progress\n`;
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexthire-executive-report-${companyId}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to generate CSV export" }, { status: 500 });
  }
}
