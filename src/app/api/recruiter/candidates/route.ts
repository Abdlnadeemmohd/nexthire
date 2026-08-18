import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

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
