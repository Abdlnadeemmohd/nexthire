import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";
import { getRecruiterEntitlements, EntitlementLimitError } from "@/lib/billing/entitlements";
import { notificationService } from "@/lib/notifications/NotificationService";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  const { id: candidateId } = params;

  if (authUser.role === "RECRUITER") {
    try {
      await assertUserVerified(authUser, "sending contact requests to candidates");
    } catch (err: any) {
      if (err instanceof VerificationRequiredError || err.name === "VerificationRequiredError") {
        return NextResponse.json(
          { success: false, error: err.message, status: err.status },
          { status: 403 }
        );
      }
      throw err;
    }
  }

  try {
    const entitlements = await getRecruiterEntitlements(authUser.id);
    if (!entitlements.canRequestContact) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact Requests are exclusively available on Diamond and Platinum plans. Please upgrade to request candidate direct phone and email consent.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const message = body.message?.trim() || `Employer would like to connect directly regarding open roles.`;

    const contactReq = await prisma.contactRequest.create({
      data: {
        recruiterId: authUser.id,
        candidateId,
        message,
        status: "PENDING",
      },
    });

    // Notify candidate
    await notificationService.sendNotification({
      userId: candidateId,
      title: "New Recruiter Contact Request",
      body: `${authUser.name} requested your direct contact details. Review in your Profile privacy center.`,
      type: "SYSTEM",
      ctaText: "Manage Privacy",
      ctaUrl: "/profile",
    });

    return NextResponse.json({
      success: true,
      message: "Contact request sent to candidate successfully. You will be notified once they respond.",
      data: contactReq,
    });
  } catch (err: any) {
    console.error("[Contact Request Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create contact request" },
      { status: 500 }
    );
  }
}
