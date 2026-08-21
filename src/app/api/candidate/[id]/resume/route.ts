import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CandidatePreferences, CandidateVisibility } from "@/lib/auth";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "Candidate Email (Protected)";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const candidateId = params.id;
  if (!candidateId || typeof candidateId !== "string" || candidateId.trim() === "") {
    return NextResponse.json(
      { success: false, error: "Invalid candidate identifier." },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: candidateId,
        role: "JOB_SEEKER",
      },
      include: {
        profile: true,
      },
    });

    if (!user || !user.profile) {
      return NextResponse.json(
        { success: false, error: "Candidate resume not found." },
        { status: 404 }
      );
    }

    // 1. Authoritative Visibility & Privacy Resolution
    let visibility: CandidateVisibility = {
      isDiscoverable: user.isDiscoverable,
      isPublic: true,
      contactVisibility: "MASKED",
      resumeVisibility: "ALL",
    };

    try {
      if (user.profile.visibility && user.profile.visibility !== "{}") {
        visibility = { ...visibility, ...JSON.parse(user.profile.visibility) };
      }
    } catch {}

    // Check if candidate has disabled public discoverability / visibility
    if (!visibility.isPublic || !visibility.isDiscoverable || !user.isDiscoverable) {
      return NextResponse.json(
        {
          success: false,
          isPrivate: true,
          error: "This candidate's resume is private or currently unavailable.",
        },
        { status: 403 }
      );
    }

    // 2. Parse Preferences for Status and Template Selection
    let preferences: CandidatePreferences = {
      openToWorkStatus: "OPEN_TO_OFFERS",
      preferredRoles: [],
      preferredTypes: ["Full-time"],
      remotePreference: "HYBRID",
      relocation: "OPEN",
      currency: "USD",
      salaryPeriod: "YEAR",
      noticePeriod: "2_WEEKS",
    };

    try {
      if (user.profile.preferences && user.profile.preferences !== "{}") {
        preferences = { ...preferences, ...JSON.parse(user.profile.preferences) };
      }
    } catch {}

    // 3. Parse Structured Profile Entities
    let experience: any[] = [];
    let education: any[] = [];
    let certifications: any[] = [];
    let projects: any[] = [];
    let links: any[] = [];

    try { experience = JSON.parse(user.profile.experience || "[]"); } catch {}
    try { education = JSON.parse(user.profile.education || "[]"); } catch {}
    try { certifications = JSON.parse(user.profile.certifications || "[]"); } catch {}
    try { projects = JSON.parse(user.profile.projects || "[]"); } catch {}
    try { links = JSON.parse(user.profile.links || "[]"); } catch {}

    // 4. Skills parsing
    const rawSkills = user.profile.skills || "";
    const skillsList = rawSkills
      ? rawSkills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // 5. Contact info sanitization according to candidate preferences
    const publicEmail =
      visibility.contactVisibility === "DIRECT"
        ? user.email
        : maskEmail(user.email);

    const publicPhone =
      visibility.contactVisibility === "DIRECT" ? user.phone || null : null;

    const employmentStatus =
      preferences.employmentStatus ||
      (preferences.openToWorkStatus === "ACTIVELY_LOOKING"
        ? "Available for Work"
        : preferences.openToWorkStatus === "NOT_LOOKING"
        ? "Not Looking"
        : "Open to Opportunities");

    const resumeTemplate = preferences.resumeTemplate || "modern";

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        headline: user.headline || "Technical Professional",
        bio: user.bio || "",
        location: user.location || "Location not specified",
        avatar: user.avatar || null,
        email: publicEmail,
        phone: publicPhone,
        employmentStatus,
        resumeTemplate,
        skills: rawSkills,
        skillsList,
        experience,
        education,
        certifications,
        projects,
        links,
        updatedAt: user.profile.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[Public Candidate Resume API Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load candidate resume." },
      { status: 500 }
    );
  }
}
