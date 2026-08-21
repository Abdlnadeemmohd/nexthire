import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getRecruiterEntitlements } from "@/lib/billing/entitlements";

export const dynamic = "force-dynamic";

function calculateRecruiterCompleteness(user: any, recruiterData: any): { score: number; missing: string[]; recommendations: string[] } {
  let score = 0;
  const missing: string[] = [];
  const recommendations: string[] = [];

  if (user.name) score += 15;
  if (user.headline) score += 15; else missing.push("Recruiter Headline & Title");
  if (user.bio) score += 15; else missing.push("About / Recruiter Bio");
  if (user.avatar) score += 10; else recommendations.push("Add a professional photo to build candidate trust");
  if (user.companyId || (recruiterData.companyAssociations && recruiterData.companyAssociations.length > 0)) {
    score += 15;
  } else {
    missing.push("Company Association");
    recommendations.push("Associate with your hiring company to post verified roles");
  }
  if (recruiterData.industryFocus && recruiterData.industryFocus.length > 0) score += 10;
  else recommendations.push("Specify your industry recruiting focus (e.g. Engineering, AI, Cloud)");
  if (recruiterData.recruitingSkills && recruiterData.recruitingSkills.length > 0) score += 10;
  if (recruiterData.status) score += 10;

  return { score: Math.min(100, Math.max(0, score)), missing, recommendations };
}

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        company: true,
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Resolve entitlements and plan tier for tier styling
    const entitlements = await getRecruiterEntitlements(user.id).catch(() => null);

    // Active vacancies count from Neon PostgreSQL
    const activeVacancies = await prisma.job.count({
      where: {
        recruiterId: user.id,
        status: "ACTIVE",
      },
    });

    const totalApplicants = await prisma.application.count({
      where: {
        job: { recruiterId: user.id },
      },
    });

    // Safely parse recruiter profile JSON from Profile model
    let recruiterData: any = {
      status: "ACTIVELY_HIRING",
      recruiterRole: "Technical Talent Acquisition Partner",
      yearsExperience: 5,
      industryFocus: ["Software Engineering", "Cloud & DevOps", "AI & Data"],
      recruitingSpecialties: ["Full-Stack Engineering", "Backend Infrastructure", "Engineering Leadership"],
      recruitingSkills: ["Technical Sourcing", "Executive Search", "Candidate Assessment", "Talent Pipeline"],
      languages: ["English"],
      targetRoles: ["Senior Full-Stack Engineer", "Cloud Architect", "Frontend Lead"],
      departments: ["Engineering", "Product", "Infrastructure"],
      seniorityLevels: ["Mid-Level", "Senior", "Lead / Staff", "Director"],
      hiringLocations: [user.location || "San Francisco, CA", "Remote"],
      remotePreferences: ["Remote", "Hybrid"],
      employmentTypes: ["Full-time", "Contract"],
      hiringVolume: "3-5 hires per month",
      links: [],
      achievements: [],
      companyAssociations: [],
    };

    try {
      if (user.profile?.recruiterProfile && user.profile.recruiterProfile !== "{}") {
        const parsed = JSON.parse(user.profile.recruiterProfile);
        recruiterData = { ...recruiterData, ...parsed };
      }
    } catch {}

    // Ensure current company is in companyAssociations
    if (user.company) {
      const hasCurrent = recruiterData.companyAssociations.some((ca: any) => ca.companyId === user.company!.id);
      if (!hasCurrent) {
        recruiterData.companyAssociations.unshift({
          companyId: user.company.id,
          companyName: user.company.name,
          relationship: "CURRENT_EMPLOYER",
          role: user.headline || "Technical Recruiter",
          isCurrent: true,
          logoUrl: user.company.logo,
          isVerifiedCompany: user.company.isVerified,
        });
      }
    }

    const { score, missing, recommendations } = calculateRecruiterCompleteness(user, recruiterData);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        headline: user.headline || null,
        title: user.headline || null,
        company: user.company?.name || null,
        companyId: user.companyId || null,
        isVerified: authUser.isVerified,
        subscriptionTier: entitlements?.planTier || "TRIAL",
        avatar: user.avatar || null,
        bio: user.bio || null,
        location: user.location || null,
        websiteUrl: user.company?.website || null,
        recruiterData,
        completeness: score,
        missingSections: missing,
        recommendations,
        metrics: {
          activeVacancies,
          totalApplicants,
          candidatesHired: 0,
          avgResponseTime: "7-Day SLA",
        },
      },
    });
  } catch (err: any) {
    console.error("[GET /api/recruiter/profile Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve recruiter profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      headline,
      bio,
      location,
      phone,
      avatar,
      companyId,
      recruiterData,
    } = body;

    // 1. Update User basic info
    const userUpdate: any = {};
    if (typeof name === "string" && name.trim()) userUpdate.name = name.trim();
    if (headline !== undefined) userUpdate.headline = typeof headline === "string" ? headline.trim() : null;
    if (bio !== undefined) userUpdate.bio = typeof bio === "string" ? bio.trim() : null;
    if (location !== undefined) userUpdate.location = typeof location === "string" ? location.trim() : null;
    if (phone !== undefined) userUpdate.phone = typeof phone === "string" ? phone.trim() : null;
    if (avatar !== undefined) userUpdate.avatar = avatar;
    if (companyId !== undefined) userUpdate.companyId = companyId || null;

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: userUpdate,
      include: { company: true },
    });

    // 2. Update Profile recruiterProfile JSON
    let profileUpdate: any = {};
    if (recruiterData && typeof recruiterData === "object") {
      profileUpdate.recruiterProfile = JSON.stringify(recruiterData);
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        skills: "",
        experience: "[]",
        education: "[]",
        portfolio: "{}",
        recruiterProfile: profileUpdate.recruiterProfile || "{}",
      },
      update: profileUpdate,
    });

    const { score, missing, recommendations } = calculateRecruiterCompleteness(updatedUser, recruiterData || {});

    return NextResponse.json({
      success: true,
      message: "Recruiter profile updated successfully in Neon PostgreSQL",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        headline: updatedUser.headline,
        bio: updatedUser.bio,
        location: updatedUser.location,
        avatar: updatedUser.avatar,
        company: updatedUser.company?.name || null,
        companyId: updatedUser.companyId || null,
        completeness: score,
        missingSections: missing,
        recommendations,
        recruiterData: recruiterData || {},
      },
    });
  } catch (err: any) {
    console.error("[PUT /api/recruiter/profile Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update recruiter profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}
