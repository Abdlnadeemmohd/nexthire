import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "JOB_SEEKER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Candidate access required" },
      { status: 403 }
    );
  }

  try {
    const requests = await prisma.contactRequest.findMany({
      where: { candidateId: authUser.id },
      include: {
        recruiter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            company: { select: { name: true, logo: true, isVerified: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (err: any) {
    console.error("[Candidate Contact Requests GET Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch contact requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "JOB_SEEKER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Candidate access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { requestId, status } = body;

    if (!requestId || !["ACCEPTED_EMAIL", "ACCEPTED_PHONE", "ACCEPTED_ALL", "DECLINED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid requestId and response status are required." },
        { status: 400 }
      );
    }

    const updated = await prisma.contactRequest.update({
      where: { id: requestId, candidateId: authUser.id },
      data: {
        status,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Contact request ${status.toLowerCase()} successfully.`,
      data: updated,
    });
  } catch (err: any) {
    console.error("[Candidate Contact Requests POST Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update contact request" },
      { status: 500 }
    );
  }
}
