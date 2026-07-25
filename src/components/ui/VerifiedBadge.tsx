"use client";

import React from "react";
import { UserRole } from "@/lib/auth";

export interface VerifiedBadgeProps {
  role?: UserRole | "COMPANY" | "PREMIUM_RECRUITER" | "HIRING_PARTNER";
  size?: "sm" | "md" | "lg";
  customLabel?: string;
  showIconOnly?: boolean;
  className?: string;
}

export function VerifiedBadge({
  role = "JOB_SEEKER",
  size = "sm",
  customLabel,
  showIconOnly = false,
  className = "",
}: VerifiedBadgeProps) {
  // Determine role specifications
  const getBadgeSpecs = () => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return {
          label: customLabel || "Platform Owner",
          colorClasses: "bg-rose-500/15 text-rose-600 border-rose-500/30",
          iconColor: "text-rose-600",
          ariaLabel: "Verified Platform Owner",
        };
      case "RECRUITER":
      case "PREMIUM_RECRUITER":
        return {
          label: customLabel || "Verified Recruiter",
          colorClasses: "bg-amber-500/15 text-amber-600 border-amber-500/30",
          iconColor: "text-amber-600",
          ariaLabel: "Verified Recruiter Account",
        };
      case "COMPANY":
        return {
          label: customLabel || "Verified Employer",
          colorClasses: "bg-amber-500/15 text-amber-600 border-amber-500/30",
          iconColor: "text-amber-600",
          ariaLabel: "Verified Employer Organization",
        };
      case "HIRING_PARTNER":
        return {
          label: customLabel || "Hiring Partner",
          colorClasses: "bg-purple-500/15 text-purple-600 border-purple-500/30",
          iconColor: "text-purple-600",
          ariaLabel: "Official Hiring Partner",
        };
      case "JOB_SEEKER":
      default:
        return {
          label: customLabel || "Verified Job Seeker",
          colorClasses: "bg-blue-500/15 text-blue-600 border-blue-500/30",
          iconColor: "text-blue-600",
          ariaLabel: "Verified Job Seeker Account",
        };
    }
  };

  const specs = getBadgeSpecs();

  // Size styling
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <span
      role="status"
      aria-label={specs.ariaLabel}
      title={specs.ariaLabel}
      className={`inline-flex items-center font-bold rounded-full border border-solid uppercase whitespace-nowrap flex-shrink-0 transition-transform hover:scale-105 select-none ${specs.colorClasses} ${sizeClasses} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`material-symbols-outlined font-bold flex-shrink-0 ${iconSizes} ${specs.iconColor}`}
      >
        verified
      </span>
      {!showIconOnly && <span>{specs.label}</span>}
    </span>
  );
}
