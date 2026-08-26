import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { updateHiringTask } from "@/lib/collaboration";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  const taskId = params.id;

  try {
    const body = await req.json();
    const { title, description, priority, status, assigneeId, dueAt } = body;

    const task = await updateHiringTask({
      taskId,
      companyId,
      updaterId: authUser.id,
      title,
      description,
      priority,
      status,
      assigneeId,
      dueAt: dueAt ? new Date(dueAt) : undefined,
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error("Error updating hiring task:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const companyId = authUser.companyId;
  if (!companyId) {
    return NextResponse.json({ success: false, error: "No company associated" }, { status: 400 });
  }

  const taskId = params.id;

  try {
    const task = await prisma.hiringTask.findFirst({
      where: { id: taskId, companyId },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    await prisma.hiringTask.delete({ where: { id: taskId } });

    await prisma.auditEvent.create({
      data: {
        actorId: authUser.id,
        action: "HIRING_TASK_DELETED",
        resourceType: "HIRING_TASK",
        resourceId: taskId,
        metadata: JSON.stringify({ title: task.title }),
      },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting hiring task:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete task" }, { status: 500 });
  }
}
