"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { JobAuthModal } from "@/components/jobs/JobAuthModal";
import { INITIAL_JOBS, Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

export default function PublicCompanyDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated } = useAuth();
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetJobForAuth, setTargetJobForAuth] = useState<{ id: string; title: string }>({ id: "", title: "" });

  const company = {
    name: "Stellar Systems Inc.",
    tagline: "Building next-generation distributed cloud infrastructure and AI developer tools.",
    industry: "Enterprise Software & Cloud Infrastructure",
    size: "250 - 500 Employees",
    headquarters: "San Francisco, CA (Hybrid / Global Remote)",
    founded: "2018",
    website: "https://stellarsystems.io",
    linkedin: "https://linkedin.com/company/stellar-systems",
    brandScore: 96,
    candidateResponseRate: "98.5%",
    avgHireDays: "12 Days",
    bannerUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    about: "Stellar Systems is a premier cloud architecture pioneer creating automated resilience infrastructure for Fortune 500 enterprises. Founded in San Francisco in 2018, our engineering teams build high-throughput microservices, distributed AI databases, and developer observability tooling.",
    mission: "To empower software teams worldwide to build scalable, fault-tolerant infrastructure effortlessly.",
    techStack: ["Next.js", "TypeScript", "Python", "Go", "AWS", "Docker", "Kubernetes", "GraphQL", "PostgreSQL"],
    benefits: [
      "Competitive Salary + Equity Options",
      "Unlimited PTO & Flexible Work Hours",
      "$3,000 Annual Learning & Conference Budget",
      "100% Premium Health, Dental & Vision Coverage",
      "Latest M3 Max MacBook Pro + 4K Monitor Setup",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80",
    ],
  };

  const handleApplyClick = (job: Job) => {
    if (!isAuthenticated) {
      setTargetJobForAuth({ id: job.id, title: job.title });
      setShowAuthModal(true);
    } else {
      setSelectedJobToApply(job);
    }
  };

  const openJobs = INITIAL_JOBS.slice(0, 3);

  return (
    <>
      <TopAppBar />

      <main className="pt-16 pb-20 bg-surface min-h-screen">
        {/* 1. Hero Cover Banner Section */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
          <img
            src={company.bannerUrl}
            alt={company.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end pb-6 text-white">
            <div className="flex items-end gap-5">
              <CompanyLogo
                src={company.logoUrl}
                name={company.name}
                size="xl"
                rounded="2xl"
                className="w-20 h-20 sm:w-28 sm:h-28 shadow-2xl border-4 border-white"
              />

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">{company.name}</h1>
                  <VerifiedBadge role="RECRUITER" customLabel="Verified Employer" size="md" />
                </div>
                <p className="text-xs sm:text-sm text-slate-200">{company.tagline}</p>
                <p className="text-xs text-slate-300 flex items-center gap-3 pt-1">
                  <span>📍 {company.headquarters}</span>
                  <span>• 👥 {company.size}</span>
                  <span>• 🏢 {company.industry}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <div className="text-center">
                <span className="font-display font-bold text-2xl text-tertiary">{company.brandScore}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-300">Employer Score</span>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="text-center">
                <span className="font-display font-bold text-2xl text-white">{openJobs.length}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-300">Open Jobs</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main 70/30 Balanced Layout Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column (70%) */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Company */}
            <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">About {company.name}</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">{company.about}</p>
              <div className="p-4 bg-primary-container/20 border-l-4 border-primary rounded-xl space-y-1">
                <h3 className="font-bold text-xs text-primary uppercase">Our Mission</h3>
                <p className="text-xs text-on-surface italic font-semibold">{company.mission}</p>
              </div>
            </div>

            {/* Primary Engineering Stack */}
            <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">Tech Stack & Tools</h2>
              <div className="flex flex-wrap gap-2">
                {company.techStack.map((tech) => (
                  <span key={tech} className="px-3 py-1.5 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-xl border border-outline-variant/30">
                    ⚡ {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits & Culture */}
            <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">Employee Benefits & Perks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {company.benefits.map((b, i) => (
                  <div key={i} className="p-3 bg-surface rounded-xl border border-outline-variant/20 text-xs font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                    {b}
                  </div>
                ))}
              </div>
            </div>

            {/* Workplace Culture Gallery */}
            <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">Workplace & Office Culture</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {company.gallery.map((img, idx) => (
                  <div key={idx} className="h-44 rounded-2xl overflow-hidden border border-outline-variant/30 group">
                    <img src={img} alt="Office Culture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Open Roles Listing */}
            <div className="space-y-4 pt-4">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface">
                Open Positions at {company.name} ({openJobs.length})
              </h2>
              <div className="space-y-4">
                {openJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    id={job.id}
                    title={job.title}
                    company={job.companyName}
                    companyId={params.id || "c-1"}
                    logo={job.companyLogo}
                    location={job.location}
                    salary={`$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k/yr`}
                    type={job.employmentType.replace("_", " ")}
                    tags={job.tags || []}
                    description={job.description || ""}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Column (30%) */}
          <div className="space-y-6">
            {/* Employer Trust Score Card */}
            <div className="glass-card rounded-3xl p-6 border border-tertiary/30 bg-tertiary-container/10 space-y-3">
              <div className="flex items-center gap-2 text-tertiary font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">verified_user</span>
                Verified Employer Snapshot
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-4xl text-on-surface">{company.brandScore}</span>
                <span className="text-xs text-on-surface-variant font-bold">/ 100 Grade A+</span>
              </div>
              <ul className="space-y-2 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/10">
                <li className="flex justify-between">
                  <span>Candidate Response:</span>
                  <span className="font-bold text-tertiary">{company.candidateResponseRate}</span>
                </li>
                <li className="flex justify-between">
                  <span>Avg Hiring Speed:</span>
                  <span className="font-bold text-on-surface">{company.avgHireDays}</span>
                </li>
              </ul>
            </div>

            {/* Company Info Breakdown */}
            <div className="glass-card rounded-3xl p-6 border border-outline-variant/20 space-y-4 text-xs">
              <h3 className="font-bold text-on-surface uppercase tracking-wider text-outline text-[11px]">
                Company Details
              </h3>
              <ul className="space-y-3 text-on-surface-variant">
                <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                  <span className="text-outline">Website:</span>
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                    stellarsystems.io
                  </a>
                </li>
                <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                  <span className="text-outline">LinkedIn:</span>
                  <a href={company.linkedin} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                    View Profile
                  </a>
                </li>
                <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                  <span className="text-outline">Headquarters:</span>
                  <span className="font-bold text-on-surface">San Francisco</span>
                </li>
                <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                  <span className="text-outline">Founded:</span>
                  <span className="font-bold text-on-surface">{company.founded}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-outline">Company Size:</span>
                  <span className="font-bold text-on-surface">{company.size}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <JobApplyModal
        jobId={selectedJobToApply?.id || ""}
        jobTitle={selectedJobToApply?.title || ""}
        companyName={selectedJobToApply?.companyName || company.name}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
      />

      <JobAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        jobTitle={targetJobForAuth?.title || "this role"}
      />
    </>
  );
}
