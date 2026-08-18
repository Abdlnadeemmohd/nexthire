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
import { EmptyState } from "@/components/ui/EmptyState";

export default function PublicCompanyDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated } = useAuth();
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

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

  const companyName = openJobs[0]?.companyName || "Employer Organization";
  const companyLocation = openJobs[0]?.location || "Remote";
  const companyDescription = openJobs[0]?.companyDescription || "Verified technology employer hiring on NextHire Cloud.";

  return (
    <>
      <TopAppBar />

      <main className="pt-16 pb-20 bg-surface min-h-screen">
        {/* Header Section */}
        <div className="bg-mesh border-b border-outline-variant/20 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-on-surface">{companyName}</h1>
              <VerifiedBadge role="RECRUITER" customLabel="Verified Employer" size="md" />
            </div>
            <p className="text-xs text-on-surface-variant flex items-center gap-3">
              <span>📍 {companyLocation}</span>
              <span>• 🏢 Technology</span>
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
          {/* About Company */}
          <section className="glass-card rounded-2xl p-6 sm:p-8 border border-outline-variant/20 space-y-4">
            <h2 className="font-display text-xl font-bold text-on-surface">About {companyName}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{companyDescription}</p>
          </section>

          {/* Open Positions */}
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
              <h2 className="font-display text-2xl font-bold text-on-surface">
                Open Positions at {companyName}
              </h2>
              <span className="text-xs font-bold text-primary">{openJobs.length} Available</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-on-surface-variant">
                Loading job openings from database...
              </div>
            ) : openJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {openJobs.map((job) => (
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
