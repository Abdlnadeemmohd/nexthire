import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getMarketOverview } from "@/lib/market";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (
    !authUser ||
    (authUser.role !== "RECRUITER" &&
      authUser.role !== "RECRUITER_MANAGER" &&
      authUser.role !== "COMPANY_ADMIN" &&
      authUser.role !== "PLATFORM_ADMIN")
  ) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "Company association required" }, { status: 400 });
  }

  const isManager =
    authUser.role === "RECRUITER_MANAGER" ||
    authUser.role === "COMPANY_ADMIN" ||
    authUser.role === "PLATFORM_ADMIN" ||
    authUser.isTester;

  try {
    const overview = await getMarketOverview(companyId, isManager ? undefined : authUser.id);
    return NextResponse.json({ success: true, data: overview, isManager });
  } catch (error: any) {
    console.error("Error generating market overview:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate market overview" }, { status: 500 });
  }
}
