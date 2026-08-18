"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { CandidateTimelineModal } from "@/components/recruiter/CandidateTimelineModal";
import { StatusBadge } from "@/components/ui/Badge";
import { AIMatchBadge } from "@/components/ui/AIMatchBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

const PIPELINE_STAGES = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "REVIEW", label: "Review" },
  { key: "SCREENING", label: "Screening" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "TECHNICAL", label: "Technical Round" },
  { key: "HR", label: "HR Round" },
  { key: "OFFER", label: "Offer Letter" },
  { key: "HIRED", label: "Hired" },
];

export default function ApplicationTrackerPage() {
  const { showToast } = useToast();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setApps(data.data);
          if (data.data.length > 0 && !selectedAppId) {
            setSelectedAppId(data.data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const selectedApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  const getStageIndex = (status: string) => {
    if (status === "REJECTED" || status === "APPLICATION_CLOSED" || status === "WITHDRAWN") return -1;
    return PIPELINE_STAGES.findIndex((s) => s.key === status);
  };

  const currentStageIndex = selectedApp ? getStageIndex(selectedApp.status) : 0;

  const handleWithdraw = async (appId: string, title: string) => {
    if (confirm(`Are you sure you want to withdraw your application for ${title}? This action cannot be undone.`)) {
      try {
        const res = await fetch(`/api/applications/${appId}/withdraw`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Your application for ${title} has been withdrawn.`, "info");
          loadApplications();
        } else {
          showToast(data.error || "Failed to withdraw application", "error");
        }
      } catch (err) {
        showToast("Withdrawal service unavailable", "error");
      }
    }
  };

  return (
    <ProtectedRoute requiredPortal="seeker">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                Application Pipeline Tracker
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Track your active applications, interviews, recruiter feedback, and offers in real-time.
              </p>
            </div>

            {selectedApp && (
              <div className="flex items-center gap-3">
                {selectedApp.status !== "APPLICATION_CLOSED" && selectedApp.status !== "HIRED" && (
                  <button
                    onClick={() => handleWithdraw(selectedApp.id, selectedApp.jobTitle)}
                    className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/30 font-bold text-xs rounded-full transition-colors"
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-on-surface-variant">
              Loading applications pipeline...
            </div>
          ) : apps.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Applications List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-outline uppercase tracking-wider">
                  Submitted Applications ({apps.length})
                </span>

                <div className="space-y-2">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedApp?.id === app.id
                          ? "bg-surface-container border-primary shadow-sm"
                          : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <CompanyLogo
                          src={app.companyLogo}
                          name={app.companyName}
                          size="md"
                          rounded="xl"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-on-surface truncate">{app.jobTitle}</h4>
                          <p className="text-[11px] text-on-surface-variant truncate">{app.companyName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <StatusBadge status={app.status} size="sm" />
                            <span className="text-[10px] text-outline">Applied {app.appliedAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Detail / Pipeline Stage View */}
              {selectedApp && (
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-xs text-primary font-bold">{selectedApp.companyName}</span>
                        <h2 className="font-display text-2xl font-bold text-on-surface">{selectedApp.jobTitle}</h2>
                        <p className="text-xs text-on-surface-variant pt-1">
                          Location: {selectedApp.location || "Remote"} • Applied on {selectedApp.appliedAt}
                        </p>
                      </div>

                      <StatusBadge status={selectedApp.status} size="md" />
                    </div>

                    {/* Progress Bar / Stage Indicator */}
                    <div className="space-y-2 pt-4 border-t border-outline-variant/10">
                      <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                        Pipeline Progression
                      </span>

                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-2">
                        {PIPELINE_STAGES.map((stage, idx) => {
                          const isCompleted = currentStageIndex >= idx;
                          const isCurrent = currentStageIndex === idx;

                          return (
                            <div key={stage.key} className="text-center space-y-1">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  isCurrent
                                    ? "bg-primary shadow-xs"
                                    : isCompleted
                                    ? "bg-primary/60"
                                    : "bg-surface-container-high"
                                }`}
                              />
                              <span
                                className={`text-[10px] font-bold block truncate ${
                                  isCurrent ? "text-primary font-bold" : "text-outline"
                                }`}
                              >
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resume Reference Section */}
                    {selectedApp.resumeUrl && (
                      <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">description</span>
                          <span className="text-xs font-bold text-on-surface">Attached Resume Document</span>
                        </div>
                        <a
                          href={selectedApp.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No applications submitted yet"
              description="When you apply to open job positions, you can monitor your review status and interview schedules right here."
              icon="assignment_late"
              actionLabel="Search Jobs"
              actionHref="/jobs"
            />
          )}
        </main>
      </div>

      <Footer />
    </ProtectedRoute>
  );
}
