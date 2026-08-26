import { prisma } from "@/lib/prisma";
import { HiringPlanProgress, HiringPlanStatus, DataLimitation } from "./types";

export interface CreateHiringPlanInput {
  companyId: string;
  createdById: string;
  title: string;
  department: string;
  targetHires: number;
  startDate: Date | string;
  targetDate: Date | string;
  budget?: number;
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  roles?: Array<{
    roleTitle: string;
    targetHires: number;
    assignedRecruiterId?: string;
    targetDate?: Date | string;
    jobId?: string;
  }>;
}

export async function createHiringPlan(input: CreateHiringPlanInput): Promise<HiringPlanProgress> {
  const startDate = new Date(input.startDate);
  const targetDate = new Date(input.targetDate);

  const plan = await prisma.hiringPlan.create({
    data: {
      companyId: input.companyId,
      createdById: input.createdById,
      title: input.title,
      department: input.department,
      targetHires: Math.max(1, input.targetHires),
      filledHires: 0,
      startDate,
      targetDate,
      budget: input.budget || null,
      priority: input.priority || "MEDIUM",
      status: "TARGET",
      roles: {
        create: (input.roles || []).map((r) => ({
          roleTitle: r.roleTitle,
          targetHires: Math.max(1, r.targetHires),
          filledHires: 0,
          assignedRecruiterId: r.assignedRecruiterId || null,
          targetDate: r.targetDate ? new Date(r.targetDate) : targetDate,
          jobId: r.jobId || null,
          status: "TARGET",
        })),
      },
    },
    include: {
      roles: {
        include: {
          assignedRecruiter: true,
        },
      },
    },
  });

  return formatHiringPlanProgress(plan);
}

export async function getHiringPlanProgress(planId: string, companyId: string): Promise<HiringPlanProgress | null> {
  const plan = await prisma.hiringPlan.findFirst({
    where: { id: planId, companyId },
    include: {
      roles: {
        include: {
          assignedRecruiter: true,
        },
      },
    },
  });

  if (!plan) return null;
  return formatHiringPlanProgress(plan);
}

export async function listCompanyHiringPlans(companyId: string): Promise<HiringPlanProgress[]> {
  const plans = await prisma.hiringPlan.findMany({
    where: { companyId },
    include: {
      roles: {
        include: {
          assignedRecruiter: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return plans.map(formatHiringPlanProgress);
}

export function formatHiringPlanProgress(plan: any): HiringPlanProgress {
  const progressPercentage = plan.targetHires > 0
    ? Math.min(100, Math.round((plan.filledHires / plan.targetHires) * 100))
    : 0;

  // Determine status deterministically based on date and progress
  let status: HiringPlanStatus = plan.status;
  const now = new Date();
  const targetDate = new Date(plan.targetDate);

  if (plan.filledHires >= plan.targetHires) {
    status = "COMPLETED";
  } else if (now > targetDate) {
    status = "BEHIND";
  } else {
    const totalDays = (targetDate.getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24);
    const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

    if (progressPercentage >= expectedProgress) {
      status = plan.filledHires > 0 ? "IN_PROGRESS" : "TARGET";
    } else if (expectedProgress - progressPercentage > 30) {
      status = "AT_RISK";
    } else {
      status = "IN_PROGRESS";
    }
  }

  const isSufficientData = plan.roles.length > 0 || plan.targetHires > 0;

  const limitations: DataLimitation = {
    isSufficientData,
    sampleSize: plan.roles.length,
    confidence: plan.roles.length >= 2 ? "HIGH" : "MEDIUM",
    assumptions: [
      "Hiring plan completion is based strictly on verified filled position counts.",
      "Status determination evaluates target dates against elapsed time without statistical extrapolation.",
    ],
  };

  return {
    planId: plan.id,
    companyId: plan.companyId,
    title: plan.title,
    department: plan.department,
    targetHires: plan.targetHires,
    completedHires: plan.filledHires,
    progressPercentage,
    startDate: new Date(plan.startDate).toISOString(),
    targetDate: new Date(plan.targetDate).toISOString(),
    budget: plan.budget ? Number(plan.budget) : null,
    priority: plan.priority,
    status,
    rolesCount: plan.roles.length,
    rolesSummary: plan.roles.map((r: any) => ({
      roleId: r.id,
      roleTitle: r.roleTitle,
      targetHires: r.targetHires,
      filledHires: r.filledHires,
      status: r.status,
      jobId: r.jobId,
      recruiterName: r.assignedRecruiter?.name || null,
    })),
    isSufficientData,
    limitations,
  };
}
