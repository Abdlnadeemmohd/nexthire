"use client";

import React, { useState } from "react";
import Link from "next/link";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { JobAuthModal } from "@/components/jobs/JobAuthModal";
import { useAuth } from "@/context/AuthContext";

export interface JobCardProps {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  logo: string;
  location: string;
  salary: string;
  type: string;
  tags: string[];
  description: string;
  aiMatchScore?: number;
}

export function JobCard({
  id,
  title,
  company,
  companyId = "c-1",
  logo,
  location,
  salary,
  type,
  tags,
  description,
  aiMatchScore = 88,
}: JobCardProps) {
  const { isAuthenticated } = useAuth();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleApplyClick = () => {
    if (isAuthenticated) {
      setIsApplyModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const visibleTags = tags.slice(0, 4);
  const hiddenTagCount = Math.max(0, tags.length - 4);

  return (
    <>
      <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full group">
        <div className="space-y-4">
          {/* Card Top: Logo, Company Name, Title & AI Match Score Badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <Link href={`/companies/${companyId}`} className="flex-shrink-0">
                <img
                  src={logo}
                  alt={company}
                  className="w-12 h-12 rounded-2xl object-cover border border-outline-variant/30 bg-white p-1 shadow-xs group-hover:scale-105 transition-transform"
                />
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/companies/${companyId}`}
                  className="text-xs font-label-md font-bold text-outline hover:text-primary transition-colors block truncate"
                >
                  {company}
                </Link>
                <Link href={`/jobs/${id}`}>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {title}
                  </h3>
                </Link>
              </div>
            </div>

            {/* AI Match Radial / Badge */}
            <div
              className="flex-shrink-0 px-2.5 py-1 bg-tertiary-container/30 border border-tertiary/20 text-tertiary rounded-full flex items-center gap-1.5 shadow-2xs"
              title="AI Skill Match Score"
            >
              <span className="material-symbols-outlined text-xs">auto_awesome</span>
              <span className="text-xs font-bold font-label-md">{aiMatchScore}%</span>
            </div>
          </div>

          {/* Location & Job Type Badges */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-label-md flex-wrap">
            <span className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-xl">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {location}
            </span>
            <span className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-xl">
              <span className="material-symbols-outlined text-sm">work</span>
              {type}
            </span>
          </div>

          {/* Description line clamped */}
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
            {description}
          </p>

          {/* Skill Tag List with +N Overflow Collapse */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {visibleTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[11px] font-label-md font-bold rounded-lg"
              >
                {tag}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="px-2 py-0.5 bg-surface-container-low text-outline text-[11px] font-label-md font-bold rounded-lg border border-outline-variant/30">
                +{hiddenTagCount} More
              </span>
            )}
          </div>
        </div>

        {/* Card Footer: Non-wrapping Salary + Anchored Action Buttons */}
        <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] text-outline font-label-md font-bold uppercase tracking-wider block">
              Salary Range
            </span>
            <span className="font-headline-sm text-sm font-bold text-primary whitespace-nowrap block truncate">
              {salary}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/jobs/${id}`}
              className="px-3.5 py-2 border border-outline-variant/40 hover:border-primary text-on-surface hover:text-primary font-label-md font-bold text-xs rounded-xl transition-all whitespace-nowrap"
            >
              View Details
            </Link>

            <button
              onClick={handleApplyClick}
              className="px-4 py-2 bg-primary text-on-primary font-label-md font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs whitespace-nowrap"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <JobApplyModal
        jobId={id}
        jobTitle={title}
        companyName={company}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />

      <JobAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        jobTitle={title}
      />
    </>
  );
}
