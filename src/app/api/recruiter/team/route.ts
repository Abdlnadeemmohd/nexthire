import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  getTeamMembers,
  getTeamWorkloadOverview,
  getHandoffs,
  detectDuplicateWork,
  getTeamActivityStream,
  getCandidateAssignmentHistory,
} from "@/lib/collaboration";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (
    !authUser ||
    (authUser.role !== "RECRUITER_MANAGER" &&
      authUser.role !== "COMPANY_ADMIN" &&
      authUser.role !== "PLATFORM_ADMIN" &&
      !authUser.isTester)
  ) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Management permissions required to access team workspace" },
      { status: 403 }
    );
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated with this recruiter" }, { status: 400 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    const teams = await prisma.recruiterTeam.findMany({
      where: { companyId },
      include: { memberships: true },
    });

    const [members, workload, handoffs, duplicateAlerts, activity] = await Promise.all([
      getTeamMembers(companyId),
      getTeamWorkloadOverview(companyId),
      getHandoffs(companyId, { status: "PENDING" }),
      detectDuplicateWork(companyId),
      getTeamActivityStream(companyId, 15),
    ]);

    // Unassigned candidates
    const activeAssignments = await prisma.candidateAssignment.findMany({
      where: { companyId, status: "ACTIVE" },
      select: { candidateId: true },
    });
    const assignedIds = new Set(activeAssignments.map((a) => a.candidateId));

    const unassignedApps = await prisma.application.findMany({
      where: {
        job: { companyId },
        applicantId: { notIn: Array.from(assignedIds) },
        status: { notIn: ["REJECTED", "APPLICATION_CLOSED"] },
      },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
      },
      take: 10,
    });

    const unassignedCandidates = unassignedApps.map((a) => ({
      id: `unassigned-${a.applicant.id}`,
      companyId,
      candidateId: a.applicant.id,
      candidateName: a.applicant.name,
      candidateEmail: a.applicant.email,
      applicationId: a.id,
      jobId: a.job.id,
      jobTitle: a.job.title,
      recruiterId: "",
      recruiterName: "Unassigned",
      teamId: null,
      teamName: null,
      assignedById: "",
      assignedByName: "",
      reason: "No active recruiter assigned",
      status: "UNASSIGNED" as any,
      assignedAt: a.appliedAt.toISOString(),
      unassignedAt: null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        companyId,
        companyName: company?.name || "Company",
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          memberCount: t.memberships.length,
        })),
        members,
        workload,
        unassignedCandidates,
        activeHandoffs: handoffs,
        duplicateWorkAlerts: duplicateAlerts,
        recentActivity: activity,
      },
    });
  } catch (error: any) {
    console.error("Error loading team overview:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load team overview" }, { status: 500 });
  }
}
