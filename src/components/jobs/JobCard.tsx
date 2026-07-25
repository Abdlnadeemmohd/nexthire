"use client";

import React from "react";
import Link from "next/link";
import { Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

interface JobCardProps {
  job: Job;
  featured?: boolean;
  onApplyClick?: (job: Job) => void;
}

export function JobCard({ job, featured = false, onApplyClick }: JobCardProps) {
  const { user } = useAuth();
  const userRole = user?.role;

  return (
    <div
      className={`glass-card rounded-2xl p-6 sm:p-8 border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between h-full ${
        featured
          ? "border-primary/40 shadow-lg bg-gradient-to-br from-white via-surface to-secondary-container/10"
          : "border-outline-variant/20 hover:border-primary/30"
      }`}
    >
      <div className="space-y-4">
        {/* Header & Logo */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-2.5 shadow-xs border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-md font-semibold text-xs text-on-surface-variant">
                  {job.companyName}
                </span>
                <span className="material-symbols-outlined text-tertiary text-sm" title="Verified Employer">
                  verified
                </span>
              </div>
              <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface hover:text-primary transition-colors">
                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
              </h3>
            </div>
          </div>

          {featured && (
            <span className="px-3 py-1 bg-primary text-on-primary font-label-sm text-[10px] font-bold rounded-full uppercase tracking-wider flex-shrink-0">
              Featured
            </span>
          )}
        </div>

        {/* Details & Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-on-surface-variant font-label-md">
          <span className="flex items-center gap-1 bg-surface-container-high/60 px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {job.location}
          </span>
          <span className="flex items-center gap-1 bg-surface-container-high/60 px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm">work</span>
            {job.employmentType.replace("_", " ")}
          </span>
          {job.isRemote && (
            <span className="flex items-center gap-1 bg-tertiary-container/30 text-tertiary px-3 py-1 rounded-full font-bold">
              <span className="material-symbols-outlined text-sm">wifi</span>
              Remote
            </span>
          )}
        </div>

        <p className="text-on-surface-variant text-xs sm:text-sm font-body-md line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Skills Tag Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {job.tags.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-0.5 bg-surface-container text-on-surface-variant text-[11px] font-label-sm font-semibold rounded-md"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Footer & Apply CTA */}
      <div className="pt-6 mt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-outline font-label-sm block uppercase tracking-wider">
            Estimated Compensation
          </span>
          <span className="font-display font-bold text-base sm:text-lg text-primary">
            ${Math.round(job.salaryMin / 1000)}k - ${Math.round(job.salaryMax / 1000)}k
            <span className="text-xs text-on-surface-variant font-normal"> / year</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="px-4 py-2.5 text-xs font-label-md font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-all text-center"
          >
            View Details
          </Link>

          {userRole === "RECRUITER" ? (
            <Link
              href="/recruiter/applicants"
              className="px-5 py-2.5 text-xs font-label-md font-bold bg-surface-container-high hover:bg-primary-container/20 text-primary rounded-full transition-all text-center"
            >
              Recruiter View
            </Link>
          ) : userRole === "PLATFORM_ADMIN" ? (
            <Link
              href="/admin/companies"
              className="px-5 py-2.5 text-xs font-label-md font-bold bg-surface-container-high text-on-surface rounded-full transition-all text-center"
            >
              Admin Audit
            </Link>
          ) : (
            <button
              onClick={() => onApplyClick && onApplyClick(job)}
              className="px-6 py-2.5 text-xs font-label-md font-bold bg-primary text-on-primary rounded-full hover:bg-primary-container transition-all shadow-sm active:scale-95 text-center"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
