import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/NotificationService";

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
  const contactId = searchParams.get("contactId");

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
          avatar: contact.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
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

    // Persist message in Neon PostgreSQL
    const createdMessage = await prisma.message.create({
      data: {
        senderId: authUser.id,
        receiverId: receiver.id,
        content: content.trim(),
        attachment: attachment || undefined,
        read: false,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        receiver: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Send in-app notification to the message receiver
    const preview = content.trim().length > 60 ? `${content.trim().substring(0, 60)}...` : content.trim();
    await notificationService.sendNotification({
      userId: receiver.id,
      title: `New Message from ${authUser.name}`,
      body: `"${preview}"`,
      type: "MESSAGE",
      ctaText: "Reply in Chat",
      ctaUrl: `/messages?contactId=${authUser.id}`,
    });

    return NextResponse.json({
      success: true,
      data: createdMessage,
    });
  } catch (err: any) {
    console.error("[POST /api/messages Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
