import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Sign in required" },
      { status: 401 }
    );
  }

  try {
    const preference = await prisma.candidateCommunicationPreference.findUnique({
      where: { userId: authUser.id },
    });

    return NextResponse.json({
      success: true,
      data: preference || {
        optedOutOutreach: false,
        allowEmailOutreach: true,
        allowInAppOutreach: true,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/candidate/outreach/preferences Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve communication preferences" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Sign in required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { optedOutOutreach, allowEmailOutreach, allowInAppOutreach } = body;

    const updated = await prisma.candidateCommunicationPreference.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        optedOutOutreach: typeof optedOutOutreach === "boolean" ? optedOutOutreach : false,
        allowEmailOutreach: typeof allowEmailOutreach === "boolean" ? allowEmailOutreach : true,
        allowInAppOutreach: typeof allowInAppOutreach === "boolean" ? allowInAppOutreach : true,
      },
      update: {
        optedOutOutreach: typeof optedOutOutreach === "boolean" ? optedOutOutreach : undefined,
        allowEmailOutreach: typeof allowEmailOutreach === "boolean" ? allowEmailOutreach : undefined,
        allowInAppOutreach: typeof allowInAppOutreach === "boolean" ? allowInAppOutreach : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    console.error("[PATCH /api/candidate/outreach/preferences Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update communication preferences" },
      { status: 500 }
    );
  }
}
