import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { checkPlatformHealth } from "@/lib/admin/adminMonitoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin role required" },
      { status: 403 }
    );
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      jobSeekers,
      recruiters,
      admins,
      companies,
      pendingCompanyVerifications,
      unverifiedRecruiters,
      activeJobs,
      totalApplications,
      activeSubscriptions,
      subSums,
      openReportsCount,
      recentAuditLogs,
      health,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "JOB_SEEKER" } }),
      prisma.user.count({ where: { role: "RECRUITER" } }),
      prisma.user.count({ where: { role: "PLATFORM_ADMIN" } }),
      prisma.company.count(),
      prisma.company.count({ where: { isVerified: false } }),
      prisma.user.count({
        where: {
          role: "RECRUITER",
          OR: [{ company: { isVerified: false } }, { companyId: null }],
        },
      }),
      prisma.job.count({ where: { status: "ACTIVE" } }),
      prisma.application.count(),
      prisma.subscription.count({ where: { status: "ACTIVE", endDate: { gte: now } } }),
      prisma.subscription.aggregate({ _sum: { amountPaid: true } }),
      prisma.auditEvent.count({ where: { action: "REPORT_SUBMITTED" } }),
      prisma.auditEvent.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
      }),
      checkPlatformHealth(),
    ]);

    const totalRevenue = subSums._sum.amountPaid || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        jobSeekers,
        recruiters,
        admins,
        companies,
        pendingCompanyVerifications,
        unverifiedRecruiters,
        activeJobs,
        totalApplications,
        activeSubscriptions,
        totalRevenue,
        openReportsCount,
        recentAuditLogs,
        systemHealth: health,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/stats Database Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve platform statistics" },
      { status: 500 }
    );
  }
}
