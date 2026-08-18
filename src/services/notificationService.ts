export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "APPLICATION_UPDATE" | "INTERVIEW_INVITE" | "OFFER_RECEIVED" | "MESSAGE" | "SYSTEM_ALERT";
  read: boolean;
  createdAt: string;
  actionLink?: string;
}

export const NotificationService = {
  getInitialNotifications(): NotificationItem[] {
    return [];
  },
};
