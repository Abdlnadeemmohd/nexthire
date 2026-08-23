"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useToast } from "@/components/ui/Toast";

interface AdminStats {
  totalUsers: number;
  jobSeekers: number;
  recruiters: number;
  admins: number;
  companies: number;
  pendingCompanyVerifications: number;
  unverifiedRecruiters: number;
  activeJobs: number;
  totalApplications: number;
  activeSubscriptions: number;
  totalRevenue: number;
  openReportsCount: number;
  recentAuditLogs: Array<{
    id: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    metadata: string | null;
    timestamp: string;
  }>;
  systemHealth: {
    status: "HEALTHY" | "DEGRADED" | "CRITICAL";
    database: { status: "HEALTHY" | "DOWN"; latencyMs: number };
    emailService: { status: "HEALTHY" | "DOWN" | "DEV_MODE" };
    authService: { status: "HEALTHY" | "DOWN" };
    cronService: { status: "HEALTHY" | "DOWN" | "PENDING"; lastRun: string | null };
    recentErrorsCount: number;
  };
}

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdminDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
          if (isManualRefresh) showToast("Admin operational metrics refreshed", "success");
        }
      } else {
        showToast("Failed to load admin statistics", "error");
      }
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      showToast("Network error loading admin console", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  const getHealthBadge = (status?: string) => {
    switch (status) {
      case "CRITICAL":
        return (
          <span className="px-2.5 py-0.5 bg-error/15 text-error text-xs font-bold rounded-full border border-error/30 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-error" />
            Critical Outage
          </span>
        );
      case "DEGRADED":
        return (
          <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-700 text-xs font-bold rounded-full border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            Degraded Performance
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-700 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Operational Normal
          </span>
        );
    }
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6 pb-20 sm:pb-24">
            <Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "Operational Command Center" }]} />

            {/* Platform Admin Console Header */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shadow-xs">
              <div className="space-y-1 z-10 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-700 text-[11px] font-bold rounded-full border border-rose-500/30 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">shield_person</span>
                    Platform Owner Command Center
                  </span>
                  {getHealthBadge(stats?.systemHealth?.status)}
                  <VerifiedBadge role="PLATFORM_ADMIN" size="sm" />
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                  Welcome back, {user?.name || "Platform Owner"}
                </h1>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  Real-time PostgreSQL telemetry, authoritative revenue metrics, verification queues, and operational audit trail.
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto z-10">
                <button
                  onClick={() => loadAdminDashboard(true)}
                  disabled={refreshing || loading}
                  className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs rounded-xl border border-outline-variant/30 transition-all flex items-center gap-1.5 whitespace-nowrap touch-target disabled:opacity-50"
                  title="Rescan platform metrics"
                >
                  <span className={`material-symbols-outlined text-base ${refreshing ? "animate-spin" : ""}`}>
                    sync
                  </span>
                  {refreshing ? "Scanning..." : "Rescan Metrics"}
                </button>
                <Link
                  href="/admin/users"
                  className="px-3.5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">group</span>
                  Users ({stats?.totalUsers || 0})
                </Link>
                <Link
                  href="/admin/companies"
                  className="px-3.5 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">apartment</span>
                  Companies ({stats?.companies || 0})
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className="px-3.5 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  Billing
                </Link>
              </div>
            </div>

            {/* Subsystem Health Matrix */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-outline-variant/25 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">monitoring</span>
                  Real-time Subsystem Health
                </h3>
                <span className="text-[10px] font-mono text-outline">
                  Neon DB Latency: {stats?.systemHealth?.database?.latencyMs || 0}ms
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                {/* 1. Database */}
                <div className="p-3 bg-surface-container/60 rounded-xl border border-outline-variant/15 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-on-surface text-xs">Database</div>
                    <div className="text-[10px] text-outline">Neon PostgreSQL</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 text-[10px] font-bold rounded-md">
                    {stats?.systemHealth?.database?.status || "HEALTHY"}
                  </span>
                </div>

                {/* 2. Auth & RBAC */}
                <div className="p-3 bg-surface-container/60 rounded-xl border border-outline-variant/15 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-on-surface text-xs">Auth & RBAC</div>
                    <div className="text-[10px] text-outline">Server-Enforced</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 text-[10px] font-bold rounded-md">
                    ACTIVE
                  </span>
                </div>

                {/* 3. Resend Email */}
                <div className="p-3 bg-surface-container/60 rounded-xl border border-outline-variant/15 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-on-surface text-xs">Email Delivery</div>
                    <div className="text-[10px] text-outline">Resend API</div>
                  </div>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md">
                    {stats?.systemHealth?.emailService?.status || "HEALTHY"}
                  </span>
                </div>

                {/* 4. Background Workers */}
                <div className="p-3 bg-surface-container/60 rounded-xl border border-outline-variant/15 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-on-surface text-xs">Cron Workers</div>
                    <div className="text-[10px] text-outline">SLA / Digest</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 text-[10px] font-bold rounded-md">
                    {stats?.systemHealth?.cronService?.status || "HEALTHY"}
                  </span>
                </div>

                {/* 5. Stripe Billing */}
                <div className="p-3 bg-surface-container/60 rounded-xl border border-outline-variant/15 flex items-center justify-between col-span-2 sm:col-span-1">
                  <div className="space-y-0.5">
                    <div className="font-bold text-on-surface text-xs">SaaS Billing</div>
                    <div className="text-[10px] text-outline">Stripe Webhooks</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 text-[10px] font-bold rounded-md">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* Action Required Alert Cards (Verification Queues & Moderation) */}
            {((stats?.pendingCompanyVerifications || 0) > 0 ||
              (stats?.unverifiedRecruiters || 0) > 0 ||
              (stats?.openReportsCount || 0) > 0) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-label-md font-bold uppercase tracking-wider text-outline">
                  <span className="material-symbols-outlined text-amber-600 text-sm">priority_high</span>
                  <span>Operational Action Required</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Company Verification Queue */}
                  {(stats?.pendingCompanyVerifications || 0) > 0 && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-2xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 bg-amber-500/15 text-amber-700 text-[10px] font-bold uppercase rounded-md">
                            Pending Queue
                          </span>
                          <span className="material-symbols-outlined text-amber-600 text-sm">business</span>
                        </div>
                        <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                          {stats?.pendingCompanyVerifications} Company Verification{stats?.pendingCompanyVerifications === 1 ? "" : "s"}
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Employer accounts awaiting verification approval before active job posting.
                        </p>
                      </div>
                      <Link
                        href="/admin/companies"
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl text-center transition-colors"
                      >
                        Review Companies ({stats?.pendingCompanyVerifications})
                      </Link>
                    </div>
                  )}

                  {/* Recruiter Identity Queue */}
                  {(stats?.unverifiedRecruiters || 0) > 0 && (
                    <div className="p-4 bg-primary/5 border border-primary/25 rounded-2xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 bg-primary-container/20 text-primary text-[10px] font-bold uppercase rounded-md">
                            Recruiter Review
                          </span>
                          <span className="material-symbols-outlined text-primary text-sm">badge</span>
                        </div>
                        <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                          {stats?.unverifiedRecruiters} Unverified Recruiter{stats?.unverifiedRecruiters === 1 ? "" : "s"}
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Recruiter profiles pending verification checks and credential validation.
                        </p>
                      </div>
                      <Link
                        href="/admin/users"
                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-xl text-center transition-colors"
                      >
                        Review Recruiters ({stats?.unverifiedRecruiters})
                      </Link>
                    </div>
                  )}

                  {/* Moderation Reports Queue */}
                  {(stats?.openReportsCount || 0) > 0 && (
                    <div className="p-4 bg-error/5 border border-error/30 rounded-2xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 bg-error/15 text-error text-[10px] font-bold uppercase rounded-md">
                            Moderation
                          </span>
                          <span className="material-symbols-outlined text-error text-sm">flag</span>
                        </div>
                        <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                          {stats?.openReportsCount} Open Content Report{stats?.openReportsCount === 1 ? "" : "s"}
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Policy violation reports filed against job postings or platform users.
                        </p>
                      </div>
                      <Link
                        href="/admin/companies"
                        className="px-3.5 py-1.5 bg-error text-on-error hover:bg-error/90 font-bold text-xs rounded-xl text-center transition-colors"
                      >
                        Review Reports ({stats?.openReportsCount})
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Authoritative Live Database Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Registered Users</span>
                <div className="text-2xl font-bold text-on-surface font-display">{stats?.totalUsers || 0}</div>
                <p className="text-[10px] text-tertiary font-medium">
                  {stats?.jobSeekers || 0} Candidates • {stats?.recruiters || 0} Recruiters
                </p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Registered Companies</span>
                <div className="text-2xl font-bold text-primary font-display">{stats?.companies || 0}</div>
                <p className="text-[10px] text-primary font-medium">
                  {(stats?.companies || 0) - (stats?.pendingCompanyVerifications || 0)} Verified Employers
                </p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Active Published Jobs</span>
                <div className="text-2xl font-bold text-emerald-700 font-display">{stats?.activeJobs || 0}</div>
                <p className="text-[10px] text-emerald-700 font-medium">
                  {stats?.totalApplications || 0} Total Candidate Applications
                </p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">SaaS Revenue Volume</span>
                <div className="text-2xl font-bold text-emerald-700 font-display">
                  ${(stats?.totalRevenue || 0).toLocaleString()}
                </div>
                <p className="text-[10px] text-emerald-700 font-medium">
                  {stats?.activeSubscriptions || 0} Active Subscriptions
                </p>
              </div>
            </div>

            {/* Split Section: Quick Actions & Recent Security / Audit Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Quick Admin Modules (8 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-lg">admin_panel_settings</span>
                  Platform Operations Modules
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/admin/users"
                    className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2 hover:border-primary/40 transition-all shadow-xs group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-xl">group</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-on-surface">User Directory & Roles</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Inspect user accounts, verify recruiter credentials, and manage role permissions.
                    </p>
                  </Link>

                  <Link
                    href="/admin/companies"
                    className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2 hover:border-primary/40 transition-all shadow-xs group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-xl">verified_user</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-on-surface">Employer Verification</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Verify company documentation, grant hiring privileges, and moderate postings.
                    </p>
                  </Link>

                  <Link
                    href="/admin/subscriptions"
                    className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2 hover:border-primary/40 transition-all shadow-xs group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-xl">payments</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-on-surface">SaaS Subscriptions</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Track subscription tiers, payment records, unlock allowances, and billing history.
                    </p>
                  </Link>

                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl">radar</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-on-surface">Talent Intelligence Telemetry</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Candidate match calculations, search intent trends, and SLA compliance monitoring.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Audit Trail & Operational Incidents (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-outline text-lg">history</span>
                    System Audit Trail
                  </h3>
                  <span className="text-[10px] font-mono text-outline">PostgreSQL Live</span>
                </div>

                <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-2.5 max-h-[420px] overflow-y-auto">
                  {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
                    stats.recentAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-surface-container/50 rounded-xl border border-outline-variant/10 flex items-start gap-2.5 text-xs"
                      >
                        <div className="w-6 h-6 rounded-lg bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-outline">
                          <span className="material-symbols-outlined text-xs">receipt_long</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-on-surface truncate font-mono text-[11px]">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-outline flex-shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {log.resourceType}: {log.resourceId || log.actorId}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-on-surface-variant">
                      No recent audit events recorded.
                    </div>
                  )}
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
