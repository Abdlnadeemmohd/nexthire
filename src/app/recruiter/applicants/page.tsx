"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { RecruiterFeedbackModal } from "@/components/recruiter/RecruiterFeedbackModal";
import { INITIAL_APPLICATIONS, CandidateApplication } from "@/lib/mockData";

export default function RecruiterApplicantsPage() {
  const [applications, setApplications] = useState<CandidateApplication[]>(INITIAL_APPLICATIONS);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedCandidateForFeedback, setSelectedCandidateForFeedback] = useState<CandidateApplication | null>(null);

  const updateCandidateStatus = (id: string, newStatus: CandidateApplication["status"]) => {
    if (newStatus === "REJECTED") {
      const cand = applications.find((a) => a.id === id);
      if (cand) setSelectedCandidateForFeedback(cand);
    } else {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
    }
  };

  const handleFeedbackSubmit = (feedbackData: any) => {
    if (selectedCandidateForFeedback) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedCandidateForFeedback.id ? { ...app, status: "REJECTED" } : app
        )
      );
    }
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
                Senior Product Designer • {filteredApps.length} Active Candidates in Review
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

                  {/* Stage Action Triggers */}
                  <div className="flex items-center gap-2">
                    <select
                      value={candidate.status}
                      onChange={(e) => updateCandidateStatus(candidate.id, e.target.value as any)}
                      className="p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs font-label-md font-bold text-on-surface cursor-pointer focus:outline-none"
                    >
                      <option value="APPLIED">Applied</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="OFFER">Offer</option>
                      <option value="REJECTED">Rejected (Provide Feedback)</option>
                    </select>

                    <Link
                      href="/messages"
                      className="p-2.5 bg-surface-container-high hover:bg-primary-container/20 text-primary rounded-xl transition-colors"
                      title="Direct Candidate Chat"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <RecruiterFeedbackModal
        isOpen={!!selectedCandidateForFeedback}
        onClose={() => setSelectedCandidateForFeedback(null)}
        candidateName={selectedCandidateForFeedback?.candidateName || ""}
        jobTitle={selectedCandidateForFeedback?.jobTitle || ""}
        onSubmitFeedback={handleFeedbackSubmit}
      />
    </>
  );
}
