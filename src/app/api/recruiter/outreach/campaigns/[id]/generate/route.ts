import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { generateOutreachSequence } from "@/lib/outreach/outreachGenerator";
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
    const campaignId = params.id;
    const body = await request.json().catch(() => ({}));
    const { preferredLevel = "PERSONALIZED", customNotes } = body;

    const campaign = await prisma.outreachCampaign.findFirst({
      where: { id: campaignId, companyId },
      include: {
        job: true,
        company: true,
        sequenceSteps: { orderBy: { stepOrder: "asc" } },
        recipients: {
          include: {
            candidate: {
              include: {
                profile: true,
                assessmentSubmissions: {
                  include: { assessment: true },
                  orderBy: { submittedAt: "desc" },
                  take: 1,
                },
              },
            },
            messages: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    const job: OutreachJobData = {
      id: campaign.job?.id || "general-outreach",
      title: campaign.job?.title || "Senior Engineering Role",
      companyName: campaign.company.name,
      requiredSkills: (campaign.job?.skills || "TypeScript, Node.js, PostgreSQL").split(",").map((s) => s.trim()),
      location: campaign.job?.location || campaign.company.location,
      isRemote: campaign.job?.isRemote ?? true,
    };

    let updatedDraftCount = 0;

    for (const recipient of campaign.recipients) {
      const candSkills = (recipient.candidate.profile?.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const latestSub = recipient.candidate.assessmentSubmissions[0];
      const assessmentEvidence = latestSub
        ? {
            hasAssessment: true,
            assessmentTitle: latestSub.assessment.title,
            overallScore: latestSub.overallScore,
            demonstratedSkills: candSkills.slice(0, 3),
          }
        : undefined;

      const candData: OutreachCandidateData = {
        id: recipient.candidate.id,
        name: recipient.candidate.name,
        email: recipient.candidate.email,
        headline: recipient.candidate.headline,
        location: recipient.candidate.location,
        skills: candSkills,
        experienceSummary: recipient.candidate.profile?.experience ? "Verified Software Engineer" : undefined,
        assessmentEvidence,
      };

      const drafts = generateOutreachSequence(
        candData,
        job,
        authUser.name,
        preferredLevel as PersonalizationLevel,
        customNotes
      );

      // Overwrite draft messages if recipient is still in DRAFT status
      if (recipient.status === "DRAFT") {
        await prisma.outreachMessage.deleteMany({
          where: { recipientId: recipient.id, status: "DRAFT" },
        });

        for (let i = 0; i < drafts.length; i++) {
          const draft = drafts[i];
          const step = campaign.sequenceSteps[i];

          await prisma.outreachMessage.create({
            data: {
              recipientId: recipient.id,
              stepId: step?.id,
              subject: draft.subject,
              body: draft.body,
              status: "DRAFT",
              recruiterApproved: false,
            },
          });
          updatedDraftCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${updatedDraftCount} personalized sequence drafts across ${campaign.recipients.length} candidate(s).`,
    });
  } catch (err: any) {
    console.error("[POST /api/recruiter/outreach/campaigns/[id]/generate Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate outreach drafts" },
      { status: 500 }
    );
  }
}
