"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoadingJobs(true);
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setFeaturedJobs(data.data.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to load featured jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    }

    loadJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/jobs?${params.toString()}`);
  };

  const handleApplyClick = (job: Job) => {
    if (!isAuthenticated) {
      router.push(`/login?role=seeker&redirect=/jobs/${job.id}`);
    } else {
      setSelectedJobToApply(job);
    }
  };

  const faqs = [
    {
      q: "How does NextHire AI skill-matching work?",
      a: "NextHire evaluates candidate resumes and profiles against recruiter job requirements using vector similarity algorithms. We match core technical competencies, years of experience, and project portfolios rather than relying solely on keyword filters.",
    },
    {
      q: "Is NextHire free for job seekers?",
      a: "Yes! Creating a candidate account, uploading your resume, searching jobs, applying, and receiving recruiter feedback is 100% free for job seekers.",
    },
    {
      q: "How do recruiters provide structured feedback?",
      a: "When a recruiter reviews candidate applications on NextHire, they can provide structured rejection notes (identifying missing skills, experience gaps, or recommended certifications), transforming rejections into constructive career guidance.",
    },
    {
      q: "Can I apply to jobs without creating an account?",
      a: "You can freely browse, search, and view all job descriptions without signing in. When you decide to apply, creating an account or logging in takes only 30 seconds and preserves your application intent.",
    },
  ];

  return (
    <>
      <TopAppBar />

      <main className="pt-16 flex-1 overflow-x-hidden bg-surface">
        {/* 1. Hero Section & Global Search Bar */}
        <section className="relative flex flex-col items-center justify-center bg-mesh px-4 sm:px-6 lg:px-8 py-6 sm:py-14 text-center border-b border-outline-variant/20">
          <div className="relative z-10 max-w-4xl mx-auto space-y-4 sm:space-y-6 flex flex-col items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm uppercase tracking-wider text-[11px] sm:text-xs font-bold shadow-xs">
              <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
              AI-Powered Skill-First Global Recruitment
            </span>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight leading-[1.15]">
              Find Work That Matches Your <span className="text-primary">Real Technical Skills</span>
            </h1>

            <p className="text-sm sm:text-lg text-on-surface-variant max-w-2xl font-body-md">
              Apply to verified technology roles with structured review timelines, transparent salary bands, and actionable feedback.
            </p>

            {/* Quick Search Box */}
            <form
              onSubmit={handleSearch}
              className="w-full max-w-3xl glass-card rounded-2xl p-2 sm:p-3 border border-outline-variant/40 shadow-xl flex flex-col sm:flex-row gap-2 mt-4"
            >
              <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-primary text-xl">search</span>
                <input
                  type="text"
                  placeholder="Job title, technical skill, or keyword..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>

              <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                <input
                  type="text"
                  placeholder="City, state, or 'Remote'..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-primary text-on-primary font-bold text-xs sm:text-sm rounded-xl hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Search Jobs</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </form>
          </div>
        </section>

        {/* 2. Featured Open Positions Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Live Openings</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                Featured Verified Roles
              </h2>
            </div>

            <Link
              href="/jobs"
              className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              Browse All Jobs <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {loadingJobs ? (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              Loading featured positions from database...
            </div>
          ) : featuredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  id={job.id}
                  title={job.title}
                  company={job.companyName}
                  companyId={job.companyId}
                  logo={job.companyLogo}
                  location={job.location}
                  salary={job.salaryMin && job.salaryMax ? `$${Math.round(job.salaryMin / 1000)}k - $${Math.round(job.salaryMax / 1000)}k` : "Competitive"}
                  type={job.employmentType}
                  tags={job.tags}
                  description={job.description}
                  aiMatchScore={95}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No open positions currently featured"
              description="New technology roles from verified hiring partners are updated daily."
              icon="work_outline"
              actionLabel="View All Jobs"
              actionHref="/jobs"
            />
          )}
        </section>

        {/* 3. Frequently Asked Questions */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-on-surface-variant">
              Everything you need to know about NextHire's skill-first hiring platform.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-2"
              >
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">help_outline</span>
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      {/* Direct Apply Modal */}
      {selectedJobToApply && (
        <JobApplyModal
          isOpen={true}
          onClose={() => setSelectedJobToApply(null)}
          jobTitle={selectedJobToApply.title}
          companyName={selectedJobToApply.companyName}
          jobId={selectedJobToApply.id}
        />
      )}
    </>
  );
}
