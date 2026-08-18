import { prisma } from "@/lib/prisma";
import { sendEmail, generateEmailTemplate } from "@/lib/email";

export interface SendNotificationParams {
  userId: string;
  userEmail?: string;
  title: string;
  body: string;
  type: "APPLICATION_STATUS" | "INTERVIEW" | "OFFER" | "REJECTION" | "SLA_WARNING" | "SYSTEM" | "MESSAGE";
  ctaText?: string;
  ctaUrl?: string;
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

      // 2. Dispatch Transactional Email if recipient email is known
      if (params.userEmail) {
        const html = generateEmailTemplate(
          params.title,
          params.body,
          params.ctaText || "View in NextHire",
          params.ctaUrl || "/dashboard"
        );
        sendEmail({
          to: params.userEmail,
          subject: `[NextHire] ${params.title}`,
          html,
        }).catch((e) => console.warn("Email dispatch note:", e));
      }

      return true;
    } catch (err) {
      console.warn("Notification delivery note:", err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
