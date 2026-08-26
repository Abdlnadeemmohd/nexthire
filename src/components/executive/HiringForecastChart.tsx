"use client";

import React from "react";

interface ForecastProps {
  forecast: {
    expectedCompletionDate: string | null;
    targetBreachRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    riskOfMissingTargetScore: number;
    expectedHiringVelocityPerMonth: number;
    sampleSize: number;
    confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
    historicalWindowDays: number;
    assumptions: string[];
    dataLimitations: string;
  };
}

export const HiringForecastChart: React.FC<ForecastProps> = ({ forecast }) => {
  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH": return "bg-amber-100 text-amber-800 border-amber-300";
      case "MEDIUM": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Placement Velocity Forecast</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">180-Day Historical Projection Engine</p>
        </div>
        <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${getRiskBadge(forecast.targetBreachRiskLevel)}`}>
          Risk: {forecast.targetBreachRiskLevel} ({forecast.riskOfMissingTargetScore}/100)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Expected Completion Date</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {forecast.expectedCompletionDate ? forecast.expectedCompletionDate.split("T")[0] : "Insufficient Data"}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Monthly Placement Rate</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {forecast.expectedHiringVelocityPerMonth} hires / mo
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Forecast Confidence</div>
          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {forecast.confidenceLevel} ({forecast.sampleSize} baseline sample)
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Model Assumptions & Limitations</div>
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
          {forecast.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
          <li className="text-amber-600 dark:text-amber-400 font-medium">{forecast.dataLimitations}</li>
        </ul>
      </div>
    </div>
  );
};
