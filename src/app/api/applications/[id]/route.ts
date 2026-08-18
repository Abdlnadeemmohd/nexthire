import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active session required." },
      { status: 401 }
    );
  }

  const { id } = params;

  try {
    const app = await prisma.application.findUnique({
      where: { id },
      include: {
        job: { include: { company: true } },
        applicant: { include: { profile: true } },
        rejection: true,
        events: { orderBy: { timestamp: "desc" } },
        interviews: true,
        offer: true,
      },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Authorization: Must be the applicant, the job's recruiter/company, or platform admin
    const isApplicant = app.applicantId === authUser.id;
    const isRecruiter =
      authUser.role === "RECRUITER" &&
      !!authUser.companyId &&
      app.job.companyId === authUser.companyId;
    const isAdmin = authUser.role === "PLATFORM_ADMIN";

    if (!isApplicant && !isRecruiter && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to view this application." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.job.title,
        companyName: app.job.company.name,
        companyLogo:
          app.job.company.logo ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
        candidateName: app.applicant.name,
        candidateEmail: app.applicant.email,
        candidateAvatar: app.applicant.avatar,
        status: app.status,
        matchScore: app.matchScore,
        appliedAt: app.appliedAt.toISOString().split("T")[0],
        updatedAt: app.updatedAt.toISOString().split("T")[0],
        resumeUrl: app.resumeUrl || app.applicant?.profile?.resumeUrl || null,
        location: app.job.location,
        rejection: app.rejection,
        events: app.events,
        interviews: app.interviews,
        offer: app.offer,
      },
    });
  } catch (err: any) {
    console.error("[Application GET by ID Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve application details." },
      { status: 500 }
    );
  }
}
