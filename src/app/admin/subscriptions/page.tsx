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
  activeCustomers: number;
  growthRate: string;
  mrrContribution: string;
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
    activeCustomers: 1245,
    growthRate: "+18%",
    mrrContribution: "£98,355",
    jobLimit: "5 Active Job Postings",
    aiAnalysisLimit: "100 AI Resume Analyses",
    seatLimit: "1 Recruiter Seat",
    status: "ACTIVE",
  },
  {
    id: "plan-2",
    name: "Growth Package",
    monthlyPrice: 199,
    annualPrice: 159,
    activeCustomers: 642,
    growthRate: "+9%",
    mrrContribution: "£127,758",
    jobLimit: "20 Active Job Postings",
    aiAnalysisLimit: "1,000 AI Resume Analyses",
    seatLimit: "5 Recruiter Seats",
    status: "ACTIVE",
  },
  {
    id: "plan-3",
    name: "Professional Package",
    monthlyPrice: 299,
    annualPrice: 239,
    activeCustomers: 312,
    growthRate: "+14%",
    mrrContribution: "£93,288",
    jobLimit: "50 Active Job Postings",
    aiAnalysisLimit: "5,000 AI Resume Analyses",
    seatLimit: "10 Recruiter Seats",
    status: "ACTIVE",
  },
  {
    id: "plan-4",
    name: "Enterprise Custom",
    monthlyPrice: 499,
    annualPrice: 399,
    activeCustomers: 89,
    growthRate: "+22%",
    mrrContribution: "£44,411",
    jobLimit: "Unlimited Job Postings",
    aiAnalysisLimit: "Unlimited AI Analyses",
    seatLimit: "25+ Recruiter Seats",
    status: "ACTIVE",
  },
];

interface ActivityLog {
  id: string;
  title: string;
  timestamp: string;
  type: "RENEWAL" | "UPGRADE" | "REFUND" | "FAILED";
  amount: string;
}

const RECENT_ACTIVITIES: ActivityLog[] = [
  {
    id: "act-1",
    title: "Growth Package renewed by Vercel Inc.",
    timestamp: "2 mins ago",
    type: "RENEWAL",
    amount: "+£199.00",
  },
  {
    id: "act-2",
    title: "Enterprise Custom upgraded by Stripe Tech",
    timestamp: "Yesterday",
    type: "UPGRADE",
    amount: "+£499.00",
  },
  {
    id: "act-3",
    title: "Partial refund processed for Apex Labs",
    timestamp: "3 days ago",
    type: "REFUND",
    amount: "-£45.00",
  },
];

export default function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<SaaSPlan[]>(INITIAL_SAAS_PLANS);
  const [selectedPlanModal, setSelectedPlanModal] = useState<SaaSPlan | null>(null);
  const [activeMenuPlanId, setActiveMenuPlanId] = useState<string | null>(null);

  const handleUpdatePrice = (planId: string, newPrice: number) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, monthlyPrice: newPrice } : p))
    );
    showToast(`Updated monthly pricing for ${plans.find((p) => p.id === planId)?.name} to £${newPrice}/mo`, "success");
    setSelectedPlanModal(null);
  };

  const handleActionClick = (actionName: string) => {
    showToast(`Triggered operator action: ${actionName}`, "info");
    setActiveMenuPlanId(null);
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8">
            {/* Header Banner & Floating Quick Actions */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">payments</span>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                      Platform Owner SaaS Business Console
                    </h1>
                  </div>
                  <p className="text-on-surface-variant text-xs sm:text-sm">
                    Executive SaaS Operations: Revenue metrics, subscription tier performance, active trials, and payment gateway health.
                  </p>
                </div>

                {/* Owner Quick Actions Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleActionClick("Create Plan")}
                    className="px-3.5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Create Plan
                  </button>
                  <button
                    onClick={() => handleActionClick("Export Revenue Report")}
                    className="px-3.5 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Export Revenue
                  </button>
                  <button
                    onClick={() => handleActionClick("Payment Gateway Settings")}
                    className="px-3 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                    title="Payment Gateway"
                  >
                    <span className="material-symbols-outlined text-base">credit_score</span>
                  </button>
                  <button
                    onClick={() => handleActionClick("Coupons & Promotions")}
                    className="px-3 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                    title="Coupons & Discounts"
                  >
                    <span className="material-symbols-outlined text-base">local_offer</span>
                  </button>
                </div>
              </div>

              {/* Executive Revenue KPI Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl space-y-1">
                  <span className="text-outline text-[11px] font-label-md">Monthly Recurring Revenue (MRR)</span>
                  <h3 className="font-display text-2xl font-bold text-on-surface">
                    £142,500 <span className="text-xs text-emerald-700 font-bold">+18.4%</span>
                  </h3>
                  <p className="text-[10px] text-on-surface-variant">Annualized ARR: £1.71 Million</p>
                </div>

                <div className="p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl space-y-1">
                  <span className="text-outline text-[11px] font-label-md">Active Paying Customers</span>
                  <h3 className="font-display text-2xl font-bold text-on-surface">
                    2,288 <span className="text-xs text-primary font-bold">Employers</span>
                  </h3>
                  <p className="text-[10px] text-on-surface-variant">Avg LTV: £3,450 per account</p>
                </div>

                <div className="p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl space-y-1">
                  <span className="text-outline text-[11px] font-label-md">Gross Churn Rate</span>
                  <h3 className="font-display text-2xl font-bold text-on-surface">
                    1.8% <span className="text-xs text-emerald-700 font-bold">-0.4% MoM</span>
                  </h3>
                  <p className="text-[10px] text-on-surface-variant">184 Active Free Trials</p>
                </div>

                <div className="p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl space-y-1">
                  <span className="text-outline text-[11px] font-label-md">Trial Conversion Rate</span>
                  <h3 className="font-display text-2xl font-bold text-on-surface">
                    34.2% <span className="text-xs text-emerald-700 font-bold">+4.1%</span>
                  </h3>
                  <p className="text-[10px] text-on-surface-variant">Free Trial to Paid Ratio</p>
                </div>
              </div>
            </div>

            {/* Rich SaaS Pricing Cards (2x2 Grid on Laptop Breakpoints) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">layers</span>
                  Configured SaaS Subscription Tiers ({plans.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative"
                  >
                    <div className="space-y-4">
                      {/* Top Header & Customer Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-headline-sm text-base font-bold text-on-surface">{plan.name}</h4>
                        <span className="px-2.5 py-1 bg-primary-container/20 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                          {plan.activeCustomers.toLocaleString()} Active Customers
                        </span>
                      </div>

                      {/* Pricing with Breathing Room */}
                      <div className="py-2 border-y border-outline-variant/15 space-y-1">
                        <div className="flex items-baseline gap-1">
                          <h3 className="font-display text-3xl font-bold text-on-surface">£{plan.monthlyPrice}</h3>
                          <span className="text-xs font-label-md text-on-surface-variant font-bold">/ per month</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-outline font-label-md">Billed annually</span>
                          <span className="text-emerald-700 font-bold">{plan.growthRate} Growth ({plan.mrrContribution})</span>
                        </div>
                      </div>

                      {/* Rich Icon-Based Feature Box */}
                      <div className="bg-surface-container-low rounded-2xl p-3 text-xs space-y-2.5 border border-outline-variant/20">
                        <div className="flex items-center gap-2.5 font-bold text-on-surface">
                          <span className="text-base">📄</span>
                          <span>{plan.jobLimit}</span>
                        </div>
                        <div className="flex items-center gap-2.5 font-bold text-on-surface">
                          <span className="text-base">🤖</span>
                          <span>{plan.aiAnalysisLimit}</span>
                        </div>
                        <div className="flex items-center gap-2.5 font-bold text-on-surface">
                          <span className="text-base">👥</span>
                          <span>{plan.seatLimit}</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button & 3-Dot Dropdown Menu */}
                    <div className="pt-3 border-t border-outline-variant/20 flex items-center gap-2 relative">
                      <button
                        onClick={() => setSelectedPlanModal(plan)}
                        className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">tune</span>
                        Manage Plan
                      </button>

                      {/* 3-Dot Menu Toggle */}
                      <button
                        onClick={() => setActiveMenuPlanId(activeMenuPlanId === plan.id ? null : plan.id)}
                        className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl border border-outline-variant/30"
                        aria-label="More plan options"
                      >
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>

                      {/* 3-Dot Dropdown Menu */}
                      {activeMenuPlanId === plan.id && (
                        <div className="absolute right-0 bottom-12 w-40 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl z-50 p-1.5 text-xs space-y-1 animate-scale-in">
                          <button
                            onClick={() => {
                              setSelectedPlanModal(plan);
                              setActiveMenuPlanId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-surface-container font-bold text-on-surface flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span> Edit Tier
                          </button>
                          <button
                            onClick={() => handleActionClick(`Duplicate ${plan.name}`)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-surface-container font-bold text-on-surface flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span> Duplicate
                          </button>
                          <button
                            onClick={() => handleActionClick(`Archive ${plan.name}`)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-surface-container font-bold text-on-surface-variant flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">archive</span> Archive
                          </button>
                          <button
                            onClick={() => handleActionClick(`Delete ${plan.name}`)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-500/10 font-bold text-rose-700 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm text-rose-700">delete</span> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Recent Platform Transactions & Billing Activity Feed */}
            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Recent Live Platform Transactions & Activity Feed
                </h3>
                <span className="text-xs text-outline font-label-md">Real-Time Webhook Feed</span>
              </div>

              <div className="space-y-2">
                {RECENT_ACTIVITIES.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between border border-outline-variant/15 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                          act.type === "RENEWAL"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : act.type === "UPGRADE"
                            ? "bg-primary-container text-primary"
                            : "bg-rose-500/15 text-rose-700"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {act.type === "RENEWAL" ? "autorenew" : act.type === "UPGRADE" ? "rocket_launch" : "history_toggle_off"}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-on-surface block">{act.title}</span>
                        <span className="text-[10px] text-outline">{act.timestamp}</span>
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold ${
                        act.amount.startsWith("+") ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {act.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>

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
                <label className="font-bold text-on-surface block mb-1">Monthly Pricing (£ GBP)</label>
                <input
                  type="number"
                  defaultValue={selectedPlanModal.monthlyPrice}
                  id="monthly-price-input-gbp"
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
                  const inputVal = (document.getElementById("monthly-price-input-gbp") as HTMLInputElement)?.value;
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
