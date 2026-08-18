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
  getInitialThreads(): ChatThread[] {
    return [];
  },

  getThreadMessages(threadId: string): ChatMessage[] {
    return [];
  },
};
