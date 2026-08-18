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
import { Modal } from "@/components/ui/Modal";
import {
  getAllowedTransitions,
  STAGE_LABELS,
  RECRUITER_ACTION_LABELS,
  isTerminalStatus,
} from "@/lib/ats/stateMachine";

export default function RecruiterApplicantsPage() {
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [scheduleModalCandidate, setScheduleModalCandidate] = useState<any | null>(null);
  const [rejectionModalCandidate, setRejectionModalCandidate] = useState<any | null>(null);
  const [timelineModalCandidate, setTimelineModalCandidate] = useState<any | null>(null);
  const [viewFeedbackCandidate, setViewFeedbackCandidate] = useState<any | null>(null);

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

  const filteredApplicants = applicants.filter((app) => {
    if (selectedStage === "ALL") return true;
    if (selectedStage === "INTERVIEW_SCHEDULED") {
      return app.status.startsWith("INTERVIEW");
    }
    return app.status === selectedStage;
  });

  const handleMoveStage = async (candidateId: string, newStage: string) => {
    if (newStage === "INTERVIEW_SCHEDULED" || newStage === "INTERVIEW_ROUND_1") {
      const cand = applicants.find((a) => a.id === candidateId);
      if (cand) {
        setScheduleModalCandidate(cand);
        return;
      }
    }

    try {
      const res = await fetch(`/api/recruiter/applicants/${candidateId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStage }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Candidate status updated to ${STAGE_LABELS[newStage] || newStage}!`, "success");
        loadApplicants();
      } else {
        showToast(data.error || "Failed to update candidate status", "error");
      }
    } catch (err) {
      showToast("Network error updating status", "error");
    }
  };

  const handleScheduleInterviewConfirm = async (event: ScheduledInterviewEvent) => {
    if (!scheduleModalCandidate) return;
    try {
      const res = await fetch(`/api/recruiter/applicants/${scheduleModalCandidate.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "INTERVIEW_SCHEDULED",
          interviewDate: event.date ? `${event.date}T${event.time || "10:00"}:00Z` : new Date().toISOString(),
          notes: `Interview scheduled: ${event.interviewType} via ${event.platform}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Interview scheduled successfully! Candidate notified.", "success");
        loadApplicants();
      } else {
        showToast(data.error || "Failed to schedule interview", "error");
      }
    } catch {
      showToast("Service unavailable", "error");
    } finally {
      setScheduleModalCandidate(null);
    }
  };

  const handleConfirmRejection = async (feedback: RejectionFeedbackData) => {
    if (!rejectionModalCandidate) return;

    try {
      const res = await fetch(`/api/recruiter/applicants/${rejectionModalCandidate.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: feedback.reason,
          recruiterComments: feedback.recruiterComments,
          missingSkills: feedback.missingSkills,
          suggestedCertifications: feedback.suggestedCertifications,
          resumeImprovementAdvice: feedback.resumeImprovementAdvice,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Candidate marked as Rejected. Constructive feedback delivered.`, "success");
        loadApplicants();
      } else {
        showToast(data.error || "Failed to submit rejection", "error");
      }
    } catch {
      showToast("Network error updating candidate status", "error");
    } finally {
      setRejectionModalCandidate(null);
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
                  Review applicant profiles, evaluate verified resumes, and manage interview stages with server-side validation.
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
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="INTERVIEW_SCHEDULED">Interview</option>
                  <option value="FINAL_DECISION">Final Decision</option>
                  <option value="OFFER_EXTENDED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="APPLICATION_CLOSED">Closed</option>
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
                {filteredApplicants.map((candidate) => {
                  const allowedNext = getAllowedTransitions(candidate.status);
                  const isTerminal = isTerminalStatus(candidate.status);
                  const forwardTransitions = allowedNext.filter((st) => st !== "REJECTED" && st !== "APPLICATION_CLOSED");
                  const canReject = allowedNext.includes("REJECTED");

                  return (
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
                            className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base text-primary">download</span>
                            Resume
                          </button>

                          <button
                            onClick={() => setTimelineModalCandidate(candidate)}
                            className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base text-secondary">history</span>
                            History
                          </button>
                        </div>
                      </div>

                      {/* Stage Action Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-outline-variant/10 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-outline uppercase">Current:</span>
                          <span className="font-bold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                            {STAGE_LABELS[candidate.status] || candidate.status}
                          </span>
                        </div>

                        {isTerminal ? (
                          <div className="flex items-center gap-2">
                            {candidate.status === "REJECTED" && (
                              <button
                                onClick={() => setViewFeedbackCandidate(candidate)}
                                className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-lg border border-outline-variant/20 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm text-error">reviews</span>
                                View Rejection Feedback
                              </button>
                            )}
                            <span className="text-[11px] font-bold text-outline uppercase bg-surface-container px-3 py-1 rounded-lg">
                              Terminal Stage (No further actions)
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-outline uppercase">Next Actions:</span>

                            {forwardTransitions.map((nextSt) => (
                              <button
                                key={nextSt}
                                onClick={() => handleMoveStage(candidate.id, nextSt)}
                                className="px-3 py-1 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/20 rounded-lg font-bold text-xs transition-all hover:border-primary/40 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm text-primary">arrow_forward</span>
                                {RECRUITER_ACTION_LABELS[nextSt] || STAGE_LABELS[nextSt] || nextSt}
                              </button>
                            ))}

                            {canReject && (
                              <button
                                onClick={() => setRejectionModalCandidate(candidate)}
                                className="px-3 py-1 bg-error/10 hover:bg-error/20 text-error font-bold text-xs rounded-lg border border-error/20 ml-2 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">cancel</span>
                                Reject
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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

      {/* Structured Rejection Modal */}
      {rejectionModalCandidate && (
        <StructuredRejectionModal
          isOpen={true}
          onClose={() => setRejectionModalCandidate(null)}
          candidateName={rejectionModalCandidate.applicant?.name || "Candidate"}
          jobTitle={rejectionModalCandidate.job?.title || "Job Position"}
          onConfirmRejection={handleConfirmRejection}
        />
      )}

      {/* Interview Scheduling Modal */}
      {scheduleModalCandidate && (
        <InterviewScheduleModal
          isOpen={true}
          onClose={() => setScheduleModalCandidate(null)}
          candidateName={scheduleModalCandidate.applicant?.name || "Candidate"}
          jobTitle={scheduleModalCandidate.job?.title || "Job Position"}
          onScheduleComplete={handleScheduleInterviewConfirm}
        />
      )}

      {/* Candidate History Timeline Modal */}
      {timelineModalCandidate && (
        <CandidateTimelineModal
          isOpen={true}
          onClose={() => setTimelineModalCandidate(null)}
          candidateName={timelineModalCandidate.applicant?.name || "Candidate"}
          jobTitle={timelineModalCandidate.job?.title || "Job Position"}
          events={(timelineModalCandidate.events || []).map((e: any) => ({
            id: e.id,
            timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString() : "Recently",
            stage: e.type || "STATUS_CHANGED",
            actorName: e.actorId ? "Recruiter" : "System",
            actorRole: "RECRUITER",
            description: e.notes || e.type || "Pipeline action recorded",
            badgeType:
              e.type === "REJECTION_SUBMITTED"
                ? "REJECTED"
                : e.type === "INTERVIEW_SCHEDULED"
                ? "INTERVIEW"
                : "APPLIED",
          }))}
        />
      )}

      {/* View Rejection Feedback Modal */}
      {viewFeedbackCandidate && (
        <Modal
          isOpen={true}
          onClose={() => setViewFeedbackCandidate(null)}
          title={`Rejection Feedback: ${viewFeedbackCandidate.applicant?.name || "Candidate"}`}
        >
          <div className="space-y-4 text-xs font-body-md">
            <div className="p-3 bg-error-container/20 border border-error-container/40 rounded-xl">
              <span className="font-bold text-on-surface">Reason: </span>
              <span className="text-error font-bold">
                {viewFeedbackCandidate.rejection?.reason || "Skills / Experience Alignment"}
              </span>
            </div>

            {viewFeedbackCandidate.rejection?.closingMessage && (
              <div className="space-y-1">
                <span className="font-bold text-outline uppercase tracking-wider text-[10px]">
                  Recruiter Feedback Notes:
                </span>
                <p className="text-on-surface bg-surface-container p-3 rounded-xl leading-relaxed">
                  {viewFeedbackCandidate.rejection.closingMessage}
                </p>
              </div>
            )}

            {viewFeedbackCandidate.rejection?.suggestions && viewFeedbackCandidate.rejection.suggestions.length > 0 && (
              <div className="space-y-1">
                <span className="font-bold text-outline uppercase tracking-wider text-[10px]">
                  Improvement Suggestions:
                </span>
                <ul className="list-disc list-inside space-y-1 bg-surface-container p-3 rounded-xl text-on-surface-variant">
                  {viewFeedbackCandidate.rejection.suggestions.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end">
              <button
                onClick={() => setViewFeedbackCandidate(null)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
