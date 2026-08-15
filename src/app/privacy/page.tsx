"use client";

import React from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8 glass-card rounded-3xl p-8 sm:p-12 border border-white/60 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-3 py-1 bg-primary-container text-on-primary-container font-label-sm font-bold text-xs rounded-full uppercase">
              LEGAL COMPLIANCE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-on-surface">
              Privacy Policy & Data Protection
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm">
              Last Updated: July 2026 • GDPR & CCPA Compliant
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/20 pt-6">
            <section className="space-y-2">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                1. Information We Collect
              </h2>
              <p>
                NextHire collects personal information required to deliver AI-powered talent matching services. This includes profile photo, full name, email address, phone number, work experience, education credentials, uploaded resume files (PDF/DOCX), and company verification documentation.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                2. How We Use Artificial Intelligence
              </h2>
              <p>
                Our AI skill-matching engine processes uploaded resume data and job descriptions to calculate objective Match Scores. We do not use automated decision-making that produces legal effects without human oversight by recruiters.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                3. Data Sharing & Recruiter Access
              </h2>
              <p>
                When you submit a job application or set your profile status to active, your professional details and resume become viewable by verified employer accounts. We never sell candidate personal data to third-party data brokers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                4. Your Data Rights & Deletion
              </h2>
              <p>
                You have the right to request a complete export of your personal data or request permanent deletion of your account at any time through your Account Settings panel.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
