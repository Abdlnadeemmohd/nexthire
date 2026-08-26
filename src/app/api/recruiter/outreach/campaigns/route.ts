import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createOutreachCampaign, calculateCampaignMetrics } from "@/lib/outreach/outreachEngine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter session required" },
      { status: 403 }
    );
  }

  const companyId = authUser.companyId;
  if (!companyId && authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Company profile required to manage outreach campaigns" },
      { status: 400 }
    );
  }

  try {
    const campaigns = await prisma.outreachCampaign.findMany({
      where: companyId ? { companyId } : {},
      include: {
        job: { select: { id: true, title: true, location: true } },
        recruiter: { select: { id: true, name: true, email: true } },
        sequenceSteps: { orderBy: { stepOrder: "asc" } },
        recipients: {
          include: {
            candidate: { select: { id: true, name: true, headline: true, location: true } },
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const campaignsWithMetrics = campaigns.map((c) => {
      const metrics = calculateCampaignMetrics(c, c.recipients);
      return {
        ...c,
        metrics,
      };
    });

    return NextResponse.json({
      success: true,
      data: campaignsWithMetrics,
    });
  } catch (err: any) {
    console.error("[GET /api/recruiter/outreach/campaigns Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
      { success: false, error: "Company profile required to create campaigns" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, jobId, candidateIds, preferredLevel, customNotes, sequenceDelays } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Campaign name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one candidate ID must be selected" },
        { status: 400 }
      );
    }

    const result = await createOutreachCampaign(companyId, authUser.id, {
      name: name.trim(),
      description: description?.trim(),
      jobId,
      candidateIds,
      preferredLevel,
      customNotes,
      sequenceDelays,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.campaign,
        duplicateWarnings: result.duplicateWarnings,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/recruiter/outreach/campaigns Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create outreach campaign" },
      { status: 500 }
    );
  }
}
