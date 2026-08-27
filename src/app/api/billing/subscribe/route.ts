import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";
import { SUBSCRIPTION_PLANS, syncSubscriptionPlans } from "@/lib/billing/plans";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { getRecruiterEntitlements, hasRecruiterConsumedTrial } from "@/lib/billing/entitlements";

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

    const isFreeOrTrial = planId === "trial" || planId === "free";
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan && !isFreeOrTrial) {
      return NextResponse.json(
        { success: false, error: `Invalid plan ID "${planId}". Available plans: trial, silver, gold, diamond, platinum.` },
        { status: 400 }
      );
    }

    if (isFreeOrTrial || plan?.id === "trial") {
      // 1. Enforce strict server-level one-time Free/Trial eligibility per Recruiter ID
      const trialConsumed = await hasRecruiterConsumedTrial(authUser.id);
      if (trialConsumed) {
        return NextResponse.json(
          { success: false, error: "Free trial has already been used for this account." },
          { status: 400 }
        );
      }

      // Deactivate previous active subscriptions
      await prisma.subscription.updateMany({
        where: { userId: authUser.id, status: "ACTIVE" },
        data: { status: "EXPIRED" },
      });

      // Activate the one-time Free Trial
      await prisma.recruiterTrial.upsert({
        where: { recruiterId: authUser.id },
        create: {
          recruiterId: authUser.id,
          companyId: authUser.companyId || "00000000-0000-0000-0000-000000000001",
          candidateSearchLimit: 5,
          candidateSearchesUsed: 0,
          jobPostingLimit: 1,
          jobPostingsUsed: 0,
          status: "ACTIVE",
        },
        update: {
          status: "ACTIVE",
          candidateSearchesUsed: 0,
          jobPostingsUsed: 0,
        },
      });

      await logAuditEvent(
        authUser.id,
        "SUBSCRIPTION_ACTIVATED",
        "Subscription",
        authUser.id,
        {
          planId: "trial",
          planName: "Trial Mode",
        }
      );

      const entitlements = await getRecruiterEntitlements(authUser.id);

      return NextResponse.json({
        success: true,
        message: authUser.isTester ? "Successfully switched to Free / Evaluation Tier!" : "Successfully activated your one-time Free Trial!",
        subscription: null,
        entitlements,
        subscriptionTier: "FREE",
        data: {
          subscription: null,
          entitlements,
          subscriptionTier: "FREE",
        },
      });
    }

    // 2. Paid Plan Activation (SILVER, GOLD, PLATINUM, DIAMOND)
    const targetPlan = plan!;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + targetPlan.durationDays * 24 * 60 * 60 * 1000);

    // Deactivate previous active subscriptions
    await prisma.subscription.updateMany({
      where: { userId: authUser.id, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });

    // For real users, mark trial as permanently COMPLETED
    if (!authUser.isTester) {
      await prisma.recruiterTrial.updateMany({
        where: { recruiterId: authUser.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    // Create new active subscription
    const newSub = await prisma.subscription.create({
      data: {
        userId: authUser.id,
        companyId: authUser.companyId,
        planId: targetPlan.id,
        status: "ACTIVE",
        startDate,
        endDate,
        amountPaid: targetPlan.price,
        currency: targetPlan.currency,
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
        planId: targetPlan.id,
        planName: targetPlan.name,
        price: targetPlan.price,
        currency: targetPlan.currency,
        paymentMethod,
      }
    );

    const entitlements = await getRecruiterEntitlements(authUser.id);

    return NextResponse.json({
      success: true,
      message: `Successfully switched to NextHire ${targetPlan.name}!`,
      subscription: newSub,
      entitlements,
      subscriptionTier: targetPlan.tier,
      data: {
        subscription: newSub,
        entitlements,
        subscriptionTier: targetPlan.tier,
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
