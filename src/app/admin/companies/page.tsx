"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface CompanyRecord {
  id: string;
  name: string;
  industry: string;
  location: string;
  website?: string;
  isVerified: boolean;
  createdAt: string;
  recruiters?: { name: string; email: string }[];
  jobs?: { id: string; title: string; status: string }[];
}

export default function AdminCompanyModerationPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"ALL" | "VERIFIED" | "PENDING">("ALL");

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/companies");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCompanies(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to load admin companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((c) => {
    if (filterTab === "VERIFIED") return c.isVerified;
    if (filterTab === "PENDING") return !c.isVerified;
    return true;
  });

  const handleToggleVerification = async (companyId: string, name: string, nextStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, isVerified: nextStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          nextStatus ? `Verified employer status for ${name}!` : `Revoked verification for ${name}.`,
          "success"
        );
        loadCompanies();
      } else {
        showToast(data.error || "Failed to update verification status", "error");
      }
    } catch (err) {
      showToast("Verification service error", "error");
    }
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6 pb-20 sm:pb-24">
            <Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "Company Moderation" }]} />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Company Directory & Verification
                </h1>
                <p className="text-on-surface-variant text-xs sm:text-sm pt-1">
                  Audit registered employers, review active jobs catalog, and issue verified badges.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {["ALL", "VERIFIED", "PENDING"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTab(t as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                      filterTab === t
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Companies List */}
            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                Loading company profiles from database...
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((comp) => (
                  <div
                    key={comp.id}
                    className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base text-on-surface">{comp.name}</h3>
                          <p className="text-xs text-on-surface-variant">{comp.industry}</p>
                          <p className="text-[11px] text-outline">{comp.location}</p>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            comp.isVerified
                              ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                          }`}
                        >
                          {comp.isVerified ? "Verified" : "Pending Review"}
                        </span>
                      </div>

                      <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-outline">Active Openings:</span>
                          <span className="font-bold text-on-surface">{(comp as any).jobsCount ?? comp.jobs?.length ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">Associated Recruiters:</span>
                          <span className="font-bold text-on-surface">{(comp as any).teamSize ?? comp.recruiters?.length ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between">
                      {comp.website && (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          Website →
                        </a>
                      )}

                      <button
                        onClick={() => handleToggleVerification(comp.id, comp.name, !comp.isVerified)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ml-auto ${
                          comp.isVerified
                            ? "bg-error/10 text-error hover:bg-error/20"
                            : "bg-primary text-on-primary hover:bg-primary-container"
                        }`}
                      >
                        {comp.isVerified ? "Revoke Verification" : "Verify Company"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No companies found"
                description={
                  filterTab !== "ALL"
                    ? `No companies are currently categorized as '${filterTab}'.`
                    : "No employer organizations have registered yet."
                }
                icon="domain_disabled"
                actionLabel="View All Companies"
                onAction={() => setFilterTab("ALL")}
              />
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
