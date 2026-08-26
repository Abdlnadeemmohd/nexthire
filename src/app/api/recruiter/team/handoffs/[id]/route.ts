import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { acceptHandoff, rejectHandoff } from "@/lib/collaboration";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  const handoffId = params.id;

  try {
    const body = await req.json();
    const { action, reason } = body; // action: "ACCEPT" | "REJECT"

    if (action === "ACCEPT") {
      const accepted = await acceptHandoff(handoffId, authUser.id, companyId);
      return NextResponse.json({ success: true, data: accepted });
    } else if (action === "REJECT") {
      await rejectHandoff(handoffId, authUser.id, companyId, reason);
      return NextResponse.json({ success: true, message: "Handoff rejected" });
    } else {
      return NextResponse.json({ success: false, error: "Invalid action. Use ACCEPT or REJECT" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error updating handoff:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update handoff" }, { status: 500 });
  }
}
