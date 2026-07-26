"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { INITIAL_JOBS } from "@/lib/mockData";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "JOB" | "COMPANY" | "CANDIDATE" | "PAGE" | "SETTING";
  href: string;
  icon: string;
}

const SEARCH_DATABASE: SearchResultItem[] = [
  // Jobs
  ...INITIAL_JOBS.map((j) => ({
    id: `job-${j.id}`,
    title: j.title,
    subtitle: `${j.companyName} • ${j.location}`,
    category: "JOB" as const,
    href: `/jobs/${j.id}`,
    icon: "work",
  })),
  // Companies
  { id: "comp-1", title: "Stellar Systems Inc.", subtitle: "Enterprise SaaS & Cloud Infrastructure", category: "COMPANY", href: "/companies/c-1", icon: "business" },
  { id: "comp-2", title: "NeuralScale AI Labs", subtitle: "Artificial Intelligence Models", category: "COMPANY", href: "/companies/c-2", icon: "memory" },
  { id: "comp-3", title: "QuantumPay Systems", subtitle: "Fintech Zero-Latency Gateway", category: "COMPANY", href: "/companies/c-3", icon: "payments" },
  // Candidates
  { id: "cand-1", title: "Alex Rivers", subtitle: "Senior UX Specialist • 98% Match", category: "CANDIDATE", href: "/recruiter/candidates", icon: "person" },
  { id: "cand-2", title: "Marcus Vance", subtitle: "Lead AI Systems Engineer • 95% Match", category: "CANDIDATE", href: "/recruiter/candidates", icon: "badge" },
  // Pages & Settings
  { id: "page-1", title: "Application Tracker", subtitle: "Candidate Application Statuses", category: "PAGE", href: "/applications", icon: "assignment" },
  { id: "page-2", title: "Resume Studio", subtitle: "ATS Keyword Optimization & Builder", category: "PAGE", href: "/resume-studio", icon: "description" },
  { id: "page-3", title: "Support Operations Desk", subtitle: "Tickets, Inquiries & Help", category: "PAGE", href: "/help", icon: "headset_mic" },
  { id: "page-4", title: "SaaS Subscriptions & Revenue", subtitle: "MRR / ARR Financial Dashboard", category: "PAGE", href: "/admin/subscriptions", icon: "payments" },
  { id: "page-5", title: "Account Settings & Data Privacy", subtitle: "Profile, Security, CSV Export", category: "SETTING", href: "/settings", icon: "settings" },
];

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = query.trim()
    ? SEARCH_DATABASE.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_DATABASE.slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-on-surface/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-2xl w-full p-4 space-y-4 shadow-2xl relative overflow-hidden">
        {/* Search Header Input */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-4 text-primary text-xl">search</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, candidates, companies, subscriptions, settings... (Esc to close)"
            className="w-full pl-12 pr-10 py-3.5 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          />
          <button
            onClick={onClose}
            className="absolute right-3 p-1 text-on-surface-variant hover:bg-surface-container rounded-full"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Results Category List */}
        <div className="max-h-96 overflow-y-auto space-y-1 divide-y divide-outline-variant/15">
          {results.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <span className="material-symbols-outlined text-outline text-3xl">search_off</span>
              <p className="text-xs text-on-surface-variant">No platform results found for "{query}"</p>
            </div>
          ) : (
            results.map((res) => (
              <Link
                key={res.id}
                href={res.href}
                onClick={onClose}
                className="flex items-center gap-3.5 p-3 hover:bg-surface-container-low/80 rounded-2xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">{res.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                      {res.title}
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-high text-outline font-bold rounded-md text-[9px] uppercase">
                      {res.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate">{res.subtitle}</p>
                </div>
                <span className="material-symbols-outlined text-outline text-sm group-hover:text-primary transition-colors">
                  arrow_forward
                </span>
              </Link>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-outline px-2">
          <span>Navigate with <strong>Enter</strong> or click</span>
          <span>Press <strong>Esc</strong> to exit</span>
        </div>
      </div>
    </div>
  );
}
