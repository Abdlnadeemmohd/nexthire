"use client";

import React from "react";

interface FunnelEfficiencyProps {
  channels: Array<{
    channelName: string;
    sourceType: string;
    totalOutreachOrCandidates: number;
    qualifiedCandidates: number;
    interviewsResulting: number;
    hiresResulting: number;
    conversionToQualifiedRate: number;
    conversionToHireRate: number;
    efficiencyRating: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  }>;
}

export const FunnelEfficiencyWidget: React.FC<FunnelEfficiencyProps> = ({ channels }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Sourcing Channel ROI & Conversion</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Yield Across Candidate Acquisition Channels</p>
        </div>
      </div>

      <div className="space-y-3">
        {channels.map((channel, idx) => (
          <div key={idx} className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-900 dark:text-white">{channel.channelName}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${channel.efficiencyRating === "HIGH" ? "bg-emerald-100 text-emerald-800" : channel.efficiencyRating === "MEDIUM" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                {channel.efficiencyRating}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-600 dark:text-slate-400 mt-2">
              <div>
                <span className="block text-[10px] text-slate-400">Total</span>
                <span className="font-bold text-slate-900 dark:text-white">{channel.totalOutreachOrCandidates}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Qualified</span>
                <span className="font-bold text-slate-900 dark:text-white">{channel.qualifiedCandidates} ({channel.conversionToQualifiedRate}%)</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Interviews</span>
                <span className="font-bold text-slate-900 dark:text-white">{channel.interviewsResulting}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Hires</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{channel.hiresResulting} ({channel.conversionToHireRate}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
