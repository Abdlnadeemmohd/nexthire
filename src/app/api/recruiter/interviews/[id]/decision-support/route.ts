import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { generateDecisionSupport } from "@/lib/interview/decisionEngine";

export async function GET(
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

    const decisionSupport = await generateDecisionSupport(interview.applicationId, companyId);
    return NextResponse.json({ success: true, data: decisionSupport });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to generate decision support" }, { status: 500 });
  }
}
