"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
      setRecentSearches(["Next.js Engineer", "Full Stack Developer", "Resume Studio", "Remote Jobs"]);
    } else if (role === "RECRUITER") {
      setRecentSearches(["Full-Stack Candidate", "Candidate Pipeline", "Post New Job", "Billing"]);
    } else {
      setRecentSearches(["User Directory", "Company Moderation", "SaaS Subscriptions", "System Audit"]);
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

  // Role-Isolated Search Quick Actions Generator
  const getSearchDatabase = (): SearchItem[] => {
    if (role === "JOB_SEEKER") {
      return [
        { id: "act-s1", title: "Resume Studio & ATS Optimizer", subtitle: "AI keyword matcher & resume builder", category: "ACTIONS", href: "/resume-studio", icon: "description" },
        { id: "act-s2", title: "Browse Live Tech Jobs", subtitle: "Filter jobs by salary, location & remote", category: "ACTIONS", href: "/jobs", icon: "search" },
        { id: "act-s3", title: "Track Active Applications", subtitle: "View submitted application statuses", category: "ACTIONS", href: "/applications", icon: "assignment" },
        { id: "act-s4", title: "Candidate Profile & Skills", subtitle: "Edit work experience and certifications", category: "ACTIONS", href: "/profile", icon: "person" },
        { id: "comp-1", title: "Companies Directory", subtitle: "Explore verified employer organizations", category: "COMPANIES", href: "/companies", icon: "business" },
        { id: "help-1", title: "Help Centre & ATS FAQs", subtitle: "Learn how AI skill matching works", category: "HELP", href: "/help", icon: "help" },
        { id: "set-1", title: "Account & Data Privacy", subtitle: "Settings, security, and notification preferences", category: "SETTINGS", href: "/settings", icon: "settings" },
      ];
    }

    if (role === "RECRUITER") {
      return [
        { id: "act-r1", title: "Post a New Job Listing", subtitle: "Create job requisition with AI assistance", category: "ACTIONS", href: "/recruiter/jobs/new", icon: "add_circle" },
        { id: "act-r2", title: "Candidate Recruitment Pipeline", subtitle: "Review Kanban stages & schedule interviews", category: "ACTIONS", href: "/recruiter/applicants", icon: "view_kanban" },
        { id: "act-r3", title: "Search Candidates Database", subtitle: "Source verified engineering talent", category: "ACTIONS", href: "/recruiter/candidates", icon: "badge" },
        { id: "act-r4", title: "Billing & Subscription Plans", subtitle: "Manage employer tier & invoice receipts", category: "ACTIONS", href: "/recruiter/billing", icon: "credit_card" },
        { id: "comp-rec", title: "Employer Company Profile", subtitle: "Manage company brand and open jobs", category: "COMPANY", href: "/recruiter/company", icon: "business" },
        { id: "help-rec", title: "Employer Verification Help", subtitle: "Submit verification documents or contact support", category: "HELP", href: "/help", icon: "help" },
      ];
    }

    // PLATFORM_ADMIN Database
    return [
      { id: "act-a1", title: "User Directory & Access Controls", subtitle: "Manage platform accounts & security roles", category: "ACTIONS", href: "/admin/users", icon: "group" },
      { id: "act-a2", title: "Employer Verification Directory", subtitle: "Audit and verify employer organizations", category: "ACTIONS", href: "/admin/companies", icon: "verified_user" },
      { id: "act-a3", title: "Support Operations Inbox", subtitle: "Resolve candidate & recruiter tickets", category: "ACTIONS", href: "/help", icon: "headset_mic" },
      { id: "act-a4", title: "SaaS Subscriptions & Revenue", subtitle: "MRR, ARR & financial metrics", category: "ACTIONS", href: "/admin/subscriptions", icon: "payments" },
      { id: "usr-1", title: "Recruiter Account", subtitle: "recruiter@nexthire.cloud • VERIFIED", category: "USERS", href: "/admin/users", icon: "person" },
      { id: "usr-2", title: "Job Seeker Account", subtitle: "jobseeker@nexthire.cloud • VERIFIED", category: "USERS", href: "/admin/users", icon: "person" },
      { id: "usr-3", title: "Platform Owner Account", subtitle: "owner@nexthire.cloud • SUPER ADMIN", category: "USERS", href: "/admin/users", icon: "admin_panel_settings" },
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

  const filteredItems = query.trim()
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
      className="absolute right-0 top-full mt-2 w-[320px] sm:w-[460px] lg:w-[520px] max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Search Input Box */}
      <div className="p-4 border-b border-outline-variant/20 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-xl">search</span>
        <input
          type="text"
          autoFocus
          placeholder={placeholderText}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Dropdown Body */}
      <div className="p-4 max-h-96 overflow-y-auto space-y-4">
        {query.trim() ? (
          filteredItems.length > 0 ? (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block px-2">
                Matching Results ({filteredItems.length})
              </span>
              {filteredItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="p-3 rounded-2xl hover:bg-surface-container-low flex items-center gap-3 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-on-surface truncate">{item.title}</h4>
                    <p className="text-[11px] text-on-surface-variant truncate">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-bold text-outline uppercase px-2 py-0.5 rounded-md bg-surface-container">
                    {item.category}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              No results found for &ldquo;{query}&rdquo;. Try another search term.
            </div>
          )
        ) : (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block px-1">
                  Suggested Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectRecent(term)}
                      className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded-full text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs text-outline">history</span>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions List */}
            <div className="space-y-1 pt-2 border-t border-outline-variant/15">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block px-1 pb-1">
                Quick Portal Navigation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {database.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
                    <span className="text-xs font-bold text-on-surface truncate">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
