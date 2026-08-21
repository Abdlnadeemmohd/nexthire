"use client";

import React from "react";

interface ProfileCompletenessWidgetProps {
  score: number;
  missingSections?: string[];
  recommendations?: string[];
  role?: "candidate" | "recruiter" | "company";
}

export function ProfileCompletenessWidget({
  score,
  missingSections = [],
  recommendations = [],
  role = "candidate",
}: ProfileCompletenessWidgetProps) {
  const getScoreBadge = () => {
    if (score >= 90) return { label: "Verified All-Star", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
    if (score >= 70) return { label: "Strong Profile", color: "bg-primary/15 text-primary border-primary/30" };
    if (score >= 40) return { label: "Intermediate", color: "bg-amber-500/15 text-amber-700 border-amber-500/30" };
    return { label: "Getting Started", color: "bg-surface-container-high text-on-surface-variant border-outline-variant/30" };
  };

  const badge = getScoreBadge();

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
      <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden p-0.5 border border-outline-variant/20">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            score >= 90 ? "bg-emerald-500" : score >= 60 ? "bg-primary" : "bg-amber-500"
          }`}
          style={{ width: `${Math.max(5, score)}%` }}
        ></div>
      </div>

      {/* Checklist / Recommendations */}
      {(missingSections.length > 0 || recommendations.length > 0) && (
        <div className="pt-2 border-t border-outline-variant/15 space-y-3">
          <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
            Recommended Improvements
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {missingSections.map((item, idx) => (
              <div
                key={`missing-${idx}`}
                className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-amber-600">add_circle</span>
                <span>Add <strong>{item}</strong></span>
              </div>
            ))}

            {recommendations.slice(0, 3).map((rec, idx) => (
              <div
                key={`rec-${idx}`}
                className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-on-surface-variant flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-base text-primary flex-shrink-0 mt-0.5">tips_and_updates</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
