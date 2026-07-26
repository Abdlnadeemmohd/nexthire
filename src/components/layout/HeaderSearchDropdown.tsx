"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { INITIAL_JOBS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

interface HeaderSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  href: string;
  icon: string;
}

export function HeaderSearchDropdown({ isOpen, onClose }: HeaderSearchDropdownProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const role = user?.role || "JOB_SEEKER";

  useEffect(() => {
    if (role === "JOB_SEEKER") {
      setRecentSearches(["Next.js Engineer", "Stellar Systems", "Resume Studio", "Remote Jobs"]);
    } else if (role === "RECRUITER") {
      setRecentSearches(["Alex Rivers", "Senior UX Specialist", "Post New Job", "Billing Plan"]);
    } else {
      setRecentSearches(["David Chen Verification", "SaaS Subscriptions", "Support Ticket #899", "User Directory"]);
    }
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Role-Isolated Search Database Generator
  const getSearchDatabase = (): SearchItem[] => {
    if (role === "JOB_SEEKER") {
      return [
        // Suggested Quick Actions
        { id: "act-s1", title: "Resume Studio & ATS Optimizer", subtitle: "AI keyword matcher & resume builder", category: "ACTIONS", href: "/resume-studio", icon: "description" },
        { id: "act-s2", title: "Browse Live Tech Jobs", subtitle: "Filter jobs by salary, location & remote", category: "ACTIONS", href: "/jobs", icon: "search" },
        { id: "act-s3", title: "Track Active Applications", subtitle: "View submitted application statuses", category: "ACTIONS", href: "/applications", icon: "assignment" },
        { id: "act-s4", title: "Candidate Profile & Skills", subtitle: "Edit work experience and certifications", category: "ACTIONS", href: "/profile", icon: "person" },
        // Jobs
        ...INITIAL_JOBS.map((j) => ({
          id: `job-${j.id}`,
          title: j.title,
          subtitle: `${j.companyName} • ${j.location}`,
          category: "JOBS",
          href: `/jobs/${j.id}`,
          icon: "work",
        })),
        // Companies
        { id: "comp-1", title: "Stellar Systems Inc.", subtitle: "Enterprise Cloud Infrastructure • Verified Employer", category: "COMPANIES", href: "/companies/c-1", icon: "business" },
        { id: "comp-2", title: "NeuralScale AI Labs", subtitle: "Deep Learning & Artificial Intelligence", category: "COMPANIES", href: "/companies/c-2", icon: "memory" },
        // Account & Help
        { id: "help-1", title: "Help Centre & ATS FAQs", subtitle: "Learn how AI skill matching works", category: "HELP", href: "/help", icon: "help" },
        { id: "set-1", title: "Account & Data Privacy", subtitle: "Settings, security, and notification preferences", category: "SETTINGS", href: "/settings", icon: "settings" },
      ];
    }

    if (role === "RECRUITER") {
      return [
        // Suggested Quick Actions
        { id: "act-r1", title: "Post a New Job Listing", subtitle: "Create job requisition with AI assistance", category: "ACTIONS", href: "/recruiter/jobs/new", icon: "add_circle" },
        { id: "act-r2", title: "Candidate Recruitment Pipeline", subtitle: "Review Kanban stages & schedule interviews", category: "ACTIONS", href: "/recruiter/applicants", icon: "view_kanban" },
        { id: "act-r3", title: "Search Candidates Database", subtitle: "Source verified engineering talent", category: "ACTIONS", href: "/recruiter/candidates", icon: "badge" },
        { id: "act-r4", title: "Billing & Subscription Plans", subtitle: "Manage employer tier & invoice receipts", category: "ACTIONS", href: "/recruiter/billing", icon: "credit_card" },
        // Candidates
        { id: "cand-1", title: "Alex Rivers", subtitle: "Senior UX Specialist • 98% ATS Match", category: "CANDIDATES", href: "/recruiter/candidates", icon: "person" },
        { id: "cand-2", title: "Marcus Vance", subtitle: "Lead AI Systems Engineer • 95% Match", category: "CANDIDATES", href: "/recruiter/candidates", icon: "badge" },
        // Company & Jobs
        { id: "comp-rec", title: "Stellar Systems Profile", subtitle: "Edit company domain & tax verification document", category: "COMPANY", href: "/recruiter/company", icon: "business" },
        ...INITIAL_JOBS.map((j) => ({
          id: `job-${j.id}`,
          title: j.title,
          subtitle: `${j.companyName} • ${j.location}`,
          category: "JOBS",
          href: `/jobs/${j.id}`,
          icon: "work",
        })),
        { id: "help-rec", title: "Employer Verification Help", subtitle: "Submit verification documents or contact support", category: "HELP", href: "/help", icon: "help" },
      ];
    }

    // PLATFORM_ADMIN Database
    return [
      // Suggested Quick Actions
      { id: "act-a1", title: "User Directory & Access Controls", subtitle: "Manage platform accounts & security roles", category: "ACTIONS", href: "/admin/users", icon: "group" },
      { id: "act-a2", title: "Employer Verification Queue (3)", subtitle: "Audit tax certificate submissions", category: "ACTIONS", href: "/admin/companies", icon: "verified_user" },
      { id: "act-a3", title: "Support Operations Inbox", subtitle: "Resolve candidate & recruiter tickets", category: "ACTIONS", href: "/help", icon: "headset_mic" },
      { id: "act-a4", title: "SaaS Subscriptions & Revenue", subtitle: "MRR, ARR & financial metrics", category: "ACTIONS", href: "/admin/subscriptions", icon: "payments" },
      // Admin Directory & Accounts
      { id: "usr-1", title: "Sarah Jenkins (Recruiter)", subtitle: "Stellar Systems • VERIFIED", category: "USERS", href: "/admin/users", icon: "person" },
      { id: "usr-2", title: "Alex Rivers (Job Seeker)", subtitle: "Senior UX Specialist • VERIFIED", category: "USERS", href: "/admin/users", icon: "person" },
      { id: "usr-3", title: "David Chen (Recruiter)", subtitle: "CyberShield Sec • PENDING VERIFICATION", category: "USERS", href: "/admin/users", icon: "person" },
      // Companies & Tickets
      { id: "comp-adm1", title: "Stellar Systems Inc.", subtitle: "Enterprise Tier • $499/mo Plan", category: "COMPANIES", href: "/admin/companies", icon: "business" },
      { id: "tick-adm1", title: "Support Ticket TICK-901", subtitle: "Tax ID Document Verification Pending", category: "TICKETS", href: "/help", icon: "confirmation_number" },
    ];
  };

  const database = getSearchDatabase();

  const placeholderText =
    role === "JOB_SEEKER"
      ? "Search jobs, companies, skills..."
      : role === "RECRUITER"
      ? "Search candidates, jobs, companies..."
      : "Search users, subscriptions, tickets...";

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  const filteredResults = query.trim()
    ? database.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 z-50 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden animate-slide-down w-[340px] sm:w-[480px] lg:w-[520px]"
      style={{ animationDuration: "180ms" }}
    >
      {/* Dropdown Input Bar */}
      <div className="p-3 bg-surface-container-low/50 border-b border-outline-variant/20 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">search</span>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholderText}
          className="w-full bg-transparent text-xs text-on-surface focus:outline-none font-medium placeholder:text-outline"
        />
        {query && (
          <button onClick={() => setQuery("")} className="p-1 text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto p-2 space-y-3">
        {/* Recent Searches (when query is empty) */}
        {!query.trim() && recentSearches.length > 0 && (
          <div className="space-y-1.5 p-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-outline uppercase tracking-wider px-2">
              <span>Recent Searches</span>
              <button onClick={handleClearRecent} className="hover:text-primary transition-colors">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 px-2">
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectRecent(term)}
                  className="px-2.5 py-1 bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs text-outline">history</span>
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Actions (when query is empty) */}
        {!query.trim() && (
          <div className="space-y-1 p-1">
            <div className="text-[10px] font-bold text-outline uppercase tracking-wider px-2">
              Suggested Quick Actions
            </div>
            {database.filter((i) => i.category === "ACTIONS").map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-xl transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-on-surface-variant truncate">{item.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Search Results (when query exists) */}
        {query.trim() && filteredResults.length === 0 && (
          <div className="py-8 text-center space-y-2">
            <span className="material-symbols-outlined text-outline text-2xl">search_off</span>
            <p className="text-xs text-on-surface-variant font-medium">No results found for "{query}"</p>
          </div>
        )}

        {query.trim() && filteredResults.length > 0 && (
          <div className="space-y-1">
            {filteredResults.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 hover:bg-surface-container-low rounded-xl transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </span>
                    <span className="px-1.5 py-0.5 bg-surface-container-high text-outline font-bold rounded-md text-[9px] uppercase">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant truncate">{item.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation Hint */}
      <div className="p-2.5 bg-surface-container-low/40 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-outline px-3">
        <span>Role: <strong>{role.replace("_", " ")}</strong></span>
        <span>Press <strong>Esc</strong> to exit</span>
      </div>
    </div>
  );
}
