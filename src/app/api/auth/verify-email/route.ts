import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/events/eventEngine";

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

    if (user && user.role === "JOB_SEEKER") {
      await emitEvent({
        type: "SEEKER_EMAIL_VERIFICATION_SENT",
        recipientId: user.id,
        recipientEmail: user.email,
        metadata: {
          requestedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Verification email dispatched successfully.",
    });
  } catch (err: any) {
    console.error("[POST /api/auth/verify-email Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch verification email." },
      { status: 500 }
    );
  }
}
