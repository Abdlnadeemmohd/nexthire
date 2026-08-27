"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  JobMarketIntelligence,
  MarketOverview,
  SourcingRecommendation,
} from "@/lib/market/types";

export default function RecruiterMarketIntelligencePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("overview");
  const [jobIntelligence, setJobIntelligence] = useState<JobMarketIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobLoading, setJobLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "skills" | "location" | "seniority" | "strictness" | "trends"
  >("overview");

  const loadOverview = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/recruiter/market-intelligence/overview");
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        if (isManual) showToast("Market intelligence refreshed", "success");
      } else {
        showToast(json.error || "Failed to load market intelligence", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading market overview", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadJobIntelligence = async (jobId: string) => {
    if (jobId === "overview") {
      setJobIntelligence(null);
      return;
    }

    setJobLoading(true);
    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}/market-intelligence`);
      const json = await res.json();
      if (json.success && json.data) {
        setJobIntelligence(json.data);
      } else {
        showToast(json.error || "Failed to load job market intelligence", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading job intelligence", "error");
    } finally {
      setJobLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedJobId(val);
    loadJobIntelligence(val);
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-16">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">travel_explore</span>
                    Market Intelligence Engine
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {user?.role === "RECRUITER_MANAGER" || user?.role === "COMPANY_ADMIN" || user?.role === "PLATFORM_ADMIN" || user?.isTester
                      ? "COMPANY TALENT SUPPLY (MANAGER)"
                      : "ASSIGNED REQUISITIONS (RECRUITER)"}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Talent Supply & Sourcing Strategy
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Grounded analysis of candidate supply, skill scarcity, location density, and supply vs. funnel bottlenecks.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedJobId}
                  onChange={handleJobChange}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="overview">Company Overview (All Jobs)</option>
                  {overview?.jobMarketSummaries?.map((j) => (
                    <option key={j.jobId} value={j.jobId}>
                      {j.jobTitle} ({j.supplyLevel})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    loadOverview(true);
                    if (selectedJobId !== "overview") loadJobIntelligence(selectedJobId);
                  }}
                  disabled={refreshing}
                  className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                  title="Refresh data"
                >
                  <span className={`material-symbols-outlined text-lg ${refreshing ? "animate-spin" : ""}`}>
                    refresh
                  </span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs - One line on desktop, controlled container scrolling on mobile */}
            <div className="w-full border-b border-slate-200 dark:border-slate-800 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-px">
              <div className="flex items-center justify-between xl:justify-start gap-1 xl:gap-2 min-w-max lg:min-w-0">
                {[
                  { id: "overview", label: "Overview & Strategy", icon: "dashboard" },
                  { id: "skills", label: "Skill Scarcity", icon: "psychology" },
                  { id: "location", label: "Geographic & Remote", icon: "location_on" },
                  { id: "seniority", label: "Seniority & Experience", icon: "badge" },
                  { id: "strictness", label: "Requirement Strictness", icon: "tune" },
                  { id: "trends", label: "Market Trends", icon: "trending_up" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 lg:px-2.5 xl:px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                      activeTab === tab.id
                        ? "border-primary text-primary bg-primary/5 dark:bg-primary/10 font-bold"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base xl:text-lg flex-shrink-0">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                  ))}
                </div>
                <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
              </div>
            ) : (
              <>
                {/* TAB 1: OVERVIEW & STRATEGY */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Top Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <span>Total Matching Supply</span>
                          <span className="material-symbols-outlined text-primary text-lg">group</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {jobIntelligence
                              ? jobIntelligence.talentSupply.totalMatching
                              : overview?.totalDiscoverableTalent || 0}
                          </span>
                          <span className="text-xs text-slate-500">active profiles</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {jobIntelligence ? `${jobIntelligence.talentSupply.qualifiedCount} qualified candidates` : "Across platform ecosystem"}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <span>Verified Evidence Pool</span>
                          <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {jobIntelligence
                              ? jobIntelligence.talentSupply.verifiedCount
                              : overview?.jobMarketSummaries.reduce((acc, j) => acc + j.verifiedCount, 0) || 0}
                          </span>
                          <span className="text-xs text-slate-500">assessment verified</span>
                        </div>
                        <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                          Phase 8 verified technical evidence &gt;= 75%
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <span>Supply vs Funnel Status</span>
                          <span className="material-symbols-outlined text-indigo-500 text-lg">alt_route</span>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                              jobIntelligence?.supplyVsFunnel.classification === "SUPPLY_CONSTRAINT"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : jobIntelligence?.supplyVsFunnel.classification === "FUNNEL_CONSTRAINT"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {jobIntelligence?.supplyVsFunnel.classification || "BALANCED_SUPPLY"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {jobIntelligence ? `Funnel Health: ${jobIntelligence.supplyVsFunnel.funnelHealthScore}/100` : "Active diagnosis available"}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <span>Talent Concentration</span>
                          <span className="material-symbols-outlined text-cyan-500 text-lg">hub</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {jobIntelligence
                              ? jobIntelligence.talentSupply.concentration.replace("_", " ")
                              : overview?.talentConcentration.replace("_", " ") || "DISTRIBUTED"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Top geographic concentration index
                        </div>
                      </div>
                    </div>

                    {/* Supply vs Funnel Diagnosis Card (If Job Selected) */}
                    {jobIntelligence && (
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-500">stethoscope</span>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              Supply vs. Funnel Constraint Diagnosis
                            </h2>
                          </div>
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Confidence: {jobIntelligence.supplyVsFunnel.confidence}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-4">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {jobIntelligence.supplyVsFunnel.diagnosisSummary}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {jobIntelligence.supplyVsFunnel.recommendation}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Observed Diagnostic Evidence:
                          </h3>
                          <ul className="space-y-1.5">
                            {jobIntelligence.supplyVsFunnel.evidence.map((ev, i) => (
                              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Prioritized Sourcing Recommendations */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500">lightbulb</span>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Prioritized Sourcing Strategy Recommendations
                          </h2>
                        </div>
                        <span className="text-xs text-slate-500">Ordered by impact priority</span>
                      </div>

                      <div className="space-y-4">
                        {(jobIntelligence
                          ? jobIntelligence.recommendations
                          : overview?.topRecommendations || []
                        ).map((rec) => (
                          <div
                            key={rec.id}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                                    rec.priority === "CRITICAL"
                                      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                      : rec.priority === "HIGH"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                  }`}
                                >
                                  {rec.priority}
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {rec.title}
                                </h3>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {rec.reason}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>Impact: {rec.expectedImpact}</span>
                                <span>•</span>
                                <span>Confidence: {rec.confidence}</span>
                              </div>
                            </div>

                            <Link
                              href={rec.ctaUrl}
                              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
                            >
                              {rec.ctaText}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SKILL SCARCITY */}
                {activeTab === "skills" && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          Skill Scarcity & Adjacent Skills Matrix
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Deterministic platform scarcity index and co-occurring adjacent skill pathways.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                            <th className="py-3 px-4">Skill</th>
                            <th className="py-3 px-4">Scarcity Level</th>
                            <th className="py-3 px-4">Candidates</th>
                            <th className="py-3 px-4">Pool Share</th>
                            <th className="py-3 px-4">Verified</th>
                            <th className="py-3 px-4">Adjacent Skills</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(jobIntelligence
                            ? jobIntelligence.skillScarcity
                            : overview?.topScarcitySkills || []
                          ).map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                                {s.skill}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded font-semibold ${
                                    s.relativeScarcity === "CRITICALLY_SCARCE"
                                      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                      : s.relativeScarcity === "SCARCE"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : s.relativeScarcity === "LIMITED"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                                      : s.relativeScarcity === "HEALTHY"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  }`}
                                >
                                  {s.relativeScarcity}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                                {s.matchingCount}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                {s.poolPercentage}%
                              </td>
                              <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                                {s.verifiedCount}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {s.adjacentSkills.map((adj, i) => (
                                    <span
                                      key={i}
                                      className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px]"
                                    >
                                      {adj}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: GEOGRAPHIC & REMOTE */}
                {activeTab === "location" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Geographic Hubs */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Top Geographic Talent Hubs
                      </h2>
                      <div className="space-y-3">
                        {(jobIntelligence
                          ? jobIntelligence.topLocations
                          : overview?.topLocations || []
                        ).map((loc, i) => (
                          <div
                            key={i}
                            className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {loc.city}, {loc.country}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {loc.qualifiedCandidates} qualified • {loc.verifiedCandidates} verified
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-primary">
                                {loc.totalCandidates} candidates
                              </div>
                              <div className="text-xs text-slate-500">
                                {loc.percentageOfPool}% of pool
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Remote & Hybrid Supply */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Remote & Hybrid Supply Distribution
                      </h2>
                      <div className="space-y-3">
                        {(jobIntelligence
                          ? jobIntelligence.remoteSupply
                          : overview?.remoteDistribution || []
                        ).map((r, i) => (
                          <div
                            key={i}
                            className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {r.remotePreference}
                              </span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {r.percentageOfPool}% ({r.candidateCount})
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${r.percentageOfPool}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              {r.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: SENIORITY & EXPERIENCE */}
                {activeTab === "seniority" && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Seniority & Experience Distribution
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(jobIntelligence
                        ? jobIntelligence.senioritySupply
                        : overview?.seniorityDistribution || []
                      ).map((sen) => (
                        <div
                          key={sen.level}
                          className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800"
                        >
                          <div className="text-xs font-bold text-primary uppercase">
                            {sen.level}
                          </div>
                          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                            {sen.totalCount} candidates
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Avg Exp: {sen.avgExperienceYears} yrs • {sen.percentageOfPool}% pool
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
                            {sen.verifiedCount} verified profiles
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: REQUIREMENT STRICTNESS SIMULATION */}
                {activeTab === "strictness" && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          Requirement Strictness & Pool Expansion Simulation
                        </h2>
                        {jobIntelligence && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            Strictness Score: {jobIntelligence.requirementStrictness.overallStrictnessScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Simulates candidate pool size expansion if specific mandatory constraints are relaxed.
                      </p>
                    </div>

                    {jobIntelligence ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200">
                          <strong>Simulation Summary:</strong> {jobIntelligence.requirementStrictness.summary}
                        </div>

                        <div className="space-y-3">
                          {jobIntelligence.requirementStrictness.simulations.map((sim, i) => (
                            <div
                              key={i}
                              className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {sim.parameter}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                  <span className="line-through text-slate-400">{sim.originalValue}</span> ➔{" "}
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{sim.relaxedValue}</span>
                                </div>
                                <p className="text-xs text-slate-500">{sim.rationale}</p>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    +{sim.poolGainPercentage}% Pool Gain
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {sim.originalPoolSize} ➔ {sim.relaxedPoolSize} profiles
                                  </div>
                                </div>

                                <Link
                                  href={`/recruiter/jobs/${jobIntelligence.jobId}/edit`}
                                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Adjust Job
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon="tune"
                        title="Select a Job Requisition"
                        description="Select an active job requisition above to simulate requirement relaxation and pool gain."
                      />
                    )}
                  </div>
                )}

                {/* TAB 6: MARKET TRENDS */}
                {activeTab === "trends" && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Historical Talent Supply & Growth Trends
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Observed growth rates in candidate volume, verified profiles, and emerging technical skills over time.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-xs text-slate-500 uppercase font-bold">Candidate Growth</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {overview?.recentTrends.candidateGrowthRate && overview.recentTrends.candidateGrowthRate >= 0 ? "+" : ""}
                          {overview?.recentTrends.candidateGrowthRate || 0}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Sample size: {overview?.recentTrends.sampleSize || 0} candidates
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-xs text-slate-500 uppercase font-bold">Qualified Profile Growth</div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          {overview?.recentTrends.qualifiedGrowthRate && overview.recentTrends.qualifiedGrowthRate >= 0 ? "+" : ""}
                          {overview?.recentTrends.qualifiedGrowthRate || 0}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          High-completeness profile surge
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-xs text-slate-500 uppercase font-bold">Remote Talent Influx</div>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                          {overview?.recentTrends.remoteCandidateGrowthRate && overview.recentTrends.remoteCandidateGrowthRate >= 0 ? "+" : ""}
                          {overview?.recentTrends.remoteCandidateGrowthRate || 0}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Remote & hybrid preference growth
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Top Emerging Skills in Candidate Registrations:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {overview?.recentTrends.topGrowingSkills.map((tg, i) => (
                          <div
                            key={i}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                          >
                            <span>{tg.skill}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">+{tg.growthPercentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Non-Fabrication Disclosure Disclaimer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-slate-400">info</span>
              <div>
                <strong>Data Truth & Disclosure:</strong> All metrics, scarcity indices, and supply distributions are calculated strictly from NextHire discoverable candidate registrations, profile evidence, and assessment verification submissions. No external labor market statistics are fabricated.
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
