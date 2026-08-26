import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLogger";

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
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: {
        job: true,
        questions: { orderBy: { order: "asc" } },
        invitations: {
          include: {
            candidate: { select: { id: true, name: true, email: true, headline: true } },
            submission: true,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Strict multi-tenant company isolation
    if (authUser.role !== "PLATFORM_ADMIN" && assessment.companyId !== authUser.companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Assessment belongs to another company" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Strict multi-tenant isolation
    if (authUser.role !== "PLATFORM_ADMIN" && assessment.companyId !== authUser.companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Assessment belongs to another company" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, durationMinutes, passingScore, status, questions } = body;

    const updated = await prisma.assessment.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(durationMinutes && { durationMinutes }),
        ...(passingScore && { passingScore }),
        ...(status && { status }),
      },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });

    // If questions were updated, replace questions
    if (Array.isArray(questions)) {
      await prisma.assessmentQuestion.deleteMany({
        where: { assessmentId: params.id },
      });

      await prisma.assessmentQuestion.createMany({
        data: questions.map((q: any, idx: number) => ({
          assessmentId: params.id,
          category: q.category || "General Technical",
          type: q.type || "KNOWLEDGE",
          question: q.question,
          codeSnippet: q.codeSnippet || null,
          sampleAnswer: q.sampleAnswer || null,
          rubric: typeof q.rubric === "string" ? q.rubric : JSON.stringify(q.rubric || []),
          maxScore: q.maxScore || 20,
          order: q.order || idx + 1,
        })),
      });
    }

    await logAuditEvent(
      authUser.id,
      "ASSESSMENT_EDITED",
      "Assessment",
      assessment.id,
      { updatedFields: Object.keys(body), companyId: assessment.companyId }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update assessment" },
      { status: 500 }
    );
  }
}
