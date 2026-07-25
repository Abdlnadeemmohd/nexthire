"use client";

import React from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh pt-24 pb-20 px-4 sm:px-6 lg:px-8 space-y-16 max-w-[1600px] mx-auto">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-6">
          <span className="px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm uppercase tracking-wider text-xs font-bold shadow-xs">
            ABOUT NEXTHIRE
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-on-surface tracking-tight">
            Re-engineering Global Recruitment Through <span className="text-primary">AI Innovation</span>
          </h1>
          <p className="font-body-fluid-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            NextHire was created to replace slow, keyword-stuffed job boards with intelligent, verified skill-first matching that connects top talent with high-growth companies.
          </p>
        </section>

        {/* Mission & Vision Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold text-2xl">
              <span className="material-symbols-outlined text-3xl">flag</span>
            </div>
            <h2 className="font-headline-sm text-2xl font-bold text-on-surface">Our Mission</h2>
            <p className="text-on-surface-variant text-sm font-body-md leading-relaxed">
              To eliminate bias, reduce hiring cycles from 42 days to under 14 days, and empower every professional to discover career breakthroughs matched to their true skills.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
            <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center font-bold text-2xl">
              <span className="material-symbols-outlined text-3xl">visibility</span>
            </div>
            <h2 className="font-headline-sm text-2xl font-bold text-on-surface">Our Vision</h2>
            <p className="text-on-surface-variant text-sm font-body-md leading-relaxed">
              To build the world's most trusted global recruitment ecosystem where employer identity is verified, candidate potential is transparently measured, and hiring happens effortlessly.
            </p>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="font-headline-fluid-lg font-bold text-on-surface">
              Why NextHire Outperforms Legacy Platforms
            </h2>
            <p className="text-on-surface-variant text-sm">
              Designed specifically for modern tech professionals and fast-moving talent acquisition teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Seeker Benefits */}
            <div className="glass-card rounded-3xl p-8 border border-primary/20 space-y-4 bg-primary-container/10">
              <h3 className="font-headline-sm text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">person</span> For Job Seekers
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-on-surface-variant">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                  <span><strong>AI Match Radar</strong>: Real-time candidate match scoring tailored to your exact skills.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                  <span><strong>1-Click Applications</strong>: Apply instantly using your saved profile and resume.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                  <span><strong>Direct Recruiter Messaging</strong>: Communicate directly with hiring managers without recruiter gatekeeping.</span>
                </li>
              </ul>
            </div>

            {/* Recruiter Benefits */}
            <div className="glass-card rounded-3xl p-8 border border-tertiary/20 space-y-4 bg-tertiary-container/10">
              <h3 className="font-headline-sm text-xl font-bold text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined">business</span> For Employers & Recruiters
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-on-surface-variant">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                  <span><strong>Kanban Applicant Pipeline</strong>: Manage candidates through visual stage columns (Applied → Hired).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                  <span><strong>Verified Employer Badge</strong>: Gain candidate trust through verified Tax ID and document audits.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                  <span><strong>Automated Scheduling</strong>: Schedule interviews directly with calendar integration.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="glass-card rounded-3xl p-8 sm:p-12 border border-outline-variant/20 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-label-sm font-bold text-primary uppercase tracking-wider">LOOKING AHEAD</span>
            <h2 className="font-headline-fluid-lg font-bold text-on-surface">Product Expansion Roadmap</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="p-6 bg-surface rounded-2xl border border-outline-variant/20 space-y-2">
              <span className="px-2.5 py-0.5 bg-primary text-on-primary font-bold rounded-full text-[10px]">PHASE 1 - LIVE</span>
              <h4 className="font-bold text-sm text-on-surface">Skill Matching & SaaS Portals</h4>
              <p className="text-on-surface-variant">Next.js 14, RBAC guards, user management, and subscription billing engine.</p>
            </div>

            <div className="p-6 bg-surface rounded-2xl border border-outline-variant/20 space-y-2">
              <span className="px-2.5 py-0.5 bg-tertiary-container text-on-tertiary-container font-bold rounded-full text-[10px]">PHASE 2</span>
              <h4 className="font-bold text-sm text-on-surface">Firebase Auth & Cloud Storage</h4>
              <p className="text-on-surface-variant">Plug-and-play production Firebase Auth SDK and Cloudinary image optimization.</p>
            </div>

            <div className="p-6 bg-surface rounded-2xl border border-outline-variant/20 space-y-2">
              <span className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant font-bold rounded-full text-[10px]">PHASE 3</span>
              <h4 className="font-bold text-sm text-on-surface">AI Video Interview Assistant</h4>
              <p className="text-on-surface-variant">Automated candidate screening interviews with transcript sentiment analysis.</p>
            </div>

            <div className="p-6 bg-surface rounded-2xl border border-outline-variant/20 space-y-2">
              <span className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant font-bold rounded-full text-[10px]">PHASE 4</span>
              <h4 className="font-bold text-sm text-on-surface">Native Mobile Apps</h4>
              <p className="text-on-surface-variant">iOS and Android native candidate apps with push notifications.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
