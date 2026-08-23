import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Verifies Resend / Svix webhook signature using HMAC-SHA256.
 * Headers: svix-id, svix-timestamp, svix-signature (or resend-signature)
 */
function verifyWebhookSignature(
  rawBody: string,
  headers: Headers,
  secret: string,
  toleranceSeconds = 300
): boolean {
  try {
    const svixId = headers.get("svix-id") || headers.get("resend-id") || "";
    const svixTimestamp = headers.get("svix-timestamp") || headers.get("resend-timestamp") || "";
    const svixSignature = headers.get("svix-signature") || headers.get("resend-signature") || "";

    if (!svixId || !svixTimestamp || !svixSignature) {
      return false;
    }

    // Check timestamp tolerance (prevent replay attacks)
    const timestampSec = parseInt(svixTimestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > toleranceSeconds) {
      return false;
    }

    // Construct signature payload: `${id}.${timestamp}.${body}`
    const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;

    // Normalize secret (handle whsec_ prefix if base64 encoded)
    let keyBuffer: Buffer;
    if (secret.startsWith("whsec_")) {
      keyBuffer = Buffer.from(secret.slice(6), "base64");
    } else {
      keyBuffer = Buffer.from(secret, "utf-8");
    }

    const hmac = createHmac("sha256", keyBuffer);
    hmac.update(signedPayload);
    const calculatedSignature = hmac.digest("base64");

    // Parse signatures from header (comma or space separated: "v1,signature1 v1,signature2")
    const signatures = svixSignature
      .split(/[\s,]+/)
      .map((part) => {
        const [version, sig] = part.split("=");
        if (version && sig) return sig;
        if (part.startsWith("v1,")) return part.slice(3);
        return part;
      })
      .filter(Boolean);

    for (const sig of signatures) {
      try {
        const expectedBuffer = Buffer.from(calculatedSignature);
        const actualBuffer = Buffer.from(sig);
        if (
          expectedBuffer.length === actualBuffer.length &&
          timingSafeEqual(expectedBuffer, actualBuffer)
        ) {
          return true;
        }
      } catch {}
    }

    return false;
  } catch (err) {
    console.error("[Resend Webhook Signature Error]:", err);
    return false;
  }
}

/**
 * POST /api/email/webhook
 * Handles Resend delivery webhooks with signature verification, idempotency, and delivery state machine.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // 1. Signature Verification
    if (webhookSecret && !webhookSecret.startsWith("whsec_placeholder") && webhookSecret.trim() !== "") {
      const isValid = verifyWebhookSignature(rawBody, request.headers, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature verification failed" },
          { status: 401 }
        );
      }
    } else {
      // Development mode fallback
      console.warn("[Resend Webhook] Processing in dev/test mode without strict signature verification.");
    }

    // 2. Parse Event Payload
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const eventType = event.type; // e.g. "email.sent", "email.delivered", "email.bounced", "email.failed", "email.complained", "email.delivery_delayed"
    const eventId = event.id || request.headers.get("svix-id") || `evt_${Date.now()}`;
    const emailData = event.data || {};
    const emailId = emailData.email_id || emailData.id;

    if (!eventType) {
      return NextResponse.json(
        { success: false, error: "Missing event type" },
        { status: 400 }
      );
    }

    // 3. Webhook Idempotency Check
    const existingAudit = await prisma.auditEvent.findFirst({
      where: {
        action: "RESEND_WEBHOOK_PROCESSED",
        resourceId: eventId,
      },
    });

    if (existingAudit) {
      return NextResponse.json({
        success: true,
        message: "Webhook already processed (idempotent duplicate)",
        eventId,
      });
    }

    // Record webhook processing in AuditEvent
    await prisma.auditEvent.create({
      data: {
        actorId: "RESEND_WEBHOOK",
        action: "RESEND_WEBHOOK_PROCESSED",
        resourceType: "EmailWebhook",
        resourceId: eventId,
        metadata: JSON.stringify({
          type: eventType,
          emailId: emailId || null,
          recipient: emailData.to || null,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // 4. Correlate with Notification record
    if (emailId) {
      const notification = await prisma.notification.findFirst({
        where: {
          metadata: { contains: emailId },
        },
      });

      if (notification) {
        const currentStatus = notification.emailStatus;

        // 5. State Machine Transition Rules
        switch (eventType) {
          case "email.sent": {
            // Only update to SENT if not already DELIVERED
            if (currentStatus !== "DELIVERED" && currentStatus !== "SKIPPED_PREFERENCE") {
              await prisma.notification.update({
                where: { id: notification.id },
                data: { emailStatus: "SENT" },
              });
            }
            break;
          }

          case "email.delivered": {
            // NEVER transition SKIPPED_PREFERENCE to DELIVERED
            if (currentStatus === "SKIPPED_PREFERENCE") {
              console.warn(`[Resend Webhook] Illegal transition attempt: ${currentStatus} -> DELIVERED. Blocked.`);
              break;
            }

            const deliveredTime = emailData.created_at ? new Date(emailData.created_at) : new Date();
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                emailStatus: "DELIVERED",
                deliveredAt: deliveredTime,
                emailError: null,
              },
            });
            break;
          }

          case "email.delivery_delayed": {
            if (currentStatus !== "DELIVERED" && currentStatus !== "SKIPPED_PREFERENCE") {
              await prisma.notification.update({
                where: { id: notification.id },
                data: { emailStatus: "RETRYING" },
              });
            }
            break;
          }

          case "email.bounced": {
            const bounceReason = emailData.bounce?.message || "Email address bounced";
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                emailStatus: "FAILED",
                emailError: `Bounced: ${bounceReason.slice(0, 100)}`,
              },
            });
            break;
          }

          case "email.failed": {
            const failError = emailData.error?.message || "Email provider dispatch failed";
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                emailStatus: "FAILED",
                emailError: failError.slice(0, 100),
              },
            });
            break;
          }

          case "email.complained": {
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                emailStatus: "FAILED",
                emailError: "Recipient marked message as spam complaint",
              },
            });

            // Record security audit for spam complaint
            await prisma.auditEvent.create({
              data: {
                actorId: "RESEND_PROVIDER",
                action: "EMAIL_SPAM_COMPLAINT",
                resourceType: "Notification",
                resourceId: notification.id,
                metadata: JSON.stringify({ emailId, to: emailData.to }),
              },
            });
            break;
          }

          default:
            console.log(`[Resend Webhook] Unhandled event type: ${eventType}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventType,
      message: "Webhook processed successfully",
    });
  } catch (err: any) {
    console.error("[POST /api/email/webhook Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
