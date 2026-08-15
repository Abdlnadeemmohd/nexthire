"use client";

import React, { useState } from "react";
import Link from "next/link";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { JobAuthModal } from "@/components/jobs/JobAuthModal";
import { useAuth } from "@/context/AuthContext";
import { AIMatchBadge } from "@/components/ui/AIMatchBadge";

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
  const [showAiBreakdown, setShowAiBreakdown] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
      <article className="surface-card bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 hover:border-primary/50 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between h-full group">
        <div className="space-y-3.5">
          {/* Card Top: Logo, Company Name, Job Title & AI Match Score Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Link href={`/companies/${companyId}`} className="flex-shrink-0 mt-0.5">
                <img
                  src={logo}
                  alt={`${company} Logo`}
                  className="w-11 h-11 rounded-xl object-cover border border-outline-variant/30 bg-white p-1 shadow-xs group-hover:scale-105 transition-transform"
                />
              </Link>
              <div className="min-w-0 space-y-0.5">
                <Link
                  href={`/companies/${companyId}`}
                  className="text-xs font-label-md font-semibold text-outline hover:text-primary transition-colors block truncate"
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
            <div className="flex-shrink-0">
              <AIMatchBadge
                score={aiMatchScore}
                size="sm"
                interactive
                isExpanded={showAiBreakdown}
                onClick={() => setShowAiBreakdown(!showAiBreakdown)}
              />
            </div>
          </div>

          {/* AI Match Breakdown Drawer */}
          {showAiBreakdown && (
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs space-y-2 animate-fade-in">
              <div className="flex justify-between items-center font-bold text-[11px] text-on-surface border-b border-outline-variant/20 pb-1.5">
                <span>AI Match Score Breakdown</span>
                <span className="text-primary font-mono">{aiMatchScore}% Overall</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex justify-between font-medium">
                  <span className="text-outline">Technical Skills:</span>
                  <span className="font-bold text-emerald-800">94%</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-outline">Experience Level:</span>
                  <span className="font-bold text-primary">86%</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-outline">Education:</span>
                  <span className="font-bold text-on-surface">90%</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-outline">Industry Domain:</span>
                  <span className="font-bold text-emerald-800">89%</span>
                </div>
              </div>
            </div>
          )}

          {/* Location & Job Type Badges */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-label-md flex-wrap">
            <span className="inline-flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/30 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-outline" aria-hidden="true">location_on</span>
              {location}
            </span>
            <span className="inline-flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/30 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-outline" aria-hidden="true">work</span>
              {type}
            </span>
          </div>

          {/* Description line clamped */}
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 font-normal">
            {description}
          </p>

          {/* Skill Tag List with +N Overflow Collapse */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 min-h-[28px]">
            {visibleTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 bg-surface-container text-on-surface-variant text-[11px] font-label-md font-medium rounded-md border border-outline-variant/20"
              >
                {tag}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="px-2 py-0.5 bg-surface-container-low text-outline text-[11px] font-label-md font-medium rounded-md border border-outline-variant/30">
                +{hiddenTagCount} More
              </span>
            )}
          </div>
        </div>

        {/* Card Footer: Non-wrapping Salary + Anchored Action Buttons */}
        <div className="mt-4 sm:mt-5 pt-3.5 border-t border-outline-variant/20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] text-outline font-label-md font-bold uppercase tracking-wider block">
              Salary Range
            </span>
            <span className="font-headline-sm text-xs sm:text-sm font-bold text-primary whitespace-nowrap block truncate">
              {salary}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-xl border transition-all touch-target focus:outline-none focus:ring-1 focus:ring-primary ${
                isSaved
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-outline-variant/40 text-outline hover:text-on-surface hover:border-outline"
              }`}
              title={isSaved ? "Saved to your jobs" : "Save Job"}
              aria-label={isSaved ? "Saved to your jobs" : "Save Job"}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                {isSaved ? "bookmark_added" : "bookmark"}
              </span>
            </button>

            <Link
              href={`/jobs/${id}`}
              className="px-2.5 sm:px-3 py-2 border border-outline-variant/60 hover:border-primary text-on-surface hover:text-primary font-label-md font-bold text-xs rounded-xl transition-all whitespace-nowrap touch-target focus:outline-none focus:ring-1 focus:ring-primary"
            >
              Details
            </Link>

            <button
              type="button"
              onClick={handleApplyClick}
              className="px-3 sm:px-3.5 py-2 bg-primary text-on-primary font-label-md font-bold text-xs rounded-xl hover:bg-primary-hover active:bg-primary-active transition-all shadow-xs whitespace-nowrap touch-target focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            >
              Apply
            </button>
          </div>
        </div>
      </article>

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
