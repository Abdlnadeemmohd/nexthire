import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const dbJob = await prisma.job.findUnique({
      where: { id },
      include: { company: true, recruiter: true },
    });

    if (!dbJob) {
      return NextResponse.json(
        { success: false, error: "Job position not found" },
        { status: 404 }
      );
    }

    let responsibilities: string[] = [];
    let requirements: string[] = [];
    let benefits: string[] = [];
    try {
      responsibilities = dbJob.responsibilities ? JSON.parse(dbJob.responsibilities) : [];
    } catch {}
    try {
      requirements = dbJob.requirements ? JSON.parse(dbJob.requirements) : [];
    } catch {}
    try {
      benefits = dbJob.benefits ? JSON.parse(dbJob.benefits) : [];
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        id: dbJob.id,
        title: dbJob.title,
        companyName: dbJob.company?.name || "NextHire Partner",
        companyLogo:
          dbJob.company?.logo ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
        location: dbJob.location,
        country: dbJob.country,
        salaryMin: dbJob.salaryMin,
        salaryMax: dbJob.salaryMax,
        employmentType: dbJob.employmentType,
        experienceLevel: dbJob.experienceLevel,
        category: dbJob.category,
        isRemote: dbJob.isRemote,
        matchScore: 95,
        tags: dbJob.skills ? dbJob.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        description: dbJob.description,
        responsibilities,
        requirements,
        benefits,
        postedAt: dbJob.createdAt.toISOString().split("T")[0],
        companyDescription: dbJob.company?.description || "",
        companyWebsite: dbJob.company?.website || "",
        companySize: "100-500 employees",
      },
    });
  } catch (err: any) {
    console.error("[GET /api/jobs/[id] Database Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve job from database" },
      { status: 500 }
    );
  }
}
