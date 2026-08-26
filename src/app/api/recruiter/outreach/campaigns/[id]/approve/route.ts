import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { approveAndDispatchCampaign } from "@/lib/outreach/outreachEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/recruiter/outreach/campaigns/[id]/approve
 * Human Approval Gate: Approves and dispatches initial outreach sequence step.
 */
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
    const { confirmed = true, recipientEdits } = body;

    const result = await approveAndDispatchCampaign(companyId, authUser.id, campaignId, {
      confirmed,
      recipientEdits,
    });

    return NextResponse.json({
      success: true,
      dispatchedCount: result.dispatchedCount,
      message: result.message,
    });
  } catch (err: any) {
    console.error("[POST /api/recruiter/outreach/campaigns/[id]/approve Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to approve and dispatch campaign" },
      { status: 500 }
    );
  }
}
