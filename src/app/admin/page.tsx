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

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    jobSeekers: 0,
    recruiters: 0,
    admins: 0,
    companies: 0,
    activeJobs: 0,
    totalApplications: 0,
    activeSubscriptions: 0,
    auditEventsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setStats(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6">
            <Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "Admin Operations" }]} />

            {/* Platform Admin Banner */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shadow-xs">
              <div className="space-y-1 z-10 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-700 text-[11px] font-bold rounded-full border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                    Platform Admin Console
                  </span>
                  <VerifiedBadge role="PLATFORM_ADMIN" size="sm" />
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                  Welcome back, {user?.name || "Platform Owner"}
                </h1>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  Stage 1 Production Simulation: Live PostgreSQL metrics, user directory controls, employer moderation, and system audit logs.
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto z-10">
                <Link
                  href="/admin/users"
                  className="px-3.5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">group</span>
                  User Directory
                </Link>
                <Link
                  href="/admin/companies"
                  className="px-3.5 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">apartment</span>
                  Companies
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className="px-3.5 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  Subscriptions
                </Link>
              </div>
            </div>

            {/* Live Database Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Registered Users</span>
                <div className="text-2xl font-bold text-on-surface font-display">{stats.totalUsers}</div>
                <p className="text-[10px] text-tertiary font-medium">
                  {stats.jobSeekers} Candidates • {stats.recruiters} Recruiters
                </p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Registered Companies</span>
                <div className="text-2xl font-bold text-primary font-display">{stats.companies}</div>
                <p className="text-[10px] text-primary font-medium">Authoritative Neon Database</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Active Published Jobs</span>
                <div className="text-2xl font-bold text-emerald-700 font-display">{stats.activeJobs}</div>
                <p className="text-[10px] text-emerald-700 font-medium">{stats.totalApplications} Total Applications</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Security & RBAC Status</span>
                <div className="text-2xl font-bold text-emerald-700 font-display">Active</div>
                <p className="text-[10px] text-emerald-700 font-medium">Enforced Server-Side</p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/admin/users"
                className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-3 hover:border-primary/40 transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">group</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface">User Directory & Roles</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Inspect user records, verify candidate profiles, and check recruiter role assignments.
                </p>
              </Link>

              <Link
                href="/admin/companies"
                className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-3 hover:border-primary/40 transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface">Employer Moderation</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Verify employer organizations, approve active hiring privileges, and manage listings.
                </p>
              </Link>

              <Link
                href="/admin/subscriptions"
                className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-3 hover:border-primary/40 transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface">SaaS Plans & Subscriptions</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Review subscription tiers, active billing status, and enterprise quotas.
                </p>
              </Link>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
