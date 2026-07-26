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

export default function RecruiterDashboardPage() {
  const { user } = useAuth();
  const [jobs] = useState(INITIAL_JOBS);

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

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Active Jobs</span>
                  <span className="material-symbols-outlined text-primary">work</span>
                </div>
                <div className="font-display text-3xl font-bold text-on-surface">{jobs.length}</div>
                <p className="text-[11px] text-outline font-label-sm">4 roles hiring</p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Interview Rate</span>
                  <span className="material-symbols-outlined text-tertiary">speed</span>
                </div>
                <div className="font-display text-3xl font-bold text-tertiary">34%</div>
                <p className="text-[11px] text-tertiary font-label-sm">Top 10% benchmark</p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-2">
                <div className="flex justify-between items-center text-outline">
                  <span className="text-xs font-label-md uppercase font-semibold">Avg Time to Hire</span>
                  <span className="material-symbols-outlined text-primary">schedule</span>
                </div>
                <div className="font-display text-3xl font-bold text-on-surface">14d</div>
                <p className="text-[11px] text-outline font-label-sm">Efficient pipeline</p>
              </div>
            </div>

            {/* Active Jobs List Table */}
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                  Active Open Positions
                </h3>
                <Link href="/recruiter/jobs/new" className="text-xs font-label-md text-primary font-bold hover:underline">
                  + Post Another Job
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-body-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-outline uppercase font-label-md font-semibold">
                      <th className="pb-3 px-4">Role Title</th>
                      <th className="pb-3 px-4">Category</th>
                      <th className="pb-3 px-4">Location</th>
                      <th className="pb-3 px-4">Salary</th>
                      <th className="pb-3 px-4">Applicants</th>
                      <th className="pb-3 px-4">Action</th>
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
                        <td className="py-4 px-4 text-on-surface-variant">{job.category}</td>
                        <td className="py-4 px-4 text-on-surface-variant">{job.location}</td>
                        <td className="py-4 px-4 font-bold text-primary">${Math.round(job.salaryMin / 1000)}k - ${Math.round(job.salaryMax / 1000)}k</td>
                        <td className="py-4 px-4 font-bold">
                          <span className="px-2.5 py-1 bg-tertiary-container/20 text-tertiary font-label-sm font-bold rounded-full">
                            28 Applicants
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href="/recruiter/applicants"
                            className="px-3 py-1 bg-surface-container-high hover:bg-primary hover:text-white rounded-full font-label-md font-bold transition-all text-[11px]"
                          >
                            Review Applicants
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
