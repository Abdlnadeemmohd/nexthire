import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getJobMarketIntelligence } from "@/lib/market";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { id: jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ success: false, error: "Job ID required" }, { status: 400 });
  }

  try {
    const intelligence = await getJobMarketIntelligence(
      jobId,
      authUser.role === "PLATFORM_ADMIN" ? undefined : authUser.companyId || undefined
    );

    if (!intelligence) {
      return NextResponse.json({ success: false, error: "Job requisition not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: intelligence });
  } catch (error: any) {
    console.error("Error retrieving job market intelligence:", error);
    if (error.message === "UNAUTHORIZED_REQUISITION_ACCESS") {
      return NextResponse.json({ success: false, error: "Unauthorized access to company requisition" }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message || "Failed to retrieve job market intelligence" }, { status: 500 });
  }
}
