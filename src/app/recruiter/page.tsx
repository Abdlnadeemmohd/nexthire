"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

interface RecruiterJob {
  id: string;
  title: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  employmentType: string;
  status: string;
  createdAt: string;
  company?: { name: string };
  applications?: any[];
}

interface RadarSummary {
  totalMatchingCandidates: number;
  strongMatches: number;
  newMatchesThisWeek: number;
  recentlyActiveCandidates: number;
  actionRequiredItems: Array<{
    id: string;
    type: string;
    priority: "CRITICAL" | "IMPORTANT" | "NORMAL";
    title: string;
    description: string;
    ctaText: string;
    ctaUrl: string;
  }>;
}

export default function RecruiterDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [radarSummary, setRadarSummary] = useState<RadarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDropdownJobId, setActiveDropdownJobId] = useState<string | null>(null);

  const toggleDropdown = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownJobId((prev) => (prev === jobId ? null : jobId));
  };

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownJobId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [jobsRes, radarRes] = await Promise.all([
        fetch("/api/recruiter/jobs"),
        fetch("/api/recruiter/talent-radar"),
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (jobsData.success && Array.isArray(jobsData.data)) {
          setJobs(jobsData.data);
        }
      }

      if (radarRes.ok) {
        const radarData = await radarRes.json();
        if (radarData.success && radarData.data) {
          setRadarSummary({
            totalMatchingCandidates: radarData.data.overview.totalMatchingCandidates,
            strongMatches: radarData.data.overview.strongMatches,
            newMatchesThisWeek: radarData.data.overview.newMatchesThisWeek,
            recentlyActiveCandidates: radarData.data.overview.recentlyActiveCandidates,
            actionRequiredItems: radarData.data.actionRequired?.items || [],
          });
        }
      }
    } catch (err) {
      console.error("Failed to load recruiter dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch("/api/recruiter/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: nextStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Job status updated to ${nextStatus}!`, "success");
        loadDashboardData();
      } else {
        showToast(data.error || "Failed to update job status", "error");
      }
    } catch (err) {
      showToast("Network error updating job", "error");
    } finally {
      setActiveDropdownJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the job posting "${title}"?`)) return;

    try {
      const res = await fetch(`/api/recruiter/jobs?id=${jobId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Job "${title}" deleted from database.`, "success");
        loadDashboardData();
      } else {
        showToast(data.error || "Failed to delete job", "error");
      }
    } catch (err) {
      showToast("Network error deleting job", "error");
    } finally {
      setActiveDropdownJobId(null);
    }
  };

  const totalApplicants = jobs.reduce((acc, j) => acc + (j.applications?.length || 0), 0);
  const activeJobsCount = jobs.filter((j) => j.status === "ACTIVE").length;

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full pb-20 sm:pb-24">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Recruiter Dashboard" }]} />

            {/* Header Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                    Employer Dashboard
                  </h1>
                  {user?.isVerified && (
                    <VerifiedBadge role="RECRUITER" tier={(user as any)?.subscriptionTier} size="md" />
                  )}
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm font-body-md">
                  {user?.companyName || "Employer Workspace"} • Talent Acquisition Suite
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Link
                  href="/recruiter/copilot"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-label-md font-bold text-xs rounded-full transition-all flex items-center gap-1.5 touch-target shadow-md hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                  Recruiter Copilot
                </Link>
                <Link
                  href="/recruiter/talent-radar"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-label-md font-bold text-xs rounded-full border border-primary/20 transition-all flex items-center gap-1.5 touch-target shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">radar</span>
                  Talent Radar
                </Link>
                <Link
                  href="/recruiter/applicants"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-full hover:bg-primary-container/20 hover:text-primary transition-all touch-target"
                >
                  Candidate Pipeline
                </Link>
                <Link
                  href="/recruiter/jobs/new"
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2 touch-target"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Post New Job
                </Link>
              </div>
            </div>

            {/* Action Required Banner (Priority alerts) */}
            {radarSummary?.actionRequiredItems && radarSummary.actionRequiredItems.length > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-lg">warning</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-xs sm:text-sm font-bold text-on-surface">
                      {radarSummary.actionRequiredItems[0]?.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {radarSummary.actionRequiredItems[0]?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Link
                    href={radarSummary.actionRequiredItems[0]?.ctaUrl || "/recruiter/applicants"}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-label-md font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 w-full md:w-auto"
                  >
                    <span>{radarSummary.actionRequiredItems[0]?.ctaText}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Metrics & Talent Radar Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-outline-variant/20 space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Total Applicants</span>
                  <span className="material-symbols-outlined text-primary">groups</span>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-on-surface">{totalApplicants}</div>
                <p className="text-[11px] text-tertiary font-label-sm">Live candidate applications</p>
              </div>

              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-outline-variant/20 space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Active Jobs</span>
                  <span className="material-symbols-outlined text-primary">work</span>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-on-surface">{activeJobsCount}</div>
                <p className="text-[11px] text-primary font-label-sm">Published positions</p>
              </div>

              {/* Radar: Matching Talent */}
              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-primary/25 bg-primary/5 space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center text-primary">
                  <span className="text-xs font-label-md uppercase font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">radar</span>
                    Matching Talent
                  </span>
                  <Link href="/recruiter/talent-radar" className="text-[10px] underline font-bold">
                    View
                  </Link>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-primary">
                  {radarSummary?.totalMatchingCandidates || 0}
                </div>
                <p className="text-[11px] text-primary font-label-sm">
                  {radarSummary?.strongMatches || 0} strong skill matches
                </p>
              </div>

              {/* Radar: New Talent This Week */}
              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-outline-variant/20 space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">New Talent This Week</span>
                  <span className="material-symbols-outlined text-tertiary">fiber_new</span>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-tertiary">
                  {radarSummary?.newMatchesThisWeek || 0}
                </div>
                <p className="text-[11px] text-tertiary font-label-sm">Candidates matching your jobs</p>
              </div>
            </div>

            {/* Active Jobs List Section */}
            <div className="glass-card rounded-2xl p-4 sm:p-8 border border-outline-variant/20 space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-headline-sm text-base sm:text-xl font-bold text-on-surface">
                    Company Job Postings
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Manage active openings, review candidate pipelines, and source matching talent.
                  </p>
                </div>
                <Link href="/recruiter/jobs/new" className="text-xs font-label-md text-primary font-bold hover:underline touch-target">
                  + Post Job
                </Link>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  Loading company jobs from database...
                </div>
              ) : jobs.length > 0 ? (
                <div className="overflow-x-auto no-scrollbar -mx-2 sm:mx-0 px-2 sm:px-0">
                  <table className="w-full text-left text-xs font-body-sm min-w-[640px]">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-outline uppercase font-label-md font-semibold">
                        <th className="pb-3 px-4">Role Title</th>
                        <th className="pb-3 px-4">Location</th>
                        <th className="pb-3 px-4">Salary Range</th>
                        <th className="pb-3 px-4">Applicants</th>
                        <th className="pb-3 px-4">Status</th>
                        <th className="pb-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-surface-container/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-sm text-on-surface">
                            <Link href={`/jobs/${job.id}`} className="hover:text-primary">
                              {job.title}
                            </Link>
                          </td>
                          <td className="py-4 px-4 text-on-surface-variant">{job.location}</td>
                          <td className="py-4 px-4 font-bold text-primary">
                            ${Math.round(job.salaryMin / 1000)}k - ${Math.round(job.salaryMax / 1000)}k
                          </td>
                          <td className="py-4 px-4 font-bold">
                            <span className="px-2.5 py-1 bg-tertiary-container/20 text-tertiary font-label-sm font-bold rounded-full">
                              {job.applications?.length || 0} Applicants
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 font-label-sm font-bold rounded-full ${
                                job.status === "ACTIVE"
                                    ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right relative">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => toggleDropdown(job.id, e)}
                                className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs rounded-xl border border-outline-variant/30 transition-all flex items-center gap-1.5 shadow-xs"
                              >
                                Actions
                                <span className="material-symbols-outlined text-sm">
                                  {activeDropdownJobId === job.id ? "arrow_drop_up" : "arrow_drop_down"}
                                </span>
                              </button>

                              {activeDropdownJobId === job.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full mt-1 w-52 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl py-2 z-50 text-xs font-body-md text-on-surface space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <Link
                                    href="/recruiter/applicants"
                                    className="w-full px-3.5 py-2 hover:bg-surface-container-low flex items-center gap-2 font-bold text-primary transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-base">groups</span>
                                    Review Applicants
                                  </Link>

                                  <Link
                                    href={`/recruiter/candidates?title=${encodeURIComponent(job.title)}`}
                                    className="w-full px-3.5 py-2 hover:bg-surface-container-low flex items-center gap-2 font-bold text-tertiary transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-base">radar</span>
                                    View Matching Talent
                                  </Link>

                                  <Link
                                    href={`/jobs/${job.id}`}
                                    className="w-full px-3.5 py-2 hover:bg-surface-container-low flex items-center gap-2 font-medium transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-base">visibility</span>
                                    View Job Details
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleJobStatus(job.id, job.status)}
                                    className="w-full px-3.5 py-2 hover:bg-surface-container-low flex items-center gap-2 font-medium text-amber-700 transition-colors text-left"
                                  >
                                    <span className="material-symbols-outlined text-base">
                                      {job.status === "ACTIVE" ? "pause_circle" : "play_circle"}
                                    </span>
                                    {job.status === "ACTIVE" ? "Pause Hiring" : "Reopen Opening"}
                                  </button>

                                  <div className="h-px bg-outline-variant/20 my-1" />

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteJob(job.id, job.title)}
                                    className="w-full px-3.5 py-2 hover:bg-error-container/20 text-error flex items-center gap-2 font-medium transition-colors text-left"
                                  >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                    Delete Job
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="Your company has not posted any jobs yet"
                  description="Post your first active opening to begin sourcing candidates, receiving Talent Radar matches, and reviewing applications."
                  icon="post_add"
                  actionLabel="Post New Job"
                  actionHref="/recruiter/jobs/new"
                />
              )}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
