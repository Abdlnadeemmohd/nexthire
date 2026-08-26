"use client";

import React from "react";

interface RecProps {
  recommendations: Array<{
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    action: string;
    rationale: string;
    expectedImpact: string;
  }>;
}

export const ExecutiveRecommendationsWidget: React.FC<RecProps> = ({ recommendations }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Strategic Leadership Directives</h3>

      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rec.priority === "CRITICAL" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800"}`}>
                {rec.priority}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{rec.action}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1"><span className="font-semibold">Rationale:</span> {rec.rationale}</p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-1">🎯 <span className="font-semibold">Expected Impact:</span> {rec.expectedImpact}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
