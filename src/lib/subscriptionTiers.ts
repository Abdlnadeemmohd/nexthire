export type SubscriptionTier = "FREE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
export type VerificationStatus = "VERIFIED" | "UNVERIFIED" | "PENDING";
export type AccountRole = "recruiter" | "employer" | "seeker";

export interface TierStyleConfig {
  name: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  checkmarkColor: string;
  accentColor: string;
}

export const SUBSCRIPTION_TIER_STYLES: Record<SubscriptionTier, TierStyleConfig> = {
  FREE: {
    name: "Free",
    badgeBorder: "border-blue-500/30",
    badgeBg: "bg-blue-500/10 dark:bg-blue-950/30",
    badgeText: "text-blue-700 dark:text-blue-300",
    checkmarkColor: "text-blue-500 dark:text-blue-400",
    accentColor: "blue",
  },
  SILVER: {
    name: "Silver",
    badgeBorder: "border-slate-400/30",
    badgeBg: "bg-slate-500/10 dark:bg-slate-800/30",
    badgeText: "text-slate-700 dark:text-slate-200",
    checkmarkColor: "text-slate-400 dark:text-slate-300",
    accentColor: "slate",
  },
  GOLD: {
    name: "Gold",
    badgeBorder: "border-amber-500/35",
    badgeBg: "bg-amber-500/10 dark:bg-amber-950/30",
    badgeText: "text-amber-800 dark:text-amber-300",
    checkmarkColor: "text-amber-500 dark:text-amber-400",
    accentColor: "amber",
  },
  PLATINUM: {
    name: "Platinum",
    badgeBorder: "border-indigo-500/35",
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-950/30",
    badgeText: "text-indigo-800 dark:text-indigo-300",
    checkmarkColor: "text-indigo-500 dark:text-indigo-400",
    accentColor: "indigo",
  },
  DIAMOND: {
    name: "Diamond",
    badgeBorder: "border-cyan-500/35",
    badgeBg: "bg-cyan-500/10 dark:bg-cyan-950/30",
    badgeText: "text-cyan-800 dark:text-cyan-300",
    checkmarkColor: "text-cyan-500 dark:text-cyan-400",
    accentColor: "cyan",
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
