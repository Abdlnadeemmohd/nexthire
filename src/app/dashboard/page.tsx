"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { INITIAL_JOBS, INITIAL_APPLICATIONS, Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

export default function SeekerDashboardPage() {
  const { user } = useAuth();
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);

  const activeApplications = INITIAL_APPLICATIONS;
  const recommendedJobs = INITIAL_JOBS.slice(0, 3);

  return (
    <ProtectedRoute requiredPortal="seeker">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header Greeting Banner */}
          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-surface-container-lowest to-secondary-container/20">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm font-bold text-xs rounded-full inline-block">
                ✨ AI Radar Active
              </span>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                Welcome back, {user?.name || "Alex"}!
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                You have 2 upcoming interview rounds and 4 active applications matching your profile.
              </p>
            </div>
            <Link
              href="/profile"
              className="px-6 py-3 bg-primary text-on-primary font-label-md font-bold rounded-full text-xs hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              Update Profile & Resume
            </Link>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <div className="flex justify-between items-center text-outline">
                <span className="text-xs font-label-md uppercase font-semibold">Active Applications</span>
                <span className="material-symbols-outlined text-primary">fact_check</span>
              </div>
              <div className="font-display text-3xl font-bold text-on-surface">4</div>
              <p className="text-[11px] text-tertiary font-label-sm">2 in interview pipeline</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <div className="flex justify-between items-center text-outline">
                <span className="text-xs font-label-md uppercase font-semibold">Saved Jobs</span>
                <span className="material-symbols-outlined text-primary">bookmark</span>
              </div>
              <div className="font-display text-3xl font-bold text-on-surface">12</div>
              <p className="text-[11px] text-outline font-label-sm">3 closing soon</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <div className="flex justify-between items-center text-outline">
                <span className="text-xs font-label-md uppercase font-semibold">Profile Views</span>
                <span className="material-symbols-outlined text-primary">visibility</span>
              </div>
              <div className="font-display text-3xl font-bold text-on-surface">128</div>
              <p className="text-[11px] text-tertiary font-label-sm">+24% this week</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
              <div className="flex justify-between items-center text-outline">
                <span className="text-xs font-label-md uppercase font-semibold">AI Match Score</span>
                <span className="material-symbols-outlined text-tertiary">stars</span>
              </div>
              <div className="font-display text-3xl font-bold text-tertiary">96%</div>
              <p className="text-[11px] text-tertiary font-label-sm">Top tier candidate</p>
            </div>
          </div>

          {/* Grid Layout: Active Applications & Upcoming Interviews */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Applications Tracker List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                  Active Application Status
                </h2>
                <Link href="/applications" className="text-xs font-label-md text-primary hover:underline font-bold">
                  View Full Tracker →
                </Link>
              </div>

              <div className="space-y-4">
                {activeApplications.map((app) => (
                  <div
                    key={app.id}
                    className="glass-card rounded-2xl p-6 border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-outline-variant/20 p-2 overflow-hidden shadow-xs">
                        <img src={app.companyLogo} alt={app.companyName} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-headline-sm text-base font-bold text-on-surface">{app.jobTitle}</h4>
                        <p className="text-xs text-on-surface-variant font-label-md">{app.companyName} • Applied {app.appliedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`px-3 py-1 text-xs font-label-md font-bold rounded-full ${
                        app.status === "INTERVIEW"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed"
                          : app.status === "OFFER"
                          ? "bg-primary-fixed text-on-primary-fixed"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}>
                        {app.status.replace("_", " ")}
                      </span>
                      <Link href="/applications" className="text-xs font-label-md text-primary font-bold hover:underline">
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Interview Card */}
            <div className="space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                Upcoming Interview
              </h2>

              <div className="glass-card rounded-2xl p-6 border-2 border-primary/30 space-y-4 bg-primary-fixed/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">videocam</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-base font-bold text-on-surface">Technical Round</h4>
                    <p className="text-xs text-on-surface-variant font-label-md">Stellar Systems</p>
                  </div>
                </div>

                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-on-surface">
                    <span>Tomorrow, 2:00 PM PST</span>
                    <span className="text-tertiary">Confirmed</span>
                  </div>
                  <p className="text-outline">Interviewer: Sarah Jenkins (Design Lead)</p>
                </div>

                <a
                  href="https://meet.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full block hover:bg-primary-container shadow-sm"
                >
                  Join Google Meet Call
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>

      <JobApplyModal
        job={selectedJobToApply}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
        onSuccess={(j) => console.log("Applied", j.title)}
      />
    </ProtectedRoute>
  );
}
