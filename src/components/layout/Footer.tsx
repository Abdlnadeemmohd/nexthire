"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant/20 pt-10 sm:pt-12 pb-8 transition-colors duration-200 mt-auto w-full flex-shrink-0">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-lg shadow-xs">
                N
              </div>
              <span className="font-display font-bold text-lg text-on-surface tracking-tight">
                Next<span className="text-primary">Hire</span>
              </span>
            </Link>
            <p className="text-on-surface-variant text-xs leading-relaxed max-w-sm">
              Connecting exceptional talent with world-class tech companies through intelligent AI skill-first matching and verified recruitment workflows.
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="space-y-2.5">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              <li><Link href="/jobs" className="hover:text-primary transition-colors">Browse Live Jobs</Link></li>
              <li><Link href="/companies" className="hover:text-primary transition-colors">Employer Profiles</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About NextHire</Link></li>
              <li><Link href="/recruiter/billing" className="hover:text-primary transition-colors">Pricing & Plans</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Centre</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">Contact Support</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">Recruiter Guides</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">System FAQs</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              <li><Link href="/settings" className="hover:text-primary transition-colors">Data Privacy Settings</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Version Bar */}
        <div className="border-t border-outline-variant/20 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-outline font-label-md">
          <p>© {new Date().getFullYear()} NextHire Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-3 text-outline">
            <span className="text-[11px]">Version 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
