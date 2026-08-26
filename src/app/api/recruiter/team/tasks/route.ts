import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getHiringTasks, createHiringTask } from "@/lib/collaboration";

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
  const assigneeId = searchParams.get("assigneeId") || undefined;
  const status = (searchParams.get("status") as any) || undefined;
  const candidateId = searchParams.get("candidateId") || undefined;
  const jobId = searchParams.get("jobId") || undefined;

  try {
    const tasks = await getHiringTasks(companyId, { assigneeId, status, candidateId, jobId });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("Error fetching hiring tasks:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch tasks" }, { status: 500 });
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
    const { title, description, priority, assigneeId, candidateId, applicationId, jobId, dueAt } = body;

    if (!title || !assigneeId) {
      return NextResponse.json({ success: false, error: "Title and assigneeId are required" }, { status: 400 });
    }

    const task = await createHiringTask({
      companyId,
      title,
      description,
      priority,
      assigneeId,
      creatorId: authUser.id,
      candidateId,
      applicationId,
      jobId,
      dueAt: dueAt ? new Date(dueAt) : null,
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error("Error creating hiring task:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create task" }, { status: 500 });
  }
}
