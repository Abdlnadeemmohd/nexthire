"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PublicCompanyDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated } = useAuth();
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const company = {
    name: "NextHire Simulation Corp",
    tagline: "Enterprise cloud software and AI candidate matching platform.",
    industry: "Enterprise Software & Cloud Infrastructure",
    size: "100 - 250 Employees",
    headquarters: "San Francisco, CA (Hybrid / Global Remote)",
    founded: "2023",
    website: "https://nexthire.cloud",
    linkedin: "https://linkedin.com/company/nexthire-cloud",
    brandScore: 98,
    candidateResponseRate: "99.2%",
    avgHireDays: "10 Days",
    bannerUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    about: "NextHire Simulation Corp is the reference employer organization for NextHire Cloud Stage 1 production simulation, showcasing end-to-end recruitment workflows, verified ATS pipelines, and Cloudinary-integrated candidate evaluation.",
    mission: "To connect elite technology talent with world-class engineering organizations through seamless AI workflows.",
    techStack: ["Next.js", "TypeScript", "Prisma", "Neon PostgreSQL", "Cloudinary", "Firebase Auth", "Tailwind CSS"],
    benefits: [
      "Competitive Compensation + Equity",
      "Flexible Remote-First Work Policy",
      "Annual Continuing Education Stipend",
      "Comprehensive Health, Dental & Vision",
      "Modern Engineering Hardware Kit",
    ],
  };

  useEffect(() => {
    async function loadCompanyJobs() {
      try {
        setLoading(true);
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setOpenJobs(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load company jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCompanyJobs();
  }, []);

  return (
    <>
      <TopAppBar />

      <main className="pt-16 pb-20 bg-surface min-h-screen">
        {/* Hero Cover Banner Section */}
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
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
          {/* About Company */}
          <section className="glass-card rounded-2xl p-6 sm:p-8 border border-outline-variant/20 space-y-4">
            <h2 className="font-display text-xl font-bold text-on-surface">About {company.name}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{company.about}</p>
          </section>

          {/* Open Positions */}
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
              <h2 className="font-display text-2xl font-bold text-on-surface">
                Open Positions at {company.name}
              </h2>
              <span className="text-xs font-bold text-primary">{openJobs.length} Available</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-on-surface-variant">
                Loading job openings...
              </div>
            ) : openJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {openJobs.map((job) => (
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
                title="No open positions currently available"
                description="This company does not have any active job postings at this moment."
                icon="work_off"
                actionLabel="Browse Other Jobs"
                actionHref="/jobs"
              />
            )}
          </section>
        </div>
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
