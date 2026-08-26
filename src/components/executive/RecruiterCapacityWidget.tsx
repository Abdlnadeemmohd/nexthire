"use client";

import React from "react";

interface CapacityProps {
  capacity: {
    totalRecruiters: number;
    overloadedRecruitersCount: number;
    optimalRecruitersCount: number;
    underloadedRecruitersCount: number;
    averageCapacityLoadPercentage: number;
    projectedStaffingBottleneck: boolean;
    recommendedHiresRequired: number;
    limitations: {
      isSufficientData: boolean;
      sampleSize: number;
      confidence: string;
      reason?: string;
      assumptions: string[];
    };
  };
}

export const RecruiterCapacityWidget: React.FC<CapacityProps> = ({ capacity }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recruiter Staffing & Capacity</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Workload Load & Staffing Bottlenecks</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${capacity.projectedStaffingBottleneck ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
          {capacity.projectedStaffingBottleneck ? "Staffing Bottleneck Alert" : "Capacity Balanced"}
        </span>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg mb-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Composite Capacity Load</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{capacity.averageCapacityLoadPercentage}%</div>
        </div>

        <div className="text-right text-xs text-slate-600 dark:text-slate-400">
          <div>Team Size: <span className="font-bold text-slate-900 dark:text-white">{capacity.totalRecruiters} Recruiter(s)</span></div>
          {capacity.recommendedHiresRequired > 0 && (
            <div className="text-rose-600 dark:text-rose-400 font-semibold mt-1">
              Recommended Recruiter Hires: +{capacity.recommendedHiresRequired}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <div className="font-bold text-lg">{capacity.overloadedRecruitersCount}</div>
          <div className="text-[10px]">Overloaded</div>
        </div>

        <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <div className="font-bold text-lg">{capacity.optimalRecruitersCount}</div>
          <div className="text-[10px]">Optimal</div>
        </div>

        <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <div className="font-bold text-lg">{capacity.underloadedRecruitersCount}</div>
          <div className="text-[10px]">Underloaded</div>
        </div>
      </div>
    </div>
  );
};
