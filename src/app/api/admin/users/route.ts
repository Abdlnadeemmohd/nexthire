import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Platform Admin access required" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  try {
    const users = await prisma.user.findMany({
      where: role && role !== "ALL" ? { role: role as any } : {},
      include: {
        company: true,
        profile: true,
        _count: {
          select: {
            applications: true,
            jobs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: "ACTIVE",
      avatar: u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      headline: u.headline || "",
      companyName: u.company?.name || "",
      joinedDate: u.createdAt.toISOString().split("T")[0],
      applicationsCount: u._count.applications,
      jobsCount: u._count.jobs,
    }));

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: any) {
    console.error("[GET /api/admin/users Database Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve user directory from database" },
      { status: 500 }
    );
  }
}
