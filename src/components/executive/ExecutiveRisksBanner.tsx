"use client";

import React from "react";

interface RiskProps {
  risks: Array<{
    riskId: string;
    category: string;
    riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
    observedFacts: string[];
    reason: string;
    affectedJobsCount: number;
    affectedCandidatesCount: number;
    recommendedAction: string;
    confidence: string;
    dataLimitations: string;
  }>;
}

export const ExecutiveRisksBanner: React.FC<RiskProps> = ({ risks }) => {
  if (!risks || risks.length === 0) {
    return (
      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Hiring Operations Nominal</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400">Zero critical or high organizational hiring risks detected across company requisitions.</div>
          </div>
        </div>
      </div>
    );
  }

  const getRiskStyle = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200";
      case "HIGH": return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200";
      default: return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Organizational Risk Radar</h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
          {risks.length} Risk Alert(s)
        </span>
      </div>

      <div className="space-y-3">
        {risks.map((r) => (
          <div key={r.riskId} className={`p-4 rounded-xl border ${getRiskStyle(r.riskLevel)} transition-all`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                    {r.riskLevel}
                  </span>
                  <span className="text-sm font-semibold">{r.category.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs mt-1 opacity-90">{r.reason}</p>

                <div className="mt-2 text-xs font-medium">
                  💡 <span className="font-semibold">Recommended Leadership Action:</span> {r.recommendedAction}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] opacity-75">Confidence: {r.confidence}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
