import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { SUBSCRIPTION_PLANS, syncSubscriptionPlans } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin access required" },
      { status: 403 }
    );
  }

  try {
    await syncSubscriptionPlans();

    // Fetch all subscriptions
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        company: { select: { id: true, name: true, isVerified: true } },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all trials
    const trials = await prisma.recruiterTrial.findMany({
      include: {
        recruiter: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true, isVerified: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    // Calculate MRR from active subscriptions
    const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE" && new Date(s.endDate) >= new Date());
    const mrr = activeSubs.reduce((acc, s) => acc + (s.amountPaid || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        plans: SUBSCRIPTION_PLANS,
        subscriptions,
        trials,
        metrics: {
          mrr: `₹${mrr.toLocaleString()}`,
          activeSubscribers: activeSubs.length,
          totalTrials: trials.length,
          activeTrials: trials.filter((t) => t.status === "ACTIVE").length,
          completedTrials: trials.filter((t) => t.status === "COMPLETED").length,
        },
      },
    });
  } catch (err: any) {
    console.error("[Admin Subscriptions GET Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch subscription statistics" },
      { status: 500 }
    );
  }
}
