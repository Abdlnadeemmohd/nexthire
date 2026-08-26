import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getNotesForCandidate, createCollaborationNote } from "@/lib/collaboration";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidateId");

  if (!candidateId) {
    return NextResponse.json({ success: false, error: "candidateId is required" }, { status: 400 });
  }

  try {
    const notes = await getNotesForCandidate(candidateId, companyId);
    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { candidateId, applicationId, jobId, noteType, content } = body;

    if (!candidateId || !content) {
      return NextResponse.json({ success: false, error: "candidateId and content are required" }, { status: 400 });
    }

    const note = await createCollaborationNote({
      companyId,
      authorId: authUser.id,
      candidateId,
      applicationId,
      jobId,
      noteType,
      content,
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    console.error("Error creating collaboration note:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create note" }, { status: 500 });
  }
}
