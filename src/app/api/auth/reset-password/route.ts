import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { emitEvent } from "@/lib/events/eventEngine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, token, newPassword } = body;

    if (!email || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Valid email and new password (minimum 8 characters) are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    const passwordHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Dispatch mandatory security alert
    const eventType = user.role === "JOB_SEEKER" ? "SEEKER_PASSWORD_CHANGED" : "RECRUITER_SECURITY_ALERT";
    await emitEvent({
      type: eventType,
      recipientId: user.id,
      recipientEmail: user.email,
      metadata: {
        changedAt: new Date().toISOString(),
        ipAddress: request.headers.get("x-forwarded-for") || "Direct Client",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You may now sign in with your new credentials.",
    });
  } catch (err: any) {
    console.error("[POST /api/auth/reset-password Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to reset account password." },
      { status: 500 }
    );
  }
}
