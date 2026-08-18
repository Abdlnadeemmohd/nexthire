import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

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
    const [
      totalUsers,
      jobSeekers,
      recruiters,
      admins,
      companies,
      activeJobs,
      totalApplications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "JOB_SEEKER" } }),
      prisma.user.count({ where: { role: "RECRUITER" } }),
      prisma.user.count({ where: { role: "PLATFORM_ADMIN" } }),
      prisma.company.count(),
      prisma.job.count({ where: { status: "ACTIVE" } }),
      prisma.application.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        jobSeekers,
        recruiters,
        admins,
        companies,
        activeJobs,
        totalApplications,
        activeSubscriptions: 0,
        auditEventsCount: 0,
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
