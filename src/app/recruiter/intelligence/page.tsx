"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  IntelligenceOverview,
  JobFunnelMetrics,
  BottleneckItem,
  StalledCandidate,
  StrategicRecommendation,
  RecruiterWorkload,
} from "@/lib/intelligence/types";

export default function RecruiterHiringIntelligencePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [overview, setOverview] = useState<IntelligenceOverview | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [activeJobFunnel, setActiveJobFunnel] = useState<JobFunnelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "funnel" | "bottlenecks" | "stalled" | "workload">("overview");

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/recruiter/intelligence/overview");
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        if (json.data.jobsSummary?.jobFunnels?.length > 0) {
          if (selectedJobId === "all") {
            setActiveJobFunnel(json.data.jobsSummary.jobFunnels[0]);
          } else {
            const found = json.data.jobsSummary.jobFunnels.find((j: any) => j.jobId === selectedJobId);
            setActiveJobFunnel(found || json.data.jobsSummary.jobFunnels[0]);
          }
        }
        if (isManualRefresh) {
          showToast("Funnel intelligence refreshed successfully", "success");
        }
      } else {
        showToast(json.error || "Failed to load intelligence data", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Network error loading intelligence overview", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    if (!overview) return;
    if (jobId === "all") {
      setActiveJobFunnel(overview.jobsSummary.jobFunnels[0] || null);
    } else {
      const found = overview.jobsSummary.jobFunnels.find((j) => j.jobId === jobId);
      setActiveJobFunnel(found || null);
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Healthy</span>;
      case "WATCH":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">🟡 Watch</span>;
      case "AT_RISK":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">🟠 At Risk</span>;
      case "CRITICAL":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">🚨 Critical</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-800 uppercase tracking-wide">Critical</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-800 uppercase tracking-wide">High</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 uppercase tracking-wide">Medium</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-800 uppercase tracking-wide">Low</span>;
    }
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-slate-900 text-slate-100 min-h-screen pt-16 font-sans">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-16">
            <Breadcrumbs
                items={[
                  { label: "Recruiter Dashboard", href: "/recruiter" },
                  { label: "Hiring Funnel Intelligence & Strategy" },
                ]}
              />

              {/* Header Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <span>⚡ Hiring Funnel Intelligence</span>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                      Phase 11 Production Engine
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Grounded pipeline health, SLA bottleneck detection, candidate stall tracking, and recruiter strategy recommendations.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition disabled:opacity-50"
                  >
                    <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{refreshing ? "Computing..." : "Refresh Funnel"}</span>
                  </button>

                  <Link
                    href="/recruiter/copilot"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition"
                  >
                    <span>Ask Recruiter Copilot</span>
                    <span className="text-xs font-mono">⌘K</span>
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="py-24 text-center">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3"></div>
                  <p className="text-slate-400 text-sm">Computing real-time pipeline metrics and grounded signals...</p>
                </div>
              ) : !overview ? (
                <EmptyState
                  title="No Pipeline Data Available"
                  description="No active jobs or applicant data found in your company workspace to compute funnel intelligence."
                  actionText="Post a New Job"
                  onAction={() => {
                    if (typeof window !== "undefined") window.location.href = "/recruiter/jobs/new";
                  }}
                />
              ) : (
                <>
                  {/* Top Intelligence KPI Scorecards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Overall Funnel Health Card */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                        <span>Company Funnel Health</span>
                        {getHealthBadge(overview.jobsSummary.overallHealth)}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{overview.jobsSummary.averageHealthScore}</span>
                        <span className="text-xs text-slate-400">/ 100 Index</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Across {overview.jobsSummary.activeJobsCount} active hiring role{overview.jobsSummary.activeJobsCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Active Candidate Pipeline Card */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                        <span>Active Pipeline</span>
                        <span className="text-xs text-indigo-400 font-mono">
                          {overview.jobsSummary.totalApplications} total
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{overview.jobsSummary.totalActive}</span>
                        <span className="text-xs text-emerald-400 font-medium">In Progress</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {overview.jobsSummary.totalQualified} qualified candidates (match ≥ 75%)
                      </p>
                    </div>

                    {/* Bottlenecks & At Risk Card */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                        <span>SLA Bottlenecks</span>
                        {overview.bottlenecks.length > 0 ? (
                          <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-300 font-mono">
                            {overview.bottlenecks.length} active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            Clear
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{overview.bottlenecks.length}</span>
                        <span className="text-xs text-slate-400">Breaches</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {overview.stalledCandidates.length} candidate{overview.stalledCandidates.length !== 1 ? "s" : ""} stalled in stage
                      </p>
                    </div>

                    {/* Recruiter Workload Card */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                        <span>My Workload</span>
                        <span className={`px-2 py-0.5 text-xs rounded font-mono ${
                          overview.myWorkload?.status === "CRITICAL"
                            ? "bg-red-500/20 text-red-300"
                            : overview.myWorkload?.status === "OVERLOADED"
                            ? "bg-orange-500/20 text-orange-300"
                            : overview.myWorkload?.status === "BUSY"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}>
                          {overview.myWorkload?.status || "NORMAL"}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{overview.myWorkload?.workloadScore || 0}</span>
                        <span className="text-xs text-slate-400">/ 100 Load</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {overview.myWorkload?.pendingReviewsCount || 0} reviews, {overview.myWorkload?.pendingScorecardsCount || 0} scorecards due
                      </p>
                    </div>
                  </div>

                  {/* Navigation Tabs - One line on desktop, controlled container scrolling on mobile */}
                  <div className="w-full border-b border-slate-800 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-px">
                    <div className="flex items-center justify-between xl:justify-start gap-2 xl:gap-4 min-w-max lg:min-w-0">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                          activeTab === "overview"
                            ? "border-indigo-500 text-indigo-400 font-semibold"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        🎯 Action Center & Strategy ({overview.strategicRecommendations.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("funnel")}
                        className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                          activeTab === "funnel"
                            ? "border-indigo-500 text-indigo-400 font-semibold"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        📊 Visual Stage Funnel
                      </button>
                      <button
                        onClick={() => setActiveTab("bottlenecks")}
                        className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                          activeTab === "bottlenecks"
                            ? "border-indigo-500 text-indigo-400 font-semibold"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ⚠️ Operational Bottlenecks ({overview.bottlenecks.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("stalled")}
                        className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                          activeTab === "stalled"
                            ? "border-indigo-500 text-indigo-400 font-semibold"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ⏳ Stalled Candidates ({overview.stalledCandidates.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("workload")}
                        className={`pb-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                          activeTab === "workload"
                            ? "border-indigo-500 text-indigo-400 font-semibold"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        👥 Recruiter Workload
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: Action Center & Strategy */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-lg font-semibold text-white">Needs Your Attention (Priority Actions)</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Synthesized actions ranked by operational severity and expected pipeline acceleration.
                            </p>
                          </div>
                          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                            Deterministic Priority Engine
                          </span>
                        </div>

                        {overview.strategicRecommendations.length === 0 ? (
                          <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-slate-800">
                            <span className="text-3xl mb-2 block">✨</span>
                            <p className="text-sm font-medium text-slate-300">All candidate pipelines and SLA queues are clear!</p>
                            <p className="text-xs text-slate-500 mt-1">No urgent candidate stalls, review backlogs, or missing scorecards.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {overview.strategicRecommendations.map((rec) => (
                              <div
                                key={rec.id}
                                className="bg-slate-900/70 border border-slate-700/60 rounded-lg p-4 hover:border-slate-600 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    {getPriorityBadge(rec.priority)}
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      {rec.category.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-sm font-semibold text-white">{rec.title}</span>
                                    {rec.entityName && (
                                      <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                                        📌 {rec.entityName}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-300 mt-1">
                                    <span className="text-slate-400 font-medium">Observed Cause:</span> {rec.reason}
                                  </p>
                                  <p className="text-xs text-emerald-400 font-mono">
                                    <span>Impact:</span> {rec.expectedImpact}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Link
                                    href={rec.ctaUrl}
                                    className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition whitespace-nowrap"
                                  >
                                    {rec.ctaText} →
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Hiring Target Risks Summary */}
                      {overview.hiringTargetRisks && overview.hiringTargetRisks.length > 0 && (
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6">
                          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                            <span>🎯 Target Hiring Date & Velocity Tracking</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {overview.hiringTargetRisks.map((risk) => (
                              <div
                                key={risk.jobId}
                                className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-white">{risk.jobTitle}</span>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                    risk.velocityStatus === "ON_TRACK"
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : risk.velocityStatus === "BEHIND"
                                      ? "bg-amber-500/20 text-amber-300"
                                      : "bg-red-500/20 text-red-300"
                                  }`}>
                                    {risk.velocityStatus.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs py-1 border-y border-slate-800 font-mono">
                                  <div>
                                    <span className="text-slate-400 block">Hires Needed</span>
                                    <span className="text-white font-bold">{risk.hiresRemaining}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Days Left</span>
                                    <span className="text-white font-bold">{risk.daysUntilTarget ?? "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Est. Time</span>
                                    <span className="text-white font-bold">{risk.estimatedTimeToHireDays ? `${risk.estimatedTimeToHireDays}d` : "N/A"}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-400">{risk.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Visual Stage Funnel */}
                  {activeTab === "funnel" && (
                    <div className="space-y-6">
                      {/* Job Selector Banner */}
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <label htmlFor="job-filter-select" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Select Hiring Pipeline
                          </label>
                          <select
                            id="job-filter-select"
                            value={selectedJobId}
                            onChange={(e) => handleJobSelect(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 min-w-[280px]"
                          >
                            {overview.jobsSummary.jobFunnels.map((j) => (
                              <option key={j.jobId} value={j.jobId}>
                                {j.jobTitle} ({j.health.status} — {j.totalApplications} apps)
                              </option>
                            ))}
                          </select>
                        </div>

                        {activeJobFunnel && (
                          <div className="flex items-center gap-4 flex-wrap">
                            <div>
                              <span className="text-xs text-slate-400 block">Pipeline Health</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {getHealthBadge(activeJobFunnel.health.status)}
                                <span className="text-sm font-bold text-white">{activeJobFunnel.health.score}/100</span>
                              </div>
                            </div>
                            <div className="border-l border-slate-700 pl-4">
                              <span className="text-xs text-slate-400 block">Qualified Rate</span>
                              <span className="text-sm font-bold text-emerald-400">{activeJobFunnel.qualifiedRate ?? 0}%</span>
                            </div>
                            <div className="border-l border-slate-700 pl-4">
                              <span className="text-xs text-slate-400 block">Avg Time to Hire</span>
                              <span className="text-sm font-bold text-white">{activeJobFunnel.timeToHireHours ? `${Math.round(activeJobFunnel.timeToHireHours / 24)}d` : "N/A"}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Visual Funnel Stage Pipeline */}
                      {activeJobFunnel && (
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6">
                          <h3 className="text-base font-semibold text-white mb-4 flex items-center justify-between">
                            <span>Stage-by-Stage Conversion Funnel</span>
                            <span className="text-xs text-slate-400 font-normal">
                              Based on PostgreSQL Application Transitions & Events
                            </span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                            {activeJobFunnel.stages.map((st, idx) => (
                              <div
                                key={st.stage}
                                className="bg-slate-900/80 border border-slate-700/70 rounded-lg p-3.5 flex flex-col justify-between relative overflow-hidden"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-indigo-400 font-bold">0{idx + 1}</span>
                                    {st.dropOffRate !== null && st.dropOffRate > 50 && (
                                      <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                        Drop {st.dropOffRate}%
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                    {st.stage.replace(/_/g, " ")}
                                  </h4>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Total Entered:</span>
                                    <span className="text-white font-bold">{st.entrants}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Currently Active:</span>
                                    <span className="text-emerald-400 font-bold">{st.activeCount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Conversion:</span>
                                    <span className="text-indigo-300 font-bold">{st.conversionRate !== null ? `${st.conversionRate}%` : "—"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Median Time:</span>
                                    <span className="text-slate-300 font-mono">{st.medianTimeHours !== null ? `${Math.round(st.medianTimeHours / 24)}d` : "—"}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Health Diagnostic Explanation */}
                          <div className="mt-6 p-4 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300 space-y-2">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>🔍 Funnel Health Diagnosis:</span>
                              {getHealthBadge(activeJobFunnel.health.status)}
                            </div>
                            <p>{activeJobFunnel.health.calculationSummary}</p>
                            {activeJobFunnel.health.signals.length > 0 && (
                              <div className="space-y-1 pt-2 border-t border-slate-800">
                                <span className="text-slate-400 block font-medium">Detected Health Signals:</span>
                                {activeJobFunnel.health.signals.map((sig, sIdx) => (
                                  <div key={sIdx} className="flex items-center gap-2 text-slate-300">
                                    <span className={sig.type === "CRITICAL" ? "text-red-400" : sig.type === "WARNING" ? "text-amber-400" : "text-slate-400"}>
                                      • [{sig.type}]
                                    </span>
                                    <span>{sig.description}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Operational Bottlenecks */}
                  {activeTab === "bottlenecks" && (
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-white">Active Operational Bottlenecks</h2>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Automated detection across screening backlogs, overdue scorecards, pending assessments, and outreach stalls.
                          </p>
                        </div>
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                          SLA Compliance Rules
                        </span>
                      </div>

                      {overview.bottlenecks.length === 0 ? (
                        <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-slate-800">
                          <span className="text-3xl mb-2 block">✅</span>
                          <p className="text-sm font-medium text-slate-300">Zero active operational bottlenecks</p>
                          <p className="text-xs text-slate-500 mt-1">All candidates, interviews, and reviews are operating within target SLAs.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {overview.bottlenecks.map((b) => (
                            <div
                              key={b.id}
                              className="bg-slate-900/70 border border-slate-700/60 rounded-lg p-4 space-y-2"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  {getPriorityBadge(b.severity)}
                                  <span className="text-sm font-semibold text-white">{b.jobTitle}</span>
                                  <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                    {b.type.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <span className="text-xs text-amber-400 font-mono">
                                  {b.affectedCount} candidate{b.affectedCount !== 1 ? "s" : ""} affected • Oldest: {b.oldestAgeDays}d
                                </span>
                              </div>
                              <p className="text-xs text-slate-300">
                                <span className="text-slate-400 font-medium">Grounded Evidence:</span> {b.evidence}
                              </p>
                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-indigo-300">
                                  <strong>Action:</strong> {b.recommendedAction}
                                </span>
                                <Link
                                  href={`/recruiter/applicants?jobId=${b.jobId}`}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                                >
                                  Resolve Backlog →
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: Stalled Candidates */}
                  {activeTab === "stalled" && (
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-white">Stalled Candidates Watchlist</h2>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Candidates remaining in the same pipeline stage longer than the expected velocity limit.
                          </p>
                        </div>
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                          Stage Velocity SLAs
                        </span>
                      </div>

                      {overview.stalledCandidates.length === 0 ? (
                        <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-slate-800">
                          <span className="text-3xl mb-2 block">🌟</span>
                          <p className="text-sm font-medium text-slate-300">No stalled candidates detected</p>
                          <p className="text-xs text-slate-500 mt-1">All candidates are advancing through interview and review stages on schedule.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-slate-400 font-mono uppercase border-b border-slate-700">
                              <tr>
                                <th className="p-3">Risk</th>
                                <th className="p-3">Candidate</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Stage</th>
                                <th className="p-3">Days in Stage</th>
                                <th className="p-3">Match</th>
                                <th className="p-3">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {overview.stalledCandidates.map((c) => (
                                <tr key={c.applicationId} className="hover:bg-slate-800/50">
                                  <td className="p-3">{getPriorityBadge(c.riskLevel)}</td>
                                  <td className="p-3">
                                    <div className="font-semibold text-white">{c.candidateName}</div>
                                    <div className="text-[10px] text-slate-400">{c.candidateEmail}</div>
                                  </td>
                                  <td className="p-3 text-slate-300">{c.jobTitle}</td>
                                  <td className="p-3 font-mono text-indigo-300">{c.currentStage}</td>
                                  <td className="p-3 font-mono text-amber-400">
                                    {c.daysInStage} days <span className="text-slate-500">(Limit: {c.expectedThresholdDays}d)</span>
                                  </td>
                                  <td className="p-3 font-mono text-emerald-400 font-bold">{c.matchScore}%</td>
                                  <td className="p-3">
                                    <Link
                                      href={`/recruiter/applicants?applicationId=${c.applicationId}`}
                                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium"
                                    >
                                      Take Action →
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: Recruiter Workload */}
                  {activeTab === "workload" && (
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold text-white">Recruiter Workload & Capacity Intelligence</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Calculated from active assigned roles, pending resume reviews, scorecard obligations, and overdue SLA tasks.
                        </p>
                      </div>

                      {overview.myWorkload && (
                        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-400 uppercase tracking-wider block">Assigned Workload Score</span>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-bold text-white">{overview.myWorkload.workloadScore}</span>
                                <span className="text-xs text-slate-400">/ 100 Capacity Index</span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${
                              overview.myWorkload.status === "CRITICAL"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : overview.myWorkload.status === "OVERLOADED"
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                : overview.myWorkload.status === "BUSY"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {overview.myWorkload.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
                            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                              <span className="text-slate-400 block">Active Jobs</span>
                              <span className="text-lg font-bold text-white">{overview.myWorkload.activeJobsCount}</span>
                            </div>
                            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                              <span className="text-slate-400 block">Active Candidates</span>
                              <span className="text-lg font-bold text-white">{overview.myWorkload.activeCandidatesCount}</span>
                            </div>
                            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                              <span className="text-slate-400 block">Pending Reviews</span>
                              <span className="text-lg font-bold text-amber-400">{overview.myWorkload.pendingReviewsCount}</span>
                            </div>
                            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                              <span className="text-slate-400 block">Pending Scorecards</span>
                              <span className="text-lg font-bold text-indigo-400">{overview.myWorkload.pendingScorecardsCount}</span>
                            </div>
                            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                              <span className="text-slate-400 block">Upcoming Interviews</span>
                              <span className="text-lg font-bold text-emerald-400">{overview.myWorkload.upcomingInterviewsCount}</span>
                            </div>
                            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                              <span className="text-slate-400 block">Overdue Tasks</span>
                              <span className="text-lg font-bold text-red-400">{overview.myWorkload.overdueTasksCount}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 italic">
                            {overview.myWorkload.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
