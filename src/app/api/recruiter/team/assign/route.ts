import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assignCandidate, assignJobOwner } from "@/lib/collaboration";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { type = "CANDIDATE", candidateId, applicationId, jobId, recruiterId, reason, teamId } = body;

    if (type === "JOB") {
      if (!jobId || !recruiterId) {
        return NextResponse.json({ success: false, error: "jobId and recruiterId are required" }, { status: 400 });
      }
      await assignJobOwner({
        companyId,
        jobId,
        newRecruiterId: recruiterId,
        assignedById: authUser.id,
        reason,
      });
      return NextResponse.json({ success: true, message: "Job owner assigned successfully" });
    } else {
      if (!candidateId || !recruiterId) {
        return NextResponse.json({ success: false, error: "candidateId and recruiterId are required" }, { status: 400 });
      }
      const assignment = await assignCandidate({
        companyId,
        candidateId,
        applicationId,
        jobId,
        recruiterId,
        assignedById: authUser.id,
        reason,
        teamId,
      });
      return NextResponse.json({ success: true, data: assignment });
    }
  } catch (error: any) {
    console.error("Error assigning:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to perform assignment" }, { status: 500 });
  }
}
