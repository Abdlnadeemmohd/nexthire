import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { INITIAL_APPLICATIONS } from "@/lib/mockData";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (authUser.role === "JOB_SEEKER") {
      const dbApps = await prisma.application.findMany({
        where: { applicantId: authUser.id },
        include: {
          job: { include: { company: true } },
          events: { orderBy: { timestamp: "desc" } },
          rejection: true,
          interviews: true,
        },
        orderBy: { appliedAt: "desc" },
      });

      if (dbApps && dbApps.length > 0) {
        const formatted = dbApps.map((a) => {
          const daysDiff = Math.floor((Date.now() - new Date(a.appliedAt).getTime()) / (1000 * 60 * 60 * 24));
          const slaStatus = daysDiff > 7 ? "SLA_BREACHED" : daysDiff > 5 ? "NEAR_SLA" : "HEALTHY";
          return {
            id: a.id,
            jobId: a.jobId,
            jobTitle: a.job.title,
            companyName: a.job.company.name,
            companyLogo: a.job.company.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
            candidateName: authUser.name,
            candidateAvatar: authUser.avatar,
            candidateTitle: authUser.headline || "Candidate Specialist",
            matchScore: a.matchScore,
            status: a.status,
            appliedAt: a.appliedAt.toISOString().split("T")[0],
            daysAwaitingUpdate: daysDiff,
            slaStatus,
            updatedAt: a.updatedAt.toISOString().split("T")[0],
            resumeUrl: a.resumeUrl || "/resumes/Alex_Rivers_Resume_2026.pdf",
            location: a.job.location,
            skills: a.job.skills ? a.job.skills.split(",").map((s) => s.trim()) : [],
            events: a.events,
            rejection: a.rejection,
            interviews: a.interviews,
          };
        });
        return NextResponse.json({ success: true, count: formatted.length, data: formatted });
      }
    }
  } catch (err) {
    console.warn("Prisma application fetch failed, using initial application fixture:", err);
  }

  return NextResponse.json({ success: true, count: INITIAL_APPLICATIONS.length, data: INITIAL_APPLICATIONS });
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "JOB_SEEKER") {
    return NextResponse.json({ success: false, error: "Unauthorized: Candidates only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { jobId, coverLetter, resumeUrl } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 });
    }

    try {
      const slaDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day SLA deadline
      const app = await prisma.application.create({
        data: {
          jobId,
          applicantId: authUser.id,
          status: "SUBMITTED",
          matchScore: 92,
          resumeUrl: resumeUrl || authUser.resumeUrl || "/resumes/Alex_Rivers_Resume_2026.pdf",
          coverLetter,
          slaDeadline,
          events: {
            create: {
              type: "STATUS_CHANGED",
              actorId: authUser.id,
              notes: "Application submitted by candidate via NextHire Web Portal",
            },
          },
        },
        include: { job: { include: { company: true } } },
      });

      return NextResponse.json({ success: true, data: app }, { status: 201 });
    } catch {
      // Memory fallback
      const newAppMemory = {
        id: `app-${Date.now()}`,
        jobId,
        jobTitle: body.jobTitle || "Senior Application Engineer",
        companyName: body.companyName || "Stellar Systems",
        companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
        candidateName: authUser.name,
        candidateAvatar: authUser.avatar,
        candidateTitle: authUser.headline || "Senior Developer",
        matchScore: 94,
        status: "APPLIED" as const,
        appliedAt: new Date().toISOString().split("T")[0],
        daysAwaitingUpdate: 0,
        slaStatus: "HEALTHY" as const,
        updatedAt: new Date().toISOString().split("T")[0],
        resumeUrl: resumeUrl || "/resumes/Alex_Rivers_Resume_2026.pdf",
        location: "San Francisco, CA",
        skills: ["TypeScript", "Next.js"],
      };

      INITIAL_APPLICATIONS.unshift(newAppMemory as any);
      return NextResponse.json({ success: true, data: newAppMemory }, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to submit application" }, { status: 500 });
  }
}
