"use client";

import React from "react";

interface TimeToHireProps {
  data: {
    overallAverageDays: number | null;
    overallMedianDays: number | null;
    primaryBottleneckStage: string | null;
    primaryBottleneckType: string;
    stages: Array<{
      stageName: string;
      averageDays: number;
      medianDays: number;
      candidateCount: number;
    }>;
  };
}

export const TimeToHireAnalysisWidget: React.FC<TimeToHireProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Time to Hire Breakdown</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Stage Cycle Times & Primary Delays</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {data.overallAverageDays !== null ? `${data.overallAverageDays} Days Avg` : "N/A"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            ({data.overallMedianDays !== null ? `${data.overallMedianDays}d Median` : "N/A"})
          </span>
        </div>
      </div>

      {data.primaryBottleneckStage && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-xs">
          <span className="font-semibold text-amber-900 dark:text-amber-300">
            ⚠️ Primary Bottleneck: <span className="underline">{data.primaryBottleneckStage}</span> ({data.primaryBottleneckType.replace(/_/g, " ")})
          </span>
          <span className="text-amber-700 dark:text-amber-400 font-medium">Requires Leadership SLA Alignment</span>
        </div>
      )}

      <div className="space-y-3">
        {data.stages.map((stage, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-50 dark:bg-slate-800/40">
            <span className="font-medium text-slate-800 dark:text-slate-200">{stage.stageName}</span>
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
              <span>{stage.candidateCount} candidate(s)</span>
              <span className="font-bold text-slate-900 dark:text-white">{stage.averageDays}d avg ({stage.medianDays}d med)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
