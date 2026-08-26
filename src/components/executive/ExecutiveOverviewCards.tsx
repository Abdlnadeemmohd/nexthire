"use client";

import React from "react";

interface OverviewProps {
  metrics: {
    openRequisitions: number;
    filledPositions: number;
    jobsAtRisk: number;
    activeCandidates: number;
    interviewsScheduled: number;
    offersOutstanding: number;
    hiresCompleted: number;
    averageTimeToHireDays: number | null;
    offerAcceptanceRate: number | null;
    hiringTargetProgressPercentage: number | null;
  };
}

export const ExecutiveOverviewCards: React.FC<OverviewProps> = ({ metrics }) => {
  const cards = [
    { label: "Open Requisitions", value: metrics.openRequisitions, badge: `${metrics.jobsAtRisk} At Risk`, badgeColor: metrics.jobsAtRisk > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800" },
    { label: "Active Candidates", value: metrics.activeCandidates, badge: "Pipeline", badgeColor: "bg-blue-100 text-blue-800" },
    { label: "Interviews Scheduled", value: metrics.interviewsScheduled, badge: "Live", badgeColor: "bg-purple-100 text-purple-800" },
    { label: "Hires Completed", value: metrics.hiresCompleted, badge: `${metrics.filledPositions} Filled Jobs`, badgeColor: "bg-emerald-100 text-emerald-800" },
    { label: "Avg Time to Hire", value: metrics.averageTimeToHireDays !== null ? `${metrics.averageTimeToHireDays}d` : "N/A", badge: "Historical", badgeColor: "bg-slate-100 text-slate-700" },
    { label: "Target Progress", value: metrics.hiringTargetProgressPercentage !== null ? `${metrics.hiringTargetProgressPercentage}%` : "N/A", badge: "Overall Plan", badgeColor: "bg-indigo-100 text-indigo-800" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{card.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>{card.badge}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</div>
        </div>
      ))}
    </div>
  );
};
