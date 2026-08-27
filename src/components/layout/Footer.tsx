"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getHomeRouteForRole } from "@/lib/auth";


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
  const { user, isLoading, isAuthenticated } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const developerUrl = process.env.NEXT_PUBLIC_DEVELOPER_URL;

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const homeHref = getHomeRouteForRole(isAuthenticated ? user?.role : null);

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
      className="bg-surface-container border-t border-outline-variant/20 pt-6 sm:pt-8 pb-5 sm:pb-6 transition-colors duration-200 mt-auto w-full flex-shrink-0"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
        {/* Main Footer Links Container */}
        <div
          className={
            isSingleSection
              ? "flex flex-col md:flex-row justify-between items-start gap-5 md:gap-8"
              : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5 md:gap-6 lg:gap-8"
          }
        >
          {/* Brand Column */}
          <div className={isSingleSection ? "max-w-md space-y-2" : "sm:col-span-2 space-y-2.5"}>
            <Link
              href={homeHref}
              className="flex items-center gap-2 group outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl p-0.5 transition-all inline-flex"
              aria-label="NextHire home"
            >
              <div className="w-7 h-7 bg-primary text-on-primary rounded-lg flex items-center justify-center font-bold font-display text-base shadow-xs">
                N
              </div>
              <span className="font-display font-bold text-base sm:text-lg text-on-surface tracking-tight">
                Next<span className="text-primary">Hire</span>
              </span>
            </Link>

            <p className="text-on-surface-variant text-xs leading-relaxed max-w-sm">
              Connecting exceptional talent with world-class tech companies through intelligent AI skill-first matching and verified recruitment workflows.
            </p>
          </div>

          {/* Navigation Columns */}
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            const contentId = `footer-nav-${section.id}`;
            return (
              <nav
                key={section.id}
                aria-label={`${section.title} navigation`}
                className="border-t md:border-t-0 border-outline-variant/20 pt-2.5 md:pt-0"
              >
                {/* Mobile Accordion Toggle (< md) */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="w-full flex md:hidden justify-between items-center py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg group"
                >
                  <span className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider group-hover:text-primary transition-colors">
                    {section.title}
                  </span>
                  <span
                    className={`material-symbols-outlined text-sm text-outline transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                    aria-hidden="true"
                  >
                    expand_more
                  </span>
                </button>

                {/* Desktop Static Heading (>= md) */}
                <h4 className="hidden md:block font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
                  {section.title}
                </h4>

                {/* Navigation Links: Visible always on md+, collapsible on mobile */}
                <div
                  id={contentId}
                  className={`${isOpen ? "block" : "hidden"} md:!block`}
                >
                  <ul className="space-y-1.5 text-xs text-on-surface-variant pb-2 md:pb-0">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="hover:text-primary transition-colors py-0.5 inline-block focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none rounded"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            );
          })}
        </div>

        {/* Bottom Copyright & Version Bar */}
        <div className="border-t border-outline-variant/20 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2.5 text-xs text-outline font-label-md text-center sm:text-left">
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
