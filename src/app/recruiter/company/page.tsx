"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { INITIAL_JOBS } from "@/lib/mockData";

export default function RecruiterCompanyPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState({
    name: "Stellar Systems",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUSY4HuOhQnp99RQGM7nj2qJaAWM49iI9uWz43APGGY9elmswm8Xhx8Hx3opdXODLdtZq0n-bxGcH7MRRbeOar3uNrgkHm1g4eL86ilUFWlHgKQHoc0-DqJsvor7xRNbZXRHP0WvFXR_dNDhMolXMQPnmQg4Jl_XDs_ssI9JsQ_WcIV4LJRpTCzOkZnd3pXcC9vurP6zcFOrmGm5bUwPACA1hF1P7gnmLUPkIZbbhMPh5kRmRcRFnUqsykv9lu5Rpjm64oHzTH_oyL",
    banner: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=60",
    industry: "Enterprise AI & Cloud Infrastructure",
    size: "250-500 employees",
    website: "https://stellarsystems.ai",
    linkedin: "https://linkedin.com/company/stellarsystems",
    location: "San Francisco, CA (HQ)",
    founded: "2021",
    description: "Stellar Systems is pioneering next-generation enterprise AI tools that empower multi-functional teams to streamline workflows and decision intelligence.",
    verified: true,
    completion: 96,
  });

  const activeJobs = INITIAL_JOBS.filter((j) => j.companyName === company.name);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                Employer Brand & Company Profile
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Manage your employer showcase visible to high-caliber tech talent.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  {isEditing ? "check" : "edit"}
                </span>
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* Company Header Banner Card */}
          <div className="glass-card rounded-2xl overflow-hidden border border-outline-variant/20 relative">
            <div className="h-48 w-full relative bg-surface-container-high">
              <img
                src={company.banner}
                alt="Company Banner"
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <button className="absolute top-4 right-4 px-3 py-1 bg-surface/80 backdrop-blur-md rounded-full text-xs font-label-md font-bold text-on-surface hover:bg-surface">
                  Change Banner
                </button>
              )}
            </div>

            <div className="p-8 pt-0 relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6 -mt-12">
              <div className="flex items-end gap-5">
                <div className="w-24 h-24 bg-white rounded-2xl p-3 border-4 border-surface shadow-lg overflow-hidden flex-shrink-0">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1 pb-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                      {company.name}
                    </h2>
                    {company.verified && (
                      <span className="px-3 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm font-bold text-xs rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Verified Employer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant font-label-md font-semibold">
                    {company.industry} • {company.size}
                  </p>
                  <p className="text-xs text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {company.location} • Founded {company.founded}
                  </p>
                </div>
              </div>

              {/* Profile Completion Indicator */}
              <div className="p-4 bg-tertiary-container/10 border border-tertiary/30 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center font-bold font-display text-sm shadow-xs">
                  {company.completion}%
                </div>
                <div>
                  <h4 className="font-label-md font-bold text-xs text-on-surface">
                    Employer Brand Score
                  </h4>
                  <p className="text-[11px] text-on-surface-variant">
                    High candidate engagement rate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* About Company */}
              <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-4">
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                  About {company.name}
                </h3>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={company.description}
                    onChange={(e) =>
                      setCompany({ ...company, description: e.target.value })
                    }
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-xs font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-on-surface-variant text-sm font-body-md leading-relaxed">
                    {company.description}
                  </p>
                )}
              </div>

              {/* Company Open Roles */}
              <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                    Active Hiring Positions ({activeJobs.length})
                  </h3>
                  <Link href="/recruiter/jobs/new" className="text-xs font-label-md text-primary font-bold hover:underline">
                    + Post Role
                  </Link>
                </div>

                <div className="space-y-3">
                  {activeJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-4 bg-surface rounded-xl border border-outline-variant/20 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                          {j.title}
                        </h4>
                        <p className="text-xs text-outline">{j.location} • ${Math.round(j.salaryMin/1000)}k - ${Math.round(j.salaryMax/1000)}k</p>
                      </div>
                      <Link href={`/jobs/${j.id}`} className="text-xs text-primary font-bold hover:underline">
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Links & Info */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Company Links & Info
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-outline font-label-md">Website</span>
                    <a href={company.website} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                      {company.website.replace("https://", "")}
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-outline font-label-md">LinkedIn</span>
                    <a href={company.linkedin} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                      View Company Page
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-outline font-label-md">Headquarters</span>
                    <span className="font-bold text-on-surface">{company.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-outline font-label-md">Company Size</span>
                    <span className="font-bold text-on-surface">{company.size}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
