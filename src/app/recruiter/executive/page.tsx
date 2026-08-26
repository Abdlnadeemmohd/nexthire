"use client";

import React, { useState, useEffect } from "react";
import { ExecutiveOverviewCards } from "@/components/executive/ExecutiveOverviewCards";
import { HiringPlanStatusWidget } from "@/components/executive/HiringPlanStatusWidget";
import { HiringForecastChart } from "@/components/executive/HiringForecastChart";
import { ExecutiveRisksBanner } from "@/components/executive/ExecutiveRisksBanner";
import { TimeToHireAnalysisWidget } from "@/components/executive/TimeToHireAnalysisWidget";
import { RecruiterCapacityWidget } from "@/components/executive/RecruiterCapacityWidget";
import { FunnelEfficiencyWidget } from "@/components/executive/FunnelEfficiencyWidget";
import { ExecutiveRecommendationsWidget } from "@/components/executive/ExecutiveRecommendationsWidget";
import { ExecutiveReportGeneratorModal } from "@/components/executive/ExecutiveReportGeneratorModal";
import { CopilotExecutiveWidget } from "@/components/executive/CopilotExecutiveWidget";

export default function ExecutiveDashboardPage() {
  const [overview, setOverview] = useState<any | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any | null>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any | null>(null);
  const [funnel, setFunnel] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOverview, resPlans, resForecast, resRisks, resPerf, resFunnel] = await Promise.all([
        fetch("/api/recruiter/executive/overview").then((r) => r.json()),
        fetch("/api/recruiter/executive/hiring-plan").then((r) => r.json()),
        fetch("/api/recruiter/executive/forecast").then((r) => r.json()),
        fetch("/api/recruiter/executive/risks").then((r) => r.json()),
        fetch("/api/recruiter/executive/performance").then((r) => r.json()),
        fetch("/api/recruiter/executive/funnel").then((r) => r.json()),
      ]);

      if (resOverview.success) setOverview(resOverview.data);
      if (resPlans.success) setPlans(resPlans.data);
      if (resForecast.success) setForecast(resForecast.data);
      if (resRisks.success) setRisks(resRisks.data);
      if (resPerf.success) setPerformance(resPerf.data);
      if (resFunnel.success) setFunnel(resFunnel.data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🏛️ Executive Hiring Intelligence Platform
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time executive metrics, placement forecasting, organizational risk radar, and business reporting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/recruiter/executive/export"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            📥 Export CSV
          </a>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            📊 Compile Executive Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-sm">
          Loading Executive Hiring Intelligence...
        </div>
      ) : (
        <>
          {/* Executive Overview KPIs */}
          {overview && <ExecutiveOverviewCards metrics={overview} />}

          {/* Organizational Risk Radar */}
          <ExecutiveRisksBanner risks={risks} />

          {/* Copilot Assistant */}
          <CopilotExecutiveWidget />

          {/* Core Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <HiringPlanStatusWidget plans={plans} />
              {forecast && <HiringForecastChart forecast={forecast} />}
              {funnel && <FunnelEfficiencyWidget channels={funnel.sourcingChannels} />}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {performance?.timeToHire && <TimeToHireAnalysisWidget data={performance.timeToHire} />}
              {performance?.capacity && <RecruiterCapacityWidget capacity={performance.capacity} />}
              {overview?.recommendations && (
                <ExecutiveRecommendationsWidget
                  recommendations={overview.recommendations.map((r: any) => ({
                    priority: r.priority,
                    action: r.action,
                    rationale: r.rationale,
                    expectedImpact: r.expectedImpact,
                  }))}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Executive Report Generator Modal */}
      <ExecutiveReportGeneratorModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerated={fetchData}
      />
    </div>
  );
}
