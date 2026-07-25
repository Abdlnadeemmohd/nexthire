"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { INITIAL_APPLICATIONS, CandidateApplication } from "@/lib/mockData";

const PIPELINE_STAGES = [
  { key: "APPLIED", label: "Applied" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer Letter" },
  { key: "HIRED", label: "Hired" },
];

export default function ApplicationTrackerPage() {
  const [selectedApp, setSelectedApp] = useState<CandidateApplication>(
    INITIAL_APPLICATIONS[0]
  );

  const getStageIndex = (status: string) => {
    return PIPELINE_STAGES.findIndex((s) => s.key === status);
  };

  const currentStageIndex = getStageIndex(selectedApp.status);

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
                Track your active interviews, recruiter feedback, and offer status in real-time.
              </p>
            </div>
          </div>

          {/* Interactive Pipeline Timeline Bar */}
          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
            <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-outline-variant/20 p-2 shadow-xs">
                <img
                  src={selectedApp.companyLogo}
                  alt={selectedApp.companyName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                  {selectedApp.jobTitle}
                </h3>
                <p className="text-xs text-on-surface-variant font-label-md">
                  {selectedApp.companyName} • Applied on {selectedApp.appliedAt}
                </p>
              </div>
            </div>

            {/* Stepper Pipeline Timeline */}
            <div className="py-6 px-2">
              <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container-high -z-0"></div>
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-700 -z-0"
                  style={{
                    width: `${
                      (currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100
                    }%`,
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
                          <span className="material-symbols-outlined text-base">
                            check
                          </span>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-xs font-label-md hidden sm:block ${
                          isCurrent
                            ? "font-bold text-primary"
                            : isCompleted
                            ? "font-semibold text-on-surface"
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

            {/* Recruiter Notes & Timeline Info */}
            {selectedApp.notes && (
              <div className="p-4 bg-tertiary-container/10 border border-tertiary/30 rounded-xl flex items-start gap-3 text-xs">
                <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">
                  info
                </span>
                <div>
                  <h4 className="font-bold text-on-surface font-label-md">
                    Recruiter Feedback Note
                  </h4>
                  <p className="text-on-surface-variant font-body-sm mt-0.5">
                    {selectedApp.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* All Submitted Applications List */}
          <div className="space-y-4">
            <h3 className="font-headline-sm text-xl font-bold text-on-surface">
              All Applications ({INITIAL_APPLICATIONS.length})
            </h3>

            <div className="space-y-4">
              {INITIAL_APPLICATIONS.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`glass-card rounded-2xl p-6 border transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    selectedApp.id === app.id
                      ? "border-primary ring-2 ring-primary/20 bg-primary-fixed/5"
                      : "border-outline-variant/20 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-outline-variant/20 p-2 overflow-hidden shadow-xs">
                      <img
                        src={app.companyLogo}
                        alt={app.companyName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-base font-bold text-on-surface">
                        {app.jobTitle}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-label-md">
                        {app.companyName} • {app.location} • Applied {app.appliedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-xs font-bold rounded-full">
                      {app.matchScore}% Match
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-label-md font-bold rounded-full ${
                        app.status === "INTERVIEW"
                          ? "bg-tertiary text-on-tertiary"
                          : app.status === "OFFER"
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {app.status.replace("_", " ")}
                    </span>
                    <Link
                      href="/messages"
                      className="p-2 text-primary hover:bg-primary-container/20 rounded-full transition-colors"
                      title="Chat Recruiter"
                    >
                      <span className="material-symbols-outlined text-lg">
                        chat
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
