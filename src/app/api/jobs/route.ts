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
        companyName: j.company?.name || "NextHire Partner",
        companyLogo:
          j.company?.logo ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
        location: j.location,
        country: j.country,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        category: j.category,
        isRemote: j.isRemote,
        matchScore: 95,
        tags: j.skills ? j.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        description: j.description,
        responsibilities,
        requirements,
        benefits,
        postedAt: j.createdAt.toISOString().split("T")[0],
        companyDescription: j.company?.description || "",
        companyWebsite: j.company?.website || "",
        companySize: "100-250 employees",
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

    let companyId = body.companyId || authUser.companyId;
    if (!companyId) {
      let comp = await prisma.company.findFirst();
      if (!comp) {
        comp = await prisma.company.create({
          data: {
            name: authUser.companyName || "NextHire Simulation Corp",
            industry: "Software & Cloud Infrastructure",
            location: "San Francisco, CA",
            description: "Dedicated enterprise partner on NextHire Cloud.",
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
        salaryMin: Number(body.salaryMin) || 120000,
        salaryMax: Number(body.salaryMax) || 160000,
        employmentType: body.employmentType || "FULL_TIME",
        experienceLevel: body.experienceLevel || "Mid-Senior",
        category: body.category || "ENGINEERING",
        isRemote: body.isRemote ?? true,
        skills: Array.isArray(body.tags)
          ? body.tags.join(",")
          : body.skills || "TypeScript, React, PostgreSQL",
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
