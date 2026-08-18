"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface Candidate {
  id: string;
  name: string;
  headline?: string | null;
  location?: string | null;
  skills?: string[];
  employmentStatus?: string;
  bio?: string | null;
  resumeUrl?: string | null;
  resumeScore?: number | null;
  avatar?: string | null;
}

export default function CandidateSearchPage() {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true);
        const res = await fetch("/api/recruiter/candidates");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setCandidates(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, []);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((cand) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        cand.name.toLowerCase().includes(q) ||
        (cand.headline && cand.headline.toLowerCase().includes(q)) ||
        (cand.skills && cand.skills.some((s) => s.toLowerCase().includes(q))) ||
        (cand.location && cand.location.toLowerCase().includes(q));

      return matchesSearch;
    });
  }, [candidates, searchQuery]);

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Candidate Search" }]} />

            {/* Header */}
            <div className="border-b border-outline-variant/20 pb-4">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                Candidate Search & Sourcing
              </h1>
              <p className="text-on-surface-variant text-xs sm:text-sm font-body-md pt-1">
                Directly explore verified technical talent registered on NextHire Cloud.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search candidates by name, skill (e.g. Next.js, TypeScript, PostgreSQL), or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Candidates Grid */}
            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                Loading talent directory from database...
              </div>
            ) : filteredCandidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="glass-card rounded-2xl p-6 border border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <img
                          src={cand.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                          alt={cand.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20"
                        />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-on-surface truncate">{cand.name}</h3>
                            <VerifiedBadge role="JOB_SEEKER" size="sm" />
                          </div>
                          <p className="text-xs text-primary font-bold truncate">
                            {cand.headline || "Technical Candidate"}
                          </p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            📍 {cand.location || "Location not specified"}
                          </p>
                        </div>
                      </div>

                      {cand.bio && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 italic">
                          "{cand.bio}"
                        </p>
                      )}

                      {/* Skills Badges */}
                      {cand.skills && cand.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cand.skills.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-surface-container-high text-on-surface text-[10px] font-bold rounded-lg"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-outline font-bold">
                        {cand.resumeScore ? (
                          <>Score: <span className="text-tertiary font-bold">{cand.resumeScore}%</span></>
                        ) : (
                          <span className="text-on-surface-variant">Profile Active</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/messages?contactId=${cand.id}`}
                          className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">mail</span>
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No candidates found"
                description={
                  searchQuery
                    ? `No registered talent matched "${searchQuery}". Try searching with broader keywords like "Next.js" or "TypeScript".`
                    : "No job seekers have registered on the platform yet."
                }
                icon="person_search"
                actionLabel={searchQuery ? "Clear Search" : undefined}
                onAction={searchQuery ? () => setSearchQuery("") : undefined}
              />
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
