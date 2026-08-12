import { prisma } from "@/lib/prisma";

export interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: "APPLICATION_STATUS" | "INTERVIEW" | "OFFER" | "REJECTION" | "SLA_WARNING" | "SYSTEM";
  emailTemplate?: string;
}

class NotificationService {
  public async sendNotification(params: SendNotificationParams): Promise<boolean> {
    try {
      // 1. Create In-App Notification in database
      await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          body: params.body,
          type: params.type,
        },
      });

      // 2. Transactional Email Hook abstraction
      this.triggerTransactionalEmail(params);

      // 3. Future Firebase Push Notification Hook
      this.triggerFirebasePush(params);

      return true;
    } catch (err) {
      console.warn("Failed to create in-app notification:", err);
      return false;
    }
  }

  private triggerTransactionalEmail(params: SendNotificationParams): void {
    if (process.env.RESEND_API_KEY) {
      console.log(`[EmailService] Dispatching transactional email '${params.type}' to user ${params.userId}`);
    }
  }

  private triggerFirebasePush(params: SendNotificationParams): void {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      console.log(`[FCM Push] FCM notification '${params.title}' ready for user ${params.userId}`);
    }
  }
}

export const notificationService = new NotificationService();
