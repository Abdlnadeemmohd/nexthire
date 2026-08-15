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
  // Determine role specifications with honest trust labels
  const getBadgeSpecs = () => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return {
          label: customLabel || "Platform Admin",
          colorClasses: "bg-rose-50 text-rose-800 border-rose-200",
          iconColor: "text-rose-700",
          ariaLabel: "Verified Platform Administrator",
        };
      case "RECRUITER":
      case "PREMIUM_RECRUITER":
        return {
          label: customLabel || "Verified Recruiter",
          colorClasses: "bg-blue-50 text-blue-800 border-blue-200",
          iconColor: "text-blue-700",
          ariaLabel: "Verified Recruiter Profile",
        };
      case "COMPANY":
        return {
          label: customLabel || "Verified Employer",
          colorClasses: "bg-emerald-50 text-emerald-800 border-emerald-200",
          iconColor: "text-emerald-700",
          ariaLabel: "Verified Employer Organization",
        };
      case "HIRING_PARTNER":
        return {
          label: customLabel || "Hiring Partner",
          colorClasses: "bg-purple-50 text-purple-800 border-purple-200",
          iconColor: "text-purple-700",
          ariaLabel: "Official Hiring Partner",
        };
      case "JOB_SEEKER":
      default:
        return {
          label: customLabel || "Verified Candidate",
          colorClasses: "bg-slate-100 text-slate-700 border-slate-300",
          iconColor: "text-slate-600",
          ariaLabel: "Verified Candidate Account",
        };
    }
  };

  const specs = getBadgeSpecs();

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
      className={`inline-flex items-center font-bold rounded-full border border-solid uppercase whitespace-nowrap flex-shrink-0 select-none ${specs.colorClasses} ${sizeClasses} ${className}`}
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
