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

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, isDiscoverable: true, phone: true, email: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      isDiscoverable: user?.isDiscoverable ?? true,
      phone: user?.phone || null,
      email: user?.email,
    },
  });
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
    const updateData: any = {};

    if (typeof body.isDiscoverable === "boolean") {
      updateData.isDiscoverable = body.isDiscoverable;
    }

    if (typeof body.avatar === "string") {
      updateData.avatar = body.avatar.trim();
    }

    if (typeof body.headline === "string") {
      updateData.headline = body.headline.trim();
    }

    if (typeof body.bio === "string") {
      updateData.bio = body.bio.trim();
    }

    if (typeof body.location === "string") {
      updateData.location = body.location.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: { id: true, isDiscoverable: true, phone: true, email: true, avatar: true, headline: true, bio: true, location: true },
    });

    return NextResponse.json({
      success: true,
      message: "Candidate privacy preferences updated successfully.",
      data: updatedUser,
    });
  } catch (err: any) {
    console.error("[Candidate Privacy Update Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update privacy preferences" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}
