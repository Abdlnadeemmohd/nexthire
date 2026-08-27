"use client";

import React from "react";
import {
  SubscriptionTier,
  VerificationStatus,
  AccountRole,
  SUBSCRIPTION_TIER_STYLES,
  normalizeSubscriptionTier,
  normalizeVerificationStatus,
} from "@/lib/subscriptionTiers";

export type { SubscriptionTier, VerificationStatus, AccountRole };

export interface SubscriptionVerificationBadgeProps {
  tier?: SubscriptionTier | string;
  verificationStatus?: VerificationStatus | boolean | string;
  role?: AccountRole | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SubscriptionVerificationBadge({
  tier = "FREE",
  verificationStatus = "UNVERIFIED",
  role = "recruiter",
  size = "md",
  className = "",
}: SubscriptionVerificationBadgeProps) {
  const normalizedStatus = normalizeVerificationStatus(verificationStatus);
  const normalizedTier = normalizeSubscriptionTier(tier);
  const tierStyle = SUBSCRIPTION_TIER_STYLES[normalizedTier] || SUBSCRIPTION_TIER_STYLES.FREE;

  // Normalized role display label
  const roleLabel =
    role === "employer" || role === "COMPANY" || role === "HIRING_PARTNER"
      ? "Employer"
      : role === "seeker" || role === "JOB_SEEKER"
      ? "Job Seeker"
      : role === "RECRUITER_MANAGER"
      ? "Recruiter Manager"
      : "Recruiter";

  const sizeClasses = {
    sm: "px-3 py-1 text-xs gap-1.5 rounded-xl font-semibold tracking-tight",
    md: "px-3.5 py-1.5 text-[13px] gap-2 rounded-xl font-bold tracking-tight",
    lg: "px-4 py-2 text-sm gap-2.5 rounded-2xl font-bold tracking-tight",
  }[size] || "px-3.5 py-1.5 text-[13px] gap-2 rounded-xl font-bold tracking-tight";

  const circleSizes = {
    sm: "w-4 h-4",
    md: "w-[18px] h-[18px]",
    lg: "w-5 h-5",
  }[size] || "w-[18px] h-[18px]";

  const svgSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  }[size] || "w-3 h-3";


  // 1. PENDING State
  if (normalizedStatus === "PENDING") {
    return (
      <span
        aria-label={`${roleLabel}, verification is pending`}
        className={`inline-flex items-center border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 transition-all shadow-2xs ${sizeClasses} ${className}`}
      >
        <span>{roleLabel}</span>
        <span className="material-symbols-outlined text-[13px] text-amber-600 dark:text-amber-400">hourglass_top</span>
      </span>
    );
  }

  // 2. UNVERIFIED State (Tile adopts subtle tier identity without verification checkmark)
  if (normalizedStatus === "UNVERIFIED") {
    return (
      <span
        aria-label={`${roleLabel}, ${tierStyle.name} Tier, verification not completed`}
        className={`inline-flex items-center border ${tierStyle.badgeBorder} ${tierStyle.badgeBg} ${tierStyle.badgeText} transition-all shadow-2xs ${sizeClasses} ${className}`}
      >
        <span>{roleLabel}</span>
      </span>
    );
  }

  // 3. VERIFIED State (Recruiter [●✓] with tier-colored tile + solid circle with white checkmark)
  return (
    <span
      aria-label={`Verified ${roleLabel}, ${tierStyle.name} Tier`}
      className={`inline-flex items-center border ${tierStyle.badgeBorder} ${tierStyle.badgeBg} ${tierStyle.badgeText} transition-all shadow-2xs ${sizeClasses} ${className}`}
    >
      <span>{roleLabel}</span>
      <span
        className={`inline-flex items-center justify-center rounded-full ${tierStyle.checkmarkCircleBg} text-white leading-none select-none flex-shrink-0 shadow-2xs ${circleSizes}`}
        aria-hidden="true"
      >
        <svg className={`${svgSizes} fill-none stroke-current stroke-[3]`} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </span>
    </span>
  );
}
