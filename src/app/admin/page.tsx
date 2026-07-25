"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "companies" | "jobs">("overview");

  const [users, setUsers] = useState([
    { id: "u-1", name: "Alex Rivers", role: "JOB_SEEKER", status: "VERIFIED", email: "alex.rivers@gmail.com" },
    { id: "u-2", name: "Sarah Jenkins", role: "RECRUITER", status: "VERIFIED", email: "sarah@stellarsystems.ai" },
    { id: "u-3", name: "Marcus Vance", role: "RECRUITER", status: "PENDING", email: "marcus@neuralscale.io" },
  ]);

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "VERIFIED" ? "SUSPENDED" : "VERIFIED" }
          : u
      )
    );
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
                Platform Admin Console
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                NextHire Operations, Security & Monetization Dashboard
              </p>
            </div>
            <VerifiedBadge role="PLATFORM_ADMIN" size="md" />
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <span className="text-xs font-label-md uppercase font-semibold text-outline">Total Users</span>
              <div className="font-display text-3xl font-bold text-on-surface">254,800</div>
              <p className="text-[11px] text-tertiary font-label-sm">+1,240 today</p>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <span className="text-xs font-label-md uppercase font-semibold text-outline">Verified Companies</span>
              <div className="font-display text-3xl font-bold text-on-surface">25,410</div>
              <p className="text-[11px] text-tertiary font-label-sm">+85 this week</p>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <span className="text-xs font-label-md uppercase font-semibold text-outline">Active Listings</span>
              <div className="font-display text-3xl font-bold text-primary">14,250</div>
              <p className="text-[11px] text-outline font-label-sm">High match rate</p>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <span className="text-xs font-label-md uppercase font-semibold text-outline">Monthly Revenue</span>
              <div className="font-display text-3xl font-bold text-tertiary">$482,000</div>
              <p className="text-[11px] text-tertiary font-label-sm">ARR $5.78M</p>
            </div>
          </div>

          {/* Controls */}
          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
            <h3 className="font-headline-sm text-xl font-bold text-on-surface">
              Super Admin Control Suite
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/admin/users"
                className="p-6 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary transition-all group space-y-2 block"
              >
                <div className="flex justify-between items-center text-primary">
                  <span className="material-symbols-outlined text-2xl">people</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
                <h4 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary">
                  User Management
                </h4>
                <p className="text-xs text-on-surface-variant">Manage candidates, recruiters, and statuses.</p>
              </Link>

              <Link
                href="/admin/companies"
                className="p-6 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary transition-all group space-y-2 block"
              >
                <div className="flex justify-between items-center text-primary">
                  <span className="material-symbols-outlined text-2xl">business</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
                <h4 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary">
                  Company Moderation
                </h4>
                <p className="text-xs text-on-surface-variant">Audit tax IDs, licenses, and verifications.</p>
              </Link>

              <Link
                href="/admin/subscriptions"
                className="p-6 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary transition-all group space-y-2 block"
              >
                <div className="flex justify-between items-center text-primary">
                  <span className="material-symbols-outlined text-2xl">credit_card</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
                <h4 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary">
                  Subscriptions & Billing
                </h4>
                <p className="text-xs text-on-surface-variant">Manage SaaS tiers, MRR analytics, and transactions.</p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
