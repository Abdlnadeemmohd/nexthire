import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { emitEvent } from "@/lib/events/eventEngine";
import { generateAssessmentForJob } from "@/lib/assessment/assessmentGenerator";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  try {
    const companyId = authUser.companyId;
    if (!companyId && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    const assessments = await prisma.assessment.findMany({
      where: authUser.role === "PLATFORM_ADMIN" ? {} : { companyId: companyId! },
      include: {
        job: { select: { id: true, title: true, location: true } },
        questions: { orderBy: { order: "asc" } },
        invitations: {
          include: {
            candidate: { select: { id: true, name: true, email: true } },
            submission: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: assessments.length, data: assessments });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  try {
    const companyId = authUser.companyId;
    if (!companyId && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Recruiter must be assigned to an active company" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      durationMinutes = 45,
      passingScore = 70,
      jobId,
      autoGenerateFromJob = false,
      questions: customQuestions,
    } = body;

    let finalTitle = title;
    let finalDescription = description;
    let finalCategory = category || "General Technical";
    let finalDuration = durationMinutes;
    let finalPassingScore = passingScore;
    let questionsToCreate = customQuestions || [];

    // If autoGenerateFromJob is requested, generate tailored assessment questions
    if (autoGenerateFromJob && jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });
      if (job) {
        const skillsList = job.skills ? job.skills.split(",").map((s) => s.trim()) : [];
        const generated = generateAssessmentForJob(job.title, job.description, skillsList);
        finalTitle = title || generated.title;
        finalDescription = description || generated.description;
        finalCategory = category || generated.category;
        finalDuration = durationMinutes || generated.durationMinutes;
        finalPassingScore = passingScore || generated.passingScore;
        questionsToCreate = generated.questions;
      }
    }

    if (!finalTitle || finalTitle.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Assessment title is required" },
        { status: 400 }
      );
    }

    const createdAssessment = await prisma.assessment.create({
      data: {
        title: finalTitle,
        description: finalDescription || "Skills assessment and verification test.",
        category: finalCategory,
        durationMinutes: finalDuration,
        passingScore: finalPassingScore,
        status: "PUBLISHED",
        companyId: companyId!,
        jobId: jobId || null,
        createdById: authUser.id,
        questions: {
          create: questionsToCreate.map((q: any, idx: number) => ({
            category: q.category || finalCategory,
            type: q.type || "KNOWLEDGE",
            question: q.question,
            codeSnippet: q.codeSnippet || null,
            sampleAnswer: q.sampleAnswer || null,
            rubric: JSON.stringify(q.rubric || []),
            maxScore: q.maxScore || 20,
            order: q.order || idx + 1,
          })),
        },
      },
      include: {
        questions: true,
        job: true,
      },
    });

    await logAuditEvent(
      authUser.id,
      "ASSESSMENT_CREATED",
      "Assessment",
      createdAssessment.id,
      { title: createdAssessment.title, companyId, questionsCount: createdAssessment.questions.length }
    );

    await emitEvent({
      type: "ASSESSMENT_CREATED",
      recipientId: authUser.id,
      actorId: authUser.id,
      entityType: "ASSESSMENT",
      entityId: createdAssessment.id,
      metadata: {
        assessmentTitle: createdAssessment.title,
        companyId,
      },
    });

    return NextResponse.json({ success: true, data: createdAssessment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create assessment" },
      { status: 500 }
    );
  }
}
