import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  try {
    const candidateId = params.id;
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      include: {
        profile: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Fetch latest completed assessment submissions for this candidate
    const submissions = await prisma.assessmentSubmission.findMany({
      where: { candidateId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            category: true,
            durationMinutes: true,
            companyId: true,
          },
        },
        invitation: {
          select: {
            companyId: true,
            deadline: true,
            submittedAt: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    const resumeSkills = candidate.profile?.skills
      ? candidate.profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    let combinedEvidenceMatrix: any[] = [];
    let combinedQuestions: any[] = [];
    let latestSubmissionData: any = null;

    if (submissions.length > 0) {
      const latest = submissions[0];
      const matrix = latest.skillVerificationMatrix ? JSON.parse(latest.skillVerificationMatrix) : [];
      const questions = latest.recommendedQuestions ? JSON.parse(latest.recommendedQuestions) : [];
      const evidence = latest.evidenceSummary ? JSON.parse(latest.evidenceSummary) : {};
      const catScores = latest.categoryScores ? JSON.parse(latest.categoryScores) : {};

      combinedEvidenceMatrix = matrix;
      combinedQuestions = questions;
      latestSubmissionData = {
        id: latest.id,
        assessmentTitle: latest.assessment.title,
        overallScore: latest.overallScore,
        categoryScores: catScores,
        evidenceSummary: evidence,
        submittedAt: latest.submittedAt.toISOString(),
      };
    } else {
      // Build baseline matrix from resume skills if no assessments taken yet
      combinedEvidenceMatrix = resumeSkills.map((s) => ({
        skill: s,
        resumeClaim: "Claimed in profile/resume",
        assessmentEvidence: "UNVERIFIED",
        confidence: "LOW",
        gapSnippet: "No technical assessment taken yet for candidate verification.",
      }));

      combinedQuestions = resumeSkills.slice(0, 3).map((s) => ({
        skill: s,
        question: `How have you applied ${s} in your previous projects to solve complex performance or scaling bottlenecks?`,
        rationale: `Candidate claims ${s} on resume; unverified by assessment.`,
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        candidateId: candidate.id,
        candidateName: candidate.name,
        resumeSkills,
        hasAssessmentData: submissions.length > 0,
        latestSubmission: latestSubmissionData,
        skillVerificationMatrix: combinedEvidenceMatrix,
        recommendedQuestions: combinedQuestions,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch candidate assessment evidence" },
      { status: 500 }
    );
  }
}
