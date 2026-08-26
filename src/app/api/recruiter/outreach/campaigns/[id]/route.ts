import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateCampaignMetrics } from "@/lib/outreach/outreachEngine";
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

  try {
    const campaignId = params.id;
    const companyId = authUser.companyId;

    const campaign = await prisma.outreachCampaign.findFirst({
      where: {
        id: campaignId,
        ...(companyId && authUser.role !== "PLATFORM_ADMIN" ? { companyId } : {}),
      },
      include: {
        job: true,
        recruiter: { select: { id: true, name: true, email: true, role: true } },
        sequenceSteps: { orderBy: { stepOrder: "asc" } },
        recipients: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                email: true,
                headline: true,
                location: true,
                avatar: true,
                profile: true,
              },
            },
            messages: { orderBy: { createdAt: "asc" } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    const metrics = calculateCampaignMetrics(campaign, campaign.recipients);

    // Fetch duplicate warnings for each recipient
    const warnings = await Promise.all(
      campaign.recipients.map((r) => checkCandidateDuplicateContact(campaign.companyId, r.candidateId))
    );

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        metrics,
        duplicateWarnings: warnings,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/recruiter/outreach/campaigns/[id] Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve campaign" },
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
    const body = await request.json();
    const { name, description, status, sequenceSteps } = body;

    const existing = await prisma.outreachCampaign.findFirst({
      where: { id: campaignId, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    const updated = await prisma.outreachCampaign.update({
      where: { id: campaignId },
      data: {
        name: name?.trim() || undefined,
        description: description !== undefined ? description?.trim() : undefined,
        status: status || undefined,
      },
    });

    if (Array.isArray(sequenceSteps)) {
      for (const step of sequenceSteps) {
        if (step.id) {
          await prisma.outreachSequenceStep.update({
            where: { id: step.id },
            data: {
              delayDays: typeof step.delayDays === "number" ? step.delayDays : undefined,
              subjectTemplate: step.subjectTemplate || undefined,
              bodyTemplate: step.bodyTemplate || undefined,
              isEnabled: typeof step.isEnabled === "boolean" ? step.isEnabled : undefined,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    console.error("[PATCH /api/recruiter/outreach/campaigns/[id] Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update campaign" },
      { status: 500 }
    );
  }
}
