import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertRecruiterAndCompanyVerified, VerificationRequiredError } from "@/lib/auth/verification";
import { assertJobPostingAllowed, EntitlementLimitError } from "@/lib/billing/entitlements";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";

  try {
    const dbJobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        AND: [
          q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                  { skills: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          location ? { location: { contains: location, mode: "insensitive" } } : {},
          category && category !== "ALL" ? { category: { equals: category } } : {},
        ],
      },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });

    const formatted = (dbJobs || []).map((j) => {
      let responsibilities: string[] = [];
      let requirements: string[] = [];
      let benefits: string[] = [];
      try {
        responsibilities = j.responsibilities ? JSON.parse(j.responsibilities) : [];
      } catch {}
      try {
        requirements = j.requirements ? JSON.parse(j.requirements) : [];
      } catch {}
      try {
        benefits = j.benefits ? JSON.parse(j.benefits) : [];
      } catch {}

      return {
        id: j.id,
        title: j.title,
        description: j.description,
        responsibilities,
        requirements,
        benefits,
        location: j.location,
        country: j.country,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salary: `$${j.salaryMin.toLocaleString()} - $${j.salaryMax.toLocaleString()}`,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        category: j.category,
        isRemote: j.isRemote,
        skills: j.skills ? j.skills.split(",").map((s) => s.trim()) : [],
        tags: j.skills ? j.skills.split(",").map((s) => s.trim()) : [],
        postedDate: j.createdAt.toISOString().split("T")[0],
        postedAt: j.createdAt.toISOString().split("T")[0],
        status: j.status,
        isTrialJob: j.isTrialJob,
        companyName: j.company?.name || "Verified Organization",
        companyId: j.companyId || j.company?.id || null,
        companyLogo:
          j.company?.logo ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        isCompanyVerified: j.company?.isVerified ?? true,
        company: {
          id: j.company?.id || "unknown",
          name: j.company?.name || "Verified Organization",
          logo:
            j.company?.logo ||
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
          industry: j.company?.industry || "Technology",
          location: j.company?.location || "Remote",
          isVerified: j.company?.isVerified ?? true,
        },
      };
    });

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: any) {
    console.error("[GET /api/jobs Database Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs from database.", count: 0, data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Sign in required to post jobs." },
      { status: 401 }
    );
  }

  if (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Recruiter or Admin role required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // 1. Enforce strict explicit verification for Recruiter AND Company
    if (authUser.role === "RECRUITER") {
      await assertRecruiterAndCompanyVerified(authUser);
    }

    // 2. Enforce job posting quotas (Trial mode max 1 job posting)
    let isTrialJob = false;
    if (authUser.role === "RECRUITER") {
      const postingQuota = await assertJobPostingAllowed(authUser.id);
      isTrialJob = postingQuota.isTrialJob;
    }

    const companyId = authUser.companyId || body.companyId;

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
        skills: Array.isArray(body.skills)
          ? body.skills.join(", ")
          : Array.isArray(body.tags)
          ? body.tags.join(", ")
          : typeof body.skills === "string"
          ? body.skills.trim()
          : "",
        status: "ACTIVE",
        isTrialJob,
        companyId,
        recruiterId: authUser.id,
      },
    });

    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (err: any) {
    if (err instanceof VerificationRequiredError || err.name === "VerificationRequiredError") {
      return NextResponse.json(
        { success: false, error: err.message, status: err.status },
        { status: 403 }
      );
    }
    if (err instanceof EntitlementLimitError || err.name === "EntitlementLimitError") {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code, upgradeRequired: true },
        { status: 403 }
      );
    }
    console.error("[POST /api/jobs Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create job in database." },
      { status: 500 }
    );
  }
}
