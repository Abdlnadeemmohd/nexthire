"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { JobAuthModal } from "@/components/jobs/JobAuthModal";
import { INITIAL_JOBS, Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetJobForAuth, setTargetJobForAuth] = useState<{ id: string; title: string }>({ id: "", title: "" });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      `/jobs?q=${encodeURIComponent(searchTitle)}&location=${encodeURIComponent(searchLocation)}`
    );
  };

  const handleApplyClick = (job: Job) => {
    if (!isAuthenticated) {
      setTargetJobForAuth({ id: job.id, title: job.title });
      setShowAuthModal(true);
    } else {
      setSelectedJobToApply(job);
    }
  };

  const featuredJobs = INITIAL_JOBS.slice(0, 3);

  const companies = [
    { name: "Stellar Systems", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUSY4HuOhQnp99RQGM7nj2qJaAWM49iI9uWz43APGGY9elmswm8Xhx8Hx3opdXODLdtZq0n-bxGcH7MRRbeOar3uNrgkHm1g4eL86ilUFWlHgKQHoc0-DqJsvor7xRNbZXRHP0WvFXR_dNDhMolXMQPnmQg4Jl_XDs_ssI9JsQ_WcIV4LJRpTCzOkZnd3pXcC9vurP6zcFOrmGm5bUwPACA1hF1P7gnmLUPkIZbbhMPh5kRmRcRFnUqsykv9lu5Rpjm64oHzTH_oyL", roles: 12, location: "San Francisco, CA" },
    { name: "Nexus AI Lab", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuGzP8a8J-E0zJg5e7J2sL8X-Z1w6sQ3vR9yT2uK0mN1pL4vH5jF8gD3cB6n1m0L8vH5jF8gD3cB6", roles: 8, location: "New York, NY" },
    { name: "CloudScale Infra", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuH1vL4vH5jF8gD3cB6n1m0L8vH5jF8gD3cB6n1m0L8vH5jF8gD3cB6n1m0", roles: 15, location: "Remote / Austin" },
    { name: "Quantum Analytics", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuF8gD3cB6n1m0L8vH5jF8gD3cB6n1m0L8vH5jF8gD3cB6n1m0L8vH5j", roles: 6, location: "London, UK" },
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
        <section className="relative min-h-[75vh] flex flex-col items-center justify-center bg-mesh px-4 sm:px-6 lg:px-8 py-16 text-center border-b border-outline-variant/20">
          <div className="relative z-10 max-w-4xl mx-auto space-y-6 flex flex-col items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm uppercase tracking-wider text-[11px] sm:text-xs font-bold shadow-xs">
              <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
              AI-Powered Skill-First Global Recruitment
            </span>

            <h1 className="font-display font-bold font-display-hero text-on-background tracking-tight max-w-3xl">
              Find Your Next <span className="text-primary">Career Breakthrough</span>
            </h1>

            <p className="font-body-fluid-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed text-xs sm:text-base">
              Connecting top tech talent with verified global employers through intelligent skill-match algorithms and transparent recruitment workflows.
            </p>

            {/* Global Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mt-4 w-full max-w-3xl glass-card rounded-2xl p-3 shadow-xl flex flex-col md:flex-row gap-3 border border-white/60"
            >
              <div className="flex-1 flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
                  search
                </span>
                <input
                  className="w-full bg-transparent border-none focus:outline-none font-body-md text-on-surface placeholder:text-outline text-xs sm:text-sm"
                  placeholder="Job Title, Skill, or Company"
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
                  placeholder="City, Country, or 'Remote'"
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="bg-primary text-on-primary px-8 py-3.5 rounded-xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-95 shadow-md font-semibold text-xs sm:text-sm"
              >
                Search Jobs
              </button>
            </form>

            {/* Quick Skill Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-2">
              <span className="text-on-surface-variant font-label-sm font-semibold text-[11px]">
                Popular Searches:
              </span>
              {["Full Stack Engineer", "Product Manager", "React", "AWS Architecture", "Remote"].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/jobs?q=${encodeURIComponent(tag)}`)}
                    className="px-3 py-1 bg-surface-container-high/80 hover:bg-primary-container/20 hover:text-primary rounded-full text-on-surface-variant transition-colors text-[11px] font-semibold"
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* 2. Platform Statistics Section */}
        <section className="bg-surface-container-low border-b border-outline-variant/20 py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="font-display font-bold text-3xl sm:text-4xl text-primary">25,000+</span>
              <p className="text-on-surface-variant text-xs font-label-md">Verified Employers</p>
            </div>
            <div className="space-y-1">
              <span className="font-display font-bold text-3xl sm:text-4xl text-tertiary">98.4%</span>
              <p className="text-on-surface-variant text-xs font-label-md">AI Match Accuracy</p>
            </div>
            <div className="space-y-1">
              <span className="font-display font-bold text-3xl sm:text-4xl text-primary">$185k</span>
              <p className="text-on-surface-variant text-xs font-label-md">Average Tech Salary</p>
            </div>
            <div className="space-y-1">
              <span className="font-display font-bold text-3xl sm:text-4xl text-on-surface">14 Days</span>
              <p className="text-on-surface-variant text-xs font-label-md">Average Time to Hire</p>
            </div>
          </div>
        </section>

        {/* 3. Featured Jobs Section */}
        <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1">
              <span className="text-xs font-label-sm font-bold text-primary uppercase tracking-wider">
                CURATED SELECTION
              </span>
              <h2 className="font-headline-fluid-lg font-bold text-on-background">
                Featured Career Opportunities
              </h2>
              <p className="text-on-surface-variant font-body-md text-xs sm:text-sm">
                Explore handpicked engineering, product, and AI roles from top employers.
              </p>
            </div>

            <Link
              href="/jobs"
              className="text-primary font-label-md flex items-center gap-1 hover:underline font-bold text-xs sm:text-sm"
            >
              View all roles <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {featuredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApplyClick={handleApplyClick}
              />
            ))}
          </div>
        </section>

        {/* 4. Featured Verified Companies */}
        <section className="bg-surface-container-low py-16 border-y border-outline-variant/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-label-sm font-bold text-primary uppercase tracking-wider">
                TOP EMPLOYERS
              </span>
              <h2 className="font-headline-sm text-2xl sm:text-3xl font-bold text-on-surface">
                Hire with World-Class Engineering Teams
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Join thousands of companies scaling their technical workforce on NextHire.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {companies.map((comp, idx) => (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-6 border border-outline-variant/20 hover:border-primary/30 transition-all text-center space-y-4 shadow-xs"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl mx-auto p-2 border border-outline-variant/20 flex items-center justify-center shadow-xs">
                    <img src={comp.logo} alt={comp.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base flex items-center justify-center gap-1">
                      {comp.name}
                      <span className="material-symbols-outlined text-tertiary text-sm">verified</span>
                    </h3>
                    <p className="text-xs text-on-surface-variant">{comp.location}</p>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/10 flex justify-between items-center text-xs">
                    <span className="text-primary font-bold">{comp.roles} Openings</span>
                    <Link href="/jobs" className="text-on-surface-variant hover:text-primary font-semibold">
                      Explore →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Why Choose NextHire (AI Match Radar) */}
        <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-label-sm font-bold text-primary uppercase tracking-wider">
              WHY NEXTHIRE
            </span>
            <h2 className="font-headline-sm text-2xl sm:text-3xl font-bold text-on-surface">
              Built for Modern Recruitment Transparency
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold text-2xl">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface">AI Skill-First Matching</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Our proprietary AI evaluates technical skills, code repositories, and project experience rather than outdated keyword matching.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
              <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center font-bold text-2xl">
                <span className="material-symbols-outlined">reviews</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface">Structured Recruiter Feedback</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Never get ghosted again. Recruiters provide structured feedback on missing skills and certifications to guide your career growth.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold text-2xl">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface">Verified Employers Only</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Every recruiter and company account is manually audited and verified by our security team before posting roles.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Frequently Asked Questions (FAQ Accordion) */}
        <section className="bg-surface-container-low py-16 border-t border-outline-variant/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-label-sm font-bold text-primary uppercase tracking-wider">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="font-headline-sm text-2xl sm:text-3xl font-bold text-on-surface">
                Everything You Need to Know
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div
                    key={i}
                    className="glass-card rounded-2xl border border-outline-variant/20 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                      className="w-full p-5 text-left flex justify-between items-center gap-4 font-bold text-sm text-on-surface hover:text-primary transition-colors"
                    >
                      <span>{faq.q}</span>
                      <span className="material-symbols-outlined text-outline">
                        {isOpen ? "expand_less" : "expand_more"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/10 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. Call to Action (CTA Banner) */}
        <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary via-primary-container/80 to-tertiary text-on-primary rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-3 text-center md:text-left max-w-xl">
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-white leading-tight">
                Ready to accelerate your tech career?
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Join thousands of software engineers, AI architects, and product managers finding their next role on NextHire.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-white text-primary font-label-md font-bold text-xs sm:text-sm rounded-full text-center hover:bg-surface transition-all shadow-md"
              >
                Create Candidate Account
              </Link>
              <Link
                href="/recruiter"
                className="px-8 py-3.5 bg-white/20 backdrop-blur-md text-white border border-white/40 font-label-md font-bold text-xs sm:text-sm rounded-full text-center hover:bg-white/30 transition-all"
              >
                Post a Job as Employer
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <JobApplyModal
        job={selectedJobToApply}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
        onSuccess={(j) => console.log("Applied to", j.title)}
      />

      <JobAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        targetJobId={targetJobForAuth.id}
        targetJobTitle={targetJobForAuth.title}
      />
    </>
  );
}
