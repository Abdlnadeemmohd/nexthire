import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    const companies = await prisma.company.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { industry: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
              { website: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: {
            jobs: {
              where: { status: "ACTIVE" },
            },
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = companies.map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logo || null,
      coverImage: c.coverImage || null,
      industry: c.industry,
      location: c.location,
      description: c.description,
      website: c.website || "",
      companySize: c.companySize || `${c._count.users || 1} team members`,
      companyType: c.companyType || "Private",
      foundedYear: c.foundedYear || null,
      tagline: c.tagline || null,
      isVerified: c.isVerified,
      activeJobsCount: c._count.jobs,
      teamSize: c._count.users,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err: any) {
    console.error("[GET /api/companies Database Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve companies list" },
      { status: 500 }
    );
  }
}
