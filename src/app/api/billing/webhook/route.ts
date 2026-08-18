import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit/auditLogger";
import { createHmac, timingSafeEqual } from "crypto";

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

    // Process Stripe subscription events
    switch (eventType) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const customerId = dataObject.customer;
        const status = dataObject.status; // active, past_due, canceled
        const planId = dataObject.items?.data?.[0]?.price?.id || "plan_growth";

        // Log audit event for billing updates
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

        await logAuditEvent(
          customerId || "stripe_system",
          "INVOICE_PAID",
          "Invoice",
          dataObject.id || "inv_live",
          { amountPaid, currency: dataObject.currency || "usd" }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const customerId = dataObject.customer;

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
        // Acknowledge other event types
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
