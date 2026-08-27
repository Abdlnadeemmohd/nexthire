import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getTeamMembers } from "@/lib/collaboration";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (
    !authUser ||
    (authUser.role !== "RECRUITER_MANAGER" &&
      authUser.role !== "COMPANY_ADMIN" &&
      authUser.role !== "PLATFORM_ADMIN" &&
      !authUser.isTester)
  ) {
    return NextResponse.json({ success: false, error: "Forbidden: Management permissions required" }, { status: 403 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  try {
    const members = await getTeamMembers(companyId);
    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch team members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (
    !authUser ||
    (authUser.role !== "RECRUITER_MANAGER" &&
      authUser.role !== "COMPANY_ADMIN" &&
      authUser.role !== "PLATFORM_ADMIN" &&
      !authUser.isTester)
  ) {
    return NextResponse.json({ success: false, error: "Forbidden: Management permissions required" }, { status: 403 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { userId, teamId, role = "TEAM_MEMBER" } = body;

    if (!userId || !teamId) {
      return NextResponse.json({ success: false, error: "userId and teamId are required" }, { status: 400 });
    }

    // Verify user and team belong to company
    const [user, team] = await Promise.all([
      prisma.user.findFirst({ where: { id: userId, companyId } }),
      prisma.recruiterTeam.findFirst({ where: { id: teamId, companyId } }),
    ]);

    if (!user || !team) {
      return NextResponse.json({ success: false, error: "User or Team not found in company" }, { status: 404 });
    }

    const membership = await prisma.teamMembership.upsert({
      where: {
        teamId_userId: { teamId, userId },
      },
      update: { role, companyId },
      create: { teamId, userId, companyId, role },
    });

    return NextResponse.json({ success: true, data: membership });
  } catch (error: any) {
    console.error("Error creating team membership:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create membership" }, { status: 500 });
  }
}
