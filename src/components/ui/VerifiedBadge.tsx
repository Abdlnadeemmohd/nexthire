"use client";

import React from "react";
import { UserRole } from "@/lib/auth";
import {
  SUBSCRIPTION_TIER_STYLES,
  normalizeSubscriptionTier,
  SubscriptionTier,
} from "@/lib/subscriptionTiers";

export interface VerifiedBadgeProps {
  role?: UserRole | "COMPANY" | "PREMIUM_RECRUITER" | "HIRING_PARTNER" | string;
  tier?: "TRIAL" | "FREE" | "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM" | SubscriptionTier | string;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  customLabel?: string;
  showIconOnly?: boolean;
  className?: string;
}

export function VerifiedBadge({
  role = "JOB_SEEKER",
  tier = "FREE",
  isVerified = true,
  size = "sm",
  customLabel,
  showIconOnly = false,
  className = "",
}: VerifiedBadgeProps) {
  // Normalize role
  const roleLabel =
    customLabel ||
    (role === "COMPANY" || role === "HIRING_PARTNER" || role === "employer"
      ? "Employer"
      : role === "RECRUITER" || role === "PREMIUM_RECRUITER" || role === "recruiter"
      ? "Recruiter"
      : "Job Seeker");

  const normalizedTier = normalizeSubscriptionTier(tier);
  const tierStyle = SUBSCRIPTION_TIER_STYLES[normalizedTier] || SUBSCRIPTION_TIER_STYLES.FREE;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1 rounded-lg",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-xl font-medium",
    lg: "px-3.5 py-1.5 text-sm gap-2 rounded-2xl font-bold",
  }[size] || "px-2 py-0.5 text-[11px] gap-1 rounded-lg";

  const checkmarkSizes = {
    sm: "text-[12px]",
    md: "text-[14px]",
    lg: "text-[16px]",
  }[size] || "text-[12px]";

  // 1. UNVERIFIED State
  if (!isVerified) {
    return (
      <span
        aria-label={`${roleLabel} profile, verification not completed`}
        className={`inline-flex items-center font-medium border border-outline-variant/30 bg-surface-container-high/80 text-on-surface-variant transition-colors shadow-2xs ${sizeClasses} ${className}`}
      >
        <span>{roleLabel}</span>
      </span>
    );
  }

  // 2. VERIFIED State (Recruiter ✓ with tier-colored checkmark & subtle tier styling)
  return (
    <span
      aria-label={`Verified ${roleLabel}, ${tierStyle.name} Tier`}
      className={`inline-flex items-center font-bold border ${tierStyle.badgeBorder} ${tierStyle.badgeBg} ${tierStyle.badgeText} transition-all shadow-2xs ${sizeClasses} ${className}`}
    >
      {!showIconOnly && <span>{roleLabel}</span>}
      <span
        className={`font-black ${tierStyle.checkmarkColor} ${checkmarkSizes} leading-none select-none`}
        aria-hidden="true"
      >
        ✓
      </span>
    </span>
  );
}
