"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "PAID" | "PENDING";
  plan: string;
  pdfUrl: string;
}

const INVOICE_HISTORY: Invoice[] = [
  {
    id: "INV-2026-004",
    date: "2026-07-01",
    amount: "$199.00",
    status: "PAID",
    plan: "Growth Plan (Monthly)",
    pdfUrl: "#",
  },
  {
    id: "INV-2026-003",
    date: "2026-06-01",
    amount: "$199.00",
    status: "PAID",
    plan: "Growth Plan (Monthly)",
    pdfUrl: "#",
  },
  {
    id: "INV-2026-002",
    date: "2026-05-01",
    amount: "$199.00",
    status: "PAID",
    plan: "Growth Plan (Monthly)",
    pdfUrl: "#",
  },
];

export default function RecruiterBillingPage() {
  const { showToast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [autoRenew, setAutoRenew] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    showToast(`Promo code '${promoCode}' applied! 15% discount will be reflected on next renewal.`, "success");
    setPromoCode("");
  };

  const handleDownloadInvoice = (invId: string) => {
    showToast(`Downloading PDF receipt for invoice ${invId}...`, "info");
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="recruiter" />

        <main className="flex-1 lg:pl-72 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">credit_card</span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Billing & Subscription Management
                </h1>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">
                Manage your enterprise recruiter subscription plan, payment methods, job credit quotas, and invoices.
              </p>
            </div>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-base">rocket_launch</span>
              Upgrade Plan
            </button>
          </div>

          {/* Current Subscription Card & Credit Meter Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Active Plan Card */}
            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-emerald-500/15 text-emerald-700 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    Active Subscription
                  </span>
                  <span className="text-xs font-bold text-outline">Growth Plan</span>
                </div>

                <div>
                  <h3 className="font-display text-3xl font-bold text-on-surface">
                    $199<span className="text-sm font-label-md text-on-surface-variant"> / month</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Renews automatically on <strong className="text-on-surface">August 1, 2026</strong>
                  </p>
                </div>

                {/* Auto Renew Toggle */}
                <div className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-on-surface">Auto-Renewal</span>
                    <p className="text-[11px] text-on-surface-variant">Keep recruiter features uninterrupted</p>
                  </div>
                  <button
                    onClick={() => {
                      setAutoRenew(!autoRenew);
                      showToast(`Auto-renewal ${!autoRenew ? "enabled" : "disabled"}`, "info");
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                      autoRenew ? "bg-primary" : "bg-outline-variant"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white block transition-transform ${
                        autoRenew ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="pt-4 border-t border-outline-variant/20 space-y-3 text-xs">
                <span className="text-outline font-label-md uppercase tracking-wider block text-[10px]">
                  Default Payment Method
                </span>
                <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">credit_card</span>
                    <div>
                      <span className="font-bold text-on-surface block">Visa ending in 4242</span>
                      <span className="text-[10px] text-outline">Expires 12/2028</span>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast("Opening payment method updater...", "info")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>

            {/* Recruiter Credit & Resource Quotas (2 Columns) */}
            <div className="lg:col-span-2 glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-6">
              <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">data_usage</span>
                Monthly Recruiter Usage & Credit Quotas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Meter 1: Active Job Postings */}
                <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">Active Job Credits</span>
                    <span className="font-mono font-bold text-primary">14 / 20 Used</span>
                  </div>
                  <div className="w-full h-2.5 bg-outline-variant/30 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "70%" }} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant">6 active job credits remaining for July</p>
                </div>

                {/* Meter 2: AI Resume Analyses */}
                <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">AI Resume Analyses</span>
                    <span className="font-mono font-bold text-amber-600">450 / 1,000 Used</span>
                  </div>
                  <div className="w-full h-2.5 bg-outline-variant/30 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "45%" }} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant">550 AI analyses remaining in billing cycle</p>
                </div>

                {/* Meter 3: Recruiter Seats */}
                <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">Recruiter Seats</span>
                    <span className="font-mono font-bold text-purple-600">3 / 5 Seats Occupied</span>
                  </div>
                  <div className="w-full h-2.5 bg-outline-variant/30 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: "60%" }} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant">2 additional seat invitations available</p>
                </div>

                {/* Meter 4: Direct Candidate Messaging */}
                <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">Candidate InMail Credits</span>
                    <span className="font-mono font-bold text-emerald-600">Unlimited</span>
                  </div>
                  <div className="w-full h-2.5 bg-outline-variant/30 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant">Unlimited messaging on Growth Plan</p>
                </div>
              </div>

              {/* Promo Code Entry Form */}
              <form onSubmit={handleApplyPromo} className="pt-4 border-t border-outline-variant/20 flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo coupon code (e.g. NEXT15)"
                  className="flex-1 px-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl transition-colors"
                >
                  Apply Code
                </button>
              </form>
            </div>
          </div>

          {/* Invoice & Billing History Table */}
          <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Invoice & Billing History
              </h3>
              <span className="text-xs text-outline font-label-md">Showing last 3 invoices</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider text-[10px] font-label-md">
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                  {INVOICE_HISTORY.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold">{inv.id}</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">{inv.date}</td>
                      <td className="py-3.5 px-4 font-bold">{inv.plan}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">{inv.amount}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-700 font-bold rounded-full text-[10px]">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDownloadInvoice(inv.id)}
                          className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-primary font-bold rounded-lg transition-colors text-[11px] inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">download</span> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Footer />

      {/* Plan Upgrade Comparison Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-on-surface">
                  Compare Enterprise Recruiter Packages
                </h3>
                <p className="text-xs text-on-surface-variant">Upgrade or adjust your plan to unlock more recruiter seats & AI credits</p>
              </div>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-xl"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-primary" : "text-outline"}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                className="w-12 h-6 bg-primary rounded-full p-1 relative transition-colors"
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white block transition-transform ${
                    billingCycle === "annual" ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ${billingCycle === "annual" ? "text-primary" : "text-outline"}`}>
                Annual Billing <span className="text-[10px] bg-amber-500/15 text-amber-700 px-2 py-0.5 rounded-full font-bold">Save 20%</span>
              </span>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starter Plan */}
              <div className="border border-outline-variant/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between bg-surface-container-low">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-on-surface">Starter Package</h4>
                  <p className="text-[11px] text-on-surface-variant">For growing startups hiring engineers</p>
                  <h3 className="font-display text-2xl font-bold text-on-surface pt-2">
                    {billingCycle === "monthly" ? "$79" : "$63"}
                    <span className="text-xs font-label-md text-outline"> / mo</span>
                  </h3>
                  <ul className="text-xs space-y-2 pt-2 text-on-surface-variant">
                    <li className="flex items-center gap-2">✓ 5 Active Job Postings</li>
                    <li className="flex items-center gap-2">✓ 100 AI Resume Analyses</li>
                    <li className="flex items-center gap-2">✓ 1 Recruiter Seat</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    showToast("Switched to Starter Plan", "info");
                    setShowUpgradeModal(false);
                  }}
                  className="w-full py-2 border border-outline-variant/40 text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container"
                >
                  Downgrade to Starter
                </button>
              </div>

              {/* Growth Plan (Current) */}
              <div className="border-2 border-primary rounded-2xl p-5 space-y-4 flex flex-col justify-between bg-primary-container/10 relative shadow-md">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold px-3 py-0.5 rounded-full">
                  Current Plan
                </span>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-on-surface">Growth Package</h4>
                  <p className="text-[11px] text-on-surface-variant">Ideal for scaling engineering teams</p>
                  <h3 className="font-display text-2xl font-bold text-primary pt-2">
                    {billingCycle === "monthly" ? "$199" : "$159"}
                    <span className="text-xs font-label-md text-outline"> / mo</span>
                  </h3>
                  <ul className="text-xs space-y-2 pt-2 text-on-surface-variant font-medium">
                    <li className="flex items-center gap-2 font-bold text-on-surface">✓ 20 Active Job Postings</li>
                    <li className="flex items-center gap-2 font-bold text-on-surface">✓ 1,000 AI Resume Analyses</li>
                    <li className="flex items-center gap-2 font-bold text-on-surface">✓ 5 Recruiter Seats</li>
                    <li className="flex items-center gap-2">✓ Unlimited Candidate InMail</li>
                  </ul>
                </div>
                <button disabled className="w-full py-2 bg-primary/20 text-primary font-bold text-xs rounded-xl cursor-default">
                  Active Plan
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="border border-outline-variant/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between bg-surface-container-low">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-on-surface">Enterprise Plan</h4>
                  <p className="text-[11px] text-on-surface-variant">For large enterprises with high hiring volume</p>
                  <h3 className="font-display text-2xl font-bold text-on-surface pt-2">
                    {billingCycle === "monthly" ? "$499" : "$399"}
                    <span className="text-xs font-label-md text-outline"> / mo</span>
                  </h3>
                  <ul className="text-xs space-y-2 pt-2 text-on-surface-variant">
                    <li className="flex items-center gap-2 font-bold text-on-surface">✓ Unlimited Job Postings</li>
                    <li className="flex items-center gap-2 font-bold text-on-surface">✓ Unlimited AI Resume Analyses</li>
                    <li className="flex items-center gap-2 font-bold text-on-surface">✓ 25 Recruiter Seats</li>
                    <li className="flex items-center gap-2">✓ Custom API Access & SSO</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    showToast("Upgraded to Enterprise Plan!", "success");
                    setShowUpgradeModal(false);
                  }}
                  className="w-full py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-xs"
                >
                  Upgrade to Enterprise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
