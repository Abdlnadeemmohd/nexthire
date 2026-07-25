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

            <Link
              href={`/applications/${selectedApp.id}/feedback`}
              className="px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">reviews</span>
              View Recruiter Feedback & AI Guidance →
            </Link>
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
          </div>

          {/* Submitted Applications Feed */}
          <div className="space-y-4">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">
              All Active Applications ({INITIAL_APPLICATIONS.length})
            </h3>
            <div className="space-y-4">
              {INITIAL_APPLICATIONS.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`glass-card rounded-2xl p-6 border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    selectedApp.id === app.id
                      ? "border-primary ring-2 ring-primary/20 shadow-md"
                      : "border-outline-variant/20 hover:border-outline-variant/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={app.companyLogo}
                      alt={app.companyName}
                      className="w-12 h-12 rounded-xl object-contain bg-white p-2 border border-outline-variant/20 shadow-xs"
                    />
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{app.jobTitle}</h4>
                      <p className="text-xs text-on-surface-variant font-label-md">
                        {app.companyName} • Applied {app.appliedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-tertiary-container/30 text-tertiary font-label-sm font-bold text-xs rounded-full">
                      Match: {app.matchScore}%
                    </span>
                    <Link
                      href={`/applications/${app.id}/feedback`}
                      className="px-3 py-1 bg-surface-container-high hover:bg-primary-container/20 text-primary font-label-md font-bold text-xs rounded-full"
                    >
                      Feedback & AI Advice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
