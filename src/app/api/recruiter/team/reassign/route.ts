import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { reassignCandidate } from "@/lib/collaboration";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (
    !authUser ||
    (authUser.role !== "RECRUITER_MANAGER" &&
      authUser.role !== "COMPANY_ADMIN" &&
      authUser.role !== "PLATFORM_ADMIN" &&
      !authUser.isTester)
  ) {
    return NextResponse.json({ success: false, error: "Forbidden: Management permissions required to reassign candidates" }, { status: 403 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { assignmentId, candidateId, newRecruiterId, reason } = body;

    if (!newRecruiterId || (!assignmentId && !candidateId)) {
      return NextResponse.json({
        success: false,
        error: "newRecruiterId and either assignmentId or candidateId are required",
      }, { status: 400 });
    }

    const assignment = await reassignCandidate({
      companyId,
      assignmentId,
      candidateId,
      newRecruiterId,
      assignedById: authUser.id,
      reason,
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error("Error reassigning candidate:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to reassign candidate" }, { status: 500 });
  }
}
