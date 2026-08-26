import { prisma } from "@/lib/prisma";
import { CapacityForecast, DataLimitation } from "./types";

export async function forecastRecruiterCapacity(companyId: string): Promise<CapacityForecast> {
  const teamMembers = await prisma.teamMembership.findMany({
    where: { team: { companyId } },
    include: { user: true },
  });

  const activeApplications = await prisma.application.count({
    where: {
      job: { companyId },
      status: { notIn: ["REJECTED", "APPLICATION_CLOSED"] },
    },
  });

  const totalRecruiters = teamMembers.length;
  if (totalRecruiters === 0) {
    return {
      totalRecruiters: 0,
      overloadedRecruitersCount: 0,
      optimalRecruitersCount: 0,
      underloadedRecruitersCount: 0,
      averageCapacityLoadPercentage: 0,
      projectedStaffingBottleneck: activeApplications > 0,
      recommendedHiresRequired: activeApplications > 0 ? Math.ceil(activeApplications / 25) : 0,
      limitations: {
        isSufficientData: false,
        sampleSize: 0,
        confidence: "LOW",
        reason: "No active recruiter team memberships found for company.",
        assumptions: ["Optimal capacity per recruiter is defined as 25 active candidates."],
      },
    };
  }

  // Calculate load distribution
  const candidatesPerRecruiter = activeApplications / totalRecruiters;
  const averageCapacityLoadPercentage = Math.round((candidatesPerRecruiter / 25) * 100);

  let overloadedRecruitersCount = 0;
  let optimalRecruitersCount = 0;
  let underloadedRecruitersCount = 0;

  if (averageCapacityLoadPercentage > 110) {
    overloadedRecruitersCount = totalRecruiters;
  } else if (averageCapacityLoadPercentage >= 50) {
    optimalRecruitersCount = totalRecruiters;
  } else {
    underloadedRecruitersCount = totalRecruiters;
  }

  const projectedStaffingBottleneck = averageCapacityLoadPercentage > 90;
  const recommendedHiresRequired = projectedStaffingBottleneck
    ? Math.ceil((activeApplications - totalRecruiters * 25) / 25)
    : 0;

  return {
    totalRecruiters,
    overloadedRecruitersCount,
    optimalRecruitersCount,
    underloadedRecruitersCount,
    averageCapacityLoadPercentage,
    projectedStaffingBottleneck,
    recommendedHiresRequired: Math.max(0, recommendedHiresRequired),
    limitations: {
      isSufficientData: true,
      sampleSize: totalRecruiters,
      confidence: totalRecruiters >= 3 ? "HIGH" : "MEDIUM",
      assumptions: [
        "Optimal candidate capacity load per recruiter is 25 active pipeline candidates.",
        "Overload threshold is defined at >90% composite capacity load.",
      ],
    },
  };
}
