import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/NotificationService";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";
import { sanitizeMessageContent } from "@/lib/privacy/contactProtection";
import { getTodayDateString } from "@/lib/billing/entitlements";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Sign in required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId") || searchParams.get("conversationWith");

  try {
    if (contactId) {
      // Get messages between authUser and specific contact
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: authUser.id, receiverId: contactId },
            { senderId: contactId, receiverId: authUser.id },
          ],
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } },
          receiver: { select: { id: true, name: true, avatar: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({
        success: true,
        count: messages.length,
        data: messages,
      });
    }

    // Otherwise, get all recent messages involving the authenticated user
    const allMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: authUser.id }, { receiverId: authUser.id }],
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        receiver: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group into contacts
    const contactsMap = new Map<string, any>();
    allMessages.forEach((msg) => {
      const contact = msg.senderId === authUser.id ? msg.receiver : msg.sender;
      if (contact && !contactsMap.has(contact.id)) {
        contactsMap.set(contact.id, {
          id: contact.id,
          name: contact.name,
          role: contact.role,
          avatar: contact.avatar || null,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unread: !msg.read && msg.receiverId === authUser.id,
        });
      }
    });

    return NextResponse.json({
      success: true,
      contacts: Array.from(contactsMap.values()),
      messages: allMessages.reverse(),
    });
  } catch (err: any) {
    console.error("[GET /api/messages Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Sign in required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { receiverId, content, attachment } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing receiverId or message content" },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: "Receiver not found" },
        { status: 404 }
      );
    }

    // Track daily message usage
    const today = getTodayDateString();
    await prisma.dailyUsage.upsert({
      where: { userId_date: { userId: authUser.id, date: today } },
      create: { userId: authUser.id, date: today, messages: 1 },
      update: { messages: { increment: 1 } },
    });

    // Sanitize contact info if message contains unprotected emails/phone numbers
    const { sanitized } = sanitizeMessageContent(content.trim());

    // Persist message in Neon PostgreSQL
    const createdMessage = await prisma.message.create({
      data: {
        senderId: authUser.id,
        receiverId: receiver.id,
        content: sanitized,
        attachment: attachment || undefined,
        read: false,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        receiver: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Dispatch message notification via EventEngine
    const preview = sanitized.length > 60 ? `${sanitized.substring(0, 60)}...` : sanitized;
    const { emitEvent } = await import("@/lib/events/eventEngine");

    const isCandidateReply = receiver.role === "RECRUITER" && authUser.role === "JOB_SEEKER";
    const eventType = receiver.role === "JOB_SEEKER"
      ? "SEEKER_MESSAGE_RECEIVED"
      : (isCandidateReply ? "RECRUITER_CANDIDATE_REPLY" : "RECRUITER_MESSAGE_RECEIVED");

    emitEvent({
      type: eventType,
      recipientId: receiver.id,
      recipientEmail: receiver.email,
      companyId: receiver.companyId || undefined,
      actorId: authUser.id,
      actorName: authUser.name,
      entityType: "Message",
      entityId: createdMessage.id,
      title: isCandidateReply ? `Candidate Reply from ${authUser.name}` : `New Message from ${authUser.name}`,
      body: `"${preview}"`,
      ctaText: "Reply in Chat",
      ctaUrl: `/messages?contactId=${authUser.id}`,
      metadata: {
        senderId: authUser.id,
        senderName: authUser.name,
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: createdMessage,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof VerificationRequiredError || err.name === "VerificationRequiredError") {
      return NextResponse.json(
        { success: false, error: err.message, status: err.status },
        { status: 403 }
      );
    }
    console.error("[POST /api/messages Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
