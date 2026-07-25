"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { INITIAL_APPLICATIONS, CandidateApplication } from "@/lib/mockData";

export default function RecruiterApplicantsPage() {
  const [applications, setApplications] = useState<CandidateApplication[]>(INITIAL_APPLICATIONS);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const updateCandidateStatus = (id: string, newStatus: CandidateApplication["status"]) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const filteredApps = applications.filter((app) =>
    filterStatus === "ALL" ? true : app.status === filterStatus
  );

  return (
    <>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                Applicant Tracking Pipeline
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Senior Product Designer • 4 Active Candidates in Review
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => alert("Downloading all candidate resumes in .zip bundle...")}
                className="px-5 py-2.5 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-full hover:bg-primary-container/20 hover:text-primary transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Bulk Download Resumes
              </button>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-outline-variant/20">
            {["ALL", "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFER", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full font-label-md text-xs transition-all ${
                  filterStatus === status
                    ? "bg-primary text-on-primary font-bold shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {status === "ALL" ? "All Applicants" : status.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Candidates List Cards */}
          <div className="space-y-4">
            {filteredApps.map((candidate) => (
              <div
                key={candidate.id}
                className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={candidate.candidateAvatar}
                      alt={candidate.candidateName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary-fixed shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                          {candidate.candidateName}
                        </h3>
                        <span className="px-3 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm rounded-full text-xs font-bold">
                          {candidate.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-label-md">
                        {candidate.candidateTitle} • {candidate.location}
                      </p>
                      <p className="text-[11px] text-outline pt-1">
                        Applied for: <span className="font-bold text-on-surface">{candidate.jobTitle}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className={`px-3 py-1 text-xs font-label-md font-bold rounded-full ${
                      candidate.status === "INTERVIEW"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed"
                        : candidate.status === "OFFER"
                        ? "bg-primary-fixed text-on-primary-fixed"
                        : candidate.status === "REJECTED"
                        ? "bg-error-container text-on-error-container"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {candidate.status.replace("_", " ")}
                    </span>

                    <Link
                      href="/messages"
                      className="p-2.5 text-primary hover:bg-primary-container/20 rounded-full transition-colors"
                      title="Chat Candidate"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </Link>
                  </div>
                </div>

                {/* Candidate Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-outline-variant/10 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-outline font-label-sm font-semibold">Skills:</span>
                    {candidate.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-surface-container rounded-full text-[11px] font-label-md text-on-surface-variant">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setShowScheduleModal(true);
                      }}
                      className="px-4 py-1.5 bg-tertiary text-on-tertiary font-label-md font-bold rounded-full hover:bg-tertiary-container transition-all"
                    >
                      Schedule Interview
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setShowOfferModal(true);
                      }}
                      className="px-4 py-1.5 bg-primary text-on-primary font-label-md font-bold rounded-full hover:bg-primary-container transition-all"
                    >
                      Send Offer Letter
                    </button>
                    <button
                      onClick={() => updateCandidateStatus(candidate.id, "REJECTED")}
                      className="px-3 py-1.5 border border-outline-variant text-outline hover:text-error hover:border-error rounded-full font-label-md font-bold transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Interview Schedule Modal */}
      {showScheduleModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">
              Schedule Interview with {selectedCandidate.candidateName}
            </h3>
            <p className="text-xs text-on-surface-variant">
              Select date and time for the technical video round.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-outline font-label-md font-bold mb-1">Date & Time</label>
                <input type="datetime-local" className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl" />
              </div>
              <div>
                <label className="block text-outline font-label-md font-bold mb-1">Meeting Link</label>
                <input type="text" defaultValue="https://meet.google.com/nexthire-interview" className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 text-xs font-label-md text-on-surface-variant">Cancel</button>
              <button
                onClick={() => {
                  updateCandidateStatus(selectedCandidate.id, "INTERVIEW");
                  setShowScheduleModal(false);
                }}
                className="px-5 py-2 bg-tertiary text-on-tertiary text-xs font-bold rounded-full"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Letter Generator Modal */}
      {showOfferModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">
              Generate Official Offer Letter
            </h3>
            <p className="text-xs text-on-surface-variant">
              Candidate: <span className="font-bold text-on-surface">{selectedCandidate.candidateName}</span>
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-outline font-label-md font-bold mb-1">Annual Base Salary ($)</label>
                <input type="number" defaultValue={210000} className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl" />
              </div>
              <div>
                <label className="block text-outline font-label-md font-bold mb-1">Equity Grant (%)</label>
                <input type="text" defaultValue="0.15% Stock Options" className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowOfferModal(false)} className="px-4 py-2 text-xs font-label-md text-on-surface-variant">Cancel</button>
              <button
                onClick={() => {
                  updateCandidateStatus(selectedCandidate.id, "OFFER");
                  setShowOfferModal(false);
                }}
                className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full"
              >
                Send Official Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
