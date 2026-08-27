"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface JobRadarCard {
  jobId: string;
  title: string;
  location: string;
  employmentType: string;
  createdAt: string;
  applicationsCount: number;
  matchingCandidatesCount: number;
  strongCandidatesCount: number;
  newMatchesCount: number;
  topMatchedSkills: string[];
  ctaUrl: string;
}

interface SupplyTrend {
  category: string;
  trendPercentage: number | null;
  trendDirection: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  description: string;
}

interface ActionRequiredItem {
  id: string;
  type: string;
  priority: "CRITICAL" | "IMPORTANT" | "NORMAL";
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}

interface TalentRadarData {
  company: { id: string; name: string } | null;
  overview: {
    totalActiveJobs: number;
    totalMatchingCandidates: number;
    strongMatches: number;
    newMatchesThisWeek: number;
    recentlyActiveCandidates: number;
  };
  topSkills: Array<{ name: string; count: number }>;
  talentSupplyTrends: SupplyTrend[];
  jobRadarCards: JobRadarCard[];
  actionRequired: {
    pendingApplicationsCount: number;
    slaWarningsCount: number;
    slaBreachesCount: number;
    expiringJobsCount: number;
    overdueFeedbackCount: number;
    upcomingInterviewsCount: number;
    unreadMessagesCount: number;
    items: ActionRequiredItem[];
  };
  intelligenceCards: Array<{
    id: string;
    priority: string;
    title: string;
    description: string;
    ctaText: string;
    ctaUrl: string;
  }>;
}

export default function RecruiterTalentRadarPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<TalentRadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTalentRadar = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch("/api/recruiter/talent-radar");
      const json = await res.json();

      if (res.ok && json.success) {
        setData(json.data);
        if (isRefresh) showToast("Talent Radar refreshed with latest PostgreSQL data", "success");
      } else {
        showToast(json.error || "Failed to load Talent Radar", "error");
      }
    } catch (err) {
      console.error("Talent Radar fetch error:", err);
      showToast("Network error fetching Talent Radar intelligence", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTalentRadar();
  }, []);

  const getTrendBadge = (trend: SupplyTrend) => {
    if (trend.trendDirection === "INSUFFICIENT_DATA" || trend.trendPercentage === null) {
      return (
        <span className="px-2.5 py-1 bg-surface-container-highest text-on-surface-variant font-label-sm font-semibold rounded-full text-xs">
          Not enough data yet
        </span>
      );
    }

    if (trend.trendDirection === "UP") {
      return (
        <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-label-sm font-bold rounded-full text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          +{trend.trendPercentage}% Growth
        </span>
      );
    }

    if (trend.trendDirection === "DOWN") {
      return (
        <span className="px-2.5 py-1 bg-rose-500/15 text-rose-700 border border-rose-500/30 font-label-sm font-bold rounded-full text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">trending_down</span>
          {trend.trendPercentage}% Shift
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 bg-primary/10 text-primary font-label-sm font-semibold rounded-full text-xs flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">trending_flat</span>
        Stable Supply
      </span>
    );
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-16">
            {/* Header Title & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/20 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">radar</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                    Recruiter Talent Radar
                  </h1>
                  <VerifiedBadge isVerified={user?.isVerified} role="RECRUITER" tier={(user as any)?.subscriptionTier} size="md" />
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm font-body-md">
                  Real-time market intelligence, candidate supply matching & actionable hiring signals.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => loadTalentRadar(true)}
                  disabled={refreshing || loading}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md font-bold text-xs rounded-full border border-outline-variant/30 transition-all flex items-center gap-1.5 touch-target disabled:opacity-50"
                  title="Rescan PostgreSQL candidate matches"
                >
                  <span className={`material-symbols-outlined text-base ${refreshing ? "animate-spin" : ""}`}>
                    sync
                  </span>
                  {refreshing ? "Scanning..." : "Rescan Radar"}
                </button>
                <Link
                  href="/recruiter/candidates"
                  className="px-5 py-2 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-1.5 touch-target"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  Search All Talent
                </Link>
              </div>
            </div>

            {/* Action Required Banner (Priority alerts) */}
            {data?.actionRequired?.items && data.actionRequired.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-label-md font-bold uppercase tracking-wider text-outline">
                  <span className="material-symbols-outlined text-amber-600 text-sm">warning</span>
                  <span>Action Required ({data.actionRequired.items.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.actionRequired.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-xs ${
                        item.priority === "CRITICAL"
                          ? "bg-error/5 border-error/30"
                          : "bg-amber-500/5 border-amber-500/30"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                              item.priority === "CRITICAL"
                                ? "bg-error/15 text-error"
                                : "bg-amber-500/15 text-amber-700"
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span className="material-symbols-outlined text-sm text-outline">
                            {item.priority === "CRITICAL" ? "crisis_alert" : "notifications_active"}
                          </span>
                        </div>
                        <h4 className="font-headline-sm text-xs sm:text-sm font-bold text-on-surface">
                          {item.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <Link
                        href={item.ctaUrl}
                        className={`px-3.5 py-1.5 rounded-xl font-label-md font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                          item.priority === "CRITICAL"
                            ? "bg-error text-on-error hover:bg-error/90"
                            : "bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                      >
                        <span>{item.ctaText}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High-Level Overview Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-5 border border-outline-variant/20 animate-pulse space-y-3">
                    <div className="h-4 bg-outline-variant/30 rounded-md w-24" />
                    <div className="h-8 bg-outline-variant/40 rounded-lg w-16" />
                    <div className="h-3 bg-outline-variant/20 rounded-md w-32" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* 1. Total Matching Talent */}
                <div className="glass-card rounded-2xl p-4 sm:p-6 border border-outline-variant/20 space-y-1 sm:space-y-2">
                  <div className="flex justify-between items-center text-outline">
                    <span className="text-xs font-label-md uppercase font-semibold">Matching Talent</span>
                    <span className="material-symbols-outlined text-primary">groups</span>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                    {data?.overview.totalMatchingCandidates || 0}
                  </div>
                  <p className="text-[11px] text-primary font-label-sm">
                    Candidates match your {data?.overview.totalActiveJobs || 0} active roles
                  </p>
                </div>

                {/* 2. Strong Matches */}
                <div className="glass-card rounded-2xl p-4 sm:p-6 border border-outline-variant/20 space-y-1 sm:space-y-2">
                  <div className="flex justify-between items-center text-outline">
                    <span className="text-xs font-label-md uppercase font-semibold">Strong Matches</span>
                    <span className="material-symbols-outlined text-emerald-600">verified</span>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-700">
                    {data?.overview.strongMatches || 0}
                  </div>
                  <p className="text-[11px] text-emerald-600 font-label-sm">
                    ≥2 Verified skills & title alignment
                  </p>
                </div>

                {/* 3. New Matches This Week */}
                <div className="glass-card rounded-2xl p-4 sm:p-6 border border-outline-variant/20 space-y-1 sm:space-y-2">
                  <div className="flex justify-between items-center text-outline">
                    <span className="text-xs font-label-md uppercase font-semibold">New Matches</span>
                    <span className="material-symbols-outlined text-tertiary">fiber_new</span>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-tertiary">
                    {data?.overview.newMatchesThisWeek || 0}
                  </div>
                  <p className="text-[11px] text-tertiary font-label-sm">
                    Joined / updated in past 7 days
                  </p>
                </div>

                {/* 4. Recently Active Pool */}
                <div className="glass-card rounded-2xl p-4 sm:p-6 border border-outline-variant/20 space-y-1 sm:space-y-2">
                  <div className="flex justify-between items-center text-outline">
                    <span className="text-xs font-label-md uppercase font-semibold">Recently Active</span>
                    <span className="material-symbols-outlined text-purple-600">bolt</span>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-purple-700">
                    {data?.overview.recentlyActiveCandidates || 0}
                  </div>
                  <p className="text-[11px] text-purple-600 font-label-sm">
                    Active in marketplace (past 14 days)
                  </p>
                </div>
              </div>
            )}

            {/* Main Content Split: Job-by-Job Talent Connection (Left 8 cols) & Market Supply/Skills (Right 4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Job-to-Talent Match Grid */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">work</span>
                      Job → Talent Radar Connection
                    </h3>
                    <p className="text-xs text-on-surface-variant font-body-sm">
                      Discoverable candidate matches evaluated per active company job.
                    </p>
                  </div>

                  <Link
                    href="/recruiter/jobs/new"
                    className="text-xs font-label-md font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    + Post Job
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="glass-card rounded-2xl p-6 border border-outline-variant/20 animate-pulse space-y-4">
                        <div className="h-5 bg-outline-variant/30 rounded-md w-1/3" />
                        <div className="grid grid-cols-4 gap-4">
                          <div className="h-10 bg-outline-variant/20 rounded-xl" />
                          <div className="h-10 bg-outline-variant/20 rounded-xl" />
                          <div className="h-10 bg-outline-variant/20 rounded-xl" />
                          <div className="h-10 bg-outline-variant/20 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : data?.jobRadarCards && data.jobRadarCards.length > 0 ? (
                  <div className="space-y-3.5">
                    {data.jobRadarCards.map((job) => (
                      <div
                        key={job.jobId}
                        className="glass-card rounded-2xl p-5 sm:p-6 border border-outline-variant/20 hover:border-primary/30 transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-y-0.5">
                            <h4 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                              <Link href={`/jobs/${job.jobId}`} className="hover:text-primary transition-colors">
                                {job.title}
                              </Link>
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
                              <span>{job.location}</span>
                              <span>•</span>
                              <span>{job.employmentType}</span>
                              {job.topMatchedSkills.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-primary font-medium">
                                    Matches: {job.topMatchedSkills.join(", ")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-700 text-xs font-bold rounded-full border border-emerald-500/25">
                            Active Opening
                          </span>
                        </div>

                        {/* Metric Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                          <div className="p-2.5 bg-surface-container/60 rounded-xl border border-outline-variant/15">
                            <div className="text-xs text-outline font-label-md font-medium">Applications</div>
                            <div className="font-display text-lg font-bold text-on-surface">{job.applicationsCount}</div>
                          </div>

                          <div className="p-2.5 bg-primary-container/15 rounded-xl border border-primary/20">
                            <div className="text-xs text-primary font-label-md font-bold">Matching Talent</div>
                            <div className="font-display text-lg font-bold text-primary">{job.matchingCandidatesCount}</div>
                          </div>

                          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <div className="text-xs text-emerald-700 font-label-md font-bold">Strong Matches</div>
                            <div className="font-display text-lg font-bold text-emerald-700">{job.strongCandidatesCount}</div>
                          </div>

                          <div className="p-2.5 bg-tertiary-container/15 rounded-xl border border-tertiary/20">
                            <div className="text-xs text-tertiary font-label-md font-bold">New This Week</div>
                            <div className="font-display text-lg font-bold text-tertiary">{job.newMatchesCount}</div>
                          </div>
                        </div>

                        {/* Smart Action Footer */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-outline-variant/15">
                          <span className="text-xs text-outline font-body-sm">
                            {job.matchingCandidatesCount > 0
                              ? `Ready to source ${job.matchingCandidatesCount} pre-screened candidate profiles`
                              : "No candidates currently match this title/skill combination"}
                          </span>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Link
                              href={`/recruiter/applicants`}
                              className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold rounded-xl transition-all"
                            >
                              Review Pipeline ({job.applicationsCount})
                            </Link>

                            <Link
                              href={job.ctaUrl}
                              className="px-4 py-1.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1"
                            >
                              <span>View Matching Talent</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Active Jobs on Radar"
                    description="Publish an active job opening to activate NextHire Talent Radar and receive candidate match insights."
                    icon="radar"
                    actionLabel="Post New Job"
                    actionHref="/recruiter/jobs/new"
                  />
                )}
              </div>

              {/* Right Column: Market Supply Signals & Top Skills */}
              <div className="lg:col-span-4 space-y-6">
                {/* Talent Supply Trends */}
                <div className="glass-card rounded-2xl p-5 sm:p-6 border border-outline-variant/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-tertiary text-lg">insights</span>
                      Talent Supply Signals
                    </h4>
                    <span className="text-[10px] font-mono text-outline">Week-over-Week</span>
                  </div>

                  <div className="space-y-3">
                    {data?.talentSupplyTrends.map((trend) => (
                      <div
                        key={trend.category}
                        className="p-3 bg-surface-container/50 rounded-xl border border-outline-variant/15 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-on-surface">{trend.category}</span>
                          {getTrendBadge(trend)}
                        </div>
                        <p className="text-[11px] text-on-surface-variant font-body-sm leading-relaxed">
                          {trend.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Available Skills in Marketplace */}
                <div className="glass-card rounded-2xl p-5 sm:p-6 border border-outline-variant/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-lg">code</span>
                      Top Available Skills
                    </h4>
                    <span className="text-[10px] font-mono text-outline">Discoverable</span>
                  </div>

                  {data?.topSkills && data.topSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {data.topSkills.map((s) => (
                        <Link
                          key={s.name}
                          href={`/recruiter/candidates?skill=${encodeURIComponent(s.name)}`}
                          className="px-3 py-1.5 bg-surface-container-high hover:bg-primary-container/20 text-on-surface hover:text-primary rounded-xl text-xs font-label-md font-semibold border border-outline-variant/20 transition-all flex items-center gap-1.5 group"
                        >
                          <span>{s.name}</span>
                          <span className="px-1.5 py-0.2 bg-surface-container-lowest text-outline group-hover:text-primary text-[10px] font-bold rounded-md">
                            {s.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant">No candidate skills registered yet.</p>
                  )}
                </div>

                {/* Recruiter Intelligence Pro-Tip */}
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                    <span className="material-symbols-outlined text-base">psychology</span>
                    <span>Talent Intelligence Engine</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Matches are computed exclusively for candidates who have enabled public discoverability in their profile. Unlocking contact information utilizes your subscription allowance.
                  </p>
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
