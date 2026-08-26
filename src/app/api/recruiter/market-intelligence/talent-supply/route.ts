import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateTalentSupply } from "@/lib/market";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || undefined;
  const skills = searchParams.get("skills") || undefined;
  const location = searchParams.get("location") || undefined;
  const country = searchParams.get("country") || undefined;
  const jobId = searchParams.get("jobId") || undefined;

  try {
    const supply = await calculateTalentSupply({
      role,
      skills,
      location,
      country,
      jobId,
      companyId: authUser.companyId || undefined,
    });
    return NextResponse.json({ success: true, data: supply });
  } catch (error: any) {
    console.error("Error calculating talent supply:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate talent supply" }, { status: 500 });
  }
}
