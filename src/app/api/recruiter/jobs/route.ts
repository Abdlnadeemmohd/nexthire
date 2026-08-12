import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertCompanyAccess } from "@/lib/auth/multiTenant";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter or Admin access required" },
      { status: 403 }
    );
  }

  try {
    const userCompanyId = authUser.companyId;

    // Multi-tenant database query using companyId UUID
    const dbJobs = await prisma.job.findMany({
      where: authUser.role === "PLATFORM_ADMIN"
        ? {}
        : { companyId: userCompanyId || "" },
      include: {
        company: true,
        applications: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: dbJobs.length, data: dbJobs });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch recruiter jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    let companyId = body.companyId || authUser.companyId;
    if (!companyId) {
      const comp = await prisma.company.findFirst();
      if (comp) companyId = comp.id;
    }

    if (companyId) {
      assertCompanyAccess(authUser, companyId);
    }

    const newJob = await prisma.job.create({
      data: {
        title: body.title,
        description: body.description,
        responsibilities: JSON.stringify(body.responsibilities || []),
        requirements: JSON.stringify(body.requirements || []),
        benefits: JSON.stringify(body.benefits || []),
        location: body.location || "San Francisco, CA",
        country: body.country || "United States",
        salaryMin: body.salaryMin || 130000,
        salaryMax: body.salaryMax || 180000,
        employmentType: body.employmentType || "FULL_TIME",
        experienceLevel: body.experienceLevel || "Senior",
        category: body.category || "Engineering",
        isRemote: body.isRemote ?? true,
        skills: Array.isArray(body.tags) ? body.tags.join(",") : body.skills || "TypeScript, React",
        status: "ACTIVE",
        companyId: companyId || "c-1",
        recruiterId: authUser.id,
      },
    });

    await logAuditEvent(authUser.id, "JOB_CREATED", "Job", newJob.id, { title: newJob.title, companyId });

    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create recruiter job" },
      { status: 500 }
    );
  }
}
