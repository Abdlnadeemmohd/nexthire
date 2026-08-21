"use client";

import React, { useState, useEffect } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface PlanConfig {
  id: string;
  name: string;
  tier: string;
  price: number;
  currency: string;
  durationDays: number;
  candidateSearchLimit: number;
  candidateUnlockLimit: number;
  resumeUnlockLimit: number;
  messageLimit: number;
  messagingLevel: string;
  contactSharingLevel: string;
  jobPostingLimit: number;
  advancedSearch: boolean;
  savedSearches: boolean;
  aiMatching: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  description: string;
  features: string[];
}

interface EntitlementsData {
  isTrial: boolean;
  trialStatus: string;
  trialSearchesUsed: number;
  trialSearchesLimit: number;
  trialJobPostingsUsed: number;
  trialJobPostingsLimit: number;
  planId: string;
  planName: string;
  planTier: string;
  candidateUnlockLimit: number;
  candidateUnlocksUsedToday: number;
  candidateUnlocksRemainingToday: number;
  resumeUnlockLimit: number;
  resumeUnlocksUsedToday: number;
  resumeUnlocksRemainingToday: number;
  messageLimit: number;
  messagesUsedToday: number;
  messagesRemainingToday: number;
  jobPostingLimit: number;
}

export default function RecruiterBillingPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [entitlements, setEntitlements] = useState<EntitlementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [plansRes, entRes] = await Promise.all([
        fetch("/api/billing/plans"),
        fetch("/api/billing/entitlements"),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        if (pData.success) setPlans(pData.data);
      }

      if (entRes.ok) {
        const eData = await entRes.json();
        if (eData.success) setEntitlements(eData.data);
      }
    } catch (err) {
      console.error("Failed to load billing data:", err);
      showToast("Error loading subscription tiers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleSubscribe = async (plan: PlanConfig) => {
    if (plan.id === "trial") {
      showToast("Trial Mode is automatically active for verified employers.", "info");
      return;
    }

    try {
      setSubscribingPlanId(plan.id);
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, paymentMethod: "SIMULATION" }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Successfully upgraded to ${plan.name}!`, "success");
        await loadBillingData();
      } else {
        showToast(data.error || "Failed to activate subscription.", "error");
      }
    } catch (err) {
      showToast("Network error during subscription activation.", "error");
    } finally {
      setSubscribingPlanId(null);
    }
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8 pb-20 sm:pb-24">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Billing & Subscriptions" }]} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">workspace_premium</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                    Recruiter Subscription & Usage Plans
                  </h1>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm pt-1">
                  Verified employers pay for talent sourcing volume, candidate unlocks, and hiring productivity.
                </p>
              </div>

              <div className="px-4 py-2 bg-surface-container-high text-on-surface text-xs font-bold rounded-2xl border border-outline-variant/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {entitlements?.isTrial ? "Trial Mode Active" : `${entitlements?.planName || "Active Plan"}`}
              </div>
            </div>

            {/* Current Active Plan Status & Usage Overview */}
            {entitlements && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Plan Card */}
                <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-surface-container-high text-primary text-xs font-bold rounded-full">
                      Current Plan
                    </span>
                    <span className="text-xs font-mono font-bold text-outline">{entitlements.planTier}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-on-surface">{entitlements.planName}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {entitlements.isTrial
                      ? "One-time evaluation mode with 5 candidate searches."
                      : `Active paid tier with daily allowances.`}
                  </p>
                </div>

                {/* Sourcing / Unlock Allowance Meter */}
                <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-3">
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-full">
                    {entitlements.isTrial ? "Trial Searches" : "Daily Candidate Unlocks"}
                  </span>
                  {entitlements.isTrial ? (
                    <div>
                      <div className="text-2xl font-bold text-on-surface">
                        {entitlements.trialSearchesUsed} / {entitlements.trialSearchesLimit}
                      </div>
                      <p className="text-xs text-primary font-semibold mt-1">
                        {Math.max(0, entitlements.trialSearchesLimit - entitlements.trialSearchesUsed)} searches remaining
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold text-on-surface">
                        {entitlements.candidateUnlocksRemainingToday} Left
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Used {entitlements.candidateUnlocksUsedToday} of {entitlements.candidateUnlockLimit} today
                      </p>
                    </div>
                  )}
                </div>

                {/* Resume Downloads & Jobs Meter */}
                <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-3">
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-full">
                    Resume Downloads & Vacancies
                  </span>
                  <div>
                    <div className="text-2xl font-bold text-on-surface">
                      {entitlements.isTrial ? "0 Resumes" : `${entitlements.resumeUnlocksRemainingToday} Resumes Left`}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {entitlements.isTrial
                        ? `${entitlements.trialJobPostingsUsed}/${entitlements.trialJobPostingsLimit} trial jobs posted`
                        : `Up to ${entitlements.jobPostingLimit} active job vacancies`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Ladder Grid */}
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                  Subscription Plans & Tiers
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Select a tier tailored to your hiring velocity. All plans include automated daily quota resets.
                </p>
              </div>

              {loading ? (
                <div className="py-20 text-center text-xs text-on-surface-variant">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading plan configurations...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-6">
                  {plans.map((plan) => {
                    const isCurrent = entitlements?.planId === plan.id;
                    const isPopular = plan.id === "gold";

                    return (
                      <div
                        key={plan.id}
                        className={`glass-card rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all relative ${
                          isCurrent
                            ? "border-2 border-primary bg-primary/5 shadow-lg"
                            : isPopular
                            ? "border-2 border-tertiary/60 bg-tertiary/5"
                            : "border border-outline-variant/30 bg-surface-container-lowest"
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-full shadow-xs uppercase tracking-wider">
                            Most Popular
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-on-surface">{plan.name}</h3>
                            <span className="text-[10px] font-mono font-bold text-outline">{plan.tier}</span>
                          </div>

                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-on-surface">
                                ₹{plan.price}
                              </span>
                              <span className="text-xs text-on-surface-variant">
                                {plan.price === 0 ? "one-time" : `/${plan.durationDays}d`}
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-1">{plan.description}</p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                            {plan.features.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-on-surface">
                                <span className="material-symbols-outlined text-xs text-emerald-600 flex-shrink-0 mt-0.5">
                                  check_circle
                                </span>
                                <span className="text-[11px]">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          {isCurrent ? (
                            <div className="w-full py-2.5 bg-primary/10 text-primary font-bold text-xs rounded-xl text-center border border-primary/30">
                              Active Tier
                            </div>
                          ) : plan.id === "trial" ? (
                            <div className="w-full py-2.5 bg-surface-container-high text-on-surface-variant font-bold text-xs rounded-xl text-center">
                              Evaluation Tier
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSubscribe(plan)}
                              disabled={subscribingPlanId === plan.id}
                              className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-md touch-target flex items-center justify-center gap-1.5"
                            >
                              {subscribingPlanId === plan.id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                                  Activating...
                                </>
                              ) : (
                                `Upgrade to ${plan.name}`
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
