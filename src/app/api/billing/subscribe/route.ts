import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";
import { SUBSCRIPTION_PLANS, syncSubscriptionPlans } from "@/lib/billing/plans";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { getRecruiterEntitlements } from "@/lib/billing/entitlements";

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  if (authUser.role === "RECRUITER") {
    try {
      await assertUserVerified(authUser, "subscribing to paid recruiter plans");
    } catch (err: any) {
      if (err instanceof VerificationRequiredError || err.name === "VerificationRequiredError") {
        return NextResponse.json(
          { success: false, error: err.message, status: err.status },
          { status: 403 }
        );
      }
      throw err;
    }
  }

  try {
    await syncSubscriptionPlans();
    const body = await request.json();
    const { planId, paymentMethod = "SIMULATION" } = body;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId && p.id !== "trial");
    if (!plan) {
      return NextResponse.json(
        { success: false, error: `Invalid paid plan ID "${planId}". Available plans: silver, gold, diamond, platinum.` },
        { status: 400 }
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Deactivate previous active subscriptions
    await prisma.subscription.updateMany({
      where: { userId: authUser.id, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });

    // Create new active subscription
    const newSub = await prisma.subscription.create({
      data: {
        userId: authUser.id,
        companyId: authUser.companyId,
        planId: plan.id,
        status: "ACTIVE",
        startDate,
        endDate,
        amountPaid: plan.price,
        currency: plan.currency,
        paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        autoRenew: false,
      },
    });

    // Audit log
    await logAuditEvent(
      authUser.id,
      "SUBSCRIPTION_ACTIVATED",
      "Subscription",
      newSub.id,
      {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        currency: plan.currency,
        paymentMethod,
      }
    );

    const entitlements = await getRecruiterEntitlements(authUser.id);

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to NextHire ${plan.name}!`,
      subscription: newSub,
      entitlements,
      data: {
        subscription: newSub,
        entitlements,
      },
    });
  } catch (err: any) {
    console.error("[Subscription Activation Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to activate subscription" },
      { status: 500 }
    );
  }
}
