"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
}

/**
 * Anonymous / Public Visitor Navigation
 * Intentionally minimal: strictly Legal resources
 */
const PUBLIC_FOOTER: FooterSection[] = [
  {
    id: "legal",
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

/**
 * Authenticated Job Seeker Navigation
 * Role-tailored: Platform job exploration, support guides, and data privacy
 */
const JOB_SEEKER_FOOTER: FooterSection[] = [
  {
    id: "platform",
    title: "Platform",
    links: [
      { label: "Browse Live Jobs", href: "/jobs" },
      { label: "About NextHire", href: "/about" },
      { label: "About the Developer", href: "/developer" },
    ],
  },
  {
    id: "support",
    title: "Support",
    links: [
      { label: "Help Centre", href: "/help" },
      { label: "FAQs", href: "/help?section=faq" },
      { label: "System Support", href: "/help?section=contact" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Data Privacy Settings", href: "/settings" },
    ],
  },
];

/**
 * Authenticated Recruiter / Employer Navigation
 * Role-tailored: Pricing & subscriptions, talent operations support, and legal settings
 */
const RECRUITER_FOOTER: FooterSection[] = [
  {
    id: "platform",
    title: "Platform",
    links: [
      { label: "About NextHire", href: "/about" },
      { label: "About the Developer", href: "/developer" },
      { label: "Pricing & Plans", href: "/recruiter/billing" },
    ],
  },
  {
    id: "support",
    title: "Support",
    links: [
      { label: "Help Centre", href: "/help" },
      { label: "FAQs", href: "/help?section=faq" },
      { label: "System Support", href: "/help?section=contact" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Data Privacy Settings", href: "/settings" },
    ],
  },
];

export function Footer() {
  const { user, isLoading } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const developerUrl = process.env.NEXT_PUBLIC_DEVELOPER_URL;

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  // Authoritatively derive navigation sections from session state
  const sections = useMemo(() => {
    if (isLoading || !user) {
      return PUBLIC_FOOTER;
    }
    if (user.role === "RECRUITER" || user.role === "RECRUITER_MANAGER" || user.role === "COMPANY_ADMIN" || user.role === "PLATFORM_ADMIN") {
      return RECRUITER_FOOTER;
    }
    return JOB_SEEKER_FOOTER;
  }, [user, isLoading]);

  const isSingleSection = sections.length === 1;

  return (
    <footer
      data-avoid-copilot="true"
      className="bg-surface-container border-t border-outline-variant/20 pt-6 sm:pt-10 pb-6 sm:pb-8 transition-colors duration-200 mt-auto w-full flex-shrink-0"
      role="contentinfo"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Main Footer Links Container */}
        <div
          className={
            isSingleSection
              ? "flex flex-col md:flex-row justify-between items-start gap-6 md:gap-12"
              : "grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8"
          }
        >
          {/* Brand Column */}
          <div className={isSingleSection ? "max-w-md space-y-3" : "md:col-span-2 space-y-3"}>
            <Link
              href="/"
              className="flex items-center gap-2.5 group outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl p-0.5 transition-all inline-flex"
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

          {/* Navigation Columns */}
          {isSingleSection ? (
            <nav aria-label="Legal navigation" className="w-full md:w-auto md:min-w-[200px]">
              {sections.map((section) => (
                <div key={section.id} className="space-y-2.5 border-t md:border-t-0 border-outline-variant/20 pt-3 md:pt-0">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={openSection === section.id}
                    className="w-full flex justify-between items-center cursor-pointer md:cursor-default py-2 md:py-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                  >
                    <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                      {section.title}
                    </h4>
                    <span
                      className="material-symbols-outlined text-sm md:hidden text-outline transition-transform duration-200"
                      aria-hidden="true"
                    >
                      {openSection === section.id ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  <ul
                    className={`space-y-1.5 text-xs text-on-surface-variant ${
                      openSection === section.id ? "block" : "hidden md:block"
                    }`}
                  >
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="hover:text-primary transition-colors py-1 inline-block focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none rounded"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          ) : (
            sections.map((section) => (
              <nav
                key={section.id}
                aria-label={`${section.title} navigation`}
                className="space-y-2.5 border-t md:border-t-0 border-outline-variant/20 pt-3 md:pt-0"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={openSection === section.id}
                  className="w-full flex justify-between items-center cursor-pointer md:cursor-default py-2 md:py-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                >
                  <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                    {section.title}
                  </h4>
                  <span
                    className="material-symbols-outlined text-sm md:hidden text-outline transition-transform duration-200"
                    aria-hidden="true"
                  >
                    {openSection === section.id ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <ul
                  className={`space-y-1.5 text-xs text-on-surface-variant ${
                    openSection === section.id ? "block" : "hidden md:block"
                  }`}
                >
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="hover:text-primary transition-colors py-1 inline-block focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none rounded"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))
          )}
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
