"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { INITIAL_COMPANY_MODERATIONS, CompanyModerationItem } from "@/lib/mockData";

export default function CompanyModerationPage() {
  const [moderations, setModerations] = useState<CompanyModerationItem[]>(INITIAL_COMPANY_MODERATIONS);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [selectedCompany, setSelectedCompany] = useState<CompanyModerationItem | null>(null);

  const handleAction = (id: string, status: "APPROVED" | "REJECTED") => {
    setModerations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    setSelectedCompany(null);
  };

  const filtered = moderations.filter((m) => m.status === activeTab);

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
                Company Moderation & Verification
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Verify employer tax documentation, business licenses, and recruiter identity.
              </p>
            </div>

            <div className="flex gap-2">
              {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {tab} ({moderations.filter((m) => m.status === tab).length})
                </button>
              ))}
            </div>
          </div>

          {/* Company Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full glass-card rounded-2xl p-12 text-center space-y-3">
                <span className="material-symbols-outlined text-outline text-4xl">domain_disabled</span>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  No {activeTab.toLowerCase()} company verifications
                </h3>
                <p className="text-xs text-on-surface-variant">
                  All employer verifications in this queue have been audited.
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.logo}
                          alt={item.companyName}
                          className="w-12 h-12 rounded-xl object-contain border border-outline-variant/20 p-2 bg-white"
                        />
                        <div>
                          <h4 className="font-headline-sm text-base font-bold text-on-surface">
                            {item.companyName}
                          </h4>
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                          >
                            {item.website.replace("https://", "")}
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </a>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-2 font-body-sm border border-outline-variant/10">
                      <div className="flex justify-between">
                        <span className="text-outline">Tax ID:</span>
                        <span className="font-bold text-on-surface">{item.taxId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">License #:</span>
                        <span className="font-bold text-on-surface">{item.licenseNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">Recruiter:</span>
                        <span className="font-bold text-on-surface">{item.recruiterName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/10">
                    <button
                      onClick={() => setSelectedCompany(item)}
                      className="flex-1 py-2 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary text-on-surface font-label-md font-bold text-xs rounded-full transition-all"
                    >
                      Audit Details
                    </button>
                    {item.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleAction(item.id, "APPROVED")}
                          className="p-2 bg-tertiary text-on-tertiary hover:bg-tertiary-container rounded-full transition-all"
                          title="Approve Company"
                        >
                          <span className="material-symbols-outlined text-base">check</span>
                        </button>
                        <button
                          onClick={() => handleAction(item.id, "REJECTED")}
                          className="p-2 bg-error text-on-error hover:opacity-90 rounded-full transition-all"
                          title="Reject Company"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {selectedCompany && (
        <Modal
          isOpen={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
          title={`Verification Audit: ${selectedCompany.companyName}`}
        >
          <div className="space-y-4 text-xs font-body-sm">
            <div className="p-4 bg-surface rounded-xl space-y-3 border border-outline-variant/20">
              <div className="flex justify-between items-center">
                <span className="font-bold text-on-surface">Legal Entity Registration</span>
                <StatusBadge status={selectedCompany.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-outline">
                <div>Tax ID: <span className="font-bold text-on-surface">{selectedCompany.taxId}</span></div>
                <div>License: <span className="font-bold text-on-surface">{selectedCompany.licenseNumber}</span></div>
                <div>Contact Email: <span className="font-bold text-on-surface">{selectedCompany.email}</span></div>
                <div>Recruiter: <span className="font-bold text-on-surface">{selectedCompany.recruiterName}</span></div>
              </div>
            </div>

            {selectedCompany.notes && (
              <div className="p-3 bg-error-container/20 border border-error/30 rounded-xl text-error text-xs">
                <strong>Audit Note:</strong> {selectedCompany.notes}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container rounded-full"
              >
                Close Audit
              </button>
              {selectedCompany.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleAction(selectedCompany.id, "REJECTED")}
                    className="px-5 py-2 bg-error text-on-error font-label-md font-bold rounded-full"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleAction(selectedCompany.id, "APPROVED")}
                    className="px-5 py-2 bg-tertiary text-on-tertiary font-label-md font-bold rounded-full"
                  >
                    Approve Verification
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
