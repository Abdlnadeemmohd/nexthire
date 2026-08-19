import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertUserVerified, VerificationRequiredError } from "@/lib/auth/verification";
import { getRecruiterEntitlements } from "@/lib/billing/entitlements";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter access required" },
      { status: 403 }
    );
  }

  if (authUser.role === "RECRUITER") {
    try {
      await assertUserVerified(authUser, "viewing recruiter billing and entitlements");
    } catch (err: any) {
      if (err instanceof VerificationRequiredError || err.name === "VerificationRequiredError") {
        return NextResponse.json(
          { success: false, error: err.message, status: err.status },
          { status: 403 }
        );
      }
      throw err;
    }
  }

  try {
    const entitlements = await getRecruiterEntitlements(authUser.id);
    return NextResponse.json({
      success: true,
      data: entitlements,
    });
  } catch (err: any) {
    console.error("[Entitlements GET Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch entitlements" },
      { status: 500 }
    );
  }
}
