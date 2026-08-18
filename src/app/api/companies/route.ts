import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
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
      industry: c.industry,
      location: c.location,
      description: c.description,
      website: c.website || "",
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
      { success: false, error: "Failed to retrieve public companies list" },
      { status: 500 }
    );
  }
}
