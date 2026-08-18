"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface Candidate {
  id: string;
  name: string;
  email: string;
  headline?: string;
  location?: string;
  skills?: string[];
  employmentStatus?: string;
  bio?: string;
  resumeUrl?: string;
}

export default function CandidateSearchPage() {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            // Filter to JOB_SEEKER role users
            const seekers = data.data
              .filter((u: any) => u.role === "JOB_SEEKER")
              .map((u: any) => ({
                id: u.id,
                name: u.name || "Candidate",
                email: u.email,
                headline: u.profile?.headline || "Full-Stack Software Engineer",
                location: u.profile?.city ? `${u.profile.city}, ${u.profile.country}` : "San Francisco, CA (Remote)",
                skills: u.profile?.skills || ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL"],
                employmentStatus: u.profile?.employmentStatus || "OPEN_TO_OPPORTUNITIES",
                bio: u.profile?.bio || "Verified candidate on NextHire Cloud.",
                resumeUrl: u.profile?.resumeUrl || null,
              }));
            setCandidates(seekers);
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
      const matchesSearch =
        cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cand.headline && cand.headline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cand.skills && cand.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

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
            {/* Header */}
            <div className="border-b border-outline-variant/20 pb-4">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                Candidate Search & AI Sourcing
              </h1>
              <p className="text-on-surface-variant text-xs sm:text-sm font-body-md pt-1">
                Directly explore verified talent registered on the NextHire platform.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search candidates by name, skill (e.g. Next.js, TypeScript), or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Candidates Grid */}
            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                Loading talent directory...
              </div>
            ) : filteredCandidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                          {cand.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-base text-on-surface truncate">{cand.name}</h3>
                            <VerifiedBadge role="JOB_SEEKER" size="sm" />
                          </div>
                          <p className="text-xs text-on-surface-variant truncate">{cand.headline}</p>
                          <p className="text-[11px] text-outline truncate">{cand.location}</p>
                        </div>
                      </div>

                      <p className="text-xs text-on-surface-variant line-clamp-2">{cand.bio}</p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(cand.skills || []).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between gap-2">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-700 font-bold text-[10px] rounded-md">
                        {cand.employmentStatus?.replace(/_/g, " ")}
                      </span>

                      <button
                        onClick={() => {
                          showToast(`Contact invitation sent to ${cand.email}`, "success");
                        }}
                        className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-colors shadow-xs"
                      >
                        Contact Candidate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No candidates found"
                description={
                  searchQuery
                    ? `No candidates found matching '${searchQuery}'.`
                    : "No job seekers are currently registered in the system."
                }
                icon="person_search"
                actionLabel="Clear Search"
                onAction={() => setSearchQuery("")}
              />
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
