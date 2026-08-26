import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { emitEvent } from "@/lib/events/eventEngine";
import { evaluateAssessmentSubmission } from "@/lib/assessment/evidenceEngine";
import { AssessmentQuestionData } from "@/lib/assessment/types";

export const dynamic = "force-dynamic";

export async function POST(
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
            questions: { orderBy: { order: "asc" } },
          },
        },
        company: true,
        submission: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Assessment invitation not found" },
        { status: 404 }
      );
    }

    // Strict Candidate Authorization: Candidate B cannot submit for Candidate A
    if (invitation.candidateId !== authUser.id && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to submit for this candidate" },
        { status: 403 }
      );
    }

    // Check duplicate submission
    if (invitation.status === "SUBMITTED" || invitation.submission) {
      return NextResponse.json(
        { success: false, error: "Assessment has already been submitted and cannot be resubmitted." },
        { status: 400 }
      );
    }

    // Enforce deadline
    if (new Date(invitation.deadline) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Assessment submission rejected: Deadline has passed. Request an extension from the recruiter." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { answers = [] } = body;

    // Fetch candidate resume skills for verification comparison
    const candidateProfile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });
    const resumeSkills = candidateProfile?.skills
      ? candidateProfile.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // Format questions for evaluation engine
    const formattedQuestions: AssessmentQuestionData[] = invitation.assessment.questions.map((q) => ({
      id: q.id,
      category: q.category,
      type: q.type,
      question: q.question,
      codeSnippet: q.codeSnippet || undefined,
      sampleAnswer: q.sampleAnswer || undefined,
      rubric: q.rubric ? JSON.parse(q.rubric) : [],
      maxScore: q.maxScore,
      order: q.order,
    }));

    // Run grounded evidence extraction & scoring engine
    const evaluation = evaluateAssessmentSubmission(formattedQuestions, answers, resumeSkills);

    // Save AssessmentSubmission in transaction
    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.assessmentSubmission.create({
        data: {
          invitationId: invitation.id,
          assessmentId: invitation.assessmentId,
          candidateId: authUser.id,
          overallScore: evaluation.overallScore,
          categoryScores: JSON.stringify(evaluation.categoryScores),
          evidenceSummary: JSON.stringify(evaluation.evidenceSummary),
          skillVerificationMatrix: JSON.stringify(evaluation.skillVerificationMatrix),
          recommendedQuestions: JSON.stringify(evaluation.recommendedQuestions),
          status: "EVALUATED",
          submittedAt: new Date(),
          evaluatedAt: new Date(),
          answers: {
            create: evaluation.evaluatedAnswers.map((ea) => {
              const rawAns = answers.find((a: any) => a.questionId === ea.questionId);
              return {
                questionId: ea.questionId,
                answerText: rawAns?.answerText || "",
                score: ea.score,
                feedback: ea.feedback,
                evidencePoints: JSON.stringify(ea.evidencePoints),
                gapPoints: JSON.stringify(ea.gapPoints),
              };
            }),
          },
        },
        include: {
          answers: true,
        },
      });

      await tx.assessmentInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      return sub;
    });

    // Record audit events
    await logAuditEvent(
      authUser.id,
      "ASSESSMENT_SUBMITTED",
      "AssessmentSubmission",
      submission.id,
      {
        assessmentId: invitation.assessmentId,
        score: evaluation.overallScore,
        companyId: invitation.companyId,
      }
    );

    // Notify candidate of completed submission
    await emitEvent({
      type: "ASSESSMENT_COMPLETED",
      recipientId: authUser.id,
      actorId: authUser.id,
      companyId: invitation.companyId,
      entityType: "ASSESSMENT_SUBMISSION",
      entityId: submission.id,
      title: `Assessment Completed: ${invitation.assessment.title}`,
      body: `Your skills evaluation has been submitted to ${invitation.company.name} and evidence added to your verified profile.`,
      ctaText: "View Applications",
      ctaUrl: "/applications",
    });

    // Notify recruiter of new submission requiring review
    await emitEvent({
      type: "ASSESSMENT_SUBMITTED",
      recipientId: invitation.assessment.createdById,
      actorId: authUser.id,
      actorName: authUser.name,
      companyId: invitation.companyId,
      entityType: "ASSESSMENT_SUBMISSION",
      entityId: submission.id,
      title: `Assessment Submitted: ${authUser.name}`,
      body: `${authUser.name} scored ${evaluation.overallScore}/100 on ${invitation.assessment.title}. Evidence breakdown ready for recruiter review.`,
      ctaText: "Review Submission",
      ctaUrl: `/recruiter/assessments`,
      metadata: {
        assessmentId: invitation.assessmentId,
        candidateId: authUser.id,
        candidateName: authUser.name,
        overallScore: evaluation.overallScore,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        overallScore: evaluation.overallScore,
        isPassed: evaluation.isPassed,
        evidenceSummary: evaluation.evidenceSummary,
        skillVerificationMatrix: evaluation.skillVerificationMatrix,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
