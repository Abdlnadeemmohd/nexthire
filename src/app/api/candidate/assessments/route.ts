import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: User session required" },
      { status: 401 }
    );
  }

  try {
    const invitations = await prisma.assessmentInvitation.findMany({
      where: { candidateId: authUser.id },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            durationMinutes: true,
            passingScore: true,
            questions: { select: { id: true } },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
          },
        },
        application: {
          include: {
            job: { select: { id: true, title: true, location: true } },
          },
        },
        submission: {
          select: {
            id: true,
            overallScore: true,
            status: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const formatted = invitations.map((inv) => {
      let currentStatus = inv.status;
      if (currentStatus === "PENDING" && new Date(inv.deadline) < now) {
        currentStatus = "EXPIRED";
      }

      return {
        id: inv.id,
        assessmentId: inv.assessmentId,
        title: inv.assessment.title,
        description: inv.assessment.description,
        category: inv.assessment.category,
        durationMinutes: inv.assessment.durationMinutes,
        questionsCount: inv.assessment.questions.length,
        companyName: inv.company.name,
        companyLogo: inv.company.logo,
        jobTitle: inv.application?.job?.title || null,
        deadline: inv.deadline.toISOString(),
        isExpired: new Date(inv.deadline) < now,
        status: currentStatus,
        invitedAt: inv.invitedAt.toISOString(),
        submission: inv.submission
          ? {
              id: inv.submission.id,
              overallScore: inv.submission.overallScore,
              status: inv.submission.status,
              submittedAt: inv.submission.submittedAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch candidate assessments" },
      { status: 500 }
    );
  }
}
