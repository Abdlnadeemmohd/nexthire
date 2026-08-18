"use client";

import React from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";

export default function DeveloperPage() {
  const developerUrl = process.env.NEXT_PUBLIC_DEVELOPER_URL;

  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh pt-24 pb-20 px-4 sm:px-6 lg:px-8 space-y-12 max-w-[1400px] mx-auto">
        {/* Header Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-label-sm uppercase tracking-wider text-xs font-bold border border-primary/20">
            PRODUCT AUTHORSHIP & CREDITS
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight">
            About the <span className="text-primary">Developer</span>
          </h1>
          <p className="font-body-fluid-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            NextHire is designed, built, and developed by{" "}
            {developerUrl ? (
              <a
                href={developerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline"
              >
                Abdul Nadeem Mohd
              </a>
            ) : (
              <strong className="font-bold text-on-surface">Abdul Nadeem Mohd</strong>
            )}.
          </p>
        </section>

        {/* Core Architecture & Product Overview Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold text-2xl">
              <span className="material-symbols-outlined text-3xl">code</span>
            </div>
            <h2 className="font-headline-sm text-xl font-bold text-on-surface">Product Engineering</h2>
            <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed">
              Architected as a web-first, multi-tenant global talent platform. NextHire features a decoupled Search Provider Abstraction Layer, database-backed session security, real-time candidate match scoring, ATS pipeline stage transitions, and responsive web design.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-4">
            <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center font-bold text-2xl">
              <span className="material-symbols-outlined text-3xl">layers</span>
            </div>
            <h2 className="font-headline-sm text-xl font-bold text-on-surface">Technology Stack</h2>
            <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed">
              Built with Next.js 14 App Router, TypeScript, TailwindCSS, Prisma ORM, PostgreSQL database, scrypt cryptographic session security, Schema.org JobPosting structured data, and custom AI search query engines.
            </p>
          </div>
        </section>

        {/* Product Information Card */}
        <section className="glass-card rounded-3xl p-6 sm:p-10 border border-outline-variant/20 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold text-xl">
              N
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface">NextHire Platform Specification</h3>
              <p className="text-xs text-on-surface-variant">System details & developer credits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-body-md">
            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase">Primary Brand</span>
              <div className="font-bold text-on-surface">NextHire Platform</div>
            </div>

            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase">Developer / Author</span>
              <div className="font-bold text-primary">Abdul Nadeem Mohd</div>
            </div>

            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase">Application Version</span>
              <div className="font-bold text-on-surface">v2.0.0 Production</div>
            </div>

            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase">Platform Domain</span>
              <div className="font-bold text-on-surface">www.nexthire.cloud</div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap gap-4 items-center justify-between">
            <Link
              href="/about"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Learn more about NextHire product vision
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <Link
              href="/jobs"
              className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs"
            >
              Explore Live Portal
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
