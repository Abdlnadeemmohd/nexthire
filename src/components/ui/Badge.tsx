import React from "react";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  let bg = "bg-surface-container-high text-on-surface-variant";

  if (["VERIFIED", "APPROVED", "ACTIVE", "HIRED", "COMPLETED", "SUCCESS"].includes(normalized)) {
    bg = "bg-tertiary-fixed text-on-tertiary-fixed font-bold";
  } else if (["PENDING", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"].includes(normalized)) {
    bg = "bg-primary-fixed text-on-primary-fixed font-bold";
  } else if (["REJECTED", "SUSPENDED", "CANCELLED", "BLOCKED", "ERROR"].includes(normalized)) {
    bg = "bg-error-container text-on-error-container font-bold";
  }

  return (
    <span className={`px-3 py-1 text-[11px] font-label-md rounded-full uppercase tracking-wider ${bg}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const normalized = role.toUpperCase();
  let bg = "bg-secondary-container text-on-secondary-container";

  if (normalized === "PLATFORM_ADMIN") {
    bg = "bg-error-container text-on-error-container font-bold";
  } else if (normalized === "RECRUITER") {
    bg = "bg-primary-container text-on-primary-container font-bold";
  }

  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-label-md rounded-full font-bold uppercase tracking-wider ${bg}`}>
      {role.replace("_", " ")}
    </span>
  );
}
