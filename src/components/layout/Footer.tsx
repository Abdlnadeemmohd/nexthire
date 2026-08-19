"use client";

import React, { useState } from "react";
import Link from "next/link";

export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const developerUrl = process.env.NEXT_PUBLIC_DEVELOPER_URL;

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <footer data-avoid-copilot="true" className="bg-surface-container border-t border-outline-variant/20 pt-6 sm:pt-10 pb-6 sm:pb-8 transition-colors duration-200 mt-auto w-full flex-shrink-0">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl p-0.5 transition-all"
              aria-label="NextHire home"
            >
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

          {/* Desktop & Collapsible Mobile Navigation Columns */}
          <div className="space-y-2.5 border-t md:border-t-0 border-outline-variant/20 pt-3 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection("platform")}
              aria-expanded={openSection === "platform"}
              className="w-full flex justify-between items-center cursor-pointer md:cursor-default py-2 md:py-0 text-left focus:outline-none"
            >
              <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                Platform
              </h4>
              <span className="material-symbols-outlined text-sm md:hidden text-outline" aria-hidden="true">
                {openSection === "platform" ? "expand_less" : "expand_more"}
              </span>
            </button>
            <ul className={`space-y-1.5 text-xs text-on-surface-variant ${openSection === "platform" ? "block" : "hidden md:block"}`}>
              <li><Link href="/jobs" className="hover:text-primary transition-colors py-1 inline-block">Browse Live Jobs</Link></li>
              <li><Link href="/companies" className="hover:text-primary transition-colors py-1 inline-block">Employer Profiles</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors py-1 inline-block">About NextHire</Link></li>
              <li><Link href="/developer" className="hover:text-primary transition-colors py-1 inline-block">About the Developer</Link></li>
              <li><Link href="/recruiter/billing" className="hover:text-primary transition-colors py-1 inline-block">Pricing & Plans</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5 border-t md:border-t-0 border-outline-variant/20 pt-3 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection("support")}
              aria-expanded={openSection === "support"}
              className="w-full flex justify-between items-center cursor-pointer md:cursor-default py-2 md:py-0 text-left focus:outline-none"
            >
              <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                Support
              </h4>
              <span className="material-symbols-outlined text-sm md:hidden text-outline" aria-hidden="true">
                {openSection === "support" ? "expand_less" : "expand_more"}
              </span>
            </button>
            <ul className={`space-y-1.5 text-xs text-on-surface-variant ${openSection === "support" ? "block" : "hidden md:block"}`}>
              <li><Link href="/help" className="hover:text-primary transition-colors py-1 inline-block">Help Centre</Link></li>
              <li><Link href="/help?section=contact" className="hover:text-primary transition-colors py-1 inline-block">Contact Support</Link></li>
              <li><Link href="/help?section=faq" className="hover:text-primary transition-colors py-1 inline-block">System FAQs</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors py-1 inline-block">Platform Guides</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5 border-t md:border-t-0 border-outline-variant/20 pt-3 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection("legal")}
              aria-expanded={openSection === "legal"}
              className="w-full flex justify-between items-center cursor-pointer md:cursor-default py-2 md:py-0 text-left focus:outline-none"
            >
              <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                Legal
              </h4>
              <span className="material-symbols-outlined text-sm md:hidden text-outline" aria-hidden="true">
                {openSection === "legal" ? "expand_less" : "expand_more"}
              </span>
            </button>
            <ul className={`space-y-1.5 text-xs text-on-surface-variant ${openSection === "legal" ? "block" : "hidden md:block"}`}>
              <li><Link href="/privacy" className="hover:text-primary transition-colors py-1 inline-block">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors py-1 inline-block">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors py-1 inline-block">Cookie Policy</Link></li>
              <li><Link href="/settings" className="hover:text-primary transition-colors py-1 inline-block">Data Privacy Settings</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Version Bar */}
        <div className="border-t border-outline-variant/20 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-outline font-label-md text-center sm:text-left">
          <p>© {new Date().getFullYear()} NextHire. All rights reserved.</p>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-outline">
            <span className="text-xs text-on-surface-variant font-medium">
              Built & Developed by{" "}
              {developerUrl ? (
                <a
                  href={developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  ANM
                </a>
              ) : (
                <strong className="font-bold text-on-surface">ANM</strong>
              )}
            </span>
            <span className="text-[11px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Version 2.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
