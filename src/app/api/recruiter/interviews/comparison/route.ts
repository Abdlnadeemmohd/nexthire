import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { generateCandidateComparison } from "@/lib/interview/candidateComparisonEngine";

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { applicationIds } = body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length < 2 || applicationIds.length > 5) {
      return NextResponse.json({
        success: false,
        error: "Comparison requires an array of 2 to 5 applicationIds",
      }, { status: 400 });
    }

    const companyId = authUser.companyId;
    if (!companyId && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ success: false, error: "Company association required" }, { status: 400 });
    }

    const matrix = await generateCandidateComparison(applicationIds, companyId || "");
    return NextResponse.json({ success: true, data: matrix });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to generate candidate comparison" }, { status: 500 });
  }
}
