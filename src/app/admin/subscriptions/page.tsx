"use client";

import React, { useState, useEffect } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface PlanItem {
  id: string;
  name: string;
  tier: string;
  price: number;
  currency: string;
  durationDays: number;
  candidateSearchLimit: number;
  candidateUnlockLimit: number;
  resumeUnlockLimit: number;
  jobPostingLimit: number;
  description: string;
  features: string[];
}

interface SubscriptionRecord {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  currency: string;
  paymentId?: string;
  plan: PlanItem;
  user: {
    id: string;
    name: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
    isVerified: boolean;
  };
}

interface TrialRecord {
  id: string;
  candidateSearchesUsed: number;
  candidateSearchLimit: number;
  jobPostingsUsed: number;
  jobPostingLimit: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  recruiter: {
    id: string;
    name: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export default function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [metrics, setMetrics] = useState({
    mrr: "₹0",
    activeSubscribers: 0,
    totalTrials: 0,
    activeTrials: 0,
    completedTrials: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PLANS" | "SUBSCRIBERS" | "TRIALS">("PLANS");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setPlans(data.data.plans || []);
          setSubscriptions(data.data.subscriptions || []);
          setTrials(data.data.trials || []);
          setMetrics(data.data.metrics || {
            mrr: "₹0",
            activeSubscribers: 0,
            totalTrials: 0,
            activeTrials: 0,
            completedTrials: 0,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load admin subscriptions:", err);
      showToast("Error loading subscription data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] w-full pb-20 sm:pb-24">
            <Breadcrumbs items={[{ label: "Admin Hub", href: "/admin" }, { label: "Subscriptions & Sourcing Quotas" }]} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">workspace_premium</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                    Subscription & Sourcing Tier Oversight
                  </h1>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm pt-1">
                  Manage commercial subscription tiers, monitor active recruiter trials, and track live MRR metrics.
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 p-1 bg-surface-container-high rounded-2xl border border-outline-variant/30 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("PLANS")}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeTab === "PLANS" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Subscription Plans ({plans.length})
                </button>
                <button
                  onClick={() => setActiveTab("SUBSCRIBERS")}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeTab === "SUBSCRIBERS" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Active Subscribers ({subscriptions.length})
                </button>
                <button
                  onClick={() => setActiveTab("TRIALS")}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeTab === "TRIALS" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Recruiter Trials ({trials.length})
                </button>
              </div>
            </div>

            {/* Live Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Monthly Recurring Revenue (MRR)
                </span>
                <div className="text-3xl font-bold text-on-surface font-mono">{metrics.mrr}</div>
                <p className="text-[11px] text-outline">Real live revenue from active subscribers</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Active Paying Recruiters
                </span>
                <div className="text-3xl font-bold text-on-surface font-mono">{metrics.activeSubscribers}</div>
                <p className="text-[11px] text-outline">Paid employers on Silver, Gold, Diamond, Platinum</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Active Recruiter Trials
                </span>
                <div className="text-3xl font-bold text-emerald-700 font-mono">{metrics.activeTrials}</div>
                <p className="text-[11px] text-outline">Verified recruiters evaluating sourcing</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Completed / Exhausted Trials
                </span>
                <div className="text-3xl font-bold text-primary font-mono">{metrics.completedTrials}</div>
                <p className="text-[11px] text-outline">5/5 searches completed (Ready for upgrade)</p>
              </div>
            </div>

            {/* Tab 1: Subscription Plans Matrix */}
            {activeTab === "PLANS" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-base text-on-surface">{plan.name}</h3>
                          <span className="px-2 py-0.5 bg-surface-container-high text-on-surface font-mono text-[10px] font-bold rounded-md">
                            {plan.tier}
                          </span>
                        </div>

                        <div>
                          <span className="text-2xl font-bold text-on-surface">₹{plan.price}</span>
                          <span className="text-xs text-on-surface-variant">
                            {plan.price === 0 ? " one-time" : `/${plan.durationDays}d`}
                          </span>
                          <p className="text-xs text-on-surface-variant mt-1">{plan.description}</p>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-outline-variant/10 text-xs">
                          <div className="flex items-center justify-between text-on-surface">
                            <span className="text-on-surface-variant">Daily Unlocks:</span>
                            <span className="font-bold">{plan.candidateUnlockLimit > 0 ? `${plan.candidateUnlockLimit}/day` : "0 (Preview)"}</span>
                          </div>
                          <div className="flex items-center justify-between text-on-surface">
                            <span className="text-on-surface-variant">Resume Downloads:</span>
                            <span className="font-bold">{plan.resumeUnlockLimit > 0 ? `${plan.resumeUnlockLimit}/day` : "0 (Blocked)"}</span>
                          </div>
                          <div className="flex items-center justify-between text-on-surface">
                            <span className="text-on-surface-variant">Active Jobs:</span>
                            <span className="font-bold">{plan.jobPostingLimit} vacancies</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="block text-center py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl">
                          Active Tier
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Subscribers Table */}
            {activeTab === "SUBSCRIBERS" && (
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-lg text-on-surface">Commercial Subscribers Directory</h3>
                {subscriptions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 text-on-surface-variant">
                          <th className="py-3 px-4">Recruiter / Employer</th>
                          <th className="py-3 px-4">Plan Tier</th>
                          <th className="py-3 px-4">Amount Paid</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Valid Until</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {subscriptions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-surface-container/30">
                            <td className="py-3 px-4">
                              <div className="font-bold text-on-surface">{sub.user.name}</div>
                              <div className="text-[11px] text-on-surface-variant font-mono">{sub.user.email}</div>
                              {sub.company && (
                                <div className="text-[11px] text-primary font-semibold">{sub.company.name}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-on-surface">{sub.plan?.name || "Paid Plan"}</td>
                            <td className="py-3 px-4 font-mono font-bold text-on-surface">₹{sub.amountPaid}</td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 font-bold rounded-full border border-emerald-500/30">
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-outline">
                              {new Date(sub.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-on-surface-variant">
                    No active commercial subscriptions found in Neon PostgreSQL yet.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Recruiter Trials Table */}
            {activeTab === "TRIALS" && (
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-lg text-on-surface">Recruiter Trial Mode Monitoring</h3>
                {trials.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 text-on-surface-variant">
                          <th className="py-3 px-4">Recruiter</th>
                          <th className="py-3 px-4">Employer Company</th>
                          <th className="py-3 px-4">Candidate Searches</th>
                          <th className="py-3 px-4">Job Postings</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Started Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {trials.map((tr) => (
                          <tr key={tr.id} className="hover:bg-surface-container/30">
                            <td className="py-3 px-4">
                              <div className="font-bold text-on-surface">{tr.recruiter?.name || "Recruiter"}</div>
                              <div className="text-[11px] text-on-surface-variant font-mono">{tr.recruiter?.email}</div>
                            </td>
                            <td className="py-3 px-4 text-on-surface font-semibold">{tr.company?.name || "Company"}</td>
                            <td className="py-3 px-4 font-mono font-bold">
                              <span className={tr.candidateSearchesUsed >= tr.candidateSearchLimit ? "text-rose-600 font-bold" : "text-emerald-700"}>
                                {tr.candidateSearchesUsed} / {tr.candidateSearchLimit}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {tr.jobPostingsUsed} / {tr.jobPostingLimit}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 font-bold rounded-full ${
                                  tr.status === "COMPLETED"
                                    ? "bg-amber-500/10 text-amber-700 border border-amber-500/30"
                                    : "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30"
                                }`}
                              >
                                {tr.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-outline">
                              {new Date(tr.startedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-on-surface-variant">
                    No recruiter trials registered yet.
                  </div>
                )}
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
