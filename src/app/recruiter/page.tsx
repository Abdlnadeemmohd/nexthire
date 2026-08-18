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

export default function RecruiterDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
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

  useEffect(() => {
    async function loadRecruiterJobs() {
      try {
        setLoading(true);
        const res = await fetch("/api/recruiter/jobs");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setJobs(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load recruiter jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRecruiterJobs();
  }, []);

  const totalApplicants = jobs.reduce((acc, j) => acc + (j.applications?.length || 0), 0);
  const activeJobsCount = jobs.filter((j) => j.status === "ACTIVE").length;

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
                  {user?.companyName || "NextHire Simulation Corp"} • Talent Acquisition Suite
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
                <div className="font-display text-3xl font-bold text-on-surface">{totalApplicants}</div>
                <p className="text-[11px] text-tertiary font-label-sm">Live candidates in database</p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Active Jobs</span>
                  <span className="material-symbols-outlined text-primary">work</span>
                </div>
                <div className="font-display text-3xl font-bold text-on-surface">{activeJobsCount}</div>
                <p className="text-[11px] text-primary font-label-sm">Published positions</p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Total Job Postings</span>
                  <span className="material-symbols-outlined text-primary">bolt</span>
                </div>
                <div className="font-display text-3xl font-bold text-primary">{jobs.length}</div>
                <p className="text-[11px] text-primary font-label-sm">Company job catalog</p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Hiring SLA</span>
                  <span className="material-symbols-outlined text-tertiary">speed</span>
                </div>
                <div className="font-display text-3xl font-bold text-tertiary">7 Days</div>
                <p className="text-[11px] text-tertiary font-label-sm">Standard review target</p>
              </div>
            </div>

            {/* Active Jobs List Section */}
            <div className="glass-card rounded-2xl p-4 sm:p-8 border border-outline-variant/20 space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-sm text-base sm:text-xl font-bold text-on-surface">
                  Company Job Postings
                </h3>
                <Link href="/recruiter/jobs/new" className="text-xs font-label-md text-primary font-bold hover:underline touch-target">
                  + Post Job
                </Link>
              </div>

              {jobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-body-sm">
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
                            <span className="px-2.5 py-1 bg-primary/10 text-primary font-label-sm font-bold rounded-full">
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
                  description="Post your first active opening to begin sourcing candidates and reviewing resumes."
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
