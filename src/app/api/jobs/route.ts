import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_JOBS } from "@/lib/mockData";
import { getAuthenticatedUser } from "@/lib/auth/session";

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

    if (dbJobs && dbJobs.length > 0) {
      const formatted = dbJobs.map((j) => ({
        id: j.id,
        title: j.title,
        companyName: j.company.name,
        companyLogo: j.company.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
        location: j.location,
        country: j.country,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        category: j.category,
        isRemote: j.isRemote,
        matchScore: 95,
        tags: j.skills ? j.skills.split(",").map((s) => s.trim()) : [],
        description: j.description,
        responsibilities: j.responsibilities ? JSON.parse(j.responsibilities) : [],
        requirements: j.requirements ? JSON.parse(j.requirements) : [],
        benefits: j.benefits ? JSON.parse(j.benefits) : [],
        postedAt: j.createdAt.toISOString().split("T")[0],
        companyDescription: j.company.description,
        companyWebsite: j.company.website || "",
        companySize: "100-250 employees",
      }));

      return NextResponse.json({ success: true, count: formatted.length, data: formatted });
    }
  } catch (err) {
    console.warn("Prisma jobs query failed, using initial jobs fixture:", err);
  }

  let filtered = INITIAL_JOBS;
  if (q) {
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q.toLowerCase()) ||
        j.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))
    );
  }
  if (location) {
    filtered = filtered.filter((j) =>
      j.location.toLowerCase().includes(location.toLowerCase())
    );
  }
  if (category && category !== "ALL") {
    filtered = filtered.filter((j) => j.category === category);
  }

  return NextResponse.json({ success: true, count: filtered.length, data: filtered });
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
    
    // Attempt DB creation
    try {
      let companyId = body.companyId;
      if (!companyId) {
        let comp = await prisma.company.findFirst();
        if (!comp) {
          comp = await prisma.company.create({
            data: {
              name: authUser.companyName || "Enterprise Partner Inc",
              industry: "Software",
              location: "San Francisco, CA",
              description: "Enterprise software organization.",
            },
          });
        }
        companyId = comp.id;
      }

      const newJob = await prisma.job.create({
        data: {
          title: body.title || "Software Engineer",
          description: body.description || "Exciting engineering opportunity.",
          responsibilities: JSON.stringify(body.responsibilities || []),
          requirements: JSON.stringify(body.requirements || []),
          benefits: JSON.stringify(body.benefits || []),
          location: body.location || "San Francisco, CA",
          country: body.country || "United States",
          salaryMin: body.salaryMin || 120000,
          salaryMax: body.salaryMax || 160000,
          employmentType: body.employmentType || "FULL_TIME",
          experienceLevel: body.experienceLevel || "Mid-Senior",
          category: body.category || "Engineering",
          isRemote: body.isRemote ?? true,
          skills: Array.isArray(body.tags) ? body.tags.join(",") : body.skills || "TypeScript, React",
          status: "ACTIVE",
          companyId,
          recruiterId: authUser.id,
        },
      });

      return NextResponse.json({ success: true, data: newJob }, { status: 201 });
    } catch (dbErr: any) {
      console.error("[POST /api/jobs DB Error]:", dbErr);
      return NextResponse.json(
        {
          success: false,
          error: dbErr?.message || "Failed to create job in database.",
          category: "DATABASE_ERROR",
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process job creation request." },
      { status: 500 }
    );
  }
}
