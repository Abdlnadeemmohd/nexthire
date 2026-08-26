import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { listCompanyHiringPlans, createHiringPlan } from "@/lib/executive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Forbidden: Executive access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedCompanyId = searchParams.get("companyId");
  const companyId = authUser.role === "PLATFORM_ADMIN" ? (requestedCompanyId || authUser.companyId) : authUser.companyId;

  if (!companyId) {
    return NextResponse.json({ success: false, error: "Company context missing" }, { status: 400 });
  }

  if (requestedCompanyId && requestedCompanyId !== authUser.companyId && authUser.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden: Cross-tenant executive access blocked" }, { status: 403 });
  }

  try {
    const plans = await listCompanyHiringPlans(companyId);
    return NextResponse.json({ success: true, count: plans.length, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to list hiring plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Forbidden: Executive access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const companyId = authUser.role === "PLATFORM_ADMIN" ? (body.companyId || authUser.companyId) : authUser.companyId;

    if (!companyId) {
      return NextResponse.json({ success: false, error: "Company context missing" }, { status: 400 });
    }

    const plan = await createHiringPlan({
      companyId,
      createdById: authUser.id,
      title: body.title,
      department: body.department,
      targetHires: body.targetHires,
      startDate: body.startDate || new Date(),
      targetDate: body.targetDate,
      budget: body.budget,
      priority: body.priority,
      roles: body.roles,
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create hiring plan" }, { status: 500 });
  }
}
