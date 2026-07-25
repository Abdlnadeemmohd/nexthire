"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_TRANSACTIONS,
  SubscriptionPlanItem,
  TransactionItem,
} from "@/lib/mockData";

export default function SubscriptionsManagementPage() {
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(INITIAL_SUBSCRIPTION_PLANS);
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState(499);

  const totalMRR = plans.reduce((acc, p) => acc + p.mrr, 0);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName) return;
    const newPlan: SubscriptionPlanItem = {
      id: `plan-${Date.now()}`,
      name: newPlanName,
      price: newPlanPrice,
      interval: "month",
      features: ["Custom Job Limits", "Dedicated AI Match Agent"],
      subscribersCount: 1,
      status: "ACTIVE",
      mrr: newPlanPrice,
    };
    setPlans((prev) => [...prev, newPlan]);
    setNewPlanName("");
    setIsCreatePlanOpen(false);
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="admin" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                SaaS Subscription & Billing
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Stripe Billing Engine • Recurring Revenue & Subscription Tiers
              </p>
            </div>

            <button
              onClick={() => setIsCreatePlanOpen(true)}
              className="px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Create New Plan Tier
            </button>
          </div>

          {/* Revenue Analytics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <span className="text-xs font-label-md uppercase font-semibold text-outline">
                Monthly Recurring (MRR)
              </span>
              <div className="font-display text-3xl font-bold text-tertiary">
                ${totalMRR.toLocaleString()}
              </div>
              <p className="text-[11px] text-tertiary font-label-sm">+14.2% this month</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <span className="text-xs font-label-md uppercase font-semibold text-outline">
                Annual Run Rate (ARR)
              </span>
              <div className="font-display text-3xl font-bold text-primary">
                ${(totalMRR * 12).toLocaleString()}
              </div>
              <p className="text-[11px] text-outline font-label-sm">Projection</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <span className="text-xs font-label-md uppercase font-semibold text-outline">
                Paid Subscribers
              </span>
              <div className="font-display text-3xl font-bold text-on-surface">
                {plans.reduce((acc, p) => acc + p.subscribersCount, 0)}
              </div>
              <p className="text-[11px] text-tertiary font-label-sm">+28 enterprise teams</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <span className="text-xs font-label-md uppercase font-semibold text-outline">
                Churn Rate
              </span>
              <div className="font-display text-3xl font-bold text-on-surface">
                1.4%
              </div>
              <p className="text-[11px] text-tertiary font-label-sm">Below industry avg</p>
            </div>
          </div>

          {/* Active Subscription Plans Grid */}
          <div className="space-y-4">
            <h3 className="font-headline-sm text-xl font-bold text-on-surface">
              Active Subscription Tiers ({plans.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-headline-sm text-lg font-bold text-on-surface">
                        {plan.name}
                      </h4>
                      <StatusBadge status={plan.status} />
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-bold text-primary">
                        ${plan.price}
                      </span>
                      <span className="text-xs text-outline font-label-md">/{plan.interval}</span>
                    </div>

                    <p className="text-xs font-label-md font-bold text-tertiary">
                      {plan.subscribersCount} Active Subscribers • ${plan.mrr.toLocaleString()}/mo MRR
                    </p>

                    <ul className="space-y-2 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/10">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-tertiary text-sm">
                            check_circle
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/10 flex gap-2">
                    <button className="flex-1 py-2 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary text-on-surface font-label-md font-bold text-xs rounded-full transition-all">
                      Edit Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices & Billing Log */}
          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
            <h3 className="font-headline-sm text-xl font-bold text-on-surface">
              Recent Billing Transactions
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-outline uppercase font-label-md font-semibold">
                    <th className="pb-3 px-4">Invoice ID</th>
                    <th className="pb-3 px-4">Customer</th>
                    <th className="pb-3 px-4">Company</th>
                    <th className="pb-3 px-4">Plan Tier</th>
                    <th className="pb-3 px-4">Amount</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-primary">{tx.id}</td>
                      <td className="py-4 px-4 font-bold">{tx.customerName}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{tx.companyName}</td>
                      <td className="py-4 px-4">{tx.planName}</td>
                      <td className="py-4 px-4 font-bold text-on-surface">${tx.amount}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="py-4 px-4 text-outline font-label-sm">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        title="Create New Subscription Plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs font-body-sm">
          <div className="space-y-1">
            <label className="block text-outline font-label-md font-semibold">Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Agency Pro, Scale Tier"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-outline font-label-md font-semibold">Monthly Price ($)</label>
            <input
              type="number"
              step={10}
              value={newPlanPrice}
              onChange={(e) => setNewPlanPrice(Number(e.target.value))}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsCreatePlanOpen(false)}
              className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-on-primary font-label-md font-bold rounded-full hover:bg-primary-container shadow-md"
            >
              Publish Plan
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
