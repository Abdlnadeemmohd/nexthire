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
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import {
  STAGE_LABELS,
  isTerminalStatus,
  isActiveApplicationStatus,
  CANDIDATE_PIPELINE_STAGES,
  getCandidateStageIndex,
} from "@/lib/ats/stateMachine";

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

  const [viewFilter, setViewFilter] = useState<"ACTIVE_15" | "ALL">("ACTIVE_15");

  const activeApps = apps.filter((app) => isActiveApplicationStatus(app.status));
  const filteredApps = viewFilter === "ACTIVE_15" ? activeApps : apps;

  const selectedApp = filteredApps.find((a) => a.id === selectedAppId) || filteredApps[0] || null;

  const currentStageIndex = selectedApp ? getCandidateStageIndex(selectedApp.status) : 0;

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

  const handleDownloadResume = (applicationId: string) => {
    try {
      window.open(`/api/documents/download?applicationId=${applicationId}`, "_blank");
    } catch {
      showToast("Unable to open resume. Please try again.", "error");
    }
  };

  return (
    <ProtectedRoute requiredPortal="seeker">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] w-full pb-20 sm:pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Application Pipeline Tracker
                </h1>
                <p className="text-on-surface-variant text-xs sm:text-sm font-body-md">
                  Track your active applications, interviews, recruiter feedback, and offers in real-time.
                </p>
              </div>

              {selectedApp && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowTimelineModal(true)}
                    className="px-4 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs rounded-full flex items-center gap-1.5 transition-colors touch-target"
                  >
                    <span className="material-symbols-outlined text-base text-primary">history</span>
                    Application History
                  </button>

                  {isActiveApplicationStatus(selectedApp.status) && (
                    <button
                      onClick={() => handleWithdraw(selectedApp.id, selectedApp.jobTitle)}
                      className="px-4 py-2 bg-error-container/30 hover:bg-error-container/50 text-error font-bold text-xs rounded-full flex items-center gap-1.5 transition-colors touch-target"
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                      Withdraw Application
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-on-surface-variant">
                Loading applications pipeline from database...
              </div>
            ) : apps.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Applications List */}
                <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-outline uppercase tracking-wider">
                    Applications ({filteredApps.length})
                  </span>
                  <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl text-[11px] font-bold">
                    <button
                      onClick={() => {
                        setViewFilter("ACTIVE_15");
                        if (activeApps.length > 0 && !activeApps.some((a) => a.id === selectedAppId)) {
                          setSelectedAppId(activeApps[0].id);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        viewFilter === "ACTIVE_15"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span>15-Day Pipeline</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        viewFilter === "ACTIVE_15" ? "bg-on-primary/20 text-on-primary" : "bg-surface-container text-outline"
                      }`}>
                        {activeApps.length}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setViewFilter("ALL");
                        if (apps.length > 0 && !apps.some((a) => a.id === selectedAppId)) {
                          setSelectedAppId(apps[0].id);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        viewFilter === "ALL"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span>All History</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        viewFilter === "ALL" ? "bg-on-primary/20 text-on-primary" : "bg-surface-container text-outline"
                      }`}>
                        {apps.length}
                      </span>
                    </button>
                  </div>
                </div>

                {filteredApps.length === 0 ? (
                  <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/20 text-center space-y-3">
                    <span className="material-symbols-outlined text-3xl text-outline">inbox</span>
                    <p className="text-xs font-bold text-on-surface">No Active Applications</p>
                    <p className="text-[11px] text-on-surface-variant">
                      You have no active applications in your 15-Day Pipeline.
                    </p>
                    <button
                      onClick={() => setViewFilter("ALL")}
                      className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs"
                    >
                      View All History ({apps.length})
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredApps.map((app) => (
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
                )}
              </div>

              {/* Application Detail / Pipeline Stage View */}
              {selectedApp ? (
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

                    {/* Terminal Rejection View */}
                    {selectedApp.status === "REJECTED" ? (
                      <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                        <div className="p-4 bg-error-container/20 border border-error-container/40 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-error uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-base">info</span>
                              Application Status: REJECTED
                            </span>
                            <Link
                              href={`/applications/${selectedApp.id}/feedback`}
                              className="px-3 py-1 bg-error text-on-error font-bold text-xs rounded-xl hover:bg-error/90 transition-all flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">reviews</span>
                              Full Feedback Guide
                            </Link>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-outline uppercase block">Rejection Reason:</span>
                            <p className="text-sm font-bold text-on-surface pt-0.5">
                              {selectedApp.rejection?.reason
                                ? selectedApp.rejection.reason.replace(/_/g, " ")
                                : "Profile / Skills Alignment"}
                            </p>
                          </div>

                          {selectedApp.rejection?.closingMessage && (
                            <div>
                              <span className="text-[11px] font-bold text-outline uppercase block">Recruiter Feedback:</span>
                              <p className="text-xs text-on-surface leading-relaxed pt-1 bg-surface-container/60 p-3 rounded-xl">
                                {selectedApp.rejection.closingMessage}
                              </p>
                            </div>
                          )}

                          {selectedApp.rejection?.suggestions && selectedApp.rejection.suggestions.length > 0 && (
                            <div>
                              <span className="text-[11px] font-bold text-outline uppercase block">Recommendations:</span>
                              <ul className="list-disc list-inside text-xs text-on-surface-variant pt-1 space-y-0.5">
                                {selectedApp.rejection.suggestions.map((s: string, idx: number) => (
                                  <li key={idx}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : selectedApp.status === "APPLICATION_CLOSED" || selectedApp.status === "WITHDRAWN" ? (
                      <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                        <div className="p-4 bg-surface-container-high/60 border border-outline-variant/30 rounded-2xl space-y-2">
                          <div className="flex items-center gap-2 text-outline">
                            <span className="material-symbols-outlined text-base">archive</span>
                            <span className="font-bold text-xs uppercase tracking-wider">
                              Application Status: {selectedApp.status === "WITHDRAWN" ? "WITHDRAWN" : "APPLICATION CLOSED"}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {selectedApp.status === "WITHDRAWN"
                              ? "This application was voluntarily withdrawn. It is preserved in your application history for your records."
                              : "This application has been closed and is preserved in your application history for your records."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Progress Bar / Stage Indicator */
                      <div className="space-y-2 pt-4 border-t border-outline-variant/10">
                        <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                          Pipeline Progression
                        </span>

                        <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-2">
                          {CANDIDATE_PIPELINE_STAGES.map((stage, idx) => {
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
                                  className={`text-[10px] sm:text-xs font-bold block truncate ${
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
                    )}

                    {/* Resume Reference Section */}
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">description</span>
                        <span className="text-xs font-bold text-on-surface">Attached Candidate Resume</span>
                      </div>
                      <button
                        onClick={() => handleDownloadResume(selectedApp.id)}
                        className="px-3.5 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-primary/90 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download Resume
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="No applications submitted yet"
              description="When you apply to open job positions, you can monitor your review status, recruiter feedback, and interview schedules right here."
              icon="assignment_late"
              actionLabel="Search Jobs"
              actionHref="/jobs"
            />
          )}
        </main>

        <Footer />
      </div>
    </div>

    {/* Candidate History Timeline Modal */}
    {selectedApp && (
      <CandidateTimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        candidateName={selectedApp.candidateName || "Candidate"}
        jobTitle={selectedApp.jobTitle || "Job Requisition"}
        events={(selectedApp.events || []).map((e: any) => ({
          id: e.id,
          timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString() : "Recently",
          stage: e.type || "STATUS_CHANGED",
          actorName: e.actorId === selectedApp.candidateId ? "Candidate" : "Recruiter",
          actorRole: "RECRUITER",
          description: e.notes || e.type || "Application event logged",
          badgeType:
            e.type === "REJECTION_SUBMITTED"
              ? "REJECTED"
              : e.type === "INTERVIEW_SCHEDULED"
              ? "INTERVIEW"
              : "APPLIED",
        }))}
      />
    )}
  </ProtectedRoute>
  );
}
