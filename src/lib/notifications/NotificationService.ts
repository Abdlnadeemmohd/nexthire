import { emitEvent } from "@/lib/events/eventEngine";
import { AppEventType, NotificationCategory } from "@/lib/events/types";

export interface SendNotificationParams {
  userId: string;
  userEmail?: string;
  title: string;
  body: string;
  type: "APPLICATION_STATUS" | "INTERVIEW" | "OFFER" | "REJECTION" | "SLA_WARNING" | "SYSTEM" | "MESSAGE" | string;
  ctaText?: string;
  ctaUrl?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  public async sendNotification(params: SendNotificationParams): Promise<boolean> {
    try {
      // Map legacy type string to corresponding AppEventType
      let eventType: AppEventType = "SYSTEM_GENERAL_ALERT";
      let category: NotificationCategory = "SYSTEM";

      switch (params.type) {
        case "APPLICATION_STATUS":
          eventType = "SEEKER_APPLICATION_STAGE_CHANGED";
          category = "APPLICATIONS";
          break;
        case "INTERVIEW":
          eventType = "SEEKER_INTERVIEW_SCHEDULED";
          category = "INTERVIEWS";
          break;
        case "OFFER":
          eventType = "SEEKER_OFFER_RECEIVED";
          category = "APPLICATIONS";
          break;
        case "REJECTION":
          eventType = "SEEKER_APPLICATION_REJECTED";
          category = "APPLICATIONS";
          break;
        case "SLA_WARNING":
          eventType = "RECRUITER_SLA_WARNING";
          category = "APPLICATIONS";
          break;
        case "MESSAGE":
          eventType = "SEEKER_MESSAGE_RECEIVED";
          category = "MESSAGES";
          break;
        default:
          eventType = "SYSTEM_GENERAL_ALERT";
          category = "SYSTEM";
      }

      const result = await emitEvent({
        type: eventType,
        recipientId: params.userId,
        recipientEmail: params.userEmail,
        title: params.title,
        body: params.body,
        category,
        ctaText: params.ctaText,
        ctaUrl: params.ctaUrl,
        metadata: params.metadata,
      });

      return result.success;
    } catch (err) {
      console.warn("[NotificationService] Fallback note:", err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
