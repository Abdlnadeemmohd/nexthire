export type SubscriptionTier = "FREE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
export type VerificationStatus = "VERIFIED" | "UNVERIFIED" | "PENDING";
export type AccountRole = "recruiter" | "employer" | "seeker";

export interface TierStyleConfig {
  name: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  checkmarkCircleBg: string;
  checkmarkColor: string;
  accentColor: string;
  ringColor: string;
  cardBg: string;
  cardBorder: string;
}

export const SUBSCRIPTION_TIER_STYLES: Record<SubscriptionTier, TierStyleConfig> = {
  FREE: {
    name: "Free",
    badgeBorder: "border-blue-500/40 dark:border-blue-400/40",
    badgeBg: "bg-blue-500/[0.08] dark:bg-blue-950/40",
    badgeText: "text-blue-700 dark:text-blue-300",
    checkmarkCircleBg: "bg-blue-600 dark:bg-blue-500",
    checkmarkColor: "text-white",
    accentColor: "blue",
    ringColor: "ring-blue-500/20",
    cardBg: "bg-blue-50/50 dark:bg-blue-950/20",
    cardBorder: "border-blue-200/50 dark:border-blue-900/30",
  },
  SILVER: {
    name: "Silver",
    badgeBorder: "border-slate-400/50 dark:border-slate-500/40",
    badgeBg: "bg-slate-500/[0.08] dark:bg-slate-800/40",
    badgeText: "text-slate-800 dark:text-slate-200",
    checkmarkCircleBg: "bg-slate-700 dark:bg-slate-400",
    checkmarkColor: "text-white",
    accentColor: "slate",
    ringColor: "ring-slate-400/20",
    cardBg: "bg-slate-50/50 dark:bg-slate-900/20",
    cardBorder: "border-slate-200/50 dark:border-slate-800/30",
  },
  GOLD: {
    name: "Gold",
    badgeBorder: "border-amber-500/50 dark:border-amber-400/40",
    badgeBg: "bg-amber-500/[0.10] dark:bg-amber-950/40",
    badgeText: "text-amber-800 dark:text-amber-300",
    checkmarkCircleBg: "bg-amber-600 dark:bg-amber-500",
    checkmarkColor: "text-white",
    accentColor: "amber",
    ringColor: "ring-amber-500/20",
    cardBg: "bg-amber-50/50 dark:bg-amber-950/20",
    cardBorder: "border-amber-200/50 dark:border-amber-900/30",
  },
  PLATINUM: {
    name: "Platinum",
    badgeBorder: "border-indigo-500/50 dark:border-indigo-400/40",
    badgeBg: "bg-indigo-500/[0.10] dark:bg-indigo-950/40",
    badgeText: "text-indigo-800 dark:text-indigo-300",
    checkmarkCircleBg: "bg-indigo-600 dark:bg-indigo-500",
    checkmarkColor: "text-white",
    accentColor: "indigo",
    ringColor: "ring-indigo-500/20",
    cardBg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    cardBorder: "border-indigo-200/50 dark:border-indigo-900/30",
  },
  DIAMOND: {
    name: "Diamond",
    badgeBorder: "border-cyan-500/50 dark:border-cyan-400/40",
    badgeBg: "bg-cyan-500/[0.10] dark:bg-cyan-950/40",
    badgeText: "text-cyan-800 dark:text-cyan-300",
    checkmarkCircleBg: "bg-cyan-600 dark:bg-cyan-500",
    checkmarkColor: "text-white",
    accentColor: "cyan",
    ringColor: "ring-cyan-500/20",
    cardBg: "bg-cyan-50/50 dark:bg-cyan-950/20",
    cardBorder: "border-cyan-200/50 dark:border-cyan-900/30",
  },
};

export function normalizeSubscriptionTier(tier?: string | null): SubscriptionTier {
  const upper = (tier || "").toUpperCase();
  if (["SILVER", "GOLD", "PLATINUM", "DIAMOND"].includes(upper)) {
    return upper as SubscriptionTier;
  }
  return "FREE";
}

export function normalizeVerificationStatus(status?: boolean | string | null): VerificationStatus {
  if (status === true || status === "VERIFIED") return "VERIFIED";
  if (status === "PENDING") return "PENDING";
  return "UNVERIFIED";
}
