export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  readAt?: string;
  attachmentUrl?: string;
  attachmentType?: "PDF" | "IMAGE" | "RESUME" | "INTERVIEW_INVITE";
  interviewInviteDetails?: {
    jobTitle: string;
    scheduledAt: string;
    meetingPlatform: string;
    meetingUrl: string;
  };
}

export interface ChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN";
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
}

export const MessagingService = {
  /**
   * Generates initial mock enterprise messaging threads
   */
  getInitialThreads(): ChatThread[] {
    return [
      {
        id: "thread-1",
        participantId: "u-recruiter-1",
        participantName: "Sarah Jenkins",
        participantAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
        participantRole: "RECRUITER",
        lastMessage: "Hi Alex! We would love to invite you for a 45-min System Design interview round.",
        lastMessageTimestamp: "10:42 AM",
        unreadCount: 1,
        isPinned: true,
      },
      {
        id: "thread-2",
        participantId: "u-recruiter-2",
        participantName: "Marcus Vance",
        participantAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80",
        participantRole: "RECRUITER",
        lastMessage: "Thanks for reviewing the offer terms! Looking forward to your response.",
        lastMessageTimestamp: "Yesterday",
        unreadCount: 0,
      },
    ];
  },

  /**
   * Generates mock messages for a thread
   */
  getThreadMessages(threadId: string): ChatMessage[] {
    if (threadId === "thread-1") {
      return [
        {
          id: "m-1",
          senderId: "u-recruiter-1",
          senderName: "Sarah Jenkins",
          senderAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
          receiverId: "me",
          content: "Hi Alex, your application for Senior Full Stack Engineer stood out to our hiring team!",
          timestamp: "Yesterday 4:15 PM",
          read: true,
        },
        {
          id: "m-2",
          senderId: "me",
          senderName: "Alex Morgan",
          senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
          receiverId: "u-recruiter-1",
          content: "Thank you Sarah! I'm very excited about the position and company mission.",
          timestamp: "Yesterday 5:02 PM",
          read: true,
        },
        {
          id: "m-3",
          senderId: "u-recruiter-1",
          senderName: "Sarah Jenkins",
          senderAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
          receiverId: "me",
          content: "Hi Alex! We would love to invite you for a 45-min System Design interview round.",
          timestamp: "10:42 AM",
          read: false,
          attachmentType: "INTERVIEW_INVITE",
          interviewInviteDetails: {
            jobTitle: "Senior Full Stack Engineer",
            scheduledAt: "Tomorrow at 3:00 PM EST",
            meetingPlatform: "Google Meet",
            meetingUrl: "https://meet.google.com/nex-thir-eng",
          },
        },
      ];
    }
    return [];
  },
};
