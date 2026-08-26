"use client";

import React from "react";

interface PlanProps {
  plans: Array<{
    planId: string;
    title: string;
    department: string;
    targetHires: number;
    completedHires: number;
    progressPercentage: number;
    targetDate: string;
    status: "TARGET" | "IN_PROGRESS" | "AT_RISK" | "BEHIND" | "COMPLETED";
    rolesSummary: Array<{ roleTitle: string; targetHires: number; filledHires: number; status: string }>;
  }>;
}

export const HiringPlanStatusWidget: React.FC<PlanProps> = ({ plans }) => {
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Hiring Plan Progress</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">No active hiring plans configured. Initialize a department plan to track placement targets.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-300";
      case "AT_RISK": return "bg-amber-100 text-amber-800 border-amber-300";
      case "BEHIND": return "bg-rose-100 text-rose-800 border-rose-300";
      default: return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Department Hiring Plans</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">{plans.length} active plan(s)</span>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.planId} className="p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium text-slate-900 dark:text-white text-sm">{plan.title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({plan.department})</span>
              </div>
              <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${getStatusBadge(plan.status)}`}>
                {plan.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 my-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${plan.status === "BEHIND" ? "bg-rose-500" : plan.status === "AT_RISK" ? "bg-amber-500" : "bg-indigo-600"}`}
                style={{ width: `${Math.min(100, plan.progressPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{plan.completedHires} of {plan.targetHires} hires completed ({plan.progressPercentage}%)</span>
              <span>Target: {plan.targetDate.split("T")[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
