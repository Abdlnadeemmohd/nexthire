"use client";

import React from "react";

export interface AIMatchBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  interactive?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  className?: string;
}

export function getAIMatchTier(score: number) {
  if (score >= 85) {
    return {
      tier: "EXCELLENT",
      label: "Excellent Match",
      shortLabel: "Excellent",
      colorClasses: "bg-emerald-50 text-emerald-800 border-emerald-200",
      iconColor: "text-emerald-700",
      icon: "auto_awesome",
    };
  }
  if (score >= 70) {
    return {
      tier: "STRONG",
      label: "Strong Match",
      shortLabel: "Strong",
      colorClasses: "bg-sky-50 text-sky-800 border-sky-200",
      iconColor: "text-sky-700",
      icon: "thumb_up",
    };
  }
  if (score >= 40) {
    return {
      tier: "MODERATE",
      label: "Moderate Match",
      shortLabel: "Moderate",
      colorClasses: "bg-amber-50 text-amber-800 border-amber-200",
      iconColor: "text-amber-700",
      icon: "tune",
    };
  }
  return {
    tier: "LOW",
    label: "Low Match",
    shortLabel: "Low",
    colorClasses: "bg-rose-50 text-rose-800 border-rose-200",
    iconColor: "text-rose-700",
    icon: "trending_down",
  };
}

export function AIMatchBadge({
  score,
  size = "md",
  showLabel = true,
  interactive = false,
  isExpanded = false,
  onClick,
  className = "",
}: AIMatchBadgeProps) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const tierInfo = getAIMatchTier(safeScore);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const ariaDescription = `AI Match Score: ${safeScore}% (${tierInfo.label})`;

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaDescription}
        aria-expanded={isExpanded}
        className={`inline-flex items-center font-bold rounded-full border border-solid transition-all shadow-xs hover:opacity-90 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${tierInfo.colorClasses} ${sizeClasses} ${className}`}
        title="Click to toggle AI Match Breakdown"
      >
        <span aria-hidden="true" className={`material-symbols-outlined font-bold flex-shrink-0 ${iconSizes} ${tierInfo.iconColor}`}>
          {tierInfo.icon}
        </span>
        <span className="font-mono font-bold">{safeScore}%</span>
        {showLabel && <span className="font-label-md hidden sm:inline">{tierInfo.shortLabel}</span>}
        <span aria-hidden="true" className={`material-symbols-outlined text-xs ${tierInfo.iconColor}`}>
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
      </button>
    );
  }

  return (
    <span
      role="status"
      aria-label={ariaDescription}
      className={`inline-flex items-center font-bold rounded-full border border-solid select-none ${tierInfo.colorClasses} ${sizeClasses} ${className}`}
    >
      <span aria-hidden="true" className={`material-symbols-outlined font-bold flex-shrink-0 ${iconSizes} ${tierInfo.iconColor}`}>
        {tierInfo.icon}
      </span>
      <span className="font-mono font-bold">{safeScore}%</span>
      {showLabel && <span className="font-label-md">{tierInfo.label}</span>}
    </span>
  );
}
