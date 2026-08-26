import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLogger";

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
    const campaign = await prisma.outreachCampaign.findFirst({
      where: { id: campaignId, companyId },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    await prisma.outreachCampaign.update({
      where: { id: campaignId },
      data: { status: "PAUSED" },
    });

    await logAuditEvent(
      authUser.id,
      "OUTREACH_CAMPAIGN_PAUSED",
      "OutreachCampaign",
      campaignId,
      { companyId }
    );

    return NextResponse.json({
      success: true,
      message: "Campaign paused. Active sequence follow-ups are temporarily held.",
    });
  } catch (err: any) {
    console.error("[POST /api/recruiter/outreach/campaigns/[id]/pause Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to pause campaign" },
      { status: 500 }
    );
  }
}
