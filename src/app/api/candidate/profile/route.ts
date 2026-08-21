import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function calculateCompleteness(user: any, profile: any): { score: number; missing: string[]; recommendations: string[] } {
  let score = 0;
  const missing: string[] = [];
  const recommendations: string[] = [];

  // 1. Personal & Identity (15%)
  let personalScore = 0;
  if (user.name) personalScore += 5;
  if (user.headline) personalScore += 5;
  if (user.bio) personalScore += 3;
  if (user.avatar) personalScore += 2;
  score += personalScore;
  if (!user.headline) missing.push("Professional Headline");
  if (!user.bio) missing.push("About / Professional Bio");
  if (!user.avatar) recommendations.push("Add a high-quality profile avatar for 2x recruiter engagement");

  // 2. Work Experience (20%)
  let experiences: any[] = [];
  try { experiences = JSON.parse(profile?.experience || "[]"); } catch {}
  if (experiences.length > 0) {
    score += 20;
  } else {
    missing.push("Work Experience");
    recommendations.push("Add at least 1 work experience record to appear in recruiter search");
  }

  // 3. Education (15%)
  let educations: any[] = [];
  try { educations = JSON.parse(profile?.education || "[]"); } catch {}
  if (educations.length > 0) {
    score += 15;
  } else {
    missing.push("Education");
  }

  // 4. Skills (15%)
  let skillsList: any[] = [];
  if (profile?.skills) {
    skillsList = profile.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
  }
  if (skillsList.length >= 3) {
    score += 15;
  } else if (skillsList.length > 0) {
    score += 8;
    recommendations.push("Add at least 3 skills to maximize your AI match score");
  } else {
    missing.push("Skills");
    recommendations.push("Add core technical and professional skills");
  }

  // 5. Certifications & Credentials (10%)
  let certs: any[] = [];
  try { certs = JSON.parse(profile?.certifications || "[]"); } catch {}
  if (certs.length > 0) {
    score += 10;
  } else {
    recommendations.push("Add verified professional certifications or licenses to earn verified credential badges");
  }

  // 6. Projects & Portfolio (10%)
  let projects: any[] = [];
  try { projects = JSON.parse(profile?.projects || "[]"); } catch {}
  if (projects.length > 0) {
    score += 10;
  } else {
    recommendations.push("Add key projects with GitHub / live demo links to showcase your craftsmanship");
  }

  // 7. Resume Document (10%)
  if (profile?.resumeUrl) {
    score += 10;
  } else {
    missing.push("Primary Resume File");
    recommendations.push("Upload your PDF resume for instant 1-click applications");
  }

  // 8. Professional Links & Preferences (5%)
  let links: any[] = [];
  try { links = JSON.parse(profile?.links || "[]"); } catch {}
  if (links.length > 0) {
    score += 5;
  } else {
    recommendations.push("Add your LinkedIn, GitHub, or Portfolio website link");
  }

  const finalScore = Math.min(100, Math.max(0, score));
  return { score: finalScore, missing, recommendations };
}

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active session required." },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const profile = user.profile;

    // Safely parse structured fields with default fallbacks
    let experience: any[] = [];
    let education: any[] = [];
    let certifications: any[] = [];
    let projects: any[] = [];
    let links: any[] = [];
    let achievements: any[] = [];
    let publications: any[] = [];
    let languages: any[] = [];
    let volunteer: any[] = [];
    let courses: any[] = [];
    let preferences: any = {
      openToWorkStatus: "OPEN_TO_OFFERS",
      preferredRoles: [],
      preferredTypes: ["Full-time"],
      remotePreference: "HYBRID",
      relocation: "OPEN",
      currency: "USD",
      salaryPeriod: "YEAR",
      noticePeriod: "2_WEEKS",
    };
    let visibility: any = {
      isDiscoverable: user.isDiscoverable,
      isPublic: true,
      contactVisibility: "MASKED",
      resumeVisibility: "ALL",
    };

    try { experience = JSON.parse(profile?.experience || "[]"); } catch {}
    try { education = JSON.parse(profile?.education || "[]"); } catch {}
    try { certifications = JSON.parse(profile?.certifications || "[]"); } catch {}
    try { projects = JSON.parse(profile?.projects || "[]"); } catch {}
    try { links = JSON.parse(profile?.links || "[]"); } catch {}
    try { achievements = JSON.parse(profile?.achievements || "[]"); } catch {}
    try { publications = JSON.parse(profile?.publications || "[]"); } catch {}
    try { languages = JSON.parse(profile?.languages || "[]"); } catch {}
    try { volunteer = JSON.parse(profile?.volunteer || "[]"); } catch {}
    try { courses = JSON.parse(profile?.courses || "[]"); } catch {}
    try {
      if (profile?.preferences && profile.preferences !== "{}") {
        preferences = { ...preferences, ...JSON.parse(profile.preferences) };
      }
    } catch {}
    try {
      if (profile?.visibility && profile.visibility !== "{}") {
        visibility = { ...visibility, ...JSON.parse(profile.visibility) };
      }
    } catch {}

    // Parse structured skills
    let rawSkills = profile?.skills || "";
    let skillsList = rawSkills
      ? rawSkills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const { score, missing, recommendations } = calculateCompleteness(user, profile);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        avatar: user.avatar || "",
        headline: user.headline || "",
        bio: user.bio || "",
        location: user.location || "",
        isDiscoverable: user.isDiscoverable,
        role: user.role,
        skills: rawSkills,
        skillsList,
        experience,
        education,
        certifications,
        projects,
        links,
        achievements,
        publications,
        languages,
        volunteer,
        courses,
        preferences,
        visibility,
        resumeUrl: profile?.resumeUrl || null,
        resumeScore: profile?.resumeScore ?? 92,
        completeness: score,
        missingSections: missing,
        recommendations,
        updatedAt: profile?.updatedAt?.toISOString() || user.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[GET /api/candidate/profile Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load candidate profile." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active session required." },
      { status: 401 }
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
      isDiscoverable,
      skills,
      skillsList,
      experience,
      education,
      certifications,
      projects,
      links,
      achievements,
      publications,
      languages,
      volunteer,
      courses,
      preferences,
      visibility,
      resumeUrl,
    } = body || {};

    // 1. Update User basic information
    const userUpdateData: any = {};
    if (typeof name === "string" && name.trim()) userUpdateData.name = name.trim();
    if (headline !== undefined) userUpdateData.headline = typeof headline === "string" ? headline.trim() : null;
    if (bio !== undefined) userUpdateData.bio = typeof bio === "string" ? bio.trim() : null;
    if (location !== undefined) userUpdateData.location = typeof location === "string" ? location.trim() : null;
    if (phone !== undefined) userUpdateData.phone = typeof phone === "string" ? phone.trim() : null;
    if (avatar !== undefined) userUpdateData.avatar = avatar;
    if (typeof isDiscoverable === "boolean") userUpdateData.isDiscoverable = isDiscoverable;

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: userUpdateData,
    });

    // 2. Prepare Profile structured updates
    const profileUpdateData: any = {};

    if (skills !== undefined) {
      profileUpdateData.skills = typeof skills === "string" ? skills.trim() : "";
    } else if (Array.isArray(skillsList)) {
      profileUpdateData.skills = skillsList
        .map((s: any) => (typeof s === "string" ? s : s?.name))
        .filter(Boolean)
        .join(", ");
    }

    if (Array.isArray(experience)) profileUpdateData.experience = JSON.stringify(experience);
    if (Array.isArray(education)) profileUpdateData.education = JSON.stringify(education);
    if (Array.isArray(certifications)) profileUpdateData.certifications = JSON.stringify(certifications);
    if (Array.isArray(projects)) profileUpdateData.projects = JSON.stringify(projects);
    if (Array.isArray(links)) profileUpdateData.links = JSON.stringify(links);
    if (Array.isArray(achievements)) profileUpdateData.achievements = JSON.stringify(achievements);
    if (Array.isArray(publications)) profileUpdateData.publications = JSON.stringify(publications);
    if (Array.isArray(languages)) profileUpdateData.languages = JSON.stringify(languages);
    if (Array.isArray(volunteer)) profileUpdateData.volunteer = JSON.stringify(volunteer);
    if (Array.isArray(courses)) profileUpdateData.courses = JSON.stringify(courses);
    if (preferences && typeof preferences === "object") profileUpdateData.preferences = JSON.stringify(preferences);
    if (visibility && typeof visibility === "object") profileUpdateData.visibility = JSON.stringify(visibility);
    if (resumeUrl !== undefined) profileUpdateData.resumeUrl = resumeUrl;

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        skills: profileUpdateData.skills || "",
        experience: profileUpdateData.experience || "[]",
        education: profileUpdateData.education || "[]",
        portfolio: "{}",
        certifications: profileUpdateData.certifications || "[]",
        projects: profileUpdateData.projects || "[]",
        links: profileUpdateData.links || "[]",
        achievements: profileUpdateData.achievements || "[]",
        publications: profileUpdateData.publications || "[]",
        languages: profileUpdateData.languages || "[]",
        volunteer: profileUpdateData.volunteer || "[]",
        courses: profileUpdateData.courses || "[]",
        preferences: profileUpdateData.preferences || "{}",
        visibility: profileUpdateData.visibility || "{}",
        resumeUrl: profileUpdateData.resumeUrl || null,
      },
      update: profileUpdateData,
    });

    const { score, missing, recommendations } = calculateCompleteness(updatedUser, updatedProfile);

    // Save computed completeness score
    await prisma.profile.update({
      where: { userId: authUser.id },
      data: { completeness: score },
    });

    return NextResponse.json({
      success: true,
      message: "Candidate professional profile updated successfully.",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        headline: updatedUser.headline,
        bio: updatedUser.bio,
        location: updatedUser.location,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        completeness: score,
        missingSections: missing,
        recommendations,
        updatedAt: updatedProfile.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[PUT /api/candidate/profile Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update candidate profile." },
      { status: 500 }
    );
  }
}
