import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter or Admin access required" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  // Enforce strict explicit recruiter verification check (PENDING, REJECTED, and SUSPENDED are blocked)
  if (authUser.role === "RECRUITER") {
    try {
      await assertUserVerified(authUser, "searching candidates and viewing talent profiles");
    } catch (err: any) {
      if (err instanceof VerificationRequiredError || err.name === "VerificationRequiredError") {
        return NextResponse.json(
          { success: false, error: err.message, status: err.status },
          { status: 403 }
        );
      }
      throw err;
    }
  }

  try {
    const candidates = await prisma.user.findMany({
      where: {
        role: "JOB_SEEKER",
        OR: q
          ? [
              { name: { contains: q, mode: "insensitive" } },
              { headline: { contains: q, mode: "insensitive" } },
              { bio: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
              { profile: { skills: { contains: q, mode: "insensitive" } } },
            ]
          : undefined,
      },
      include: {
        profile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = candidates.map((cand) => {
      let skillsArray: string[] = [];
      if (cand.profile?.skills) {
        skillsArray = cand.profile.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      return {
        id: cand.id,
        name: cand.name,
        headline: cand.headline || null,
        location: cand.location || null,
        skills: skillsArray,
        employmentStatus: "OPEN_TO_OPPORTUNITIES",
        bio: cand.bio || null,
        avatar: cand.avatar || null,
        resumeScore: cand.profile?.resumeScore || null,
        resumeUrl: cand.profile?.resumeUrl || null,
        joinedDate: cand.createdAt.toISOString().split("T")[0],
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err: any) {
    console.error("[GET /api/recruiter/candidates Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to search candidates" },
      { status: 500 }
    );
  }
}
