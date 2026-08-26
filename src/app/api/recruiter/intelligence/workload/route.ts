import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateRecruiterWorkload, calculateCompanyWorkloadDistribution } from "@/lib/intelligence/workloadEngine";

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
  const scope = searchParams.get("scope") || "me"; // "me" or "company"

  try {
    if (scope === "company") {
      const companyWorkload = await calculateCompanyWorkloadDistribution(companyId);
      return NextResponse.json({ success: true, data: companyWorkload });
    }

    const myWorkload = await calculateRecruiterWorkload(authUser.id, companyId);
    return NextResponse.json({ success: true, data: myWorkload });
  } catch (error: any) {
    console.error("Error calculating recruiter workload:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate workload" }, { status: 500 });
  }
}
