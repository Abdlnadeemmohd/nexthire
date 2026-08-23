import { prisma } from "@/lib/prisma";
import { PlanTier, MessagingLevel, ContactSharingLevel, TrialStatus, SubscriptionStatus } from "@prisma/client";
import { SUBSCRIPTION_PLANS, syncSubscriptionPlans } from "./plans";

export class EntitlementLimitError extends Error {
  public code: string;
  public statusCode: number;
  public metadata?: Record<string, any>;

  constructor(message: string, code = "ENTITLEMENT_LIMIT_EXCEEDED", metadata?: Record<string, any>) {
    super(message);
    this.name = "EntitlementLimitError";
    this.code = code;
    this.statusCode = 403;
    this.metadata = metadata;
  }
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export interface RecruiterEntitlements {
  isTrial: boolean;
  trialStatus: TrialStatus;
  trialSearchesUsed: number;
  trialSearchesLimit: number;
  trialJobPostingsUsed: number;
  trialJobPostingsLimit: number;
  planId: string;
  planName: string;
  planTier: PlanTier;
  candidateSearchLimit: number;
  candidateUnlockLimit: number;
  candidateUnlocksUsedToday: number;
  candidateUnlocksRemainingToday: number;
  resumeUnlockLimit: number;
  resumeUnlocksUsedToday: number;
  resumeUnlocksRemainingToday: number;
  messageLimit: number;
  messagesUsedToday: number;
  messagesRemainingToday: number;
  messagingLevel: MessagingLevel;
  contactSharingLevel: ContactSharingLevel;
  jobPostingLimit: number;
  canDownloadResume: boolean;
  canRequestContact: boolean;
  canSearchCandidates: boolean;
}

/**
 * Resolves current entitlements and trial state for a recruiter.
 * Automatically initializes a one-time RecruiterTrial record if none exists.
 */
export async function getRecruiterEntitlements(userId: string): Promise<RecruiterEntitlements> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      trials: true,
      subscriptions: {
        where: {
          status: "ACTIVE",
          endDate: { gte: new Date() },
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Ensure subscription plans exist
  const trialPlan = SUBSCRIPTION_PLANS.find((p) => p.id === "trial")!;

  // 1. Ensure RecruiterTrial record exists
  let trial = user.trials[0];
  if (!trial && user.role === "RECRUITER") {
    // Check if company has an existing trial
    if (user.companyId) {
      const companyTrial = await prisma.recruiterTrial.findFirst({
        where: { companyId: user.companyId },
      });
      if (companyTrial) {
        trial = companyTrial;
      }
    }

    if (!trial) {
      trial = await prisma.recruiterTrial.create({
        data: {
          recruiterId: user.id,
          companyId: user.companyId || "00000000-0000-0000-0000-000000000001",
          candidateSearchLimit: 5,
          candidateSearchesUsed: 0,
          jobPostingLimit: 1,
          jobPostingsUsed: 0,
          status: "ACTIVE",
        },
      });

      // Emit RECRUITER_TRIAL_STARTED event via EventEngine
      import("@/lib/events/eventEngine").then(({ emitEvent }) => {
        emitEvent({
          type: "RECRUITER_TRIAL_STARTED",
          recipientId: user.id,
          recipientEmail: user.email,
          companyId: user.companyId || undefined,
          title: "Recruiter Trial Activated",
          body: "Your complimentary trial is active with 5 candidate searches and 1 job posting.",
          ctaText: "Search Candidates",
          ctaUrl: "/recruiter/candidates",
          metadata: { searchesLimit: 5, jobPostingsLimit: 1 },
        }).catch(() => {});
      }).catch(() => {});
    }
  }

  // 2. Fetch today's usage
  const today = getTodayDateString();
  let dailyUsage = await prisma.dailyUsage.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!dailyUsage) {
    dailyUsage = await prisma.dailyUsage.create({
      data: {
        userId,
        date: today,
        candidateSearches: 0,
        candidateUnlocks: 0,
        resumeUnlocks: 0,
        messages: 0,
        contactRequests: 0,
      },
    });
  }

  // 3. Resolve active paid subscription (if any)
  const activeSub = user.subscriptions[0];

  if (activeSub && activeSub.plan) {
    const plan = activeSub.plan;
    const candidateUnlocksUsed = dailyUsage.candidateUnlocks;
    const resumeUnlocksUsed = dailyUsage.resumeUnlocks;
    const messagesUsed = dailyUsage.messages;

    return {
      isTrial: false,
      trialStatus: trial?.status || "COMPLETED",
      trialSearchesUsed: trial?.candidateSearchesUsed || 5,
      trialSearchesLimit: trial?.candidateSearchLimit || 5,
      trialJobPostingsUsed: trial?.jobPostingsUsed || 1,
      trialJobPostingsLimit: trial?.jobPostingLimit || 1,
      planId: plan.id,
      planName: plan.name,
      planTier: plan.tier,
      candidateSearchLimit: plan.candidateSearchLimit,
      candidateUnlockLimit: plan.candidateUnlockLimit,
      candidateUnlocksUsedToday: candidateUnlocksUsed,
      candidateUnlocksRemainingToday: Math.max(0, plan.candidateUnlockLimit - candidateUnlocksUsed),
      resumeUnlockLimit: plan.resumeUnlockLimit,
      resumeUnlocksUsedToday: resumeUnlocksUsed,
      resumeUnlocksRemainingToday: Math.max(0, plan.resumeUnlockLimit - resumeUnlocksUsed),
      messageLimit: plan.messageLimit,
      messagesUsedToday: messagesUsed,
      messagesRemainingToday: Math.max(0, plan.messageLimit - messagesUsed),
      messagingLevel: plan.messagingLevel,
      contactSharingLevel: plan.contactSharingLevel,
      jobPostingLimit: plan.jobPostingLimit,
      canDownloadResume: plan.resumeUnlockLimit > 0,
      canRequestContact: plan.contactSharingLevel === "CONTROLLED_REQUEST" || plan.contactSharingLevel === "DIRECT_PERMISSION",
      canSearchCandidates: true,
    };
  }

  // 4. Default to Trial Mode
  const trialSearchesUsed = trial?.candidateSearchesUsed || 0;
  const trialSearchesLimit = trial?.candidateSearchLimit || 5;
  const trialJobPostingsUsed = trial?.jobPostingsUsed || 0;
  const trialJobPostingsLimit = trial?.jobPostingLimit || 1;
  const isTrialExhausted = trialSearchesUsed >= trialSearchesLimit;
  const trialStatus: TrialStatus = isTrialExhausted ? "COMPLETED" : (trial?.status || "ACTIVE");

  return {
    isTrial: true,
    trialStatus,
    trialSearchesUsed,
    trialSearchesLimit,
    trialJobPostingsUsed,
    trialJobPostingsLimit,
    planId: "trial",
    planName: "Trial Mode",
    planTier: "TRIAL",
    candidateSearchLimit: 5,
    candidateUnlockLimit: 0,
    candidateUnlocksUsedToday: 0,
    candidateUnlocksRemainingToday: 0,
    resumeUnlockLimit: 0,
    resumeUnlocksUsedToday: 0,
    resumeUnlocksRemainingToday: 0,
    messageLimit: 10,
    messagesUsedToday: dailyUsage.messages,
    messagesRemainingToday: Math.max(0, 10 - dailyUsage.messages),
    messagingLevel: "LIMITED_MESSAGE",
    contactSharingLevel: "MASKED",
    jobPostingLimit: 1,
    canDownloadResume: false,
    canRequestContact: false,
    canSearchCandidates: !isTrialExhausted,
  };
}

/**
 * Consumes 1 Candidate Search credit.
 * On Trial: Enforces 5 search maximum and marks trial COMPLETED.
 * On Paid: Increments daily search count.
 */
export async function consumeCandidateSearch(userId: string): Promise<{
  allowed: boolean;
  isTrial: boolean;
  searchesUsed: number;
  searchesLimit: number;
  remaining: number;
}> {
  const entitlements = await getRecruiterEntitlements(userId);

  if (entitlements.isTrial) {
    if (entitlements.trialSearchesUsed >= entitlements.trialSearchesLimit) {
      throw new EntitlementLimitError(
        `Trial Candidate Searches Exhausted (${entitlements.trialSearchesUsed}/${entitlements.trialSearchesLimit}). Please choose a paid recruiter plan (Silver, Gold, Diamond, Platinum) to continue sourcing talent.`,
        "TRIAL_SEARCHES_EXHAUSTED",
        {
          trialSearchesUsed: entitlements.trialSearchesUsed,
          trialSearchesLimit: entitlements.trialSearchesLimit,
        }
      );
    }

    const updatedTrial = await prisma.recruiterTrial.update({
      where: { recruiterId: userId },
      data: {
        candidateSearchesUsed: { increment: 1 },
        status: entitlements.trialSearchesUsed + 1 >= entitlements.trialSearchesLimit ? "COMPLETED" : "ACTIVE",
        completedAt: entitlements.trialSearchesUsed + 1 >= entitlements.trialSearchesLimit ? new Date() : undefined,
      },
    });

    return {
      allowed: true,
      isTrial: true,
      searchesUsed: updatedTrial.candidateSearchesUsed,
      searchesLimit: updatedTrial.candidateSearchLimit,
      remaining: Math.max(0, updatedTrial.candidateSearchLimit - updatedTrial.candidateSearchesUsed),
    };
  }

  // Paid Plan: Record daily usage
  const today = getTodayDateString();
  const updatedUsage = await prisma.dailyUsage.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, candidateSearches: 1 },
    update: { candidateSearches: { increment: 1 } },
  });

  return {
    allowed: true,
    isTrial: false,
    searchesUsed: updatedUsage.candidateSearches,
    searchesLimit: -1,
    remaining: -1,
  };
}

/**
 * Consumes 1 Candidate Unlock quota.
 * Trial recruiters cannot unlock candidates (previews only).
 */
export async function consumeCandidateUnlock(recruiterId: string, candidateId: string): Promise<void> {
  const entitlements = await getRecruiterEntitlements(recruiterId);

  // Check if already unlocked
  const existingUnlock = await prisma.candidateUnlock.findUnique({
    where: { recruiterId_candidateId: { recruiterId, candidateId } },
  });

  if (existingUnlock) {
    return; // Already unlocked
  }

  if (entitlements.isTrial) {
    throw new EntitlementLimitError(
      "Candidate Profile Unlock is a paid feature. Trial Mode includes candidate previews only. Please upgrade to Silver, Gold, Diamond, or Platinum to unlock full candidate profiles.",
      "TRIAL_UNLOCK_NOT_PERMITTED"
    );
  }

  if (entitlements.candidateUnlocksRemainingToday <= 0) {
    import("@/lib/events/eventEngine").then(({ emitEvent }) => {
      emitEvent({
        type: "RECRUITER_QUOTA_EXHAUSTED",
        recipientId: recruiterId,
        title: "Daily Candidate Unlock Quota Reached",
        body: `You have reached your daily quota limit (${entitlements.candidateUnlockLimit} unlocks). Quota resets at 00:00 UTC.`,
        ctaText: "Upgrade Plan",
        ctaUrl: "/recruiter/billing",
        metadata: { limit: entitlements.candidateUnlockLimit, used: entitlements.candidateUnlocksUsedToday },
      }).catch(() => {});
    }).catch(() => {});

    throw new EntitlementLimitError(
      `Daily Candidate Unlock Quota reached (${entitlements.candidateUnlocksUsedToday}/${entitlements.candidateUnlockLimit}). Your allowance resets at 00:00 UTC.`,
      "DAILY_UNLOCK_LIMIT_EXCEEDED"
    );
  }

  const today = getTodayDateString();
  const updatedUsage = await prisma.dailyUsage.upsert({
    where: { userId_date: { userId: recruiterId, date: today } },
    create: { userId: recruiterId, date: today, candidateUnlocks: 1 },
    update: { candidateUnlocks: { increment: 1 } },
  });

  if (entitlements.candidateUnlockLimit > 0 && updatedUsage.candidateUnlocks >= entitlements.candidateUnlockLimit * 0.8) {
    import("@/lib/events/eventEngine").then(({ emitEvent }) => {
      emitEvent({
        type: "RECRUITER_QUOTA_APPROACHING_LIMIT",
        recipientId: recruiterId,
        title: "Daily Unlock Quota Approaching Limit",
        body: `You have used ${updatedUsage.candidateUnlocks}/${entitlements.candidateUnlockLimit} candidate unlocks for today.`,
        ctaText: "Upgrade Quota",
        ctaUrl: "/recruiter/billing",
        metadata: { limit: entitlements.candidateUnlockLimit, used: updatedUsage.candidateUnlocks },
      }).catch(() => {});
    }).catch(() => {});
  }

  await prisma.candidateUnlock.create({
    data: { recruiterId, candidateId },
  });
}

/**
 * Consumes 1 Resume Download quota.
 * Trial recruiters strictly cannot download resumes.
 */
export async function consumeResumeUnlock(recruiterId: string, candidateId: string): Promise<void> {
  const entitlements = await getRecruiterEntitlements(recruiterId);

  if (entitlements.isTrial) {
    throw new EntitlementLimitError(
      "Resume Downloads are not included in Trial Mode. Please upgrade to a paid recruiter plan (Silver, Gold, Diamond, Platinum) to download verified resumes.",
      "TRIAL_RESUME_DOWNLOAD_NOT_PERMITTED"
    );
  }

  if (entitlements.resumeUnlocksRemainingToday <= 0) {
    throw new EntitlementLimitError(
      `Daily Resume Download Quota reached (${entitlements.resumeUnlocksUsedToday}/${entitlements.resumeUnlockLimit}). Allowance resets at midnight.`,
      "DAILY_RESUME_LIMIT_EXCEEDED"
    );
  }

  const today = getTodayDateString();
  await prisma.dailyUsage.upsert({
    where: { userId_date: { userId: recruiterId, date: today } },
    create: { userId: recruiterId, date: today, resumeUnlocks: 1 },
    update: { resumeUnlocks: { increment: 1 } },
  });

  await prisma.resumeAccessLog.create({
    data: {
      recruiterId,
      candidateId,
      action: "DOWNLOAD",
    },
  });
}

/**
 * Enforces job posting limits for trial vs paid plans.
 */
export async function assertJobPostingAllowed(recruiterId: string): Promise<{ isTrialJob: boolean }> {
  const entitlements = await getRecruiterEntitlements(recruiterId);

  if (entitlements.isTrial) {
    if (entitlements.trialJobPostingsUsed >= entitlements.trialJobPostingsLimit) {
      throw new EntitlementLimitError(
        `Trial Job Posting Limit Reached (${entitlements.trialJobPostingsUsed}/${entitlements.trialJobPostingsLimit}). Please upgrade to a paid recruiter plan to publish additional vacancies.`,
        "TRIAL_JOB_LIMIT_EXCEEDED"
      );
    }

    await prisma.recruiterTrial.update({
      where: { recruiterId },
      data: { jobPostingsUsed: { increment: 1 } },
    });

    return { isTrialJob: true };
  }

  // Check active jobs against plan limit
  const activeJobsCount = await prisma.job.count({
    where: { recruiterId, status: "ACTIVE" },
  });

  if (activeJobsCount >= entitlements.jobPostingLimit) {
    throw new EntitlementLimitError(
      `Job Posting Limit Reached (${activeJobsCount}/${entitlements.jobPostingLimit} active jobs). Upgrade your plan or archive existing vacancies to post more.`,
      "PLAN_JOB_LIMIT_EXCEEDED"
    );
  }

  return { isTrialJob: false };
}
