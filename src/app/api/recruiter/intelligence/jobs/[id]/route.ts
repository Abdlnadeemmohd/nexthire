import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateJobFunnel } from "@/lib/intelligence/hiringFunnel";
import { detectJobBottlenecks } from "@/lib/intelligence/bottleneckDetector";
import { compareJobWithHistorical, calculateHiringTargetRisk } from "@/lib/intelligence/historicalComparison";
import { generateStrategicRecommendations } from "@/lib/intelligence/strategyEngine";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "Company association required" }, { status: 400 });
  }

  const jobId = params.id;
  if (!jobId) {
    return NextResponse.json({ success: false, error: "Job ID required" }, { status: 400 });
  }

  try {
    const funnel = await calculateJobFunnel(jobId, companyId);
    if (!funnel) {
      return NextResponse.json({ success: false, error: "Job not found or unauthorized" }, { status: 404 });
    }

    const bottlenecks = await detectJobBottlenecks(jobId, companyId);
    const historicalComparisons = await compareJobWithHistorical(jobId, companyId);
    const targetRisk = await calculateHiringTargetRisk(jobId, companyId);
    const recommendations = await generateStrategicRecommendations(companyId, authUser.id, jobId);

    return NextResponse.json({
      success: true,
      data: {
        funnel,
        bottlenecks,
        historicalComparisons,
        targetRisk,
        recommendations,
      },
    });
  } catch (error: any) {
    console.error("Error generating job funnel intelligence:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch job intelligence" }, { status: 500 });
  }
}
