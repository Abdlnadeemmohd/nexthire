import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { emitEvent } from "@/lib/events/eventEngine";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: User session required" },
      { status: 401 }
    );
  }

  try {
    const invitation = await prisma.assessmentInvitation.findUnique({
      where: { id: params.id },
      include: {
        assessment: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                category: true,
                type: true,
                question: true,
                codeSnippet: true,
                maxScore: true,
                order: true,
                // rubric and sampleAnswer are STRICTLY EXCLUDED for candidate privacy & test integrity
              },
            },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        application: {
          include: {
            job: { select: { id: true, title: true, location: true } },
          },
        },
        submission: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Assessment invitation not found" },
        { status: 404 }
      );
    }

    // Strict Candidate Authorization Isolation: A candidate cannot access another candidate's assessment
    if (invitation.candidateId !== authUser.id && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to view this assessment" },
        { status: 403 }
      );
    }

    // Check if expired
    const isExpired = new Date(invitation.deadline) < new Date();
    if (isExpired && invitation.status === "PENDING") {
      await prisma.assessmentInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      invitation.status = "EXPIRED";
    }

    // Mark as IN_PROGRESS if first view and not submitted/expired
    if (invitation.status === "PENDING" && !isExpired) {
      await prisma.assessmentInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
      invitation.status = "IN_PROGRESS";

      // Emit event to recruiter
      await emitEvent({
        type: "ASSESSMENT_STARTED",
        recipientId: invitation.assessment.createdById,
        actorId: authUser.id,
        actorName: authUser.name,
        companyId: invitation.companyId,
        entityType: "ASSESSMENT_INVITATION",
        entityId: invitation.id,
        title: `Candidate Started Assessment: ${invitation.assessment.title}`,
        body: `${authUser.name} has begun their technical evaluation for ${invitation.assessment.title}.`,
        ctaText: "View Assessment",
        ctaUrl: "/recruiter/assessments",
        metadata: {
          assessmentId: invitation.assessmentId,
          candidateName: authUser.name,
          candidateId: authUser.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        assessmentId: invitation.assessmentId,
        title: invitation.assessment.title,
        description: invitation.assessment.description,
        category: invitation.assessment.category,
        durationMinutes: invitation.assessment.durationMinutes,
        deadline: invitation.deadline.toISOString(),
        status: invitation.status,
        isExpired,
        companyName: invitation.company.name,
        companyLogo: invitation.company.logo,
        jobTitle: invitation.application?.job?.title || null,
        questions: invitation.assessment.questions,
        submission: invitation.submission
          ? {
              id: invitation.submission.id,
              overallScore: invitation.submission.overallScore,
              status: invitation.submission.status,
              submittedAt: invitation.submission.submittedAt.toISOString(),
              evidenceSummary: JSON.parse(invitation.submission.evidenceSummary || "{}"),
              categoryScores: JSON.parse(invitation.submission.categoryScores || "{}"),
              answers: invitation.submission.answers.map((a) => ({
                questionId: a.questionId,
                answerText: a.answerText,
              })),
            }
          : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}
