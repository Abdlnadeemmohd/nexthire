"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Modal } from "@/components/ui/Modal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const [showRecruiterPreviewModal, setShowRecruiterPreviewModal] = useState(false);

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6">
            <Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "Admin Operations" }]} />

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

              <div className="flex flex-wrap items-center gap-3 z-10">
                <Link
                  href="/admin/companies"
                  className="px-4 py-2.5 btn-accessible-success font-bold text-xs rounded-2xl transition-all shadow-xs flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  Employer Verification Queue (3)
                </Link>
                <Link
                  href="/help"
                  className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">headset_mic</span>
                  Support Operations Inbox
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className="px-4 py-2.5 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-2xl transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  SaaS Revenue Overview
                </Link>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Active Users</span>
                <div className="text-3xl font-bold text-on-surface font-display">4</div>
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  +12.4% this month
                </p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Monthly Recurring Revenue</span>
                <div className="text-3xl font-bold text-primary font-display">$14,850</div>
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  42 Active SaaS Subscriptions
                </p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Pending Employer Approvals</span>
                <div className="text-3xl font-bold text-amber-700 font-display">3</div>
                <p className="text-xs text-on-surface-variant font-medium">Requires verification audit</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Platform Security Status</span>
                <div className="text-3xl font-bold text-emerald-700 font-display">100%</div>
                <p className="text-xs text-emerald-700 font-medium">RBAC Security Active</p>
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
                  Manage candidate, recruiter, and administrator account credentials and access rights.
                </p>
              </Link>

              <Link
                href="/admin/companies"
                className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-3 hover:border-primary/40 transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface">Employer Verification</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Audit company domain registration, tax credentials, and issue verified employer badges.
                </p>
              </Link>

              <Link
                href="/admin/subscriptions"
                className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-3 hover:border-primary/40 transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface">SaaS Revenue & Packages</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Configure subscription plans, track MRR/ARR growth, and audit employer billing invoices.
                </p>
              </Link>
            </div>
          </main>

          <Footer />
        </div>
      </div>

      {showRecruiterPreviewModal && (
        <Modal
          isOpen={showRecruiterPreviewModal}
          onClose={() => setShowRecruiterPreviewModal(false)}
          title="Recruiter Portal Sandbox Preview"
        >
          <div className="space-y-5">
            <div className="p-4 bg-tertiary-container/20 border border-tertiary-container/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-tertiary font-bold text-xs">
                <span className="material-symbols-outlined text-base">shield</span>
                <span>Role Isolation Active: Preview Sandbox</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                You are inspecting the Recruiter Workspace in administrative read-only preview mode. Your primary identity remains strictly <strong>PLATFORM_ADMIN</strong>.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-on-surface">Included Recruiter Workflow Capabilities:</h4>
              <ul className="space-y-2 text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">check_circle</span>
                  <span>Recruiter Candidate Pipeline & Kanban Sourcing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">check_circle</span>
                  <span>Company Profile & Branding Customization</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">check_circle</span>
                  <span>Employer Billing, AI Resume Quotas, & Job Limits</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
              <button
                onClick={() => setShowRecruiterPreviewModal(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
              <Link
                href="/recruiter"
                onClick={() => setShowRecruiterPreviewModal(false)}
                className="px-4 py-2 bg-tertiary text-on-tertiary font-bold text-xs rounded-xl hover:bg-tertiary-container transition-all flex items-center gap-1.5"
              >
                Open Recruiter Suite Sandbox
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
