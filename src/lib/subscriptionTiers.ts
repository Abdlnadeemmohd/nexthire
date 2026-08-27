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
  cardActiveBorder: string;
  activeButtonBg: string;
  statusPill: string;
  statusDot: string;
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
    ringColor: "ring-blue-500/30",
    cardBg: "bg-blue-50/50 dark:bg-blue-950/20",
    cardBorder: "border-blue-200/60 dark:border-blue-900/40",
    cardActiveBorder: "border-2 border-blue-500/50 bg-blue-500/[0.04] shadow-sm ring-2 ring-blue-500/20",
    activeButtonBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30",
    statusPill: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    statusDot: "bg-blue-500",
  },
  SILVER: {
    name: "Silver",
    badgeBorder: "border-slate-400/50 dark:border-slate-500/40",
    badgeBg: "bg-slate-500/[0.08] dark:bg-slate-800/40",
    badgeText: "text-slate-800 dark:text-slate-200",
    checkmarkCircleBg: "bg-slate-700 dark:bg-slate-400",
    checkmarkColor: "text-white",
    accentColor: "slate",
    ringColor: "ring-slate-400/30",
    cardBg: "bg-slate-50/50 dark:bg-slate-900/20",
    cardBorder: "border-slate-300/60 dark:border-slate-800/40",
    cardActiveBorder: "border-2 border-slate-400/60 bg-slate-500/[0.04] shadow-sm ring-2 ring-slate-400/20",
    activeButtonBg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-400/40",
    statusPill: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/40",
    statusDot: "bg-slate-500",
  },
  GOLD: {
    name: "Gold",
    badgeBorder: "border-amber-500/50 dark:border-amber-400/40",
    badgeBg: "bg-amber-500/[0.10] dark:bg-amber-950/40",
    badgeText: "text-amber-800 dark:text-amber-300",
    checkmarkCircleBg: "bg-amber-600 dark:bg-amber-500",
    checkmarkColor: "text-white",
    accentColor: "amber",
    ringColor: "ring-amber-500/30",
    cardBg: "bg-amber-50/50 dark:bg-amber-950/20",
    cardBorder: "border-amber-200/60 dark:border-amber-900/40",
    cardActiveBorder: "border-2 border-amber-500/60 bg-amber-500/[0.04] shadow-sm ring-2 ring-amber-500/20",
    activeButtonBg: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/40",
    statusPill: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/40",
    statusDot: "bg-amber-500",
  },
  PLATINUM: {
    name: "Platinum",
    badgeBorder: "border-indigo-500/50 dark:border-indigo-400/40",
    badgeBg: "bg-indigo-500/[0.10] dark:bg-indigo-950/40",
    badgeText: "text-indigo-800 dark:text-indigo-300",
    checkmarkCircleBg: "bg-indigo-600 dark:bg-indigo-500",
    checkmarkColor: "text-white",
    accentColor: "indigo",
    ringColor: "ring-indigo-500/30",
    cardBg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    cardBorder: "border-indigo-200/60 dark:border-indigo-900/40",
    cardActiveBorder: "border-2 border-indigo-500/60 bg-indigo-500/[0.04] shadow-sm ring-2 ring-indigo-500/20",
    activeButtonBg: "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-500/40",
    statusPill: "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/40",
    statusDot: "bg-indigo-500",
  },
  DIAMOND: {
    name: "Diamond",
    badgeBorder: "border-cyan-500/50 dark:border-cyan-400/40",
    badgeBg: "bg-cyan-500/[0.10] dark:bg-cyan-950/40",
    badgeText: "text-cyan-800 dark:text-cyan-300",
    checkmarkCircleBg: "bg-cyan-600 dark:bg-cyan-500",
    checkmarkColor: "text-white",
    accentColor: "cyan",
    ringColor: "ring-cyan-500/30",
    cardBg: "bg-cyan-50/50 dark:bg-cyan-950/20",
    cardBorder: "border-cyan-200/60 dark:border-cyan-900/40",
    cardActiveBorder: "border-2 border-cyan-500/60 bg-cyan-500/[0.04] shadow-sm ring-2 ring-cyan-500/20",
    activeButtonBg: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-500/40",
    statusPill: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-500/40",
    statusDot: "bg-cyan-500",
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
