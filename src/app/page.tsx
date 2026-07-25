"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { INITIAL_JOBS, Job } from "@/lib/mockData";

export default function LandingPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      `/jobs?q=${encodeURIComponent(searchTitle)}&location=${encodeURIComponent(
        searchLocation
      )}`
    );
  };

  const featuredJob = INITIAL_JOBS[0];
  const secondaryJobs = INITIAL_JOBS.slice(1, 4);

  return (
    <>
      <TopAppBar />

      <main className="pt-16 pb-20 md:pb-0 flex-1 overflow-x-hidden">
        {/* Hero Section - Fluid Responsive Centering */}
        <section className="relative min-h-[80vh] sm:min-h-[85vh] flex flex-col items-center justify-center bg-mesh px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="relative z-10 max-w-4xl mx-auto space-y-6 flex flex-col items-center justify-center">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm uppercase tracking-wider text-[11px] sm:text-xs font-semibold shadow-xs">
              ⚡ AI-Powered Skill-First Matching
            </span>

            <h1 className="font-display font-bold font-display-hero text-on-background tracking-tight max-w-3xl">
              Find Your Next <span className="text-primary">Opportunity</span>
            </h1>

            <p className="font-body-fluid-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Connecting exceptional tech talent with world-class companies through intelligent, verified skill-match algorithms.
            </p>

            {/* Responsive AI Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mt-6 w-full max-w-3xl glass-card rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col md:flex-row gap-2.5 sm:gap-3 border border-white/60"
            >
              <div className="flex-1 flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
                  work_outline
                </span>
                <input
                  className="w-full bg-transparent border-none focus:outline-none font-body-md text-on-surface placeholder:text-outline text-xs sm:text-sm"
                  placeholder="Title, Skills, or Company"
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>

              <div className="flex-1 flex items-center gap-3 px-3 py-2">
                <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
                  location_on
                </span>
                <input
                  className="w-full bg-transparent border-none focus:outline-none font-body-md text-on-surface placeholder:text-outline text-xs sm:text-sm"
                  placeholder="Location or 'Remote'"
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="bg-primary text-on-primary px-6 sm:px-8 py-3.5 rounded-xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-95 shadow-md font-semibold text-xs sm:text-sm touch-target"
              >
                <span className="material-symbols-outlined text-base">search</span>
                Search Jobs
              </button>
            </form>

            {/* Quick Tag Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 sm:pt-4 text-xs">
              <span className="text-on-surface-variant font-label-sm font-semibold text-[11px] sm:text-xs">
                Popular:
              </span>
              {["Product Designer", "AI Architect", "Next.js", "Staff Engineer", "Remote"].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/jobs?q=${encodeURIComponent(tag)}`)}
                    className="px-3 py-1 bg-surface-container-high/80 hover:bg-primary-container/20 hover:text-primary rounded-full text-on-surface-variant transition-colors text-[11px] sm:text-xs"
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* Featured Jobs & Bento Grid */}
        <section className="max-w-[1600px] mx-auto py-12 sm:py-20 px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1 sm:space-y-2">
              <span className="text-xs font-label-sm font-bold text-primary uppercase tracking-wider">
                CURATED SELECTION
              </span>
              <h2 className="font-headline-fluid-lg font-bold text-on-background">
                Explore Opportunities
              </h2>
              <p className="text-on-surface-variant font-body-md text-xs sm:text-sm">
                Roles tailored to your career trajectory and verified skill metrics.
              </p>
            </div>

            <Link
              href="/jobs"
              className="text-primary font-label-md flex items-center gap-1 hover:underline font-bold text-xs sm:text-sm"
            >
              View all 2,450+ roles{" "}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 flex flex-col">
              <JobCard
                job={featuredJob}
                featured={true}
                onApplyClick={(j) => setSelectedJobToApply(j)}
              />
            </div>

            <div className="space-y-6 flex flex-col justify-between">
              {/* Career Growth Accent Card */}
              <div className="bg-primary text-on-primary rounded-2xl p-6 sm:p-8 relative overflow-hidden min-h-[220px] flex flex-col justify-end group shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent z-10"></div>
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60"
                  alt="Career Growth"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40"
                />
                <div className="relative z-20 space-y-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wider uppercase text-white inline-block">
                    AI Match Radar
                  </span>
                  <h4 className="font-headline-sm text-xl sm:text-2xl font-bold text-white">
                    Accelerate Your Path
                  </h4>
                  <p className="font-label-md text-xs text-white/90">
                    Get automated salary benchmark predictions and AI skill breakdown.
                  </p>
                </div>
              </div>

              {/* Secondary Openings */}
              <div className="space-y-4">
                {secondaryJobs.slice(0, 2).map((j) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    onApplyClick={(job) => setSelectedJobToApply(job)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platform Metrics Section */}
        <section className="bg-surface-container-low border-y border-outline-variant/30 py-12 sm:py-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div className="space-y-1">
              <span className="font-display font-bold text-3xl sm:text-4xl text-primary">25,000+</span>
              <p className="text-on-surface-variant text-xs sm:text-sm font-label-md">Verified Employers</p>
            </div>
            <div className="space-y-1">
              <span className="font-display font-bold text-3xl sm:text-4xl text-tertiary">98.4%</span>
              <p className="text-on-surface-variant text-xs sm:text-sm font-label-md">AI Match Accuracy</p>
            </div>
            <div className="space-y-1">
              <span className="font-display font-bold text-3xl sm:text-4xl text-primary">$185k</span>
              <p className="text-on-surface-variant text-xs sm:text-sm font-label-md">Average Tech Salary</p>
            </div>
            <div className="space-y-1">
              <span className="font-display font-bold text-3xl sm:text-4xl text-on-surface">14 Days</span>
              <p className="text-on-surface-variant text-xs sm:text-sm font-label-md">Average Time to Hire</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <JobApplyModal
        job={selectedJobToApply}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
        onSuccess={(j) => {
          console.log("Applied successfully to", j.title);
        }}
      />
    </>
  );
}
