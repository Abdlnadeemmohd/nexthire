import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { generateOutreachSequence } from "@/lib/outreach/outreachGenerator";
import { checkCandidateDuplicateContact } from "@/lib/outreach/duplicateProtection";
import { OutreachCandidateData, OutreachJobData, PersonalizationLevel } from "@/lib/outreach/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter session required" },
      { status: 403 }
    );
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json(
      { success: false, error: "Company profile required" },
      { status: 400 }
    );
  }

  try {
    const candidateId = params.id;
    const body = await request.json().catch(() => ({}));
    const { jobId, preferredLevel = "PERSONALIZED", customNotes } = body;

    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      include: {
        profile: true,
        candidateCommunicationPreference: true,
        assessmentSubmissions: {
          include: { assessment: true },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!candidate || candidate.role !== "JOB_SEEKER") {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    let job: OutreachJobData = {
      id: "general-outreach",
      title: "Senior Engineering Role",
      companyName: company?.name || "Our Company",
      requiredSkills: ["TypeScript", "Node.js", "PostgreSQL"],
      location: company?.location || "Remote",
      isRemote: true,
    };

    if (jobId) {
      const jobRecord = await prisma.job.findFirst({
        where: { id: jobId, companyId },
      });
      if (jobRecord) {
        job = {
          id: jobRecord.id,
          title: jobRecord.title,
          companyName: company?.name || "Our Company",
          requiredSkills: jobRecord.skills.split(",").map((s) => s.trim()),
          location: jobRecord.location,
          isRemote: jobRecord.isRemote,
        };
      }
    }

    const candSkills = (candidate.profile?.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const latestSub = candidate.assessmentSubmissions[0];
    const assessmentEvidence = latestSub
      ? {
          hasAssessment: true,
          assessmentTitle: latestSub.assessment.title,
          overallScore: latestSub.overallScore,
          demonstratedSkills: candSkills.slice(0, 3),
        }
      : undefined;

    const candData: OutreachCandidateData = {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      headline: candidate.headline,
      location: candidate.location,
      skills: candSkills,
      experienceSummary: candidate.profile?.experience ? "Verified Software Engineer" : undefined,
      assessmentEvidence,
    };

    const duplicateWarning = await checkCandidateDuplicateContact(companyId, candidateId);

    const drafts = generateOutreachSequence(
      candData,
      job,
      authUser.name,
      preferredLevel as PersonalizationLevel,
      customNotes
    );

    return NextResponse.json({
      success: true,
      data: {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          headline: candidate.headline,
          location: candidate.location,
          skills: candSkills,
        },
        job,
        drafts,
        duplicateWarning,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/recruiter/outreach/candidates/[id]/prepare Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to prepare candidate outreach draft" },
      { status: 500 }
    );
  }
}
