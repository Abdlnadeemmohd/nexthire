"use client";

import React from "react";

interface ProfileCompletenessWidgetProps {
  score: number;
  missingSections?: string[];
  recommendations?: string[];
  role?: "candidate" | "recruiter" | "company";
  onSectionClick?: (section: string) => void;
}

export function ProfileCompletenessWidget({
  score,
  missingSections = [],
  recommendations = [],
  role = "candidate",
  onSectionClick,
}: ProfileCompletenessWidgetProps) {
  const getScoreBadge = () => {
    if (score >= 90) return { label: "Verified All-Star", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
    if (score >= 70) return { label: "Strong Profile", color: "bg-primary/15 text-primary border-primary/30" };
    if (score >= 40) return { label: "Intermediate", color: "bg-amber-500/15 text-amber-700 border-amber-500/30" };
    return { label: "Getting Started", color: "bg-surface-container-high text-on-surface-variant border-outline-variant/30" };
  };

  const badge = getScoreBadge();

  const handleChipClick = (item: string) => {
    if (onSectionClick) {
      onSectionClick(item);
      return;
    }

    // Default smooth-scroll mapping by section keyword
    const lower = item.toLowerCase();
    let targetId = "";
    if (lower.includes("experience")) targetId = "section-experience";
    else if (lower.includes("education")) targetId = "section-education";
    else if (lower.includes("skill")) targetId = "section-skills";
    else if (lower.includes("cert")) targetId = "section-certifications";
    else if (lower.includes("project")) targetId = "section-projects";
    else if (lower.includes("bio") || lower.includes("headline") || lower.includes("about")) targetId = "section-header";
    else if (lower.includes("pref") || lower.includes("salary")) targetId = "section-preferences";
    else if (lower.includes("link") || lower.includes("portfolio")) targetId = "section-links";
    else if (lower.includes("company") || lower.includes("brand")) targetId = "section-company";
    else if (lower.includes("value") || lower.includes("culture")) targetId = "section-values";

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-lg sm:text-xl font-bold text-on-surface">
              Profile Completeness
            </h3>
            <span className={`px-3 py-1 font-bold text-xs rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-body-md pt-1">
            {role === "candidate"
              ? "Complete your professional profile to boost discoverability and rank higher in recruiter AI sourcing searches."
              : role === "recruiter"
              ? "A complete recruiter profile with company credentials boosts candidate response rates by up to 3.5x."
              : "Complete employer brand profiles attract 4x more qualified applicants."}
          </p>
        </div>

        <div className="flex items-baseline gap-1 self-start sm:self-auto font-display font-bold">
          <span className="text-3xl sm:text-4xl text-primary font-mono">{score}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden p-0.5 border border-outline-variant/20">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            score >= 90 ? "bg-emerald-500" : score >= 60 ? "bg-primary" : "bg-amber-500"
          }`}
          style={{ width: `${Math.max(5, score)}%` }}
        ></div>
      </div>

      {/* Recommended Improvements - Clean Compact Chips */}
      {(missingSections.length > 0 || recommendations.length > 0) && (
        <div className="pt-3 border-t border-outline-variant/15 space-y-3">
          <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
            Recommended Improvements
          </span>

          {missingSections.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {missingSections.map((item, idx) => {
                const cleanName = item.replace(/^Add\s+/i, "");
                return (
                  <button
                    key={`missing-${idx}`}
                    type="button"
                    onClick={() => handleChipClick(item)}
                    className="px-3.5 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30 hover:border-primary/50 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 touch-target active:scale-95 shadow-2xs group"
                    title={`Go to ${cleanName}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform" aria-hidden="true"></span>
                    <span>{cleanName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {recommendations.slice(0, 2).map((rec, idx) => (
                <p key={`rec-${idx}`} className="text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary flex-shrink-0" aria-hidden="true">
                    lightbulb
                  </span>
                  <span>{rec}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
