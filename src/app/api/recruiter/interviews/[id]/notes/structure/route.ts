import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { structureInterviewerNotes } from "@/lib/interview/noteAssistant";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized: Recruiter access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rawNotes } = body;

    if (!rawNotes || typeof rawNotes !== "string") {
      return NextResponse.json({ success: false, error: "Missing rawNotes text" }, { status: 400 });
    }

    const structured = structureInterviewerNotes(rawNotes);
    return NextResponse.json({ success: true, data: structured });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to structure notes" }, { status: 500 });
  }
}
