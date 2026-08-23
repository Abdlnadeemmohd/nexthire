import { prisma } from "../prisma";
import {
  AppEventType,
  EmitEventParams,
  EmitEventResult,
  EmailDeliveryStatus,
  NotificationCategory,
  NotificationPriority,
} from "./types";
import { EVENT_REGISTRY } from "./eventRegistry";
import { getUserNotificationPreferences } from "../notifications/preferences";
import { sendEmail } from "../email";
import { renderBrandedEmail } from "../email/templateEngine";

/**
 * Deterministic hash bucket generator for deduplication windows
 */
function getCooldownBucket(cooldownMinutes: number): string {
  if (cooldownMinutes <= 0) return Date.now().toString();
  const bucketMs = cooldownMinutes * 60 * 1000;
  const currentBucket = Math.floor(Date.now() / bucketMs);
  return `bucket_${currentBucket}`;
}

/**
 * Main production event dispatcher for NextHire.
 * Guaranteed never to throw an unhandled error so callers' business transactions remain safe.
 */
export async function emitEvent(params: EmitEventParams): Promise<EmitEventResult> {
  const {
    type,
    recipientId,
    actorId,
    actorName,
    entityType,
    entityId,
    title: customTitle,
    body: customBody,
    category: customCategory,
    priority: customPriority,
    ctaText: customCtaText,
    ctaUrl: customCtaUrl,
    metadata = {},
    customCooldownMinutes,
  } = params;

  try {
    // 1. Validate Recipient
    if (!recipientId || recipientId === "anonymous" || recipientId.trim() === "") {
      return {
        success: false,
        emailStatus: "NOT_QUEUED",
        error: "ANONYMOUS_OR_EMPTY_RECIPIENT_REJECTED",
      };
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isDiscoverable: true,
      },
    });

    if (!recipient) {
      return {
        success: false,
        emailStatus: "NOT_QUEUED",
        error: "RECIPIENT_NOT_FOUND",
      };
    }

    // 2. Resolve Event Definition from Registry
    const registryDef = EVENT_REGISTRY[type];
    if (!registryDef) {
      console.warn(`[EventEngine] Unregistered event type: ${type}`);
    }

    const category: NotificationCategory =
      customCategory || registryDef?.category || "SYSTEM";
    const priority: NotificationPriority =
      customPriority || registryDef?.priority || "NORMAL";
    const title = customTitle || registryDef?.defaultTitle || "NextHire Notification";
    const body = customBody || registryDef?.defaultBody || "";
    const ctaText = customCtaText || registryDef?.defaultCtaText;
    const ctaUrl = customCtaUrl || registryDef?.defaultCtaUrl;
    const isMandatory = registryDef?.isMandatory ?? false;

    // 3. Multi-Tenant Company Isolation Check
    if (metadata?.companyId && recipient.role === "RECRUITER") {
      if (recipient.companyId && recipient.companyId !== metadata.companyId) {
        return {
          success: false,
          emailStatus: "NOT_QUEUED",
          error: "CROSS_TENANT_RECRUITER_ISOLATION_VIOLATION",
        };
      }
    }

    // 4. Notification Preferences Check
    const userPrefs = await getUserNotificationPreferences(recipient.id);
    const categoryEnabled = userPrefs.preferences[category] ?? true;

    // If category is turned off and event is NOT mandatory, skip in-app and email
    if (!categoryEnabled && !isMandatory) {
      return {
        success: true,
        emailStatus: "SKIPPED_PREFERENCE",
        skippedReason: "CATEGORY_OPTED_OUT_BY_USER",
      };
    }

    // 5. Deterministic Deduplication Check
    const cooldownMinutes =
      customCooldownMinutes !== undefined
        ? customCooldownMinutes
        : registryDef?.dedupCooldownMinutes ?? 0;

    let dedupKey = params.dedupKey;
    if (!dedupKey) {
      const bucket = getCooldownBucket(cooldownMinutes);
      dedupKey = `${type}_${recipient.id}_${entityId || "default"}_${bucket}`;
    }

    if (cooldownMinutes > 0) {
      const cooldownThreshold = new Date(Date.now() - cooldownMinutes * 60 * 1000);
      const existing = await prisma.notification.findFirst({
        where: {
          userId: recipient.id,
          dedupKey,
          createdAt: { gte: cooldownThreshold },
        },
        select: { id: true },
      });

      if (existing) {
        return {
          success: true,
          notificationId: existing.id,
          emailStatus: "NOT_QUEUED",
          skippedReason: "DEDUPLICATED_WITHIN_COOLDOWN_WINDOW",
        };
      }
    }

    // 6. Persist In-App Notification
    const effectiveMetadata = {
      ...(metadata || {}),
      ...(params.companyId ? { companyId: params.companyId } : {}),
    };
    const metadataString = Object.keys(effectiveMetadata).length > 0 ? JSON.stringify(effectiveMetadata) : null;
    const notification = await prisma.notification.create({
      data: {
        userId: recipient.id,
        title,
        body,
        type,
        category,
        priority,
        ctaText,
        ctaUrl,
        metadata: metadataString,
        dedupKey,
        emailStatus: "NOT_QUEUED",
      },
    });

    // 7. Transactional Email Dispatch (Non-blocking & Truthful Delivery Status)
    let emailStatus: EmailDeliveryStatus = "NOT_QUEUED";
    const shouldSendEmail =
      params.sendEmail !== false &&
      (registryDef?.emailEligible ?? false) &&
      (userPrefs.emailEnabled || isMandatory);

    if (shouldSendEmail && recipient.email) {
      emailStatus = "SENDING";

      const emailHtml =
        params.emailHtml ||
        renderBrandedEmail({
          title,
          message: body,
          recipientName: recipient.name || "User",
          ctaText,
          ctaUrl,
          category,
          priority,
          metadata,
        });

      const emailSubject = params.emailSubject || title;

      // Dispatch asynchronously without blocking caller
      sendEmail({
        to: recipient.email,
        subject: emailSubject,
        html: emailHtml,
      })
        .then(async (emailResult) => {
          let updatedStatus: EmailDeliveryStatus = "FAILED";
          let emailError: string | undefined = undefined;

          if (emailResult.success) {
            // Note: Recorded as SENT upon provider acceptance. (Truthful status)
            updatedStatus = "SENT";
          } else {
            updatedStatus = "FAILED";
            emailError = emailResult.error;
          }

          let updatedMetadata = metadataString;
          if (emailResult.id) {
            try {
              const currentMeta = metadataString ? JSON.parse(metadataString) : {};
              currentMeta.providerMessageId = emailResult.id;
              updatedMetadata = JSON.stringify(currentMeta);
            } catch {}
          }

          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              emailStatus: updatedStatus,
              emailError,
              metadata: updatedMetadata,
            },
          });
        })
        .catch(async (err: any) => {
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              emailStatus: "FAILED",
              emailError: err?.message || "Unhandled email dispatch failure",
            },
          });
        });
    } else if (params.sendEmail && !userPrefs.emailEnabled && !isMandatory) {
      emailStatus = "SKIPPED_PREFERENCE";
      await prisma.notification.update({
        where: { id: notification.id },
        data: { emailStatus: "SKIPPED_PREFERENCE" },
      });
    }

    return {
      success: true,
      notificationId: notification.id,
      emailStatus,
    };
  } catch (error: any) {
    console.error(`[EventEngine] Critical event emission error for ${type}:`, error);
    // Never rethrow to protect the caller's business transaction
    return {
      success: false,
      emailStatus: "FAILED",
      error: error?.message || "EVENT_ENGINE_INTERNAL_ERROR",
    };
  }
}
