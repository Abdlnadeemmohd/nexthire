"use client";

import React from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8 glass-card rounded-3xl p-8 sm:p-12 border border-white/60 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-3 py-1 bg-primary-container text-on-primary-container font-label-sm font-bold text-xs rounded-full uppercase">
              TERMS OF SERVICE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-on-surface">
              Terms & Conditions
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm">
              Effective Date: July 2026 • Platform Usage Agreement
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/20 pt-6">
            <section className="space-y-2">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                1. User Accounts & Responsibilities
              </h2>
              <p>
                Job Seekers and Employers are responsible for maintaining accurate profile information. Misrepresentation of skills, credentials, or employer tax documentation may result in account suspension.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                2. Employer Verification & Moderation
              </h2>
              <p>
                Recruiter accounts require mandatory verification (business domain email, tax ID, or business license audit). NextHire reserves the right to reject non-compliant accounts.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                3. SaaS Subscription Terms
              </h2>
              <p>
                Recruiter subscription plan tiers auto-renew monthly or annually. Cancellations take effect at the end of the current billing cycle.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
