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
    return [
      {
        id: "notif-1",
        title: "Interview Scheduled!",
        body: "Sarah Jenkins invited you for a Technical Interview for Senior Full Stack Engineer.",
        type: "INTERVIEW_INVITE",
        read: false,
        createdAt: "10 minutes ago",
        actionLink: "/messages",
      },
      {
        id: "notif-2",
        title: "Application Under Review",
        body: "Stellar Systems changed your application status to Screening.",
        type: "APPLICATION_UPDATE",
        read: false,
        createdAt: "2 hours ago",
        actionLink: "/applications",
      },
      {
        id: "notif-3",
        title: "New AI Job Match",
        body: "Nexus AI Lab posted a 96% AI Match role: Lead AI UX Designer.",
        type: "SYSTEM_ALERT",
        read: true,
        createdAt: "1 day ago",
        actionLink: "/jobs",
      },
    ];
  },
};
