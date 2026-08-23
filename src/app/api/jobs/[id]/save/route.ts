import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { emitEvent } from "@/lib/events/eventEngine";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "JOB_SEEKER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Only candidates can bookmark/save positions" },
      { status: 403 }
    );
  }

  const { id: jobId } = params;

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job position not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: authUser.id,
          jobId,
        },
      },
    });

    if (existing) {
      await prisma.savedJob.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        success: true,
        saved: false,
        message: "Job removed from saved list.",
      });
    }

    const created = await prisma.savedJob.create({
      data: {
        userId: authUser.id,
        jobId,
      },
    });

    // Check if position matches candidate profile for recommended opportunity event
    const candidateProfile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });

    const userSkills = candidateProfile?.skills?.split(",").map((s) => s.trim().toLowerCase()) || [];
    const jobSkills = job.skills?.split(",").map((s) => s.trim().toLowerCase()) || [];
    const matchCount = jobSkills.filter((s) => userSkills.includes(s)).length;
    const matchPercentage = jobSkills.length > 0 ? Math.round((matchCount / jobSkills.length) * 100) : 75;

    if (matchPercentage >= 70) {
      await emitEvent({
        type: "SEEKER_RECOMMENDED_OPPORTUNITY",
        recipientId: authUser.id,
        recipientEmail: authUser.email,
        entityType: "Job",
        entityId: jobId,
        title: `Recommended Opportunity: ${job.title}`,
        body: `Based on your skillset, "${job.title}" at ${job.company.name} is a strong match.`,
        ctaText: "Apply Now",
        ctaUrl: `/jobs/${jobId}`,
        metadata: {
          jobTitle: job.title,
          companyName: job.company.name,
          matchScore: matchPercentage,
        },
      });
    }

    return NextResponse.json({
      success: true,
      saved: true,
      message: "Job saved successfully.",
      data: created,
    });
  } catch (err: any) {
    console.error("[POST /api/jobs/[id]/save Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save job" },
      { status: 500 }
    );
  }
}
