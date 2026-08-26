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
      data: { status: "CANCELLED" },
    });

    // Cancel pending recipients who haven't replied
    await prisma.outreachRecipient.updateMany({
      where: {
        campaignId,
        status: { in: ["DRAFT", "APPROVED", "QUEUED", "SENT", "DELIVERED"] },
        repliedAt: null,
      },
      data: {
        status: "CANCELLED",
        nextActionAt: null,
      },
    });

    await logAuditEvent(
      authUser.id,
      "OUTREACH_CAMPAIGN_CANCELLED",
      "OutreachCampaign",
      campaignId,
      { companyId }
    );

    return NextResponse.json({
      success: true,
      message: "Campaign cancelled. All pending sequence steps stopped.",
    });
  } catch (err: any) {
    console.error("[POST /api/recruiter/outreach/campaigns/[id]/cancel Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to cancel campaign" },
      { status: 500 }
    );
  }
}
