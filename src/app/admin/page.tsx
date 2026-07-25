"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export default function PlatformAdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8">
            {/* Header Banner */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xs">
              <div className="space-y-2 z-10 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-rose-500/15 text-rose-700 text-xs font-bold rounded-full border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                    Platform Admin Operations Console
                  </span>
                  <VerifiedBadge role="PLATFORM_ADMIN" size="sm" />
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Welcome back, {user?.name || "System Operator"}
                </h1>
                <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed">
                  Overview of live SaaS platform metrics, pending employer verification queue, user directories, and recurring revenue engines.
                </p>
              </div>

              <div className="flex items-center gap-3 z-10">
                <Link
                  href="/admin/companies"
                  className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  Employer Queue (3)
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className="px-4 py-2.5 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-2xl transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  SaaS Revenue
                </Link>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-outline text-xs font-label-md">
                  <span>Total Users</span>
                  <span className="material-symbols-outlined text-primary">group</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">48,920</h3>
                <p className="text-[11px] text-emerald-600 font-bold">+1,240 this week</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-outline text-xs font-label-md">
                  <span>Verified Employers</span>
                  <span className="material-symbols-outlined text-amber-600">business</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">2,288</h3>
                <p className="text-[11px] text-on-surface-variant font-bold">3 pending verification</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-outline text-xs font-label-md">
                  <span>Monthly Revenue (MRR)</span>
                  <span className="material-symbols-outlined text-emerald-600">trending_up</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">£142,500</h3>
                <p className="text-[11px] text-emerald-600 font-bold">+18.4% MoM Growth</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-outline text-xs font-label-md">
                  <span>System Uptime</span>
                  <span className="material-symbols-outlined text-purple-600">dns</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">99.99%</h3>
                <p className="text-[11px] text-emerald-600 font-bold">All systems healthy</p>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
