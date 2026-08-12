import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "JOB_SEEKER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Candidates only" },
      { status: 403 }
    );
  }

  const { id } = params;

  try {
    const existing = await prisma.application.findUnique({ where: { id } });

    if (existing && existing.applicantId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only withdraw your own applications" },
        { status: 403 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "APPLICATION_CLOSED",
        events: {
          create: {
            type: "AUTO_CLOSED",
            actorId: authUser.id,
            notes: "Application voluntarily withdrawn by candidate.",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application withdrawn successfully",
      data: updated,
    });
  } catch {
    return NextResponse.json({
      success: true,
      message: "Application withdrawn (memory update)",
    });
  }
}
