"use client";

import React from "react";

export type SubscriptionTier = "FREE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
export type VerificationStatus = "VERIFIED" | "UNVERIFIED" | "PENDING";
export type AccountRole = "recruiter" | "employer" | "seeker";

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
  // Normalize verification status
  const normalizedStatus: VerificationStatus =
    verificationStatus === true || verificationStatus === "VERIFIED"
      ? "VERIFIED"
      : verificationStatus === "PENDING"
      ? "PENDING"
      : "UNVERIFIED";

  // Normalize tier
  const normalizedTier: SubscriptionTier = (
    ["SILVER", "GOLD", "PLATINUM", "DIAMOND"].includes((tier || "").toUpperCase())
      ? (tier || "").toUpperCase()
      : "FREE"
  ) as SubscriptionTier;

  // Role display label when unverified
  const roleLabel =
    role === "employer"
      ? "Employer"
      : role === "seeker"
      ? "Job Seeker"
      : "Recruiter";

  // Size styles
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1 rounded-lg",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-xl font-medium",
    lg: "px-3.5 py-1.5 text-sm gap-2 rounded-2xl font-bold",
  }[size] || "px-2.5 py-1 text-xs gap-1.5 rounded-xl font-medium";

  const iconSizes = {
    sm: "text-[13px]",
    md: "text-[15px]",
    lg: "text-[18px]",
  }[size] || "text-[15px]";

  // 1. PENDING State
  if (normalizedStatus === "PENDING") {
    return (
      <span
        aria-label="Verification pending profile"
        className={`inline-flex items-center font-medium border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 transition-colors shadow-2xs ${sizeClasses} ${className}`}
      >
        <span className={`material-symbols-outlined ${iconSizes}`}>hourglass_top</span>
        <span>Verification Pending</span>
      </span>
    );
  }

  // 2. UNVERIFIED State
  if (normalizedStatus === "UNVERIFIED") {
    return (
      <span
        aria-label={`${roleLabel} profile`}
        className={`inline-flex items-center font-medium border border-outline-variant/30 bg-surface-container-high/80 text-on-surface-variant transition-colors shadow-2xs ${sizeClasses} ${className}`}
      >
        <span>{roleLabel}</span>
      </span>
    );
  }

  // 3. VERIFIED State with Tier-Based Color Styling
  const tierStyles: Record<SubscriptionTier, { border: string; bg: string; text: string }> = {
    GOLD: {
      border: "border-amber-500/40",
      bg: "bg-amber-500/10 dark:bg-amber-950/30",
      text: "text-amber-800 dark:text-amber-300",
    },
    SILVER: {
      border: "border-slate-400/40",
      bg: "bg-slate-500/10 dark:bg-slate-800/30",
      text: "text-slate-800 dark:text-slate-200",
    },
    PLATINUM: {
      border: "border-indigo-500/40",
      bg: "bg-indigo-500/10 dark:bg-indigo-950/30",
      text: "text-indigo-800 dark:text-indigo-300",
    },
    DIAMOND: {
      border: "border-cyan-500/40",
      bg: "bg-cyan-500/10 dark:bg-cyan-950/30",
      text: "text-cyan-800 dark:text-cyan-300",
    },
    FREE: {
      border: "border-blue-500/40",
      bg: "bg-blue-500/10 dark:bg-blue-950/30",
      text: "text-blue-800 dark:text-blue-300",
    },
  };

  const currentTierStyle = tierStyles[normalizedTier] || tierStyles.FREE;
  const accessibleRoleDesc = role === "employer" ? "employer" : role === "seeker" ? "candidate" : "recruiter";

  return (
    <span
      aria-label={`Verified ${accessibleRoleDesc} profile`}
      className={`inline-flex items-center font-bold border ${currentTierStyle.border} ${currentTierStyle.bg} ${currentTierStyle.text} transition-all shadow-2xs ${sizeClasses} ${className}`}
    >
      <span className={`material-symbols-outlined font-black text-emerald-600 dark:text-emerald-400 ${iconSizes}`}>
        check_circle
      </span>
      <span>✓ Verified</span>
    </span>
  );
}
