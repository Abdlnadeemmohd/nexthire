import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

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
    const companyId = authUser.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Recruiter company profile has not been created yet." },
        { status: 404 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Recruiter company profile has not been created yet." },
        { status: 404 }
      );
    }

    // Live counts calculated from Neon PostgreSQL
    const activeJobsCount = await prisma.job.count({
      where: { companyId: company.id, status: "ACTIVE" },
    });

    const totalApplicantsCount = await prisma.application.count({
      where: { job: { companyId: company.id } },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        industry: company.industry,
        location: company.location,
        headquarters: company.location,
        website: company.website || null,
        description: company.description,
        about: company.description,
        logo: company.logo || null,
        logoUrl: company.logo || null,
        isVerified: company.isVerified,
        slaDays: company.slaDays,
        autoCloseDays: company.autoCloseDays,
        activeRoles: activeJobsCount,
        totalApplicants: totalApplicantsCount,
        createdAt: company.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[GET /api/recruiter/company Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch company profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter or Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      industry,
      location,
      description,
      website,
      logo,
    } = body;

    let targetCompanyId = authUser.companyId;

    if (!targetCompanyId) {
      // Recruiter is creating company profile for the first time
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, error: "Company name is required." },
          { status: 400 }
        );
      }
      if (!industry || typeof industry !== "string" || !industry.trim()) {
        return NextResponse.json(
          { success: false, error: "Company industry is required." },
          { status: 400 }
        );
      }
      if (!location || typeof location !== "string" || !location.trim()) {
        return NextResponse.json(
          { success: false, error: "Company location is required." },
          { status: 400 }
        );
      }
      if (!description || typeof description !== "string" || !description.trim()) {
        return NextResponse.json(
          { success: false, error: "Company description is required." },
          { status: 400 }
        );
      }

      const created = await prisma.company.create({
        data: {
          name: name.trim(),
          industry: industry.trim(),
          location: location.trim(),
          description: description.trim(),
          website: website?.trim() || null,
          logo: logo || null,
          isVerified: false,
        },
      });

      targetCompanyId = created.id;

      await prisma.user.update({
        where: { id: authUser.id },
        data: { companyId: targetCompanyId },
      });

      return NextResponse.json({
        success: true,
        message: "Company profile created successfully in Neon PostgreSQL",
        data: created,
      });
    }

    // Updating existing company profile
    const updatedCompany = await prisma.company.update({
      where: { id: targetCompanyId },
      data: {
        name: name !== undefined && name.trim() ? name.trim() : undefined,
        industry: industry !== undefined && industry.trim() ? industry.trim() : undefined,
        location: location !== undefined && location.trim() ? location.trim() : undefined,
        description: description !== undefined && description.trim() ? description.trim() : undefined,
        website: website !== undefined ? website.trim() || null : undefined,
        logo: logo !== undefined ? logo : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company profile updated successfully in Neon PostgreSQL",
      data: updatedCompany,
    });
  } catch (err: any) {
    console.error("[PUT /api/recruiter/company Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update company profile" },
      { status: 500 }
    );
  }
}
