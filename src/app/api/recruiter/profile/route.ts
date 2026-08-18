import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        headline: user.headline || null,
        title: user.headline || null,
        company: user.company?.name || null,
        companyId: user.companyId || null,
        avatar: user.avatar || null,
        bio: user.bio || null,
        location: user.location || null,
        websiteUrl: user.company?.website || null,
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
    const { name, headline, bio, location, avatar } = body;

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name: name !== undefined && name.trim() ? name.trim() : undefined,
        headline: headline !== undefined ? headline.trim() || null : undefined,
        bio: bio !== undefined ? bio.trim() || null : undefined,
        location: location !== undefined ? location.trim() || null : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recruiter profile updated successfully in Neon PostgreSQL",
      data: updatedUser,
    });
  } catch (err: any) {
    console.error("[PUT /api/recruiter/profile Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update recruiter profile" },
      { status: 500 }
    );
  }
}
