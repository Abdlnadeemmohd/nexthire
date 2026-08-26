import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { processCopilotQuery } from "@/lib/copilot/copilotEngine";
import { logAuditEvent } from "@/lib/audit/auditLogger";

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
    const prompt = body.prompt || body.message;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await processCopilotQuery(user.companyId, user.id, prompt);

    // Audit log copilot invocation
    await logAuditEvent(user.id, "COPILOT_QUERY_EXECUTED", "Copilot", undefined, {
      intent: response.intent,
      toolUsed: response.toolUsed,
      companyId: user.companyId,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: any) {
    console.error("Recruiter Copilot API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process Copilot query" },
      { status: 500 }
    );
  }
}
