import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getHandoffs, createHandoff } from "@/lib/collaboration";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (
    !authUser ||
    (authUser.role !== "RECRUITER" &&
      authUser.role !== "RECRUITER_MANAGER" &&
      authUser.role !== "COMPANY_ADMIN" &&
      authUser.role !== "PLATFORM_ADMIN")
  ) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  const isManager =
    authUser.role === "RECRUITER_MANAGER" ||
    authUser.role === "COMPANY_ADMIN" ||
    authUser.role === "PLATFORM_ADMIN" ||
    authUser.isTester;

  const { searchParams } = new URL(req.url);
  const requestedRecruiterId = searchParams.get("recruiterId") || undefined;
  const recruiterId = isManager ? requestedRecruiterId : authUser.id;
  const status = (searchParams.get("status") as any) || undefined;
  const candidateId = searchParams.get("candidateId") || undefined;

  try {
    const handoffs = await getHandoffs(companyId, { recruiterId, status, candidateId });
    return NextResponse.json({ success: true, data: handoffs });
  } catch (error: any) {
    console.error("Error fetching handoffs:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch handoffs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (
    !authUser ||
    (authUser.role !== "RECRUITER" &&
      authUser.role !== "RECRUITER_MANAGER" &&
      authUser.role !== "COMPANY_ADMIN" &&
      authUser.role !== "PLATFORM_ADMIN")
  ) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      toRecruiterId,
      candidateId,
      applicationId,
      jobId,
      reason,
      currentStage,
      completedWork,
      pendingWork,
      importantEvidence,
      nextRecommendedAction,
      dueAt,
    } = body;

    if (!toRecruiterId || !candidateId || !reason || !currentStage) {
      return NextResponse.json({
        success: false,
        error: "toRecruiterId, candidateId, reason, and currentStage are required",
      }, { status: 400 });
    }

    const handoff = await createHandoff({
      companyId,
      fromRecruiterId: authUser.id,
      toRecruiterId,
      candidateId,
      applicationId,
      jobId,
      reason,
      currentStage,
      completedWork,
      pendingWork,
      importantEvidence,
      nextRecommendedAction,
      dueAt: dueAt ? new Date(dueAt) : null,
    });

    return NextResponse.json({ success: true, data: handoff });
  } catch (error: any) {
    console.error("Error creating handoff:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create handoff" }, { status: 500 });
  }
}
