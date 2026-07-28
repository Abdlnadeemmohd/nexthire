"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function MyRecruiterProfilePage() {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [recruiterData, setRecruiterData] = useState({
    name: "Sarah Jenkins",
    title: "Lead Technical Recruiter & Engineering Partner",
    department: "Global Tech Talent Acquisition",
    company: "Stellar Systems Inc.",
    email: "recruiter@nexthire.com",
    phone: "+1 (555) 342-8900",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    yearsOfExperience: "10+ Years",
    availabilityStatus: "CURRENTLY_HIRING" as "CURRENTLY_HIRING" | "AVAILABLE_INTERVIEWS" | "ON_LEAVE",
    timeZone: "PST (UTC-8) • San Francisco, CA",
    linkedinUrl: "https://linkedin.com/in/sarahjenkins-recruiter",
    websiteUrl: "https://stellarsystems.io/careers",
    bio: "Lead Talent Partner at Stellar Systems. Specialized in connecting Staff Systems Architects, AI/ML Infrastructure Engineers, and Engineering Directors with hyper-growth enterprise SaaS teams.",
    specialties: ["Cloud Infrastructure (AWS/GCP)", "AI & Machine Learning", "Full Stack Engineering", "Engineering Leadership"],
    languages: ["English (Native)", "Spanish (Professional)"],
    metrics: {
      jobsPosted: 24,
      activeVacancies: 4,
      candidatesReviewed: 348,
      candidatesHired: 148,
      avgResponseTime: "< 2 Hours",
      candidateRating: "4.9 / 5.0",
      hiringSuccessRate: "94.2%",
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    showToast("My Recruiter Profile updated successfully! Changes reflected across job postings.", "success");
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "My Recruiter Profile" }]} />

            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  My Recruiter Identity & Credentials
                </h1>
                <p className="text-on-surface-variant text-xs sm:text-sm font-body-md">
                  Manage your personal recruiter profile displayed on job postings, candidate communications, and ATS cards.
                </p>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-base">{isEditing ? "close" : "edit"}</span>
                {isEditing ? "Cancel Edit" : "Edit Recruiter Profile"}
              </button>
            </div>

            {/* Recruiter Overview Hero Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 relative shadow-md">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={recruiterData.avatar}
                    alt={recruiterData.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-primary/30 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white" title="Active Hiring Status">
                    <span className="material-symbols-outlined text-xs block">check_circle</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-display text-2xl font-bold text-on-surface">{recruiterData.name}</h2>
                    <VerifiedBadge role="RECRUITER" size="md" />
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-bold text-xs rounded-full">
                      ✓ {recruiterData.availabilityStatus === "CURRENTLY_HIRING" ? "Actively Sourcing & Hiring" : "Available"}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-primary">{recruiterData.title}</p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {recruiterData.company} • {recruiterData.department} • 📍 {recruiterData.timeZone}
                  </p>

                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 italic">
                    "{recruiterData.bio}"
                  </p>
                </div>
              </div>

              {/* Recruiter Statistics Metric Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
                <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                  <span className="text-[10px] font-bold text-outline uppercase block">Active Vacancies</span>
                  <span className="font-bold text-on-surface font-mono text-base">{recruiterData.metrics.activeVacancies} Roles</span>
                </div>

                <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                  <span className="text-[10px] font-bold text-outline uppercase block">Candidates Hired</span>
                  <span className="font-bold text-primary font-mono text-base">{recruiterData.metrics.candidatesHired} Hired</span>
                </div>

                <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                  <span className="text-[10px] font-bold text-outline uppercase block">Response SLA</span>
                  <span className="font-bold text-emerald-700 font-mono text-base">{recruiterData.metrics.avgResponseTime}</span>
                </div>

                <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                  <span className="text-[10px] font-bold text-outline uppercase block">Candidate Rating</span>
                  <span className="font-bold text-amber-500 font-mono text-base">★ {recruiterData.metrics.candidateRating}</span>
                </div>
              </div>
            </div>

            {/* Recruiter Profile Edit Form / View Details */}
            {isEditing ? (
              <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/30 space-y-6 text-xs font-body-md shadow-xl">
                <h3 className="font-bold text-base text-on-surface border-b pb-2">Edit My Personal Recruiter Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Full Name</label>
                    <input
                      type="text"
                      value={recruiterData.name}
                      onChange={(e) => setRecruiterData({ ...recruiterData, name: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Professional Title</label>
                    <input
                      type="text"
                      value={recruiterData.title}
                      onChange={(e) => setRecruiterData({ ...recruiterData, title: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Department</label>
                    <input
                      type="text"
                      value={recruiterData.department}
                      onChange={(e) => setRecruiterData({ ...recruiterData, department: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Years of Recruitment Experience</label>
                    <input
                      type="text"
                      value={recruiterData.yearsOfExperience}
                      onChange={(e) => setRecruiterData({ ...recruiterData, yearsOfExperience: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-outline uppercase text-[10px] pb-1">Recruiter Biography & Sourcing Mission</label>
                  <textarea
                    rows={3}
                    value={recruiterData.bio}
                    onChange={(e) => setRecruiterData({ ...recruiterData, bio: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      value={recruiterData.linkedinUrl}
                      onChange={(e) => setRecruiterData({ ...recruiterData, linkedinUrl: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Careers / Portfolio Link</label>
                    <input
                      type="url"
                      value={recruiterData.websiteUrl}
                      onChange={(e) => setRecruiterData({ ...recruiterData, websiteUrl: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container shadow-xs"
                  >
                    Save Recruiter Profile
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hiring Specialties */}
                <div className="glass-card rounded-3xl p-6 border border-outline-variant/20 space-y-4">
                  <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider text-outline">
                    Hiring Specialties & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recruiterData.specialties.map((s) => (
                      <span key={s} className="px-3 py-1.5 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl border border-outline-variant/30">
                        ⚡ {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact & Social Links */}
                <div className="glass-card rounded-3xl p-6 border border-outline-variant/20 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider text-outline">
                    Recruiter Direct Contact & Links
                  </h3>
                  <ul className="space-y-2.5 text-on-surface-variant">
                    <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                      <span className="text-outline">Official Email:</span>
                      <span className="font-bold text-on-surface font-mono">{recruiterData.email}</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                      <span className="text-outline">Phone Contact:</span>
                      <span className="font-bold text-on-surface font-mono">{recruiterData.phone}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-outline">LinkedIn Profile:</span>
                      <a href={recruiterData.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                        View LinkedIn
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
