"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";

interface SaaSPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  activeSubscribers: number;
  jobLimit: string;
  aiAnalysisLimit: string;
  seatLimit: string;
  status: "ACTIVE" | "RETIRED";
}

const INITIAL_SAAS_PLANS: SaaSPlan[] = [
  {
    id: "plan-1",
    name: "Starter Package",
    monthlyPrice: 79,
    annualPrice: 63,
    activeSubscribers: 1245,
    jobLimit: "5 Active Jobs",
    aiAnalysisLimit: "100 Analyses",
    seatLimit: "1 Seat",
    status: "ACTIVE",
  },
  {
    id: "plan-2",
    name: "Growth Package",
    monthlyPrice: 199,
    annualPrice: 159,
    activeSubscribers: 642,
    jobLimit: "20 Active Jobs",
    aiAnalysisLimit: "1,000 Analyses",
    seatLimit: "5 Seats",
    status: "ACTIVE",
  },
  {
    id: "plan-3",
    name: "Professional Package",
    monthlyPrice: 299,
    annualPrice: 239,
    activeSubscribers: 312,
    jobLimit: "50 Active Jobs",
    aiAnalysisLimit: "5,000 Analyses",
    seatLimit: "10 Seats",
    status: "ACTIVE",
  },
  {
    id: "plan-4",
    name: "Enterprise Custom",
    monthlyPrice: 499,
    annualPrice: 399,
    activeSubscribers: 89,
    jobLimit: "Unlimited",
    aiAnalysisLimit: "Unlimited",
    seatLimit: "25+ Seats",
    status: "ACTIVE",
  },
];

export default function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<SaaSPlan[]>(INITIAL_SAAS_PLANS);
  const [selectedPlanModal, setSelectedPlanModal] = useState<SaaSPlan | null>(null);

  const handleUpdatePrice = (planId: string, newPrice: number) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, monthlyPrice: newPrice } : p))
    );
    showToast(`Updated monthly pricing for ${plans.find((p) => p.id === planId)?.name} to $${newPrice}/mo`, "success");
    setSelectedPlanModal(null);
  };

  const handleRefundUser = () => {
    showToast("Issued full refund for transaction #TXN-99812", "info");
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <main className="flex-1 lg:pl-72 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">payments</span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  SaaS Subscription & Revenue Engine
                </h1>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">
                Operator SaaS Business Management Console: Monitor MRR, ARR, active subscriber distribution, and configure subscription tiers.
              </p>
            </div>

            <button
              onClick={() => showToast("Opening SaaS plan creator modal...", "info")}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Create SaaS Plan Tier
            </button>
          </div>

          {/* Business Revenue KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between text-outline text-xs font-label-md">
                <span>Monthly Recurring Revenue (MRR)</span>
                <span className="material-symbols-outlined text-emerald-600">trending_up</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                $142,500<span className="text-xs text-emerald-700 font-bold ml-2">+18.4%</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">Annualized ARR: $1.71 Million</p>
            </div>

            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between text-outline text-xs font-label-md">
                <span>Active Subscriptions</span>
                <span className="material-symbols-outlined text-primary">groups</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                2,288<span className="text-xs text-primary font-bold ml-2">Paying Employers</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">Avg Revenue Per Account: $62.28/mo</p>
            </div>

            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between text-outline text-xs font-label-md">
                <span>Gross Churn Rate</span>
                <span className="material-symbols-outlined text-rose-600">trending_down</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                1.8%<span className="text-xs text-emerald-700 font-bold ml-2">-0.4% MoM</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">Industry benchmark: 2.5%</p>
            </div>

            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between text-outline text-xs font-label-md">
                <span>Trial Conversion Rate</span>
                <span className="material-symbols-outlined text-amber-600">auto_awesome</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                34.2%<span className="text-xs text-primary font-bold ml-2">+4.1%</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">Free Trial to Paid Conversion</p>
            </div>
          </div>

          {/* Active SaaS Subscription Tiers Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">layers</span>
                Configured SaaS Subscription Tiers ({plans.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-base font-bold text-on-surface">{plan.name}</h4>
                      <span className="px-2.5 py-0.5 bg-primary-container text-primary text-[10px] font-bold rounded-full">
                        {plan.activeSubscribers} Accounts
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-2xl font-bold text-on-surface">
                        ${plan.monthlyPrice}<span className="text-xs font-label-md text-outline"> / mo</span>
                      </h3>
                      <p className="text-[11px] text-on-surface-variant">Annual: ${plan.annualPrice}/mo billed yearly</p>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-2xl text-xs space-y-1.5 border border-outline-variant/20">
                      <div className="flex items-center justify-between">
                        <span className="text-outline">Job Postings:</span>
                        <span className="font-bold text-on-surface">{plan.jobLimit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-outline">AI Resume Quota:</span>
                        <span className="font-bold text-on-surface">{plan.aiAnalysisLimit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-outline">Team Seats:</span>
                        <span className="font-bold text-on-surface">{plan.seatLimit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20">
                    <button
                      onClick={() => setSelectedPlanModal(plan)}
                      className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      Edit Tier Pricing & Limits
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Billing Audit & Refunds Console */}
          <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">published_with_changes</span>
                Recent Platform Transactions & Operator Refunds
              </h3>
              <button
                onClick={handleRefundUser}
                className="px-4 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors"
              >
                Issue Operator Refund
              </button>
            </div>

            <div className="p-4 bg-surface-container-low rounded-2xl text-xs text-on-surface-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">verified</span>
                <div>
                  <span className="font-bold text-on-surface block">Stripe & SaaS Gateway Live Sync Active</span>
                  <span className="text-[11px] text-outline">Real-time webhook notifications enabled for subscriber renewals & churn events.</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-700 text-xs font-bold rounded-full">100% Operational</span>
            </div>
          </div>
        </main>
      </div>

      <Footer />

      {/* Edit Tier Pricing Modal */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Configure Pricing for {selectedPlanModal.name}
              </h3>
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="p-1 text-on-surface-variant hover:bg-surface-container rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-on-surface block mb-1">Monthly Pricing ($ USD)</label>
                <input
                  type="number"
                  defaultValue={selectedPlanModal.monthlyPrice}
                  id="monthly-price-input"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface font-mono font-bold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Job Postings Quota</label>
                <input
                  type="text"
                  defaultValue={selectedPlanModal.jobLimit}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface font-bold focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/20">
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const inputVal = (document.getElementById("monthly-price-input") as HTMLInputElement)?.value;
                  handleUpdatePrice(selectedPlanModal.id, Number(inputVal) || selectedPlanModal.monthlyPrice);
                }}
                className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-xs"
              >
                Save Pricing Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
