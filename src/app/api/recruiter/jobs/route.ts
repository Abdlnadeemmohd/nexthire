import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertCompanyAccess } from "@/lib/auth/multiTenant";
import { logAuditEvent } from "@/lib/audit/auditLogger";

export const dynamic = "force-dynamic";

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

    if (!userCompanyId && authUser.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

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

    const companyId = authUser.companyId;
    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Recruiter must belong to a registered company to post jobs. Please create your company profile first.",
        },
        { status: 400 }
      );
    }

    assertCompanyAccess(authUser, companyId);

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Job title is required." },
        { status: 400 }
      );
    }

    if (!body.description || typeof body.description !== "string" || !body.description.trim()) {
      return NextResponse.json(
        { success: false, error: "Job description is required." },
        { status: 400 }
      );
    }

    const newJob = await prisma.job.create({
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        responsibilities: JSON.stringify(Array.isArray(body.responsibilities) ? body.responsibilities : []),
        requirements: JSON.stringify(Array.isArray(body.requirements) ? body.requirements : []),
        benefits: JSON.stringify(Array.isArray(body.benefits) ? body.benefits : []),
        location: body.location?.trim() || "Remote",
        country: body.country?.trim() || "United States",
        salaryMin: typeof body.salaryMin === "number" ? body.salaryMin : 0,
        salaryMax: typeof body.salaryMax === "number" ? body.salaryMax : 0,
        employmentType: body.employmentType || "FULL_TIME",
        experienceLevel: body.experienceLevel?.trim() || "Mid-Level",
        category: body.category?.trim() || "Engineering",
        isRemote: Boolean(body.isRemote),
        skills: Array.isArray(body.tags) ? body.tags.join(",") : (body.skills?.trim() || ""),
        status: "ACTIVE",
        companyId: companyId,
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

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, status, title, description, location, salaryMin, salaryMax } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing job ID" }, { status: 400 });
    }

    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (authUser.role !== "PLATFORM_ADMIN") {
      assertCompanyAccess(authUser, existingJob.companyId);
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        location: location !== undefined ? location : undefined,
        salaryMin: salaryMin !== undefined ? salaryMin : undefined,
        salaryMax: salaryMax !== undefined ? salaryMax : undefined,
      },
    });

    await logAuditEvent(authUser.id, "JOB_STATUS_UPDATED", "Job", id, { status });

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing job ID" }, { status: 400 });
  }

  try {
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (authUser.role !== "PLATFORM_ADMIN") {
      assertCompanyAccess(authUser, existingJob.companyId);
    }

    await prisma.job.delete({
      where: { id },
    });

    await logAuditEvent(authUser.id, "JOB_DELETED", "Job", id, { title: existingJob.title });

    return NextResponse.json({ success: true, message: "Job deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete job" },
      { status: 500 }
    );
  }
}
