import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { submitInterviewScorecard } from "@/lib/interview/interviewEngine";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const scorecards = await prisma.interviewScorecard.findMany({
      where: { interviewId: id },
      include: {
        scores: true,
        interviewer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: scorecards });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch scorecards" }, { status: 500 });
  }
}

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
    const payload = {
      ...body,
      interviewId: id,
    };

    const scorecard = await submitInterviewScorecard(
      payload,
      authUser.id,
      companyId,
      request.headers.get("x-forwarded-for") || "internal"
    );

    return NextResponse.json({ success: true, data: scorecard });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to submit scorecard" }, { status: 500 });
  }
}
