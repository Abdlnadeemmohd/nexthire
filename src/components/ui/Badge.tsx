import React from "react";

export type ApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN"
  | "VERIFIED"
  | "APPROVED"
  | "ACTIVE"
  | "COMPLETED"
  | "PENDING"
  | "SUSPENDED"
  | "CANCELLED"
  | "BLOCKED"
  | "ERROR";

export interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function getStatusSpecs(status: string) {
  const normalized = status.toUpperCase().replace(/\s+/g, "_");

  switch (normalized) {
    case "APPLIED":
      return {
        label: "Applied",
        colorClasses: "bg-blue-50 text-blue-800 border-blue-200",
        icon: "send",
      };
    case "UNDER_REVIEW":
    case "PENDING":
      return {
        label: "Under Review",
        colorClasses: "bg-amber-50 text-amber-800 border-amber-200",
        icon: "visibility",
      };
    case "SHORTLISTED":
      return {
        label: "Shortlisted",
        colorClasses: "bg-indigo-50 text-indigo-800 border-indigo-200",
        icon: "star",
      };
    case "INTERVIEW":
    case "INTERVIEW_SCHEDULED":
      return {
        label: "Interview",
        colorClasses: "bg-purple-50 text-purple-800 border-purple-200",
        icon: "video_call",
      };
    case "OFFER":
    case "OFFER_EXTENDED":
      return {
        label: "Offer Extended",
        colorClasses: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: "verified",
      };
    case "HIRED":
    case "VERIFIED":
    case "APPROVED":
    case "ACTIVE":
    case "COMPLETED":
    case "SUCCESS":
      return {
        label: normalized === "HIRED" ? "Hired" : normalized.replace("_", " "),
        colorClasses: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: "check_circle",
      };
    case "REJECTED":
    case "SUSPENDED":
    case "CANCELLED":
    case "BLOCKED":
    case "ERROR":
      return {
        label: normalized === "REJECTED" ? "Rejected" : normalized.replace("_", " "),
        colorClasses: "bg-rose-50 text-rose-800 border-rose-200",
        icon: "cancel",
      };
    case "WITHDRAWN":
      return {
        label: "Withdrawn",
        colorClasses: "bg-slate-100 text-slate-700 border-slate-300",
        icon: "archive",
      };
    default:
      return {
        label: status.replace("_", " "),
        colorClasses: "bg-slate-100 text-slate-700 border-slate-200",
        icon: "info",
      };
  }
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const specs = getStatusSpecs(status);
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";
  const iconSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      role="status"
      aria-label={`Status: ${specs.label}`}
      className={`inline-flex items-center font-bold rounded-full border border-solid select-none whitespace-nowrap ${specs.colorClasses} ${sizeClasses} ${className}`}
    >
      {showIcon && (
        <span aria-hidden="true" className={`material-symbols-outlined font-bold flex-shrink-0 ${iconSize}`}>
          {specs.icon}
        </span>
      )}
      <span className="font-label-md">{specs.label}</span>
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const normalized = role.toUpperCase();
  let bg = "bg-slate-100 text-slate-700 border-slate-200";
  let icon = "person";

  if (normalized === "PLATFORM_ADMIN") {
    bg = "bg-rose-50 text-rose-800 border-rose-200";
    icon = "admin_panel_settings";
  } else if (normalized === "RECRUITER") {
    bg = "bg-blue-50 text-blue-800 border-blue-200";
    icon = "business_center";
  }

  return (
    <span
      role="status"
      aria-label={`Role: ${role.replace("_", " ")}`}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-label-md rounded-full font-bold uppercase tracking-wider border border-solid ${bg}`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-xs">
        {icon}
      </span>
      <span>{role.replace("_", " ")}</span>
    </span>
  );
}
