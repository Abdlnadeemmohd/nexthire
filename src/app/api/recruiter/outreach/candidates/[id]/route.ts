import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { checkCandidateDuplicateContact } from "@/lib/outreach/duplicateProtection";

export const dynamic = "force-dynamic";

export async function GET(
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

    // Verify candidate exists and is discoverable or has an active application
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      include: {
        profile: true,
        candidateCommunicationPreference: true,
        assessmentSubmissions: {
          include: { assessment: true },
          orderBy: { submittedAt: "desc" },
          take: 3,
        },
      },
    });

    if (!candidate || candidate.role !== "JOB_SEEKER") {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check duplicate contact warning
    const duplicateWarning = await checkCandidateDuplicateContact(companyId, candidateId);

    // Fetch past outreach history in this company
    const outreachHistory = await prisma.outreachRecipient.findMany({
      where: {
        candidateId,
        campaign: { companyId },
      },
      include: {
        campaign: { select: { id: true, name: true, status: true, createdAt: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          headline: candidate.headline,
          location: candidate.location,
          avatar: candidate.avatar,
          skills: (candidate.profile?.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
          isDiscoverable: candidate.isDiscoverable,
          communicationPreference: candidate.candidateCommunicationPreference || {
            optedOutOutreach: false,
            allowEmailOutreach: true,
            allowInAppOutreach: true,
          },
          latestAssessment: candidate.assessmentSubmissions[0]
            ? {
                title: candidate.assessmentSubmissions[0].assessment.title,
                overallScore: candidate.assessmentSubmissions[0].overallScore,
                submittedAt: candidate.assessmentSubmissions[0].submittedAt,
              }
            : null,
        },
        duplicateWarning,
        outreachHistory,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/recruiter/outreach/candidates/[id] Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve candidate outreach info" },
      { status: 500 }
    );
  }
}
