"use client";

import React from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";

export default function CookiesPage() {
  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8 glass-card rounded-3xl p-8 sm:p-12 border border-white/60 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-3 py-1 bg-primary-container text-on-primary-container font-label-sm font-bold text-xs rounded-full uppercase">
              COOKIE DISCLOSURE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-on-surface">
              Cookie Policy
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm">
              How We Use Essential & Analytics Cookies
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/20 pt-6">
            <p>
              NextHire uses essential cookies to manage authenticated sessions (`AuthContext`), preserve user portal preferences, and protect against CSRF attacks. Analytics cookies help us optimize platform responsiveness and search algorithms.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
