import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { createHmac, timingSafeEqual } from "crypto";
import { emitEvent } from "@/lib/events/eventEngine";
import { checkRevenueMilestones } from "@/lib/admin/adminMonitoring";

export const dynamic = "force-dynamic";

/**
 * Validates Stripe webhook HMAC-SHA256 signature against STRIPE_WEBHOOK_SECRET
 */
function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300
): boolean {
  try {
    const elements = signatureHeader.split(",").reduce((acc: Record<string, string[]>, element) => {
      const [key, value] = element.trim().split("=");
      if (key && value) {
        acc[key] = acc[key] || [];
        acc[key].push(value);
      }
      return acc;
    }, {});

    const timestamp = elements["t"]?.[0];
    const signatures = elements["v1"] || [];

    if (!timestamp || signatures.length === 0) return false;

    // Verify timestamp within tolerance window (default 5 minutes)
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > toleranceSeconds) {
      console.warn("Stripe webhook timestamp outside tolerance window");
      return false;
    }

    // Compute expected HMAC signature
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSig = createHmac("sha256", secret).update(signedPayload).digest("hex");

    return signatures.some((sig) => {
      try {
        const sigBuf = Buffer.from(sig, "hex");
        const expBuf = Buffer.from(expectedSig, "hex");
        return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
      } catch {
        return sig === expectedSig;
      }
    });
  } catch (err) {
    console.warn("Stripe signature verification error:", err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    // 1. Production + missing STRIPE_WEBHOOK_SECRET â†’ HTTP 500 â†’ DO NOT process
    if (isProduction && (!webhookSecret || webhookSecret.startsWith("whsec_placeholder"))) {
      console.error("[Stripe Webhook Error] STRIPE_WEBHOOK_SECRET is missing or unconfigured in production.");
      return NextResponse.json(
        {
          success: false,
          error: "Stripe webhook secret is not configured",
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Production or configured dev with secret present â†’ Require & verify signature
    if (webhookSecret && !webhookSecret.startsWith("whsec_placeholder")) {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: "Missing stripe-signature header" },
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const isValid = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid stripe-signature verification failed" },
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      // 3. Development + secret absent â†’ Allow development/test behavior
      console.warn("[Stripe Webhook Dev] Processing webhook in development mode without signature verification.");
    }

    let event: any;

    // Parse webhook event
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload JSON" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const eventType = event.type || "unknown";
    const dataObject = event.data?.object || {};

    const { emitEvent } = await import("@/lib/events/eventEngine");

    // Helper to resolve recruiter from customer or metadata
    const resolveRecruiter = async (customerId?: string, metadataUserId?: string) => {
      if (metadataUserId) {
        return prisma.user.findUnique({ where: { id: metadataUserId } });
      }
      if (customerId) {
        const sub = await prisma.subscription.findFirst({
          where: { paymentId: customerId },
          include: { user: true },
        });
        if (sub?.user) return sub.user;
      }
      return prisma.user.findFirst({ where: { role: "RECRUITER" } });
    };

    // Process Stripe subscription events
    switch (eventType) {
      case "customer.subscription.created": {
        const customerId = dataObject.customer;
        const planId = dataObject.items?.data?.[0]?.price?.id || "plan_growth";
        const recruiter = await resolveRecruiter(customerId, dataObject.metadata?.userId);

        if (recruiter) {
          emitEvent({
            type: "RECRUITER_SUBSCRIPTION_ACTIVATED",
            recipientId: recruiter.id,
            recipientEmail: recruiter.email,
            companyId: recruiter.companyId || undefined,
            title: "Subscription Activated",
            body: `Thank you for upgrading! Your recruiter subscription tier is now active.`,
            ctaText: "Manage Subscription",
            ctaUrl: "/recruiter/billing",
            metadata: { planId, status: dataObject.status },
          }).catch(() => {});
        }

        await logAuditEvent(
          customerId || "stripe_system",
          "SUBSCRIPTION_ACTIVATED",
          "Subscription",
          dataObject.id || "sub_live",
          { eventType, status: dataObject.status, planId }
        );
        break;
      }

      case "customer.subscription.updated": {
        const customerId = dataObject.customer;
        const status = dataObject.status;
        const planId = dataObject.items?.data?.[0]?.price?.id || "plan_growth";
        const recruiter = await resolveRecruiter(customerId, dataObject.metadata?.userId);

        if (recruiter) {
          const isUpgrade = dataObject.metadata?.isUpgrade === "true" || planId.includes("diamond") || planId.includes("platinum");
          emitEvent({
            type: isUpgrade ? "RECRUITER_SUBSCRIPTION_UPGRADED" : "RECRUITER_SUBSCRIPTION_DOWNGRADED",
            recipientId: recruiter.id,
            recipientEmail: recruiter.email,
            companyId: recruiter.companyId || undefined,
            title: isUpgrade ? "Subscription Tier Upgraded" : "Subscription Plan Updated",
            body: `Your recruiter subscription plan change (${planId}) has been confirmed.`,
            ctaText: "View Entitlements",
            ctaUrl: "/recruiter/billing",
            metadata: { planId, status },
          }).catch(() => {});
        }

        await logAuditEvent(
          customerId || "stripe_system",
          "SUBSCRIPTION_UPDATED",
          "Subscription",
          dataObject.id || "sub_live",
          { eventType, status, planId }
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const customerId = dataObject.customer;
        const amountPaid = dataObject.amount_paid ? dataObject.amount_paid / 100 : 0;
        const recruiter = await resolveRecruiter(customerId, dataObject.metadata?.userId);

        if (recruiter) {
          emitEvent({
            type: "RECRUITER_PAYMENT_SUCCESSFUL",
            recipientId: recruiter.id,
            recipientEmail: recruiter.email,
            companyId: recruiter.companyId || undefined,
            title: "Payment Receipt",
            body: `Your subscription payment of $${amountPaid} was processed successfully.`,
            ctaText: "View Invoices",
            ctaUrl: "/recruiter/billing",
            metadata: { amountPaid, currency: dataObject.currency || "usd" },
          }).catch(() => {});
        }

        await logAuditEvent(
          customerId || "stripe_system",
          "INVOICE_PAID",
          "Invoice",
          dataObject.id || "inv_live",
          { amountPaid, currency: dataObject.currency || "usd" }
        );

        await checkRevenueMilestones(amountPaid).catch(() => {});
        break;
      }

      case "invoice.payment_failed": {
        const customerId = dataObject.customer;
        const recruiter = await resolveRecruiter(customerId, dataObject.metadata?.userId);

        if (recruiter) {
          emitEvent({
            type: "RECRUITER_PAYMENT_FAILED",
            recipientId: recruiter.id,
            recipientEmail: recruiter.email,
            companyId: recruiter.companyId || undefined,
            title: "Payment Failed: Action Required",
            body: `We were unable to process your recurring subscription payment. Please update your payment method.`,
            ctaText: "Update Billing Info",
            ctaUrl: "/recruiter/billing",
            metadata: { customerId },
          }).catch(() => {});
        }

        await logAuditEvent(
          customerId || "stripe_system",
          "PAYMENT_FAILED",
          "Invoice",
          dataObject.id || "inv_failed",
          { customerId }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const customerId = dataObject.customer;
        const recruiter = await resolveRecruiter(customerId, dataObject.metadata?.userId);

        if (recruiter) {
          emitEvent({
            type: "RECRUITER_SUBSCRIPTION_CANCELLED",
            recipientId: recruiter.id,
            recipientEmail: recruiter.email,
            companyId: recruiter.companyId || undefined,
            title: "Subscription Cancelled",
            body: `Your recruiter subscription has been cancelled and will expire at the end of the billing period.`,
            ctaText: "Review Plan",
            ctaUrl: "/recruiter/billing",
            metadata: { customerId },
          }).catch(() => {});
        }

        await logAuditEvent(
          customerId || "stripe_system",
          "SUBSCRIPTION_CANCELLED",
          "Subscription",
          dataObject.id || "sub_live",
          { eventType, cancelledAt: new Date().toISOString() }
        );
        break;
      }

      default:
        break;
    }

    return NextResponse.json(
      { success: true, received: true, eventType },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Stripe webhook processing error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Webhook processing failed" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
