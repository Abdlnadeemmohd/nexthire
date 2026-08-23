import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function calculateCompanyCompleteness(company: any): { score: number; missing: string[]; recommendations: string[] } {
  let score = 0;
  const missing: string[] = [];
  const recommendations: string[] = [];

  if (company.name) score += 15;
  if (company.industry) score += 10; else missing.push("Industry");
  if (company.location) score += 10; else missing.push("Location / HQ");
  if (company.description) score += 15; else missing.push("About / Company Story");
  if (company.website) score += 10; else missing.push("Website URL");
  if (company.logo) score += 10; else recommendations.push("Upload company logo for verified brand recognition");
  if (company.coverImage) score += 5; else recommendations.push("Add a branded cover/banner image");
  if (company.mission || company.vision) score += 5;

  let values: any[] = [];
  try { values = JSON.parse(company.values || "[]"); } catch {}
  if (values.length > 0) score += 5;

  let techStack: any[] = [];
  try { techStack = JSON.parse(company.techStack || "[]"); } catch {}
  if (techStack.length > 0) score += 5;

  let benefits: any[] = [];
  try { benefits = JSON.parse(company.benefits || "[]"); } catch {}
  if (benefits.length > 0) score += 5;

  let locations: any[] = [];
  try { locations = JSON.parse(company.locations || "[]"); } catch {}
  if (locations.length > 0) score += 5;

  return { score: Math.min(100, Math.max(0, score)), missing, recommendations };
}

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

    // Live counts from PostgreSQL
    const activeJobsCount = await prisma.job.count({
      where: { companyId: company.id, status: "ACTIVE" },
    });

    const totalApplicantsCount = await prisma.application.count({
      where: { job: { companyId: company.id } },
    });

    let values: any[] = [];
    let techStack: any[] = [];
    let benefits: any[] = [];
    let locations: any[] = [];
    let links: any[] = [];
    let media: any[] = [];

    try { values = JSON.parse(company.values || "[]"); } catch {}
    try { techStack = JSON.parse(company.techStack || "[]"); } catch {}
    try { benefits = JSON.parse(company.benefits || "[]"); } catch {}
    try { locations = JSON.parse(company.locations || "[]"); } catch {}
    try { links = JSON.parse(company.links || "[]"); } catch {}
    try { media = JSON.parse(company.media || "[]"); } catch {}

    const { score, missing, recommendations } = calculateCompanyCompleteness(company);

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
        coverImage: company.coverImage || null,
        companyType: company.companyType || "Private",
        companySize: company.companySize || "11-50 employees",
        foundedYear: company.foundedYear || null,
        tagline: company.tagline || null,
        mission: company.mission || null,
        vision: company.vision || null,
        culture: company.culture || null,
        remotePolicy: company.remotePolicy || "Hybrid",
        values,
        techStack,
        benefits,
        locations,
        links,
        media,
        isVerified: company.isVerified,
        slaDays: company.slaDays,
        autoCloseDays: company.autoCloseDays,
        activeRoles: activeJobsCount,
        totalApplicants: totalApplicantsCount,
        completeness: score,
        missingSections: missing,
        recommendations,
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
      coverImage,
      companyType,
      companySize,
      foundedYear,
      tagline,
      mission,
      vision,
      culture,
      remotePolicy,
      values,
      techStack,
      benefits,
      locations,
      links,
      media,
    } = body;

    let targetCompanyId = authUser.companyId;

    if (!targetCompanyId) {
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
          coverImage: coverImage || null,
          companyType: companyType || "Private",
          companySize: companySize || "11-50 employees",
          foundedYear: foundedYear ? Number(foundedYear) : null,
          tagline: tagline?.trim() || null,
          mission: mission?.trim() || null,
          vision: vision?.trim() || null,
          culture: culture?.trim() || null,
          remotePolicy: remotePolicy || "Hybrid",
          values: Array.isArray(values) ? JSON.stringify(values) : "[]",
          techStack: Array.isArray(techStack) ? JSON.stringify(techStack) : "[]",
          benefits: Array.isArray(benefits) ? JSON.stringify(benefits) : "[]",
          locations: Array.isArray(locations) ? JSON.stringify(locations) : "[]",
          links: Array.isArray(links) ? JSON.stringify(links) : "[]",
          media: Array.isArray(media) ? JSON.stringify(media) : "[]",
          isVerified: false,
        },
      });

      targetCompanyId = created.id;

      await prisma.user.update({
        where: { id: authUser.id },
        data: { companyId: targetCompanyId },
      });

      const { score, missing, recommendations } = calculateCompanyCompleteness(created);

      const { emitEvent } = await import("@/lib/events/eventEngine");
      emitEvent({
        type: "RECRUITER_COMPANY_CREATED",
        recipientId: authUser.id,
        recipientEmail: authUser.email,
        companyId: targetCompanyId,
        entityType: "Company",
        entityId: targetCompanyId,
        title: `Company Profile Created: ${created.name}`,
        body: `Your employer organization profile for "${created.name}" is now active on NextHire.`,
        ctaText: "View Company Profile",
        ctaUrl: "/recruiter/company",
        metadata: { companyId: targetCompanyId, companyName: created.name },
      }).catch(() => {});

      emitEvent({
        type: "RECRUITER_COMPANY_VERIFICATION_SUBMITTED",
        recipientId: authUser.id,
        recipientEmail: authUser.email,
        companyId: targetCompanyId,
        entityType: "Company",
        entityId: targetCompanyId,
        title: "Company Verification Submitted",
        body: `"${created.name}" has been submitted for verified employer review by NextHire governance.`,
        ctaText: "Check Verification Status",
        ctaUrl: "/recruiter/company",
        metadata: { companyId: targetCompanyId, companyName: created.name },
      }).catch(() => {});

      emitEvent({
        type: "RECRUITER_VERIFICATION_REQUESTED",
        recipientId: authUser.id,
        recipientEmail: authUser.email,
        companyId: targetCompanyId,
        title: "Recruiter Verification Under Review",
        body: "Your recruiter credentials and company profile are under review.",
        ctaText: "Check Status",
        ctaUrl: "/recruiter",
        metadata: { companyId: targetCompanyId },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "Company profile created successfully in Neon PostgreSQL",
        data: {
          ...created,
          completeness: score,
          missingSections: missing,
          recommendations,
        },
      });
    }

    // Updating existing company profile
    const updateData: any = {};
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (industry !== undefined && industry.trim()) updateData.industry = industry.trim();
    if (location !== undefined && location.trim()) updateData.location = location.trim();
    if (description !== undefined && description.trim()) updateData.description = description.trim();
    if (website !== undefined) updateData.website = website.trim() || null;
    if (logo !== undefined) updateData.logo = logo;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (companyType !== undefined) updateData.companyType = companyType;
    if (companySize !== undefined) updateData.companySize = companySize;
    if (foundedYear !== undefined) updateData.foundedYear = foundedYear ? Number(foundedYear) : null;
    if (tagline !== undefined) updateData.tagline = tagline?.trim() || null;
    if (mission !== undefined) updateData.mission = mission?.trim() || null;
    if (vision !== undefined) updateData.vision = vision?.trim() || null;
    if (culture !== undefined) updateData.culture = culture?.trim() || null;
    if (remotePolicy !== undefined) updateData.remotePolicy = remotePolicy;
    if (Array.isArray(values)) updateData.values = JSON.stringify(values);
    if (Array.isArray(techStack)) updateData.techStack = JSON.stringify(techStack);
    if (Array.isArray(benefits)) updateData.benefits = JSON.stringify(benefits);
    if (Array.isArray(locations)) updateData.locations = JSON.stringify(locations);
    if (Array.isArray(links)) updateData.links = JSON.stringify(links);
    if (Array.isArray(media)) updateData.media = JSON.stringify(media);

    const updatedCompany = await prisma.company.update({
      where: { id: targetCompanyId },
      data: updateData,
    });

    const { score, missing, recommendations } = calculateCompanyCompleteness(updatedCompany);

    const { emitEvent } = await import("@/lib/events/eventEngine");
    emitEvent({
      type: "RECRUITER_COMPANY_UPDATED",
      recipientId: authUser.id,
      recipientEmail: authUser.email,
      companyId: targetCompanyId,
      entityType: "Company",
      entityId: targetCompanyId,
      title: `Company Profile Updated: ${updatedCompany.name}`,
      body: `Changes to your company branding, profile, and details were saved successfully.`,
      ctaText: "View Company Profile",
      ctaUrl: "/recruiter/company",
      metadata: { companyId: targetCompanyId, companyName: updatedCompany.name },
    }).catch(() => {});

    if (body.requestVerification) {
      const { getAdminRecipients } = await import("@/lib/admin/adminMonitoring");
      const admins = await getAdminRecipients();
      for (const admin of admins) {
        emitEvent({
          type: "ADMIN_COMPANY_VERIFICATION_REQUESTED",
          recipientId: admin.id,
          recipientEmail: admin.email,
          entityType: "Company",
          entityId: targetCompanyId,
          title: `🏢 Company Verification Requested: ${updatedCompany.name}`,
          body: `Recruiter ${authUser.email} submitted verification documents for organization "${updatedCompany.name}".`,
          ctaText: "Review Company",
          ctaUrl: "/admin/companies",
          metadata: { companyId: targetCompanyId, companyName: updatedCompany.name },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: "Company profile updated successfully in Neon PostgreSQL",
      data: {
        ...updatedCompany,
        completeness: score,
        missingSections: missing,
        recommendations,
      },
    });
  } catch (err: any) {
    console.error("[PUT /api/recruiter/company Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update company profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}
