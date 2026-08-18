"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { NativeShareButton } from "@/components/ui/MobileInteractionUtils";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { Job } from "@/lib/mockData";
import { formatSalary } from "@/lib/utils";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setJob(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load job details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  if (loading) {
    return (
      <>
        <TopAppBar />
        <main className="min-h-screen bg-surface pt-28 pb-20 px-4 text-center">
          <p className="text-xs text-on-surface-variant">Loading job position details...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!job) {
    return (
      <>
        <TopAppBar />
        <main className="min-h-screen bg-surface pt-28 pb-20 px-4 max-w-4xl mx-auto">
          <EmptyState
            title="Job Position Not Found"
            description="This position may have been filled, archived, or is no longer accepting applications."
            icon="work_off"
            actionLabel="Browse Available Jobs"
            actionHref="/jobs"
          />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh pt-20 sm:pt-24 pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant flex-wrap">
          <Link href="/jobs" className="hover:text-primary font-semibold">
            Jobs
          </Link>
          <span>/</span>
          <Link
            href={`/jobs?category=${encodeURIComponent(job.category || "")}`}
            className="hover:text-primary font-semibold"
          >
            {job.category || "General"}
          </Link>
          <span>/</span>
          <span className="text-primary font-bold truncate max-w-[200px] sm:max-w-none">{job.title}</span>
        </div>

        {/* Job Hero Banner */}
        <div className="glass-card rounded-2xl p-4 sm:p-8 border border-outline-variant/20 mb-6 sm:mb-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0">
              <CompanyLogo
                src={job.companyLogo}
                name={job.companyName}
                size="xl"
                rounded="2xl"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-on-surface">
                    {job.title}
                  </h1>
                  <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm rounded-full text-xs font-bold shadow-xs">
                    {job.matchScore || 95}% Match
                  </span>
                </div>
                <p className="text-on-surface-variant font-label-md text-sm">
                  <span className="font-semibold text-on-surface">{job.companyName}</span> •{" "}
                  {job.location} ({job.country || "Global"}) • Posted {job.postedAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setSaved(!saved)}
                className={`p-3 rounded-full border transition-all touch-target ${
                  saved
                    ? "bg-primary-container/20 border-primary text-primary"
                    : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
                }`}
                title={saved ? "Saved" : "Save Job"}
              >
                <span className="material-symbols-outlined text-xl">
                  {saved ? "bookmark" : "bookmark_border"}
                </span>
              </button>

              <NativeShareButton title={`${job.title} at ${job.companyName}`} />

              <button
                onClick={() => setApplyModalOpen(true)}
                className="flex-1 md:flex-initial px-8 py-3.5 bg-primary text-on-primary rounded-full font-label-md font-bold text-sm hover:bg-primary-container transition-all shadow-md active:scale-95 touch-target"
              >
                Apply Now
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
            {(job.tags || []).map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-label-md font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Two-Column Grid: Job Details & Sidebar Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Section */}
            <section className="glass-card rounded-2xl p-6 sm:p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Role Overview
              </h2>
              <div className="text-on-surface-variant font-body-md text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </section>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <section className="glass-card rounded-2xl p-6 sm:p-8 border border-outline-variant/20 space-y-4">
                <h2 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">task_alt</span>
                  Key Responsibilities
                </h2>
                <ul className="space-y-2.5 text-on-surface-variant text-sm font-body-md">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-base mt-0.5 flex-shrink-0">
                        check_circle
                      </span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <section className="glass-card rounded-2xl p-6 sm:p-8 border border-outline-variant/20 space-y-4">
                <h2 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  Requirements & Qualifications
                </h2>
                <ul className="space-y-2.5 text-on-surface-variant text-sm font-body-md">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-secondary text-base mt-0.5 flex-shrink-0">
                        arrow_forward
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Quick Facts Card */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
              <h3 className="font-headline-sm text-base font-bold text-on-surface">Job Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">Compensation</span>
                  <span className="font-bold text-primary">
                    ${Math.round(job.salaryMin / 1000)}k - ${Math.round(job.salaryMax / 1000)}k
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">Employment Type</span>
                  <span className="font-bold text-on-surface">{job.employmentType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">Experience Level</span>
                  <span className="font-bold text-on-surface">{job.experienceLevel}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">Remote Flexibility</span>
                  <span className="font-bold text-on-surface">{job.isRemote ? "Remote" : "On-site"}</span>
                </div>
              </div>
            </div>

            {/* Company Info Card */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
              <h3 className="font-headline-sm text-base font-bold text-on-surface">About {job.companyName}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {job.companyDescription || "Enterprise hiring partner on the NextHire platform."}
              </p>
              {job.companyWebsite && (
                <a
                  href={job.companyWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary font-bold hover:underline block"
                >
                  Visit Website →
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <JobApplyModal
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
      />
    </>
  );
}
