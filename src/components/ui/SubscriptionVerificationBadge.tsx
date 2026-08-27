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
      : "Recruiter";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1 rounded-lg",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-xl font-medium",
    lg: "px-3.5 py-1.5 text-sm gap-2 rounded-2xl font-bold",
  }[size] || "px-2.5 py-1 text-xs gap-1.5 rounded-xl font-medium";

  const checkmarkSizes = {
    sm: "text-[12px]",
    md: "text-[14px]",
    lg: "text-[16px]",
  }[size] || "text-[14px]";

  // 1. PENDING State
  if (normalizedStatus === "PENDING") {
    return (
      <span
        aria-label={`${roleLabel} verification is pending`}
        className={`inline-flex items-center font-medium border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 transition-colors shadow-2xs ${sizeClasses} ${className}`}
      >
        <span className={`material-symbols-outlined text-[13px]`}>hourglass_top</span>
        <span>Verification Pending</span>
      </span>
    );
  }

  // 2. UNVERIFIED State (No checkmark, neutral subtle styling)
  if (normalizedStatus === "UNVERIFIED") {
    return (
      <span
        aria-label={`${roleLabel} profile, verification not completed`}
        className={`inline-flex items-center font-medium border border-outline-variant/30 bg-surface-container-high/80 text-on-surface-variant transition-colors shadow-2xs ${sizeClasses} ${className}`}
      >
        <span>{roleLabel}</span>
      </span>
    );
  }

  // 3. VERIFIED State (Recruiter ✓ with tier-colored checkmark & subtle tier styling)
  return (
    <span
      aria-label={`Verified ${roleLabel}, ${tierStyle.name} Tier`}
      className={`inline-flex items-center font-bold border ${tierStyle.badgeBorder} ${tierStyle.badgeBg} ${tierStyle.badgeText} transition-all shadow-2xs ${sizeClasses} ${className}`}
    >
      <span>{roleLabel}</span>
      <span
        className={`font-black ${tierStyle.checkmarkColor} ${checkmarkSizes} leading-none select-none`}
        aria-hidden="true"
      >
        ✓
      </span>
    </span>
  );
}
