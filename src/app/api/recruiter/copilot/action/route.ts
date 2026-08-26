import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { executeRecruiterAction } from "@/lib/copilot/copilotEngine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "RECRUITER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active recruiter session required" },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { success: false, error: "Recruiter must be affiliated with an active company profile" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { proposal, confirmed } = body;

    if (!proposal || !proposal.actionType) {
      return NextResponse.json(
        { success: false, error: "Valid action proposal is required" },
        { status: 400 }
      );
    }

    const result = await executeRecruiterAction(
      user.companyId,
      user.id,
      proposal,
      Boolean(confirmed)
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
      auditEventId: result.auditEventId,
    });
  } catch (err: any) {
    console.error("Recruiter Copilot Action API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute recruiter action" },
      { status: 500 }
    );
  }
}
