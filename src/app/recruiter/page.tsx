"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { INITIAL_JOBS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

import { useEffect } from "react";
import { RecruitmentEngine, SyncJob } from "@/services/recruitmentEngine";
import { useToast } from "@/components/ui/Toast";

export default function RecruiterDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>(RecruitmentEngine.getJobs());
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<SyncJob | null>(null);
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

  useEffect(() => {
    const unsub = RecruitmentEngine.subscribe(() => {
      setSyncJobs([...RecruitmentEngine.getJobs()]);
    });
    return unsub;
  }, []);

  const handlePauseToggle = (job: SyncJob) => {
    if (job.status === "PAUSED") {
      RecruitmentEngine.reopenJob(job.id);
      showToast(`Hiring for '${job.title}' reopened!`, "success");
    } else {
      RecruitmentEngine.pauseJob(job.id);
      showToast(`Hiring for '${job.title}' paused!`, "info");
    }
  };

  const handleDuplicate = (job: SyncJob) => {
    const copy = RecruitmentEngine.duplicateJob(job.id);
    if (copy) {
      showToast(`Duplicated job posting: ${copy.title}`, "success");
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmJob) return;
    RecruitmentEngine.deleteJob(deleteConfirmJob.id);
    showToast(`Job '${deleteConfirmJob.title}' archived. Historical analytics preserved.`, "info");
    setDeleteConfirmJob(null);
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-6 md:p-10 space-y-6 max-w-[1600px] w-full">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Recruiter Dashboard" }]} />

            {/* Header Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <h1 className="font-display text-3xl font-bold text-on-surface">
                  Employer Dashboard
                </h1>
                <p className="text-on-surface-variant text-sm font-body-md">
                  {user?.companyName || "Stellar Systems"} • Talent Acquisition Suite
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/recruiter/applicants"
                  className="px-5 py-2.5 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-full hover:bg-primary-container/20 hover:text-primary transition-all"
                >
                  View Candidate Pipeline
                </Link>
                <Link
                  href="/recruiter/jobs/new"
                  className="px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Post New Job
                </Link>
              </div>
            </div>

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Total Applicants</span>
                  <span className="material-symbols-outlined text-primary">groups</span>
                </div>
                <div className="font-display text-3xl font-bold text-on-surface">142</div>
                <p className="text-[11px] text-tertiary font-label-sm">+18 this week</p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2 bg-amber-500/10 border-amber-500/30">
                <div className="flex justify-between items-center text-amber-700">
                  <span className="text-xs font-label-md uppercase font-semibold">SLA Alerts (&gt;7 Days)</span>
                  <span className="material-symbols-outlined text-amber-700">warning</span>
                </div>
                <div className="font-display text-3xl font-bold text-amber-800">1</div>
                <p className="text-[11px] text-amber-700 font-bold">Requires applicant update</p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">High Priority Roles</span>
                  <span className="material-symbols-outlined text-primary">bolt</span>
                </div>
                <div className="font-display text-3xl font-bold text-primary">2</div>
                <p className="text-[11px] text-primary font-label-sm">AI recommendation boosted</p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Avg Response SLA</span>
                  <span className="material-symbols-outlined text-tertiary">speed</span>
                </div>
                <div className="font-display text-3xl font-bold text-tertiary">2.4 days</div>
                <p className="text-[11px] text-tertiary font-label-sm">100% compliant with 7d policy</p>
              </div>
            </div>

            {/* Active Jobs List Table */}
            {/* Active Jobs List Section */}
            <div className="glass-card rounded-2xl p-4 sm:p-8 border border-outline-variant/20 space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-sm text-base sm:text-xl font-bold text-on-surface">
                  Active Open Positions
                </h3>
                <Link href="/recruiter/jobs/new" className="text-xs font-label-md text-primary font-bold hover:underline touch-target">
                  + Post Job
                </Link>
              </div>

              {/* Desktop Table View (MD+ screens) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs font-body-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-outline uppercase font-label-md font-semibold">
                      <th className="pb-3 px-4">Role Title</th>
                      <th className="pb-3 px-4">Company</th>
                      <th className="pb-3 px-4">Location</th>
                      <th className="pb-3 px-4">Salary Range</th>
                      <th className="pb-3 px-4">Applicants</th>
                      <th className="pb-3 px-4 text-right align-middle font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                    {syncJobs.filter((j) => j.status !== "ARCHIVED").map((job) => (
                      <tr key={job.id} className="hover:bg-surface-container/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-sm text-on-surface">
                          <Link href={`/jobs/${job.id}`} className="hover:text-primary flex items-center gap-2">
                            {job.title}
                            {job.status === "PAUSED" && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 font-bold text-[10px] rounded-md">
                                PAUSED
                              </span>
                            )}
                            {job.status === "FILLED" && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 font-bold text-[10px] rounded-md">
                                FILLED
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">{job.company}</td>
                        <td className="py-4 px-4 text-on-surface-variant">{job.location}</td>
                        <td className="py-4 px-4 font-bold text-primary">{job.salary}</td>
                        <td className="py-4 px-4 font-bold">
                          <span className="px-2.5 py-1 bg-tertiary-container/20 text-tertiary font-label-sm font-bold rounded-full">
                            {job.applicantsCount} Applicants
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
                              <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                            </button>

                            {activeDropdownJobId === job.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl py-2 z-50 text-xs font-body-md text-on-surface space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                              >
                                <Link
                                  href="/recruiter/applicants"
                                  className="w-full px-3.5 py-2 hover:bg-surface-container-low flex items-center gap-2 font-bold text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">groups</span>
                                  Review Applicants
                                </Link>

                                <Link
                                  href={`/jobs/${job.id}`}
                                  className="w-full px-3.5 py-2 hover:bg-surface-container-low flex items-center gap-2 font-medium transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">visibility</span>
                                  View Job Details
                                </Link>

                                <Link
                                  href="/recruiter/jobs/new"
                                  className="w-full px-3.5 py-2 hover:bg-surface-container-low flex items-center gap-2 font-medium transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                  Edit Job Posting
                                </Link>

                                <button
                                  onClick={() => {
                                    handlePauseToggle(job);
                                    setActiveDropdownJobId(null);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-surface-container-low text-left flex items-center gap-2 font-medium transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {job.status === "PAUSED" ? "play_arrow" : "pause"}
                                  </span>
                                  {job.status === "PAUSED" ? "Resume Hiring" : "Pause Hiring"}
                                </button>

                                <button
                                  onClick={() => {
                                    handleDuplicate(job);
                                    setActiveDropdownJobId(null);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-surface-container-low text-left flex items-center gap-2 font-medium transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">content_copy</span>
                                  Duplicate Job
                                </button>

                                <div className="my-1 border-t border-outline-variant/20"></div>

                                <button
                                  onClick={() => {
                                    setDeleteConfirmJob(job);
                                    setActiveDropdownJobId(null);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-error/10 text-error text-left flex items-center gap-2 font-bold transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">archive</span>
                                  Archive / Delete Job
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

              {/* Mobile Stacked Cards View (<MD screens) */}
              <div className="md:hidden space-y-3">
                {syncJobs.filter((j) => j.status !== "ARCHIVED").map((job) => (
                  <div
                    key={job.id}
                    className="bg-surface-container-low/60 border border-outline-variant/30 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/jobs/${job.id}`} className="font-bold text-sm text-on-surface hover:text-primary line-clamp-1">
                          {job.title}
                        </Link>
                        <p className="text-xs text-on-surface-variant">{job.company} • {job.location}</p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-tertiary-container/20 text-tertiary font-bold rounded-full text-[10px] flex-shrink-0">
                        {job.applicantsCount} Applicants
                      </span>
                    </div>

                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2 flex-wrap text-xs font-bold">
                      <span className="text-primary">{job.salary}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePauseToggle(job)}
                          className="px-2 py-1 bg-surface-container-high text-on-surface rounded-lg"
                        >
                          {job.status === "PAUSED" ? "Reopen" : "Pause"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmJob(job)}
                          className="px-2 py-1 bg-error/10 text-error rounded-lg"
                        >
                          Archive
                        </button>
                        <Link
                          href="/recruiter/applicants"
                          className="px-3 py-1 bg-primary text-on-primary rounded-lg shadow-xs"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Archive Confirmation Modal */}
            {deleteConfirmJob && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-center gap-3 text-error">
                    <span className="material-symbols-outlined text-2xl">warning</span>
                    <h3 className="font-bold text-base text-on-surface">Confirm Archiving Job Posting</h3>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Are you sure you want to archive <strong>{deleteConfirmJob.title}</strong>? Active applicants will be notified that recruitment has concluded. Historical analytics will be preserved.
                  </p>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteConfirmJob(null)}
                      className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-5 py-2 bg-error text-on-error font-bold text-xs rounded-xl hover:bg-error/90 shadow-sm"
                    >
                      Archive Posting
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
