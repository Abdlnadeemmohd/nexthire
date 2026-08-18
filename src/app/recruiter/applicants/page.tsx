"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { StatusBadge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { InterviewScheduleModal, ScheduledInterviewEvent } from "@/components/recruiter/InterviewScheduleModal";
import { StructuredRejectionModal, RejectionFeedbackData } from "@/components/recruiter/StructuredRejectionModal";
import { CandidateTimelineModal } from "@/components/recruiter/CandidateTimelineModal";

export type ATSPipelineStage = 
  | "ALL"
  | "SUBMITTED"
  | "REVIEW"
  | "SCREENING"
  | "INTERVIEW"
  | "TECHNICAL"
  | "HR"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "APPLICATION_CLOSED";

export default function RecruiterApplicantsPage() {
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [scheduleModalCandidate, setScheduleModalCandidate] = useState<any | null>(null);
  const [rejectionModalCandidate, setRejectionModalCandidate] = useState<any | null>(null);
  const [timelineModalCandidate, setTimelineModalCandidate] = useState<any | null>(null);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setApplicants(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to load applicants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, []);

  const filteredApplicants = applicants.filter(
    (app) => selectedStage === "ALL" || app.status === selectedStage
  );

  const handleMoveStage = async (candidateId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/recruiter/applicants/${candidateId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStage }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Candidate status updated to ${newStage}!`, "success");
        loadApplicants();
      } else {
        showToast(data.error || "Failed to update candidate status", "error");
      }
    } catch (err) {
      showToast("Network error updating status", "error");
    }
  };

  const handleDownloadResume = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/documents/download?applicationId=${applicationId}`);
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      } else {
        showToast(data.error || "No resume document on file", "info");
      }
    } catch {
      showToast("Document service unavailable", "error");
    }
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] w-full">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "ATS Candidate Pipeline" }]} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/20 pb-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  ATS Candidate Pipeline
                </h1>
                <p className="text-on-surface-variant text-xs sm:text-sm font-body-md pt-1">
                  Review applicant profiles, evaluate verified resumes, and manage interview stages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-outline uppercase">Filter Stage:</span>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="px-3 py-1.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none"
                >
                  <option value="ALL">All Stages ({applicants.length})</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="REVIEW">Review</option>
                  <option value="SCREENING">Screening</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="OFFER">Offer</option>
                  <option value="HIRED">Hired</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Applicants List */}
            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                Loading applicant records from database...
              </div>
            ) : filteredApplicants.length > 0 ? (
              <div className="space-y-4">
                {filteredApplicants.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0">
                          <img
                            src={
                              candidate.applicant?.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"
                            }
                            alt={candidate.applicant?.name || "Applicant"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-on-surface">
                              {candidate.applicant?.name || "Candidate"}
                            </h3>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded-full">
                              Match: {candidate.matchScore || 92}%
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant pt-0.5">
                            Applied for <strong className="text-on-surface">{candidate.job?.title}</strong> •{" "}
                            {candidate.applicant?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={candidate.status} size="md" />

                        <button
                          onClick={() => handleDownloadResume(candidate.id)}
                          className="px-4 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-primary">download</span>
                          Resume
                        </button>
                      </div>
                    </div>

                    {/* Stage Transition Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-outline-variant/10 text-xs">
                      <span className="text-[11px] font-bold text-outline uppercase mr-2">Transition:</span>

                      {["REVIEW", "SCREENING", "INTERVIEW", "OFFER", "HIRED"].map((st) => (
                        <button
                          key={st}
                          disabled={candidate.status === st}
                          onClick={() => handleMoveStage(candidate.id, st)}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                            candidate.status === st
                              ? "bg-primary text-on-primary"
                              : "bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/20"
                          }`}
                        >
                          {st}
                        </button>
                      ))}

                      <button
                        onClick={() => handleMoveStage(candidate.id, "REJECTED")}
                        className="px-3 py-1 bg-error/10 hover:bg-error/20 text-error font-bold text-xs rounded-lg border border-error/20 ml-auto"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No candidate applications found"
                description={
                  selectedStage !== "ALL"
                    ? `No candidates are currently in the '${selectedStage}' pipeline stage.`
                    : "When candidates apply to your published job positions, they will appear here in your ATS pipeline."
                }
                icon="people_outline"
                actionLabel="View Active Jobs"
                actionHref="/recruiter"
              />
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
