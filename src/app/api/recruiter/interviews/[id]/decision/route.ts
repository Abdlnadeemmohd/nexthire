import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { recordInterviewDecision } from "@/lib/interview/interviewEngine";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  const { id } = params;

  try {
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: { include: { job: true } } },
    });

    if (!interview) {
      return NextResponse.json({ success: false, error: "Interview not found" }, { status: 404 });
    }

    const companyId = interview.application.job.companyId;
    if (authUser.companyId && companyId !== authUser.companyId && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized: Company access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      decision,
      decisionReason,
      evidenceSummary,
      conflictingNotes,
    } = body;

    if (!decision || !decisionReason || !evidenceSummary) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: decision, decisionReason, evidenceSummary",
      }, { status: 400 });
    }

    const result = await recordInterviewDecision({
      applicationId: interview.applicationId,
      decision,
      decisionReason,
      evidenceSummary,
      conflictingNotes,
      decisionMakerId: authUser.id,
      companyId,
      userIp: request.headers.get("x-forwarded-for") || "internal",
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to record interview decision" }, { status: 500 });
  }
}
