import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS, syncSubscriptionPlans } from "@/lib/billing/plans";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getRecruiterEntitlements, hasRecruiterConsumedTrial } from "@/lib/billing/entitlements";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await syncSubscriptionPlans();
    const authUser = await getAuthenticatedUser();

    let hasUsedFreeTrial = false;
    let currentPlanId: string | null = null;

    if (authUser && (authUser.role === "RECRUITER" || authUser.role === "PLATFORM_ADMIN")) {
      try {
        const entitlements = await getRecruiterEntitlements(authUser.id);
        currentPlanId = entitlements.planId;
        hasUsedFreeTrial = await hasRecruiterConsumedTrial(authUser.id);
      } catch {}
    }

    // Filter available plans: if Free/Trial has been consumed and the current plan is not trial, exclude trial
    const availablePlans = SUBSCRIPTION_PLANS.filter((plan) => {
      if (plan.id === "trial" && hasUsedFreeTrial && currentPlanId !== "trial") {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: availablePlans,
      allPlans: SUBSCRIPTION_PLANS,
      hasUsedFreeTrial,
      currentPlanId,
    });
  } catch (err: any) {
    console.error("[Subscription Plans Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}
