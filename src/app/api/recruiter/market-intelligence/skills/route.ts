import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateSkillScarcity } from "@/lib/market";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawSkills = searchParams.get("skills");
  const jobId = searchParams.get("jobId") || undefined;
  const skills = rawSkills ? rawSkills.split(",").map((s) => s.trim()).filter(Boolean) : [];

  try {
    const metrics = await calculateSkillScarcity(skills, jobId);
    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    console.error("Error calculating skill scarcity:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate skill scarcity" }, { status: 500 });
  }
}
