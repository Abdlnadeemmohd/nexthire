"use client";

import React, { useState, useEffect } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function RecruiterBillingPage() {
  const { showToast } = useToast();
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecruiterStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/recruiter/jobs");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setActiveJobsCount(data.data.filter((j: any) => j.status === "ACTIVE").length);
          }
        }
      } catch (err) {
        console.error("Failed to load recruiter stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRecruiterStats();
  }, []);

  const handleSelectPlan = (planName: string) => {
    showToast(`Plan '${planName}' selected. Stripe payment gateway is in Stage 1 test mode.`, "info");
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Billing & Subscriptions" }]} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">credit_card</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                    Billing & Subscription Management
                  </h1>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm pt-1">
                  Manage your recruiter subscription tier, job credit allocations, and payment receipts.
                </p>
              </div>

              <div className="px-4 py-2 bg-surface-container-high text-on-surface text-xs font-bold rounded-2xl border border-outline-variant/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Stage 1 Simulation Mode
              </div>
            </div>

            {/* Current Subscription Status & Usage Meter */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Subscription Status Card */}
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-full border border-outline-variant/30">
                      Standard Tier
                    </span>
                    <span className="text-xs font-bold text-outline">Stage 1 Recruiter</span>
                  </div>

                  <div>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                      Free Tier <span className="text-xs font-label-md text-on-surface-variant">(Evaluation)</span>
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      No active paid subscription on file.
                    </p>
                  </div>

                  <div className="p-3.5 bg-surface-container-low rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-on-surface block">Stripe Gateway</span>
                    <p className="text-[11px] text-on-surface-variant">
                      Payment processing is in simulation mode. Live credit card processing will activate in Stage 2.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 space-y-2 text-xs">
                  <span className="text-outline font-label-md uppercase tracking-wider block text-[10px]">
                    Payment Method
                  </span>
                  <div className="p-3 bg-surface-container-low rounded-2xl text-on-surface-variant text-[11px]">
                    No payment method configured yet.
                  </div>
                </div>
              </div>

              {/* Real Database Usage Meter */}
              <div className="lg:col-span-2 glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-6">
                <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">data_usage</span>
                  Recruiter Resource Allocation & Usage
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Meter 1: Active Job Postings */}
                  <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-on-surface">Active Job Postings</span>
                      <span className="font-mono font-bold text-primary">{activeJobsCount} / 10 Active</span>
                    </div>
                    <div className="w-full h-2.5 bg-outline-variant/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((activeJobsCount / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant">Real job postings recorded in Neon PostgreSQL</p>
                  </div>

                  {/* Meter 2: Sourcing Quota */}
                  <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-on-surface">Candidate Sourcing</span>
                      <span className="font-mono font-bold text-emerald-700">Unlimited</span>
                    </div>
                    <div className="w-full h-2.5 bg-outline-variant/30 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                    </div>
                    <p className="text-[11px] text-on-surface-variant">Full candidate search access enabled</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Subscription Tiers Explorer */}
            <div className="space-y-4">
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Available Enterprise Hiring Plans
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card rounded-3xl p-6 border border-outline-variant/30 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-outline uppercase">Starter</span>
                    <h4 className="font-display text-2xl font-bold text-on-surface">$49<span className="text-xs text-on-surface-variant"> / mo</span></h4>
                    <p className="text-xs text-on-surface-variant">For growing startups with 1-3 open engineering roles.</p>
                  </div>
                  <button
                    onClick={() => handleSelectPlan("Starter")}
                    className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest font-bold text-xs rounded-2xl transition-colors"
                  >
                    Select Starter
                  </button>
                </div>

                <div className="glass-card rounded-3xl p-6 border border-primary/40 bg-primary/5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase">Growth</span>
                      <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full">Recommended</span>
                    </div>
                    <h4 className="font-display text-2xl font-bold text-on-surface">$199<span className="text-xs text-on-surface-variant"> / mo</span></h4>
                    <p className="text-xs text-on-surface-variant">Up to 20 active jobs, AI resume matching, and SLA automation.</p>
                  </div>
                  <button
                    onClick={() => handleSelectPlan("Growth")}
                    className="w-full py-2.5 bg-primary text-on-primary hover:bg-primary-container font-bold text-xs rounded-2xl transition-colors shadow-xs"
                  >
                    Select Growth
                  </button>
                </div>

                <div className="glass-card rounded-3xl p-6 border border-outline-variant/30 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-outline uppercase">Enterprise</span>
                    <h4 className="font-display text-2xl font-bold text-on-surface">$499<span className="text-xs text-on-surface-variant"> / mo</span></h4>
                    <p className="text-xs text-on-surface-variant">Unlimited jobs, dedicated talent partner, custom ATS integration.</p>
                  </div>
                  <button
                    onClick={() => handleSelectPlan("Enterprise")}
                    className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest font-bold text-xs rounded-2xl transition-colors"
                  >
                    Select Enterprise
                  </button>
                </div>
              </div>
            </div>

            {/* Invoice & Billing History */}
            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  Invoice & Billing Transactions
                </h3>
              </div>

              <EmptyState
                title="No billing transactions yet"
                description="Payment receipts and downloadable PDF invoices will appear here once subscription transactions occur."
                icon="receipt"
              />
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
