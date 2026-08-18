"use client";

import React from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

export default function CandidateFeedbackPage({ params }: { params: { id: string } }) {
  const feedbackData = {
    jobTitle: "Senior Full Stack Engineer",
    companyName: "NextHire Simulation Corp",
    companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    status: "Feedback Received",
    primaryReason: "Skills gap in Cloud Infrastructure & System Design",
    missingSkills: ["AWS Solutions Architecture", "Docker Containerization", "Kubernetes", "GraphQL Caching"],
    experienceGap: "Candidate demonstrates high frontend competency. Additional hands-on production cloud architecture experience required.",
    suggestedCert: "AWS Certified Solutions Architect (Associate)",
    recruiterNotes: "Your background in React and Next.js is impressive. Strengthening your experience with AWS cloud infrastructure and containerization will make your profile extremely competitive for senior positions.",
    dateUpdated: "August 18, 2026",
  };

  const aiRecommendations = [
    {
      type: "Certification",
      title: "AWS Certified Solutions Architect - Associate",
      provider: "Amazon Web Services",
      duration: "4-6 weeks preparation",
      link: "https://aws.amazon.com/certification/",
    },
    {
      type: "Course",
      title: "Docker & Kubernetes: The Practical Guide",
      provider: "Udemy / Coursera",
      duration: "18 Hours",
      link: "https://udemy.com",
    },
    {
      type: "Resume Tip",
      title: "Highlight Cloud Deployment Metrics",
      provider: "NextHire Resume AI",
      duration: "Quick Fix",
      link: "/profile",
    },
  ];

  return (
    <ProtectedRoute>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
                <Link href="/applications" className="hover:underline">Applications</Link>
                <span>/</span>
                <span className="text-primary font-bold">Recruiter Feedback & AI Guidance</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-on-surface pt-1">
                Application Feedback Studio
              </h1>
            </div>

            <Link
              href="/applications"
              className="px-5 py-2 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-full hover:bg-surface-container transition-all"
            >
              ← Back to Applications
            </Link>
          </div>

          {/* Job Overview Banner */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <CompanyLogo
                src={feedbackData.companyLogo}
                name={feedbackData.companyName}
                size="lg"
                rounded="2xl"
              />
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-on-surface">
                  {feedbackData.jobTitle}
                </h2>
                <p className="text-xs text-on-surface-variant font-label-md font-semibold">
                  {feedbackData.companyName} • Feedback Updated {feedbackData.dateUpdated}
                </p>
              </div>
            </div>

            <span className="px-4 py-1.5 bg-tertiary-container/30 text-tertiary font-label-md font-bold text-xs rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">reviews</span>
              {feedbackData.status}
            </span>
          </div>

          {/* Structured Recruiter Feedback Card */}
          <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-label-md font-bold uppercase tracking-wider text-outline">
                STRUCTURED RECRUITER FEEDBACK
              </span>
              <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                {feedbackData.primaryReason}
              </h3>
            </div>

            {/* Recruiter Guidance Quote */}
            <div className="p-6 bg-surface-container/60 rounded-2xl border-l-4 border-primary space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">chat</span>
                Direct Note from Recruiter
              </div>
              <p className="text-on-surface text-sm italic leading-relaxed">
                "{feedbackData.recruiterNotes}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Missing Skills */}
              <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 space-y-3">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider text-outline">
                  Identified Missing Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {feedbackData.missingSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-error-container/30 text-error font-label-sm font-bold text-xs rounded-full border border-error/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience Gap */}
              <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 space-y-3">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider text-outline">
                  Experience Gap Note
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                  {feedbackData.experienceGap}
                </p>
              </div>

              {/* Suggested Certification */}
              <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 space-y-3">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider text-outline">
                  Recommended Certification
                </h4>
                <p className="text-xs text-tertiary font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">workspace_premium</span>
                  {feedbackData.suggestedCert}
                </p>
              </div>
            </div>
          </div>

          {/* AI Career Recommendations Section */}
          <div className="glass-card rounded-3xl p-8 border border-primary/20 space-y-6 bg-primary-container/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                  NextHire AI Career Recommendations
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Personalized action items based on recruiter feedback to strengthen your future applications.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiRecommendations.map((rec, i) => (
                <div key={i} className="p-5 bg-surface rounded-2xl border border-outline-variant/20 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 bg-primary-container text-on-primary-container font-bold rounded-full text-[10px]">
                      {rec.type}
                    </span>
                    <h4 className="font-bold text-sm text-on-surface">{rec.title}</h4>
                    <p className="text-xs text-on-surface-variant">{rec.provider} • {rec.duration}</p>
                  </div>
                  <a
                    href={rec.link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-surface-container-high hover:bg-primary-container/20 text-primary font-label-md font-bold text-xs rounded-xl text-center transition-all block"
                  >
                    Explore Course →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </ProtectedRoute>
  );
}
