import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCandidateFit } from "@/lib/copilot/copilotEngine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "RECRUITER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active recruiter session required" },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { success: false, error: "Recruiter must be affiliated with an active company profile" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { candidateId, jobId } = body;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required" },
        { status: 400 }
      );
    }

    const fitAnalysis = await getCandidateFit(user.companyId, candidateId, jobId);

    if (!fitAnalysis) {
      return NextResponse.json(
        { success: false, error: "Candidate not found or profile is private" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      fitAnalysis,
    });
  } catch (err: any) {
    console.error("Recruiter Explain Fit API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to calculate candidate fit" },
      { status: 500 }
    );
  }
}
