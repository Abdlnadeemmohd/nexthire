"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container dark:bg-slate-950 border-t border-outline-variant/20 dark:border-slate-800 pt-16 pb-12 transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-xl shadow-xs">
                N
              </div>
              <span className="font-display font-bold text-xl text-on-surface dark:text-white tracking-tight">
                Next<span className="text-primary">Hire</span>
              </span>
            </Link>
            <p className="text-on-surface-variant dark:text-slate-400 text-xs leading-relaxed max-w-sm">
              Connecting exceptional talent with world-class tech companies through intelligent AI skill-first matching and verified recruitment workflows.
            </p>
          </div>

          {/* Universal Footer Navigation Columns */}
          <div className="space-y-3">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface dark:text-slate-200 uppercase tracking-wider">
              Platform & Solutions
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant dark:text-slate-400">
              <li><Link href="/jobs" className="hover:text-primary transition-colors">Browse Live Jobs</Link></li>
              <li><Link href="/companies/c-1" className="hover:text-primary transition-colors">Employer Profiles</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About NextHire</Link></li>
              <li><Link href="/admin/subscriptions" className="hover:text-primary transition-colors">Pricing & Plans</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface dark:text-slate-200 uppercase tracking-wider">
              Help & Resources
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant dark:text-slate-400">
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Centre</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">Contact Support</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">Recruiter Guides</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">System FAQs</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface dark:text-slate-200 uppercase tracking-wider">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant dark:text-slate-400">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              <li><Link href="/settings" className="hover:text-primary transition-colors">Data Privacy Settings</Link></li>
            </ul>
          </div>
        </div>

        {/* Universal Clean Bottom Bar */}
        <div className="border-t border-outline-variant/20 dark:border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-outline dark:text-slate-500 font-label-md">
          <p>© {new Date().getFullYear()} NextHire Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-on-surface-variant dark:text-slate-400">
            <a href="https://www.nexthire.cloud" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
              www.nexthire.cloud
            </a>
            <span>•</span>
            <span className="font-semibold text-outline dark:text-slate-400">NextHire v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
