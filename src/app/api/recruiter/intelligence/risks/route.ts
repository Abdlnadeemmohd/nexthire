import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateHiringTargetRisk } from "@/lib/intelligence/historicalComparison";
import { detectStalledCandidates } from "@/lib/intelligence/candidateStallDetector";

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
    const activeJobs = await prisma.job.findMany({
      where: { companyId, status: "ACTIVE" },
      select: { id: true, title: true },
    });

    const targetRiskPromises = activeJobs.map((j) => calculateHiringTargetRisk(j.id, companyId));
    const targetRisks = (await Promise.all(targetRiskPromises)).filter((r) => r !== null);
    const stalledCandidates = await detectStalledCandidates(companyId);

    return NextResponse.json({
      success: true,
      data: {
        targetRisks,
        stalledCandidates,
      },
    });
  } catch (error: any) {
    console.error("Error calculating hiring risks:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate risks" }, { status: 500 });
  }
}
