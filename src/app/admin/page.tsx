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

import { Security } from "@/lib/security";
import { useToast } from "@/components/ui/Toast";

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showRecruiterPreviewModal, setShowRecruiterPreviewModal] = useState(false);
  const [showFeatureFlagsModal, setShowFeatureFlagsModal] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [activeImpersonation, setActiveImpersonation] = useState<string | null>(null);

  const [featureFlags, setFeatureFlags] = useState({
    aiSourcingEngine: true,
    realtimeMessaging: true,
    videoInterviewCalls: true,
    stripePayments: true,
    autoSlaReminders: true,
  });

  const handleImpersonate = (role: "RECRUITER" | "JOB_SEEKER") => {
    if (role === "RECRUITER") {
      Security.impersonateUser("sarah.recruiter@stellarsystems.com", "RECRUITER");
      setActiveImpersonation("Recruiter (Sarah Jenkins)");
      showToast("Impersonating Recruiter profile: Sarah Jenkins", "info");
    } else {
      Security.impersonateUser("alex.morgan@candidate.com", "JOB_SEEKER");
      setActiveImpersonation("Job Seeker (Alex Morgan)");
      showToast("Impersonating Candidate profile: Alex Morgan", "info");
    }
  };

  const handleClearImpersonation = () => {
    Security.clearImpersonation();
    setActiveImpersonation(null);
    showToast("Cleared impersonation. Returned to Platform Admin view.", "success");
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6">
            <Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "Admin Operations" }]} />

            {/* Impersonation & Security Control Bar */}
            <div className="glass-card bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-lg">admin_panel_settings</span>
                <div>
                  <span className="font-bold text-on-surface">Admin Security & Impersonation Engine</span>
                  <p className="text-[11px] text-on-surface-variant">
                    {activeImpersonation ? (
                      <>Currently impersonating: <span className="font-bold text-amber-700">{activeImpersonation}</span></>
                    ) : (
                      "Impersonate user roles to test exact access controls or trigger feature flags."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {activeImpersonation ? (
                  <button
                    onClick={handleClearImpersonation}
                    className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-colors shadow-xs"
                  >
                    Clear Impersonation
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleImpersonate("RECRUITER")}
                      className="px-3 py-1.5 bg-surface text-on-surface border border-outline-variant/30 font-bold text-xs rounded-xl hover:bg-surface-container transition-colors"
                    >
                      Impersonate Recruiter
                    </button>
                    <button
                      onClick={() => handleImpersonate("JOB_SEEKER")}
                      className="px-3 py-1.5 bg-surface text-on-surface border border-outline-variant/30 font-bold text-xs rounded-xl hover:bg-surface-container transition-colors"
                    >
                      Impersonate Candidate
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowFeatureFlagsModal(true)}
                  className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">toggle_on</span>
                  Feature Flags
                </button>
              </div>
            </div>

            {/* Compact Header Banner */}
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
                  Welcome back, {user?.name || "System Operator"}
                </h1>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  Overview of live SaaS platform metrics, pending employer verification queue, user directories, and recurring revenue engines.
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto z-10">
                <Link
                  href="/admin/companies"
                  className="px-3.5 py-2 btn-accessible-success font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  Verification Queue (3)
                </Link>
                <Link
                  href="/help"
                  className="px-3.5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">headset_mic</span>
                  Support Inbox
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className="px-3.5 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap touch-target flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  Revenue
                </Link>
              </div>
            </div>

            {/* Quick Metrics Grid (Elevated Above Fold on Mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Active Users</span>
                <div className="text-2xl font-bold text-on-surface font-display">4</div>
                <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  +12.4% MoM
                </p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Monthly MRR</span>
                <div className="text-2xl font-bold text-primary font-display">$14,850</div>
                <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  42 Active SaaS Subs
                </p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Pending Employer Approvals</span>
                <div className="text-2xl font-bold text-amber-700 font-display">3</div>
                <p className="text-[10px] text-on-surface-variant font-medium">Verification queue</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Platform Security</span>
                <div className="text-2xl font-bold text-emerald-700 font-display">100%</div>
                <p className="text-[10px] text-emerald-700 font-medium">RBAC Active</p>
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

      {/* Feature Flags Management Modal */}
      {showFeatureFlagsModal && (
        <Modal
          isOpen={showFeatureFlagsModal}
          onClose={() => setShowFeatureFlagsModal(false)}
          title="Platform Feature Flags & Maintenance"
        >
          <div className="space-y-4 text-xs font-body-md">
            <p className="text-on-surface-variant">
              Instantly enable or disable core enterprise modules across all production environments without requiring code deployments.
            </p>

            <div className="space-y-3">
              {Object.entries(featureFlags).map(([flagKey, enabled]) => (
                <div key={flagKey} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <span className="font-bold text-on-surface capitalize">
                    {flagKey.replace(/([A-Z])/g, " $1")}
                  </span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setFeatureFlags({ ...featureFlags, [flagKey]: e.target.checked });
                      showToast(`Feature flag '${flagKey}' set to ${e.target.checked ? "ENABLED" : "DISABLED"}`, "info");
                    }}
                    className="w-4 h-4 text-primary rounded border-outline-variant cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
              <span className="font-bold text-error">System Maintenance Mode</span>
              <button
                onClick={() => {
                  setMaintenanceMode(!maintenanceMode);
                  showToast(`Maintenance mode ${!maintenanceMode ? "ENABLED" : "DISABLED"}`, !maintenanceMode ? "info" : "success");
                }}
                className={`px-3 py-1.5 font-bold text-xs rounded-xl ${
                  maintenanceMode ? "bg-error text-on-error" : "bg-surface-container-high text-on-surface border border-outline-variant/30"
                }`}
              >
                {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
