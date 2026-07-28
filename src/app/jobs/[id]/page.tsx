"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { NativeShareButton } from "@/components/ui/MobileInteractionUtils";
import { INITIAL_JOBS, Job } from "@/lib/mockData";
import { formatSalary } from "@/lib/utils";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const job: Job =
    INITIAL_JOBS.find((j) => j.id === jobId) || INITIAL_JOBS[0];

  const [saved, setSaved] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  return (
    <>
      <TopAppBar />

      <main className="pt-20 pb-20 flex-1 bg-surface max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
        {/* Breadcrumb Navigation */}
        <div className="py-4 flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href="/jobs" className="hover:underline">
            Jobs
          </Link>
          <span>/</span>
          <span className="text-primary font-bold">{job.title}</span>
        </div>

        {/* Job Hero Banner */}
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 mb-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-outline-variant/20 p-3">
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                    {job.title}
                  </h1>
                  <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm rounded-full text-xs font-bold shadow-xs">
                    {job.matchScore}% High Match
                  </span>
                </div>
                <p className="text-on-surface-variant font-label-md text-sm">
                  <span className="font-semibold text-on-surface">{job.companyName}</span> •{" "}
                  {job.location} ({job.country}) • Posted {job.postedAt}
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
            {job.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-label-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Job Description & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                Role Overview
              </h2>
              <p className="text-on-surface-variant font-body-md leading-relaxed text-sm">
                {job.description}
              </p>
            </div>

            {/* Key Responsibilities */}
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                Key Responsibilities
              </h2>
              <ul className="space-y-3">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary text-lg mt-0.5">
                      check_circle
                    </span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                Requirements & Qualifications
              </h2>
              <ul className="space-y-3">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">
                      arrow_right
                    </span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits & Perks */}
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                Perks & Benefits
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {job.benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-tertiary text-xl">
                      card_giftcard
                    </span>
                    <span className="text-xs font-label-md font-semibold text-on-surface">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* About Company */}
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                About {job.companyName}
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {job.companyDescription}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10 text-xs font-label-md">
                <span className="text-outline">Company Size: {job.companySize}</span>
                <a
                  href={job.companyWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-bold hover:underline flex items-center gap-1"
                >
                  Visit Website <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary & Action Card */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-6 sticky top-24 shadow-md">
              <div className="space-y-1">
                <span className="text-xs text-outline font-label-sm uppercase tracking-wider font-semibold">
                  Compensation Benchmark
                </span>
                <div className="font-display text-3xl font-bold text-primary">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </div>
                <p className="text-[11px] text-tertiary font-label-sm font-semibold">
                  Top 5% market tier for {job.title}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-outline-variant/20 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-label-md">Employment Type</span>
                  <span className="font-bold text-on-surface">{job.employmentType.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-label-md">Experience Level</span>
                  <span className="font-bold text-on-surface">{job.experienceLevel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-label-md">Workplace Setup</span>
                  <span className="font-bold text-on-surface">
                    {job.isRemote ? "100% Remote" : "Hybrid"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-label-md">AI Match Rating</span>
                  <span className="font-bold text-tertiary">{job.matchScore}% Verified</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <button
                  onClick={() => setApplyModalOpen(true)}
                  className="w-full py-3.5 bg-primary text-on-primary font-label-md font-bold rounded-full text-sm hover:bg-primary-container transition-all shadow-md"
                >
                  Apply Now
                </button>
                <Link
                  href="/messages"
                  className="w-full py-3.5 bg-surface-container-high text-on-surface font-label-md font-bold rounded-full text-sm hover:bg-primary-container/20 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  Message Recruiter
                </Link>
              </div>
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
