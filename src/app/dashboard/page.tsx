"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
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

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-6 md:p-10 space-y-8 max-w-[1600px] w-full">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <span className="text-xs font-label-md uppercase font-semibold text-outline">Applications</span>
                <div className="font-display text-3xl font-bold text-on-surface">4</div>
                <span className="text-[11px] text-tertiary font-label-sm font-bold">2 in Review</span>
              </div>
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <span className="text-xs font-label-md uppercase font-semibold text-outline">Interviews</span>
                <div className="font-display text-3xl font-bold text-primary">2</div>
                <span className="text-[11px] text-primary font-label-sm font-bold">1 Scheduled Today</span>
              </div>
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <span className="text-xs font-label-md uppercase font-semibold text-outline">Saved Jobs</span>
                <div className="font-display text-3xl font-bold text-on-surface">12</div>
                <span className="text-[11px] text-outline font-label-sm font-bold">3 closing soon</span>
              </div>
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <span className="text-xs font-label-md uppercase font-semibold text-outline">Profile Views</span>
                <div className="font-display text-3xl font-bold text-tertiary">86</div>
                <span className="text-[11px] text-tertiary font-label-sm font-bold">+24% this week</span>
              </div>
            </div>

            {/* Recommended Jobs */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-headline-sm text-xl font-bold text-on-surface">AI Skill Matches For You</h3>
                  <p className="text-xs text-on-surface-variant">Recommended based on your React, Next.js & TypeScript skills</p>
                </div>
                <Link href="/jobs" className="text-xs text-primary font-bold hover:underline font-label-md">
                  View All Matches →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    id={job.id}
                    title={job.title}
                    company={job.companyName}
                    companyId="c-1"
                    logo={job.companyLogo}
                    location={job.location}
                    salary={`$${Math.round(job.salaryMin / 1000)}k - $${Math.round(job.salaryMax / 1000)}k`}
                    type={job.employmentType}
                    tags={job.tags}
                    description={job.description}
                    aiMatchScore={94}
                  />
                ))}
              </div>
            </div>

            {/* Active Applications & Upcoming Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">Active Applications</h3>
                  <Link href="/applications" className="text-xs text-primary font-bold hover:underline">
                    View Tracker
                  </Link>
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {activeApplications.slice(0, 3).map((app) => (
                    <div key={app.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.companyLogo}
                          alt={app.companyName}
                          className="w-10 h-10 rounded-xl object-cover border border-outline-variant/20 p-1 bg-white"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-on-surface">{app.jobTitle}</h4>
                          <span className="text-[11px] text-on-surface-variant">{app.companyName} • Applied {app.appliedAt}</span>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-tertiary-container/20 text-tertiary font-label-sm font-bold text-[11px] rounded-full">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Interview Card */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 bg-surface-container-low">
                <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">video_camera_front</span>
                  Next Technical Interview
                </h3>

                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 space-y-3">
                  <div>
                    <span className="text-[11px] text-primary font-bold block">Today • 3:00 PM EST</span>
                    <h4 className="font-bold text-sm text-on-surface">Senior Frontend Engineer</h4>
                    <span className="text-xs text-on-surface-variant">Stripe • 45 min Technical Call</span>
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

          <Footer />
        </div>
      </div>

      <JobApplyModal
        jobId={selectedJobToApply?.id || ""}
        jobTitle={selectedJobToApply?.title || ""}
        companyName={selectedJobToApply?.companyName || ""}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
      />
    </ProtectedRoute>
  );
}
