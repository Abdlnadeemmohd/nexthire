"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";

export default function RecruiterCompanyProfilePage() {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "roles" | "culture" | "analytics">("about");

  const [companyInfo, setCompanyInfo] = useState({
    name: "Stellar Systems Inc.",
    tagline: "Building next-generation distributed cloud infrastructure and AI developer tools.",
    industry: "Enterprise Software & Cloud Infrastructure",
    size: "250 - 500 Employees",
    headquarters: "San Francisco, CA (Hybrid / Global Remote)",
    founded: "2018",
    website: "https://stellarsystems.io",
    linkedin: "https://linkedin.com/company/stellar-systems",
    email: "careers@stellarsystems.io",
    phone: "+1 (415) 890-2341",
    brandScore: 96,
    candidateResponseRate: "98.5%",
    avgHireDays: "12 Days",
    interviewRating: "4.9 / 5.0",
    profileCompletion: "95%",
    bannerUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80",
    logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUSY4HuOhQnp99RQGM7nj2qJaAWM49iI9uWz43APGGY9elmswm8Xhx8Hx3opdXODLdtZq0n-bxGcH7MRRbeOar3uNrgkHm1g4eL86ilUFWlHgKQHoc0-DqJsvor7xRNbZXRHP0WvFXR_dNDhMolXMQPnmQg4Jl_XDs_ssI9JsQ_WcIV4LJRpTCzOkZnd3pXcC9vurP6zcFOrmGm5bUwPACA1hF1P7gnmLUPkIZbbhMPh5kRmRcRFnUqsykv9lu5Rpjm64oHzTH_oyL",
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
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    showToast("Employer brand profile updated successfully!", "success");
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header & Quick Action Triggers */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                Employer Brand & Company Profile
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Manage your public employer brand, company culture, and recruiter management tools.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/companies/c-1"
                target="_blank"
                className="px-4 py-2.5 bg-surface-container-high hover:bg-primary-container/20 text-primary font-label-md font-bold text-xs rounded-full transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">visibility</span>
                Preview Candidate View
              </Link>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">{isEditing ? "close" : "edit"}</span>
                {isEditing ? "Cancel Edit" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* 1. Structured Hero & Cover Banner Section */}
          <div className="glass-card rounded-3xl overflow-hidden border border-outline-variant/20 shadow-xl space-y-0 relative">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
              <img
                src={companyInfo.bannerUrl}
                alt="Company Cover Banner"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

              <button
                onClick={() => showToast("Banner upload dialog opened", "info")}
                className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                Change Banner
              </button>

              <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-white z-10">
                <div className="flex items-end gap-5">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-3 shadow-2xl border-4 border-white flex-shrink-0 flex items-center justify-center">
                    <img src={companyInfo.logoUrl} alt={companyInfo.name} className="w-full h-full object-contain" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-2xl sm:text-3xl font-bold">{companyInfo.name}</h1>
                      <span className="px-2.5 py-0.5 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span> Verified Employer
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200">{companyInfo.tagline}</p>
                    <p className="text-xs text-slate-300 flex items-center gap-3 pt-1">
                      <span>📍 {companyInfo.headquarters}</span>
                      <span>• 👥 {companyInfo.size}</span>
                      <span>• 🏢 {companyInfo.industry}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <div className="text-center">
                    <span className="font-display font-bold text-2xl text-tertiary">{companyInfo.brandScore}</span>
                    <span className="block text-[10px] uppercase font-bold text-slate-300">Brand Score</span>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div className="text-center">
                    <span className="font-display font-bold text-2xl text-white">12</span>
                    <span className="block text-[10px] uppercase font-bold text-slate-300">Active Roles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Recruiter Analytics Dashboard KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-1">
              <span className="text-xs font-label-md text-outline uppercase font-bold">Total Applicants</span>
              <h3 className="font-display text-2xl font-bold text-on-surface">348 Candidates</h3>
              <p className="text-[11px] text-tertiary font-bold">+18% this month</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-1">
              <span className="text-xs font-label-md text-outline uppercase font-bold">Response Rate</span>
              <h3 className="font-display text-2xl font-bold text-tertiary">{companyInfo.candidateResponseRate}</h3>
              <p className="text-[11px] text-on-surface-variant font-semibold">Avg reply within 24h</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-1">
              <span className="text-xs font-label-md text-outline uppercase font-bold">Average Time to Hire</span>
              <h3 className="font-display text-2xl font-bold text-primary">{companyInfo.avgHireDays}</h3>
              <p className="text-[11px] text-on-surface-variant font-semibold">Fast-track interview workflow</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-1">
              <span className="text-xs font-label-md text-outline uppercase font-bold">Candidate Rating</span>
              <h3 className="font-display text-2xl font-bold text-on-surface">{companyInfo.interviewRating}</h3>
              <p className="text-[11px] text-tertiary font-bold">Based on 64 reviews</p>
            </div>
          </div>

          {/* 3. Balanced 70 / 30 Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column (70%) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Tab Selector */}
              <div className="flex gap-2 border-b border-outline-variant/20 pb-2">
                {[
                  { key: "about", label: "About & Culture" },
                  { key: "roles", label: "Active Roles (12)" },
                  { key: "culture", label: "Workplace Photos" },
                  { key: "analytics", label: "Recruiter Analytics" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as any)}
                    className={`px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all ${
                      activeTab === t.key
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: About & Culture */}
              {activeTab === "about" && (
                <div className="space-y-8">
                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="glass-card rounded-3xl p-8 border border-primary/30 space-y-4 text-xs font-body-sm">
                      <h3 className="font-bold text-lg text-on-surface border-b pb-2">Edit Employer Profile</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-outline uppercase pb-1">Company Name</label>
                          <input
                            type="text"
                            value={companyInfo.name}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                            className="w-full p-2.5 bg-surface border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-outline uppercase pb-1">Tagline</label>
                          <input
                            type="text"
                            value={companyInfo.tagline}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, tagline: e.target.value })}
                            className="w-full p-2.5 bg-surface border rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-outline uppercase pb-1">Company Mission</label>
                        <textarea
                          rows={2}
                          value={companyInfo.mission}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, mission: e.target.value })}
                          className="w-full p-2.5 bg-surface border rounded-xl"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-on-surface-variant font-bold">
                          Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-primary text-on-primary font-bold rounded-full shadow-md">
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {/* Overview Card */}
                  <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface">Company Overview</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{companyInfo.about}</p>
                    <div className="p-4 bg-primary-container/20 border-l-4 border-primary rounded-xl space-y-1">
                      <h4 className="font-bold text-xs text-primary uppercase">Our Mission</h4>
                      <p className="text-xs text-on-surface italic font-semibold">{companyInfo.mission}</p>
                    </div>
                  </div>

                  {/* Technology Stack */}
                  <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface">Primary Engineering Stack</h3>
                    <div className="flex flex-wrap gap-2">
                      {companyInfo.techStack.map((tech) => (
                        <span key={tech} className="px-3 py-1.5 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-xl border border-outline-variant/30">
                          ⚡ {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Benefits & Perks */}
                  <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface">Benefits & Employee Perks</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {companyInfo.benefits.map((b, i) => (
                        <div key={i} className="p-3 bg-surface rounded-xl border border-outline-variant/20 text-xs font-semibold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Active Roles */}
              {activeTab === "roles" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="font-bold text-lg text-on-surface">Live Job Openings</h3>
                    <Link href="/recruiter/jobs/new" className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-primary-container">
                      + Post New Job
                    </Link>
                  </div>

                  {[
                    { id: "job-1", title: "Senior Full Stack Engineer", salary: "$160,000 - $190,000", type: "Full-time", location: "San Francisco / Remote", applicants: 42, status: "Active" },
                    { id: "job-2", title: "Staff AI Infrastructure Architect", salary: "$210,000 - $260,000", type: "Full-time", location: "Remote", applicants: 28, status: "Active" },
                    { id: "job-3", title: "Lead Product Designer (UI/UX)", salary: "$145,000 - $175,000", type: "Full-time", location: "Hybrid", applicants: 19, status: "Active" },
                  ].map((role) => (
                    <div key={role.id} className="glass-card rounded-2xl p-6 border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-on-surface">{role.title}</h4>
                          <span className="px-2.5 py-0.5 bg-tertiary-container/30 text-tertiary text-[10px] font-bold rounded-full">
                            {role.status}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-semibold">
                          {role.salary} • {role.type} • 📍 {role.location}
                        </p>
                        <p className="text-[11px] text-outline pt-0.5">
                          👥 {role.applicants} Candidates Applied
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href="/recruiter/applicants" className="px-4 py-2 bg-surface-container-high hover:bg-primary-container/20 text-primary font-bold text-xs rounded-full">
                          View Applicants ({role.applicants})
                        </Link>
                        <button onClick={() => showToast("Role management menu opened", "info")} className="p-2 text-outline hover:text-on-surface rounded-lg">
                          <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Workplace Photo Gallery */}
              {activeTab === "culture" && (
                <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface">Workplace & Office Culture Gallery</h3>
                    <button onClick={() => showToast("Photo upload dialog opened", "info")} className="px-3 py-1.5 bg-surface-container-high text-xs font-bold rounded-xl text-on-surface">
                      + Add Photos
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {companyInfo.gallery.map((img, idx) => (
                      <div key={idx} className="h-44 rounded-2xl overflow-hidden border border-outline-variant/30 group relative">
                        <img src={img} alt="Office Culture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Recruiter Analytics */}
              {activeTab === "analytics" && (
                <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">Recruiter Analytics & Funnel Overview</h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Profile Views to Application Conversion</span>
                        <span className="text-primary">34.8%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[35%] rounded-full"></div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Candidate Shortlist Ratio</span>
                        <span className="text-tertiary">68.2%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-tertiary w-[68%] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Column (30%) */}
            <div className="space-y-6">
              {/* Recruiter Quick Actions Panel */}
              <div className="glass-card rounded-3xl p-6 border border-outline-variant/20 space-y-3">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider text-outline">
                  Recruiter Quick Actions
                </h4>
                <div className="space-y-2 text-xs font-semibold">
                  <Link
                    href="/recruiter/jobs/new"
                    className="w-full p-3 bg-primary text-on-primary rounded-xl text-center block font-bold shadow-sm hover:bg-primary-container"
                  >
                    + Post New Job Opening
                  </Link>
                  <Link
                    href="/recruiter/applicants"
                    className="w-full p-3 bg-surface-container-high text-on-surface rounded-xl text-center block hover:bg-surface-container"
                  >
                    View Active Candidates
                  </Link>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full p-3 bg-surface border border-outline-variant/30 text-on-surface rounded-xl text-center block hover:bg-surface-container"
                  >
                    Edit Employer Profile
                  </button>
                  <Link
                    href="/admin/subscriptions"
                    className="w-full p-3 bg-surface border border-outline-variant/30 text-on-surface rounded-xl text-center block hover:bg-surface-container"
                  >
                    Manage Billing & Subscription
                  </Link>
                </div>
              </div>

              {/* Employer Brand Score Card */}
              <div className="glass-card rounded-3xl p-6 border border-tertiary/30 bg-tertiary-container/10 space-y-3">
                <div className="flex items-center gap-2 text-tertiary font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">military_tech</span>
                  Employer Trust Score
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-4xl text-on-surface">{companyInfo.brandScore}</span>
                  <span className="text-xs text-on-surface-variant font-bold">/ 100 Grade A+</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Verified employer badge active. Responding quickly to candidate inquiries increases candidate match quality by 40%.
                </p>
              </div>

              {/* Company Info Breakdown */}
              <div className="glass-card rounded-3xl p-6 border border-outline-variant/20 space-y-3 text-xs">
                <h4 className="font-bold text-on-surface uppercase tracking-wider text-outline text-[11px]">
                  Company Details
                </h4>
                <ul className="space-y-2.5 text-on-surface-variant">
                  <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-outline">Website:</span>
                    <a href={companyInfo.website} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                      stellarsystems.io
                    </a>
                  </li>
                  <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-outline">LinkedIn:</span>
                    <a href={companyInfo.linkedin} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                      View Profile
                    </a>
                  </li>
                  <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-outline">Headquarters:</span>
                    <span className="font-bold text-on-surface">San Francisco</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-outline">Founded:</span>
                    <span className="font-bold text-on-surface">{companyInfo.founded}</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-outline">Company Size:</span>
                    <span className="font-bold text-on-surface">{companyInfo.size}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-outline">Recruiter Contact:</span>
                    <span className="font-bold text-on-surface">{companyInfo.email}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </ProtectedRoute>
  );
}
