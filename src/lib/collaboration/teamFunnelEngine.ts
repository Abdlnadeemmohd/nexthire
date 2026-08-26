/**
 * NextHire Phase 13 — Team Funnel Intelligence Engine
 * Computes aggregated team-level hiring funnel conversion metrics.
 */

import { prisma } from "@/lib/prisma";
import { TeamFunnelMetrics, TeamFunnelStageConversion } from "./types";

/**
 * Calculates team-wide hiring funnel metrics filtered by recruiter, job, or team.
 */
export async function getTeamFunnelMetrics(
  companyId: string,
  filters?: { recruiterId?: string; jobId?: string; teamId?: string }
): Promise<TeamFunnelMetrics> {
  const whereJob: any = { companyId };
  if (filters?.jobId) whereJob.id = filters.jobId;
  if (filters?.recruiterId) whereJob.recruiterId = filters.recruiterId;

  const jobs = await prisma.job.findMany({
    where: whereJob,
    include: {
      applications: {
        include: {
          interviews: true,
          offer: true,
          rejection: true,
          assessmentInvitations: true,
        },
      },
    },
  });

  let totalApplications = 0;
  let countSubmitted = 0;
  let countReviewing = 0;
  let countShortlisted = 0;
  let countAssessment = 0;
  let countInterview = 0;
  let countOffer = 0;
  let countHired = 0;

  for (const job of jobs) {
    for (const app of job.applications) {
      totalApplications++;
      switch (app.status) {
        case "SUBMITTED":
          countSubmitted++;
          break;
        case "UNDER_REVIEW":
          countReviewing++;
          break;
        case "INTERVIEW_SCHEDULED":
        case "INTERVIEW_ROUND_1":
        case "INTERVIEW_ROUND_2":
        case "INTERVIEW_ROUND_3":
          countInterview++;
          break;
        case "FINAL_DECISION":
          countShortlisted++;
          break;
        case "OFFER_EXTENDED":
          countOffer++;
          break;
        default:
          if (app.offer?.status === "ACCEPTED") countHired++;
          else if (app.offer) countOffer++;
          else if (app.interviews.length > 0) countInterview++;
          else if (app.assessmentInvitations.length > 0) countAssessment++;
          else countReviewing++;
      }
    }
  }

  const entrantsApp = totalApplications;
  const entrantsRev = entrantsApp - countSubmitted;
  const entrantsShort = entrantsRev - countReviewing;
  const entrantsAssess = countAssessment + countInterview + countOffer + countHired;
  const entrantsInt = countInterview + countOffer + countHired;
  const entrantsOff = countOffer + countHired;
  const entrantsHire = countHired;

  const stages: TeamFunnelStageConversion[] = [
    {
      stage: "APPLICATION",
      entrants: entrantsApp,
      exits: countSubmitted,
      conversionRate: entrantsApp > 0 ? Math.round((entrantsRev / entrantsApp) * 100) : null,
      dropOffRate: entrantsApp > 0 ? Math.round((countSubmitted / entrantsApp) * 100) : null,
    },
    {
      stage: "REVIEWING",
      entrants: entrantsRev,
      exits: countReviewing,
      conversionRate: entrantsRev > 0 ? Math.round((entrantsShort / entrantsRev) * 100) : null,
      dropOffRate: entrantsRev > 0 ? Math.round((countReviewing / entrantsRev) * 100) : null,
    },
    {
      stage: "SHORTLISTED",
      entrants: entrantsShort,
      exits: countShortlisted,
      conversionRate: entrantsShort > 0 ? Math.round((entrantsInt / entrantsShort) * 100) : null,
      dropOffRate: entrantsShort > 0 ? Math.round((countShortlisted / entrantsShort) * 100) : null,
    },
    {
      stage: "INTERVIEW",
      entrants: entrantsInt,
      exits: countInterview,
      conversionRate: entrantsInt > 0 ? Math.round((entrantsOff / entrantsInt) * 100) : null,
      dropOffRate: entrantsInt > 0 ? Math.round((countInterview / entrantsInt) * 100) : null,
    },
    {
      stage: "OFFER",
      entrants: entrantsOff,
      exits: countOffer,
      conversionRate: entrantsOff > 0 ? Math.round((entrantsHire / entrantsOff) * 100) : null,
      dropOffRate: entrantsOff > 0 ? Math.round((countOffer / entrantsOff) * 100) : null,
    },
    {
      stage: "HIRED",
      entrants: entrantsHire,
      exits: 0,
      conversionRate: 100,
      dropOffRate: 0,
    },
  ];

  const overallConversionRate = totalApplications > 0
    ? Math.round((countHired / totalApplications) * 100)
    : null;

  const offerAcceptanceRate = countOffer + countHired > 0
    ? Math.round((countHired / (countOffer + countHired)) * 100)
    : null;

  const isSufficientData = totalApplications >= 5;

  return {
    companyId,
    totalApplications,
    stages,
    overallConversionRate,
    offerAcceptanceRate,
    sampleSize: totalApplications,
    isSufficientData,
  };
}
