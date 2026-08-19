import { prisma } from "@/lib/prisma";
import { PlanTier, MessagingLevel, ContactSharingLevel } from "@prisma/client";

export interface PlanConfig {
  id: string;
  name: string;
  tier: PlanTier;
  price: number; // in INR
  currency: string;
  durationDays: number;
  candidateSearchLimit: number; // -1 for unlimited
  candidateUnlockLimit: number; // per day (or 0 for trial)
  resumeUnlockLimit: number; // per day (or 0 for trial)
  messageLimit: number; // per day (or 10 total for trial)
  messagingLevel: MessagingLevel;
  contactSharingLevel: ContactSharingLevel;
  jobPostingLimit: number;
  advancedSearch: boolean;
  savedSearches: boolean;
  aiMatching: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  isActive: boolean;
  displayOrder: number;
  description: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    id: "trial",
    name: "Trial Mode",
    tier: "TRIAL",
    price: 0,
    currency: "INR",
    durationDays: 14,
    candidateSearchLimit: 5,
    candidateUnlockLimit: 0,
    resumeUnlockLimit: 0,
    messageLimit: 10,
    messagingLevel: "LIMITED_MESSAGE",
    contactSharingLevel: "MASKED",
    jobPostingLimit: 1,
    advancedSearch: false,
    savedSearches: false,
    aiMatching: false,
    analytics: false,
    prioritySupport: false,
    isActive: true,
    displayOrder: 0,
    description: "One-time evaluation tier for verified employers to test NextHire sourcing.",
    features: [
      "5 candidate searches total",
      "1 active job posting",
      "Candidate profile previews",
      "Controlled direct messaging (10 msgs)",
      "Applicant ATS workflow",
      "No resume downloads",
    ],
  },
  {
    id: "silver",
    name: "Silver Tier",
    tier: "SILVER",
    price: 10,
    currency: "INR",
    durationDays: 30,
    candidateSearchLimit: -1,
    candidateUnlockLimit: 15,
    resumeUnlockLimit: 15,
    messageLimit: 50,
    messagingLevel: "BASIC_MESSAGE",
    contactSharingLevel: "MASKED",
    jobPostingLimit: 5,
    advancedSearch: false,
    savedSearches: false,
    aiMatching: false,
    analytics: false,
    prioritySupport: false,
    isActive: true,
    displayOrder: 1,
    description: "Essential sourcing toolkit for small teams and growing startups.",
    features: [
      "Unlimited talent marketplace searches",
      "15 candidate unlocks / day",
      "15 verified resume downloads / day",
      "5 active job vacancies",
      "Basic direct messaging (50 msgs/day)",
      "Applicant tracking & status management",
    ],
  },
  {
    id: "gold",
    name: "Gold Tier",
    tier: "GOLD",
    price: 20,
    currency: "INR",
    durationDays: 30,
    candidateSearchLimit: -1,
    candidateUnlockLimit: 30,
    resumeUnlockLimit: 30,
    messageLimit: 100,
    messagingLevel: "ENHANCED_MESSAGE",
    contactSharingLevel: "MASKED",
    jobPostingLimit: 10,
    advancedSearch: false,
    savedSearches: true,
    aiMatching: false,
    analytics: false,
    prioritySupport: false,
    isActive: true,
    displayOrder: 2,
    description: "High-velocity talent acquisition for scaling product & engineering teams.",
    features: [
      "Unlimited talent searches",
      "30 candidate unlocks / day",
      "30 verified resume downloads / day",
      "10 active job postings",
      "Enhanced messaging with Job ID attachments",
      "Saved searches & talent watchlists",
      "Full ATS pipeline access",
    ],
  },
  {
    id: "diamond",
    name: "Diamond Tier",
    tier: "DIAMOND",
    price: 50,
    currency: "INR",
    durationDays: 30,
    candidateSearchLimit: -1,
    candidateUnlockLimit: 100,
    resumeUnlockLimit: 100,
    messageLimit: 500,
    messagingLevel: "CONTACT_REQUEST",
    contactSharingLevel: "CONTROLLED_REQUEST",
    jobPostingLimit: 25,
    advancedSearch: true,
    savedSearches: true,
    aiMatching: false,
    analytics: true,
    prioritySupport: false,
    isActive: true,
    displayOrder: 3,
    description: "Full-scale recruiting powerhouse with direct contact request capabilities.",
    features: [
      "Unlimited talent searches",
      "100 candidate unlocks / day",
      "100 verified resume downloads / day",
      "25 active job vacancies",
      "Candidate Contact Request workflow",
      "Advanced skill & experience boolean filters",
      "Talent pipeline analytics & reporting",
    ],
  },
  {
    id: "platinum",
    name: "Platinum Tier",
    tier: "PLATINUM",
    price: 100,
    currency: "INR",
    durationDays: 30,
    candidateSearchLimit: -1,
    candidateUnlockLimit: 500,
    resumeUnlockLimit: 500,
    messageLimit: 1000,
    messagingLevel: "ADVANCED_MESSAGE",
    contactSharingLevel: "DIRECT_PERMISSION",
    jobPostingLimit: 100,
    advancedSearch: true,
    savedSearches: true,
    aiMatching: true,
    analytics: true,
    prioritySupport: true,
    isActive: true,
    displayOrder: 4,
    description: "Enterprise-grade recruiting suite with fair-use access & priority support.",
    features: [
      "Fair-use candidate unlocks (500/day)",
      "Fair-use resume downloads (500/day)",
      "100 active job postings",
      "Advanced messaging & contact consent",
      "AI-powered talent matching algorithms",
      "Executive recruitment analytics",
      "24/7 dedicated priority SLA support",
    ],
  },
];

/**
 * Ensures standard subscription plans are synchronized into PostgreSQL.
 */
export async function syncSubscriptionPlans(): Promise<void> {
  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price: plan.price,
        currency: plan.currency,
        durationDays: plan.durationDays,
        candidateSearchLimit: plan.candidateSearchLimit,
        candidateUnlockLimit: plan.candidateUnlockLimit,
        resumeUnlockLimit: plan.resumeUnlockLimit,
        messageLimit: plan.messageLimit,
        messagingLevel: plan.messagingLevel,
        contactSharingLevel: plan.contactSharingLevel,
        jobPostingLimit: plan.jobPostingLimit,
        advancedSearch: plan.advancedSearch,
        savedSearches: plan.savedSearches,
        aiMatching: plan.aiMatching,
        analytics: plan.analytics,
        prioritySupport: plan.prioritySupport,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
      },
      update: {
        name: plan.name,
        price: plan.price,
        candidateSearchLimit: plan.candidateSearchLimit,
        candidateUnlockLimit: plan.candidateUnlockLimit,
        resumeUnlockLimit: plan.resumeUnlockLimit,
        messageLimit: plan.messageLimit,
        messagingLevel: plan.messagingLevel,
        contactSharingLevel: plan.contactSharingLevel,
        jobPostingLimit: plan.jobPostingLimit,
        advancedSearch: plan.advancedSearch,
        savedSearches: plan.savedSearches,
        aiMatching: plan.aiMatching,
        analytics: plan.analytics,
        prioritySupport: plan.prioritySupport,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
      },
    });
  }
}
