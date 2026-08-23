import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/events/eventEngine";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const eventType = user.role === "JOB_SEEKER" ? "SEEKER_PASSWORD_RESET_REQUESTED" : "RECRUITER_SECURITY_ALERT";

      await emitEvent({
        type: eventType,
        recipientId: user.id,
        recipientEmail: user.email,
        metadata: {
          resetToken,
          requestedAt: new Date().toISOString(),
        },
      });
    }

    // Always return success to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a secure password reset link has been dispatched.",
    });
  } catch (err: any) {
    console.error("[POST /api/auth/forgot-password Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
