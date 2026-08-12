import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_JOBS } from "@/lib/mockData";

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

    if (dbJob) {
      return NextResponse.json({
        success: true,
        data: {
          id: dbJob.id,
          title: dbJob.title,
          companyName: dbJob.company.name,
          companyLogo: dbJob.company.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
          location: dbJob.location,
          country: dbJob.country,
          salaryMin: dbJob.salaryMin,
          salaryMax: dbJob.salaryMax,
          employmentType: dbJob.employmentType,
          experienceLevel: dbJob.experienceLevel,
          category: dbJob.category,
          isRemote: dbJob.isRemote,
          matchScore: 95,
          tags: dbJob.skills ? dbJob.skills.split(",").map((s) => s.trim()) : [],
          description: dbJob.description,
          responsibilities: dbJob.responsibilities ? JSON.parse(dbJob.responsibilities) : [],
          requirements: dbJob.requirements ? JSON.parse(dbJob.requirements) : [],
          benefits: dbJob.benefits ? JSON.parse(dbJob.benefits) : [],
          postedAt: dbJob.createdAt.toISOString().split("T")[0],
          companyDescription: dbJob.company.description,
          companyWebsite: dbJob.company.website || "",
          companySize: "100-500 employees",
        },
      });
    }
  } catch {
    // Memory fallback
  }

  const memJob = INITIAL_JOBS.find((j) => j.id === id);
  if (memJob) {
    return NextResponse.json({ success: true, data: memJob });
  }

  return NextResponse.json({ success: false, error: "Job position not found" }, { status: 404 });
}
