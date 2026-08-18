import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

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
        companyName: j.company?.name || "Hiring Partner",
        companyLogo: j.company?.logo || null,
        isCompanyVerified: j.company?.isVerified || false,
        location: j.location,
        country: j.country,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        category: j.category,
        isRemote: j.isRemote,
        tags: j.skills ? j.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        description: j.description,
        responsibilities,
        requirements,
        benefits,
        postedAt: j.createdAt.toISOString().split("T")[0],
        companyDescription: j.company?.description || "",
        companyWebsite: j.company?.website || "",
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
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter or Admin role required" },
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
        companyId,
        recruiterId: authUser.id,
      },
    });

    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/jobs Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create job in database." },
      { status: 500 }
    );
  }
}
