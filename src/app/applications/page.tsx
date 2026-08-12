"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { INITIAL_APPLICATIONS, CandidateApplication } from "@/lib/mockData";

import { useEffect } from "react";
import { RecruitmentEngine, SyncApplication } from "@/services/recruitmentEngine";
import { useToast } from "@/components/ui/Toast";
import { CandidateTimelineModal } from "@/components/recruiter/CandidateTimelineModal";

const PIPELINE_STAGES = [
  { key: "APPLIED", label: "Applied" },
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
  const [apps, setApps] = useState<SyncApplication[]>(RecruitmentEngine.getApplications());
  const [selectedAppId, setSelectedAppId] = useState<string>(apps[0]?.id || "app-101");
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  useEffect(() => {
    const unsub = RecruitmentEngine.subscribe(() => {
      setApps([...RecruitmentEngine.getApplications()]);
    });
    return unsub;
  }, []);

  const selectedApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  const getStageIndex = (status: string) => {
    if (status === "REJECTED" || status === "WITHDRAWN") return -1;
    return PIPELINE_STAGES.findIndex((s) => s.key === status);
  };

  const currentStageIndex = selectedApp ? getStageIndex(selectedApp.stage) : 0;

  const handleWithdraw = (appId: string, title: string) => {
    if (confirm(`Are you sure you want to withdraw your application for ${title}? This action cannot be undone.`)) {
      const ok = RecruitmentEngine.withdrawApplication(appId, "Alex Rivers");
      if (ok) {
        showToast(`Your application for ${title} has been withdrawn. Recruiter notified.`, "info");
      }
    }
  };

  return (
    <>
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
                Track your active interviews, recruiter feedback, and offer status in real-time across NextHire.
              </p>
            </div>

            {selectedApp && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTimelineModal(true)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs rounded-full transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base text-primary">history</span>
                  View Full Timeline ({selectedApp.timeline?.length || 1})
                </button>

                {selectedApp.stage !== "WITHDRAWN" && selectedApp.stage !== "HIRED" && (
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

          {selectedApp && (
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-outline-variant/20 p-2 shadow-xs">
                    <img
                      src={selectedApp.companyLogo}
                      alt={selectedApp.company}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                      {selectedApp.jobTitle}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-label-md">
                      {selectedApp.company} • Applied on {selectedApp.appliedDate} • Updated {selectedApp.lastUpdated}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                      selectedApp.stage === "HIRED" || selectedApp.stage === "OFFER"
                        ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                        : selectedApp.stage === "REJECTED"
                        ? "bg-rose-500/15 text-rose-700 border border-rose-500/30"
                        : selectedApp.stage === "WITHDRAWN"
                        ? "bg-gray-500/15 text-gray-700 border border-gray-500/30"
                        : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                    }`}
                  >
                    Status: {selectedApp.stage.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Stepper Pipeline Timeline (Hidden if Rejected/Withdrawn) */}
              {selectedApp.stage !== "REJECTED" && selectedApp.stage !== "WITHDRAWN" ? (
                <div className="py-6 px-2 overflow-x-auto no-scrollbar">
                  <div className="relative flex items-center justify-between min-w-[640px]">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container-high -z-0"></div>
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-700 -z-0"
                      style={{
                        width: `${Math.max(
                          0,
                          (currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100
                        )}%`,
                      }}
                    ></div>

                    {PIPELINE_STAGES.map((stage, index) => {
                      const isCompleted = index <= currentStageIndex;
                      const isCurrent = index === currentStageIndex;

                      return (
                        <div
                          key={stage.key}
                          className="relative z-10 flex flex-col items-center gap-2"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                              isCurrent
                                ? "bg-primary text-on-primary ring-4 ring-primary/20 scale-110 shadow-md"
                                : isCompleted
                                ? "bg-tertiary text-on-tertiary shadow-xs"
                                : "bg-surface-container-high text-outline"
                            }`}
                          >
                            {isCompleted ? (
                              <span className="material-symbols-outlined text-lg">check</span>
                            ) : (
                              index + 1
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-label-md font-bold whitespace-nowrap ${
                              isCurrent
                                ? "text-primary"
                                : isCompleted
                                ? "text-on-surface"
                                : "text-outline"
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selectedApp.rejectionFeedback ? (
                /* Constructive Recruiter Rejection Feedback Card */
                <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                    <span className="material-symbols-outlined text-base">info</span>
                    <span>Recruiter Constructive Feedback Guide</span>
                  </div>

                  <p className="text-on-surface font-medium leading-relaxed">
                    "{selectedApp.rejectionFeedback.recruiterComments}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {selectedApp.rejectionFeedback.missingSkills.length > 0 && (
                      <div className="p-3 bg-surface border border-outline-variant/20 rounded-xl">
                        <span className="font-bold text-outline text-[10px] uppercase block pb-1">Key Skills to Master</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedApp.rejectionFeedback.missingSkills.map((sk: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[11px] rounded-md">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedApp.rejectionFeedback.suggestedCertifications.length > 0 && (
                      <div className="p-3 bg-surface border border-outline-variant/20 rounded-xl">
                        <span className="font-bold text-outline text-[10px] uppercase block pb-1">Recommended Certifications</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedApp.rejectionFeedback.suggestedCertifications.map((c: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-tertiary/10 text-tertiary font-bold text-[11px] rounded-md">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-surface border border-outline-variant/20 rounded-xl space-y-1">
                    <span className="font-bold text-outline text-[10px] uppercase block">Resume & Interview Advice</span>
                    <p className="text-on-surface-variant text-[11px]">
                      <strong>Resume:</strong> {selectedApp.rejectionFeedback.resumeImprovementAdvice}
                    </p>
                    {selectedApp.rejectionFeedback.interviewImprovementAdvice && (
                      <p className="text-on-surface-variant text-[11px]">
                        <strong>Interview:</strong> {selectedApp.rejectionFeedback.interviewImprovementAdvice}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded-2xl text-xs text-gray-700">
                  This application was withdrawn by you on {selectedApp.lastUpdated}.
                </div>
              )}
            </div>
          )}

          {/* Submitted Applications List */}
          <div className="space-y-4">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">
              All Submitted Applications ({apps.length})
            </h3>
            <div className="space-y-4">
              {apps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`glass-card rounded-2xl p-6 border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    selectedAppId === app.id
                      ? "border-primary ring-2 ring-primary/20 shadow-md"
                      : "border-outline-variant/20 hover:border-outline-variant/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={app.companyLogo}
                      alt={app.company}
                      className="w-12 h-12 rounded-xl object-contain bg-white p-2 border border-outline-variant/20 shadow-xs"
                    />
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{app.jobTitle}</h4>
                      <p className="text-xs text-on-surface-variant font-label-md">
                        {app.company} • Applied {app.appliedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-tertiary-container/30 text-tertiary font-label-sm font-bold text-xs rounded-full">
                      Match: {app.aiMatchScore}%
                    </span>
                    <span
                      className={`px-3 py-1 font-label-md font-bold text-xs rounded-full uppercase ${
                        app.stage === "HIRED" || app.stage === "OFFER"
                          ? "bg-emerald-500/15 text-emerald-700"
                          : app.stage === "REJECTED"
                          ? "bg-rose-500/15 text-rose-700"
                          : app.stage === "WITHDRAWN"
                          ? "bg-gray-500/15 text-gray-700"
                          : "bg-amber-500/15 text-amber-700"
                      }`}
                    >
                      {app.stage.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Candidate Hiring Timeline Modal */}
      {selectedApp && (
        <CandidateTimelineModal
          isOpen={showTimelineModal}
          onClose={() => setShowTimelineModal(false)}
          candidateName={selectedApp.candidateName}
          jobTitle={selectedApp.jobTitle}
          events={selectedApp.timeline || []}
        />
      )}

      <Footer />
    </>
  );
}
