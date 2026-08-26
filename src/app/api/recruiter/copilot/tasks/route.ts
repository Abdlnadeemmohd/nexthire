import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getNeedsAttentionTasks } from "@/lib/copilot/copilotEngine";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const tasks = await getNeedsAttentionTasks(user.companyId, user.id);

    return NextResponse.json({
      success: true,
      tasks,
      totalPending: tasks.reduce((sum, t) => sum + t.targetCount, 0),
    });
  } catch (err: any) {
    console.error("Recruiter Tasks API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch recruiter tasks" },
      { status: 500 }
    );
  }
}
