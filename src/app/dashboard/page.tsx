"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { StatusBadge } from "@/components/ui/Badge";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

export default function SeekerDashboardPage() {
  const { user } = useAuth();
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [activeApplications, setActiveApplications] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [appsRes, jobsRes] = await Promise.all([
          fetch("/api/applications"),
          fetch("/api/jobs"),
        ]);

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          if (appsData.success && Array.isArray(appsData.data)) {
            setActiveApplications(appsData.data);
          }
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (jobsData.success && Array.isArray(jobsData.data)) {
            setRecommendedJobs(jobsData.data.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to load seeker dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalAppsCount = activeApplications.length;
  const inReviewCount = activeApplications.filter(
    (a) => a.status === "SUBMITTED" || a.status === "APPLIED" || a.status === "REVIEW" || a.status === "SCREENING"
  ).length;
  const interviewCount = activeApplications.filter(
    (a) => a.status === "INTERVIEW" || a.status === "TECHNICAL" || a.status === "HR"
  ).length;
  const offersCount = activeApplications.filter((a) => a.status === "OFFER" || a.status === "HIRED").length;

  return (
    <ProtectedRoute requiredPortal="seeker">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] w-full">
            <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Candidate Dashboard" }]} />

            {/* Header Greeting Banner */}
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-surface-container-lowest to-secondary-container/20">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm font-bold text-[11px] rounded-full inline-block">
                  ✨ Stage 1 Live Workspace
                </span>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                  Welcome back, {user?.name || "Candidate"}!
                </h1>
                <p className="text-on-surface-variant text-xs font-body-md">
                  {totalAppsCount > 0
                    ? `You have ${interviewCount} interview rounds and ${totalAppsCount} active applications.`
                    : "Explore open job positions, upload your verified resume, and track your applications in real-time."}
                </p>
              </div>
              <Link
                href="/profile"
                className="px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold rounded-xl text-xs hover:bg-primary-container transition-all shadow-xs flex items-center gap-2 touch-target flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base">edit_note</span>
                Update Profile & Resume
              </Link>
            </div>

            {/* Key Metric Summary Cards (Live Database Counts) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-card rounded-2xl p-4 border border-outline-variant/20 space-y-1">
                <span className="text-[10px] font-label-md uppercase font-semibold text-outline">Applications</span>
                <div className="font-display text-2xl font-bold text-on-surface">{totalAppsCount}</div>
                <span className="text-[10px] text-tertiary font-label-sm font-bold">{inReviewCount} in Review</span>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-outline-variant/20 space-y-1">
                <span className="text-[10px] font-label-md uppercase font-semibold text-outline">Interviews</span>
                <div className="font-display text-2xl font-bold text-primary">{interviewCount}</div>
                <span className="text-[10px] text-primary font-label-sm font-bold">{interviewCount > 0 ? "Active pipeline" : "0 scheduled"}</span>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-outline-variant/20 space-y-1">
                <span className="text-[10px] font-label-md uppercase font-semibold text-outline">Offers</span>
                <div className="font-display text-2xl font-bold text-on-surface">{offersCount}</div>
                <span className="text-[10px] text-outline font-label-sm font-bold">{offersCount > 0 ? "Received" : "0 pending"}</span>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-outline-variant/20 space-y-1">
                <span className="text-[10px] font-label-md uppercase font-semibold text-outline">Available Jobs</span>
                <div className="font-display text-2xl font-bold text-tertiary">{recommendedJobs.length}</div>
                <span className="text-[10px] text-tertiary font-label-sm font-bold">Live positions</span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <Link
                href="/resume-studio"
                className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 shadow-xs whitespace-nowrap touch-target flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                Resume Studio
              </Link>
              <Link
                href="/jobs"
                className="px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-all flex items-center gap-2 whitespace-nowrap touch-target flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base">search</span>
                Search Jobs
              </Link>
              <Link
                href="/applications"
                className="px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-all flex items-center gap-2 whitespace-nowrap touch-target flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base">assignment</span>
                View Applications
              </Link>
              <Link
                href="/messages"
                className="px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-all flex items-center gap-2 whitespace-nowrap touch-target flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base">mail</span>
                Messages
              </Link>
            </div>

            {/* Recommended Jobs Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-headline-sm text-xl font-bold text-on-surface">Available Job Openings</h3>
                  <p className="text-xs text-on-surface-variant">Live opportunities published on NextHire Cloud</p>
                </div>
                <Link href="/jobs" className="text-xs text-primary font-bold hover:underline font-label-md">
                  View All Jobs →
                </Link>
              </div>

              {recommendedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      id={job.id}
                      title={job.title}
                      company={job.companyName}
                      companyId={job.companyId || ""}
                      logo={job.companyLogo}
                      location={job.location}
                      salary={`$${Math.round(job.salaryMin / 1000)}k - $${Math.round(job.salaryMax / 1000)}k`}
                      type={job.employmentType}
                      tags={job.tags}
                      description={job.description}
                      aiMatchScore={95}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No job openings published yet"
                  description="When partner recruiters publish new positions, they will appear here."
                  icon="work_outline"
                  actionLabel="Browse Directory"
                  actionHref="/jobs"
                />
              )}
            </div>

            {/* Active Applications Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">Your Applications</h3>
                  <Link href="/applications" className="text-xs text-primary font-bold hover:underline">
                    View Tracker
                  </Link>
                </div>

                {activeApplications.length > 0 ? (
                  <div className="divide-y divide-outline-variant/10">
                    {activeApplications.slice(0, 3).map((app) => (
                      <div key={app.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogo
                            src={app.companyLogo}
                            name={app.companyName}
                            size="md"
                            rounded="xl"
                          />
                          <div>
                            <h4 className="font-bold text-xs text-on-surface">{app.jobTitle}</h4>
                            <span className="text-[11px] text-on-surface-variant">
                              {app.companyName} • Applied {app.appliedAt}
                            </span>
                          </div>
                        </div>

                        <StatusBadge status={app.status} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs text-on-surface-variant">You have not submitted any applications yet.</p>
                    <Link
                      href="/jobs"
                      className="inline-block px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl"
                    >
                      Find Jobs to Apply
                    </Link>
                  </div>
                )}
              </div>

              {/* Status Overview Card */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 bg-surface-container-low">
                <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                  Verified Candidate Status
                </h3>

                <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 space-y-3">
                  <div>
                    <span className="text-[11px] text-primary font-bold block">Stage 1 Verified Profile</span>
                    <h4 className="font-bold text-sm text-on-surface">{user?.email || "Candidate"}</h4>
                    <span className="text-xs text-on-surface-variant">Authenticated via Neon PostgreSQL</span>
                  </div>

                  <Link
                    href="/profile"
                    className="w-full text-center py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full block hover:bg-primary-container shadow-sm"
                  >
                    View Full Profile
                  </Link>
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
