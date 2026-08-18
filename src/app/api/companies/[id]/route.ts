import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            jobs: { where: { status: "ACTIVE" } },
            users: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    const formattedJobs = company.jobs.map((j) => ({
      id: j.id,
      title: j.title,
      companyId: j.companyId,
      companyName: company.name,
      companyLogo: company.logo || null,
      location: j.location,
      country: j.country,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      employmentType: j.employmentType,
      experienceLevel: j.experienceLevel,
      category: j.category,
      isRemote: j.isRemote,
      status: j.status,
      matchScore: 90,
      tags: j.skills ? j.skills.split(",").map((s) => s.trim()) : [],
      description: j.description,
      responsibilities: j.responsibilities ? j.responsibilities.split("\n").filter(Boolean) : [],
      requirements: j.requirements ? j.requirements.split("\n").filter(Boolean) : [],
      benefits: j.benefits ? j.benefits.split("\n").filter(Boolean) : [],
      postedAt: j.createdAt.toISOString().split("T")[0],
      companyDescription: company.description,
      companyWebsite: company.website || "",
      companySize: `${company._count.users || 1} team members`,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        logo: company.logo || null,
        industry: company.industry,
        location: company.location,
        description: company.description,
        website: company.website || "",
        isVerified: company.isVerified,
        activeJobsCount: company._count.jobs,
        teamSize: company._count.users,
        createdAt: company.createdAt.toISOString(),
        jobs: formattedJobs,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/companies/[id] Database Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve company details" },
      { status: 500 }
    );
  }
}
