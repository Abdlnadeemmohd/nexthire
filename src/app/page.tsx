"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { AuthDrawer } from "@/components/auth/AuthDrawer";
import { Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetJobForAuth, setTargetJobForAuth] = useState<{ id: string; title: string }>({ id: "", title: "" });
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

  const companies = [
    { name: "NextHire Simulation Corp", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80", roles: 1, location: "San Francisco, CA" },
    { name: "Nexus AI Lab", logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80", roles: 0, location: "New York, NY" },
    { name: "CloudScale Infra", logo: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80", roles: 0, location: "Remote / Austin" },
    { name: "Quantum Analytics", logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80", roles: 0, location: "London, UK" },
  ];

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

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-[1.15]">
              Land Your Next Tech Role <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-secondary">
                Matched on Real Verified Skills
              </span>
            </h1>

            <p className="font-body-md text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              NextHire matches elite software talent with high-growth technology companies through automated skill validation, verified resume analytics, and structured feedback.
            </p>

            {/* Global Search Bar */}
            <form
              onSubmit={handleSearch}
              className="w-full max-w-3xl glass-card p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-outline-variant/30 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-surface-container-lowest sm:bg-transparent rounded-xl sm:rounded-none">
                <span className="material-symbols-outlined text-primary text-xl">search</span>
                <input
                  type="text"
                  placeholder="Job title, technical skill, or keyword..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-transparent text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div className="hidden sm:block w-px h-8 bg-outline-variant/30" />

              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-surface-container-lowest sm:bg-transparent rounded-xl sm:rounded-none">
                <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                <input
                  type="text"
                  placeholder="City, country, or 'Remote'..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3.5 bg-primary text-on-primary font-label-md font-bold text-xs sm:text-sm rounded-xl sm:rounded-full hover:bg-primary-container transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 touch-target flex-shrink-0"
              >
                <span>Find Jobs</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-on-surface-variant pt-2">
              <span className="font-semibold text-outline">Popular Searches:</span>
              {["Full-Stack", "React & Next.js", "AI & ML", "DevOps & Cloud", "Remote"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setKeyword(tag);
                    router.push(`/jobs?q=${encodeURIComponent(tag)}`);
                  }}
                  className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded-full text-[11px] font-semibold text-on-surface transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Featured Job Openings */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant/20 pb-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">Explore Verified Openings</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                Featured Tech Roles
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
              Loading featured positions...
            </div>
          ) : featuredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  id={job.id}
                  title={job.title}
                  company={job.companyName}
                  companyId="00000000-0000-0000-0000-000000000001"
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
              title="No open positions currently featured"
              description="New technology roles from verified hiring partners are updated daily."
              icon="work_outline"
              actionLabel="View All Jobs"
              actionHref="/jobs"
            />
          )}
        </section>

        {/* 3. Partner Hiring Organizations */}
        <section className="py-12 bg-surface-container-low border-y border-outline-variant/20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="font-display text-2xl font-bold text-on-surface">
                Hiring Companies on NextHire
              </h2>
              <p className="text-xs text-on-surface-variant">
                Top technology employers actively recruiting verified engineering talent.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {companies.map((c, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-4 hover:border-primary/40 transition-colors shadow-xs"
                >
                  <img src={c.logo} alt={c.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-on-surface truncate">{c.name}</h3>
                    <p className="text-[11px] text-on-surface-variant truncate">{c.location}</p>
                    <span className="text-[10px] font-bold text-primary mt-1 block">
                      {c.roles > 0 ? `${c.roles} Open Positions` : "Partner Employer"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Frequently Asked Questions */}
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
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2 shadow-xs"
              >
                <h3 className="font-bold text-sm text-on-surface">{faq.q}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <JobApplyModal
        jobId={selectedJobToApply?.id || ""}
        jobTitle={selectedJobToApply?.title || ""}
        companyName={selectedJobToApply?.companyName || ""}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
      />
    </>
  );
}
