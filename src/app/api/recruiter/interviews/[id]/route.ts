import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

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
      include: {
        application: {
          include: {
            job: { include: { company: true } },
            applicant: {
              include: {
                profile: true,
                assessmentSubmissions: {
                  include: { assessment: true },
                  orderBy: { submittedAt: "desc" },
                },
              },
            },
            events: { orderBy: { timestamp: "desc" } },
            interviewDecisions: {
              include: { decisionMaker: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        plan: true,
        scorecards: {
          include: {
            scores: true,
            interviewer: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        summary: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ success: false, error: "Interview not found" }, { status: 404 });
    }

    if (authUser.companyId && interview.application.job.companyId !== authUser.companyId && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized: Company access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch interview" }, { status: 500 });
  }
}
