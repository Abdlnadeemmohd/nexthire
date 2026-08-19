import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS, syncSubscriptionPlans } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await syncSubscriptionPlans();
    return NextResponse.json({
      success: true,
      data: SUBSCRIPTION_PLANS,
    });
  } catch (err: any) {
    console.error("[Subscription Plans Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}
