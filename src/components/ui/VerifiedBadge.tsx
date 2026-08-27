"use client";

import React from "react";
import { UserRole } from "@/lib/auth";

export interface VerifiedBadgeProps {
  role?: UserRole | "COMPANY" | "PREMIUM_RECRUITER" | "HIRING_PARTNER" | string;
  tier?: "TRIAL" | "FREE" | "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM" | string;
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
  // Map role
  const normalizedRole =
    role === "COMPANY" || role === "HIRING_PARTNER"
      ? "employer"
      : role === "RECRUITER" || role === "PREMIUM_RECRUITER"
      ? "recruiter"
      : "seeker";

  // Tier color mapping
  const normalizedTier = (
    ["SILVER", "GOLD", "PLATINUM", "DIAMOND"].includes((tier || "").toUpperCase())
      ? (tier || "").toUpperCase()
      : "FREE"
  );

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1 rounded-lg",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-xl font-medium",
    lg: "px-3.5 py-1.5 text-sm gap-2 rounded-2xl font-bold",
  }[size] || "px-2 py-0.5 text-[11px] gap-1 rounded-lg";

  const iconSizes = {
    sm: "text-[13px]",
    md: "text-[15px]",
    lg: "text-[18px]",
  }[size] || "text-[13px]";

  if (!isVerified) {
    const unverifiedLabel = customLabel || (normalizedRole === "employer" ? "Employer" : normalizedRole === "seeker" ? "Job Seeker" : "Recruiter");
    return (
      <span
        aria-label={`${unverifiedLabel} profile`}
        className={`inline-flex items-center font-medium border border-outline-variant/30 bg-surface-container-high/80 text-on-surface-variant transition-colors shadow-2xs ${sizeClasses} ${className}`}
      >
        <span>{unverifiedLabel}</span>
      </span>
    );
  }

  // Tier-based styles for verified badges
  const tierColorClasses: Record<string, string> = {
    GOLD: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    SILVER: "border-slate-400/40 bg-slate-500/10 text-slate-800 dark:text-slate-200",
    PLATINUM: "border-indigo-500/40 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300",
    DIAMOND: "border-cyan-500/40 bg-cyan-500/10 text-cyan-800 dark:text-cyan-300",
    FREE: "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300",
  };

  const currentTierStyle = tierColorClasses[normalizedTier] || tierColorClasses.FREE;
  const label = customLabel || "✓ Verified";
  const roleDesc = normalizedRole === "employer" ? "employer" : normalizedRole === "seeker" ? "candidate" : "recruiter";

  return (
    <span
      aria-label={`Verified ${roleDesc} profile`}
      className={`inline-flex items-center font-bold border ${currentTierStyle} transition-all shadow-2xs ${sizeClasses} ${className}`}
    >
      <span className={`material-symbols-outlined font-black text-emerald-600 dark:text-emerald-400 ${iconSizes}`}>
        check_circle
      </span>
      {!showIconOnly && <span>{label}</span>}
    </span>
  );
}
