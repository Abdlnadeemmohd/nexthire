import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/NotificationService";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin access required" },
      { status: 403 }
    );
  }

  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            jobs: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = companies.map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logo || null,
      industry: c.industry,
      location: c.location,
      description: c.description,
      website: c.website || "",
      isVerified: c.isVerified,
      status: c.isVerified ? "APPROVED" : "PENDING",
      registrationDate: c.createdAt.toISOString().split("T")[0],
      jobsCount: c._count.jobs,
      teamSize: c._count.users,
    }));

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: any) {
    console.error("[GET /api/admin/companies Database Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve companies list from database" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { companyId, isVerified } = body;

    if (!companyId) {
      return NextResponse.json({ success: false, error: "Missing companyId" }, { status: 400 });
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { isVerified: Boolean(isVerified) },
      include: { users: true },
    });

    // 1. Dispatch typed EventEngine events to all recruiters belonging to this company
    const { emitEvent } = await import("@/lib/events/eventEngine");
    const eventType = Boolean(isVerified)
      ? "RECRUITER_COMPANY_VERIFIED"
      : "RECRUITER_COMPANY_VERIFICATION_REJECTED";

    for (const user of updated.users) {
      if (user.role === "RECRUITER" || user.role === "COMPANY_ADMIN") {
        emitEvent({
          type: eventType,
          recipientId: user.id,
          recipientEmail: user.email,
          companyId: updated.id,
          entityType: "Company",
          entityId: updated.id,
          title: Boolean(isVerified)
            ? `🎉 ${updated.name} is now a Verified Employer!`
            : `Company Verification Status: ${updated.name}`,
          body: Boolean(isVerified)
            ? `Your organization has received the official Verified Badge on NextHire.`
            : `Company verification review was not approved at this time. Please check your company details.`,
          ctaText: "View Company Profile",
          ctaUrl: "/recruiter/company",
          metadata: { companyId: updated.id, companyName: updated.name, isVerified: Boolean(isVerified) },
        }).catch(() => {});
      }
    }

    // 2. Log Audit Trail
    await logAuditEvent(authUser.id, "COMPANY_VERIFICATION_UPDATED", "Company", companyId, {
      companyName: updated.name,
      isVerified: Boolean(isVerified),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update company verification status" },
      { status: 500 }
    );
  }
}
