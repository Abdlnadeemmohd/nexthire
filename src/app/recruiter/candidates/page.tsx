"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  hasResume?: boolean;
  resumeScore?: number | null;
  avatar?: string | null;
  email?: string;
  phone?: string | null;
  isUnlocked?: boolean;
  canDownloadResume?: boolean;
}

interface EntitlementsMeta {
  isTrial: boolean;
  trialStatus: string;
  trialSearchesUsed: number;
  trialSearchesLimit: number;
  planId: string;
  planName: string;
  planTier: string;
  candidateUnlocksRemainingToday: number;
  resumeUnlocksRemainingToday: number;
  canDownloadResume: boolean;
  canRequestContact: boolean;
}

export default function CandidateSearchPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [entitlements, setEntitlements] = useState<EntitlementsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [trialUpgradeModalOpen, setTrialUpgradeModalOpen] = useState(false);
  const [contactRequestModalOpen, setContactRequestModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadCandidates = async (query = "") => {
    try {
      setLoading(true);
      const url = query ? `/api/recruiter/candidates?q=${encodeURIComponent(query)}` : "/api/recruiter/candidates";
      const res = await fetch(url);
      const data = await res.json();

      if (res.status === 403 && data.upgradeRequired) {
        setTrialUpgradeModalOpen(true);
        showToast(data.error || "Trial searches exhausted. Upgrade to continue sourcing.", "error");
        return;
      }

      if (res.ok && data.success) {
        setCandidates(data.data || []);
        if (data.entitlements) {
          setEntitlements(data.entitlements);
        }
      } else {
        showToast(data.error || "Failed to load candidates", "error");
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      showToast("Network error fetching candidate directory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCandidates(searchQuery);
  };

  const handleUnlockCandidate = async (candidate: Candidate) => {
    if (entitlements?.isTrial) {
      setTrialUpgradeModalOpen(true);
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/recruiter/candidates/${candidate.id}/unlock`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Profile for ${candidate.name} unlocked!`, "success");
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidate.id ? { ...c, isUnlocked: true, email: data.data.email, phone: data.data.phone } : c))
        );
        if (selectedCandidate && selectedCandidate.id === candidate.id) {
          setSelectedCandidate({
            ...selectedCandidate,
            isUnlocked: true,
            email: data.data.email,
            phone: data.data.phone,
          });
        }
      } else if (res.status === 403 && data.upgradeRequired) {
        setTrialUpgradeModalOpen(true);
        showToast(data.error, "error");
      } else {
        showToast(data.error || "Failed to unlock candidate", "error");
      }
    } catch (err) {
      showToast("Network error unlocking profile", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadResume = async (candidate: Candidate) => {
    if (entitlements?.isTrial) {
      setTrialUpgradeModalOpen(true);
      showToast("Resume downloads are not available during Trial Mode. Please upgrade to a paid plan.", "info");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/recruiter/candidates/${candidate.id}/resume`);
      const data = await res.json();

      if (res.ok && data.success && data.data?.resumeUrl) {
        showToast(`Opening verified resume for ${candidate.name}...`, "success");
        window.open(data.data.resumeUrl, "_blank");
      } else if (res.status === 403 && data.upgradeRequired) {
        setTrialUpgradeModalOpen(true);
        showToast(data.error, "error");
      } else {
        showToast(data.error || "Unable to download candidate resume", "error");
      }
    } catch (err) {
      showToast("Network error downloading resume", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendContactRequest = async () => {
    if (!selectedCandidate) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/recruiter/candidates/${selectedCandidate.id}/contact-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contactMessage }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Contact request sent to candidate successfully!", "success");
        setContactRequestModalOpen(false);
        setContactMessage("");
      } else if (res.status === 403 && data.upgradeRequired) {
        setTrialUpgradeModalOpen(true);
        showToast(data.error, "error");
      } else {
        showToast(data.error || "Failed to send contact request", "error");
      }
    } catch (err) {
      showToast("Network error sending contact request", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full pb-20 sm:pb-24">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Candidate Search" }]} />

            {/* Header & Entitlements Meter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Candidate Search & Talent Sourcing
                </h1>
                <p className="text-on-surface-variant text-xs sm:text-sm font-body-md pt-1">
                  Discover verified technical professionals available for direct recruitment.
                </p>
              </div>

              {/* Sourcing Quota Meter */}
              {entitlements && (
                <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2.5 rounded-2xl border border-outline-variant/30 text-xs">
                  <span className="material-symbols-outlined text-primary text-lg">
                    {entitlements.isTrial ? "hourglass_top" : "bolt"}
                  </span>
                  <div>
                    {entitlements.isTrial ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">Trial Sourcing:</span>
                          <span className="text-primary font-bold">
                            {entitlements.trialSearchesUsed} / {entitlements.trialSearchesLimit} searches used
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          {Math.max(0, entitlements.trialSearchesLimit - entitlements.trialSearchesUsed)} searches remaining
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">{entitlements.planName}:</span>
                          <span className="text-emerald-700 font-bold">
                            {entitlements.candidateUnlocksRemainingToday} daily unlocks left
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          {entitlements.resumeUnlocksRemainingToday} resume downloads remaining today
                        </p>
                      </div>
                    )}
                  </div>
                  {entitlements.isTrial && (
                    <Link
                      href="/recruiter/billing"
                      className="ml-2 px-3 py-1 bg-primary text-on-primary font-bold text-[11px] rounded-xl hover:bg-primary-container transition-all"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by candidate name, skill (e.g. Next.js, TypeScript, PostgreSQL), or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-primary text-on-primary font-bold text-xs sm:text-sm rounded-xl hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-2xs touch-target"
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Search Talent
              </button>
            </form>

            {/* Candidates Grid */}
            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading verified talent directory from Neon PostgreSQL...
              </div>
            ) : candidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="glass-card rounded-2xl p-6 border border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <img
                          src={cand.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                          alt={cand.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20 flex-shrink-0"
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

                      {/* Contact Preview (Masked or Unlocked) */}
                      <div className="p-2.5 bg-surface-container-low rounded-xl text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-on-surface-variant">
                          <span>Email:</span>
                          <span className="font-mono text-on-surface font-semibold">{cand.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-on-surface-variant">
                          <span>Phone:</span>
                          <span className="font-mono text-on-surface font-semibold">{cand.phone || "Protected"}</span>
                        </div>
                      </div>

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

                    <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setPreviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xs font-bold rounded-xl transition-all"
                      >
                        Preview Profile
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDownloadResume(cand)}
                          disabled={!cand.hasResume || actionLoading}
                          className={`p-2 rounded-xl text-xs font-bold transition-all ${
                            cand.hasResume
                              ? "bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary"
                              : "bg-surface-container-low text-outline opacity-50 cursor-not-allowed"
                          }`}
                          title={cand.hasResume ? "Download Verified Resume" : "No resume uploaded"}
                        >
                          <span className="material-symbols-outlined text-sm">description</span>
                        </button>

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
                onAction={searchQuery ? () => { setSearchQuery(""); loadCandidates(""); } : undefined}
              />
            )}
          </main>

          <Footer />
        </div>
      </div>

      {/* Candidate Preview Modal */}
      {previewModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCandidate.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                  alt={selectedCandidate.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-lg text-on-surface">{selectedCandidate.name}</h3>
                    <VerifiedBadge role="JOB_SEEKER" size="sm" />
                  </div>
                  <p className="text-xs text-primary font-bold">{selectedCandidate.headline || "Technical Candidate"}</p>
                  <p className="text-[11px] text-on-surface-variant">📍 {selectedCandidate.location || "Location not specified"}</p>
                </div>
              </div>

              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {selectedCandidate.bio && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-on-surface">Candidate Summary</h4>
                <p className="text-xs text-on-surface-variant italic">"{selectedCandidate.bio}"</p>
              </div>
            )}

            {/* Contact Information Box */}
            <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Email Address:</span>
                <span className="font-mono text-on-surface font-bold">{selectedCandidate.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Direct Phone:</span>
                <span className="font-mono text-on-surface font-bold">{selectedCandidate.phone || "Protected"}</span>
              </div>
              {!selectedCandidate.isUnlocked && (
                <p className="text-[10px] text-primary pt-1">
                  🔒 Contact information is masked. Unlock profile to view full contact details.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {!selectedCandidate.isUnlocked && (
                <button
                  onClick={() => handleUnlockCandidate(selectedCandidate)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">lock_open</span>
                  Unlock Full Profile
                </button>
              )}

              {entitlements?.canRequestContact && (
                <button
                  onClick={() => {
                    setPreviewModalOpen(false);
                    setContactRequestModalOpen(true);
                  }}
                  className="px-4 py-2 bg-secondary text-on-secondary font-bold text-xs rounded-xl hover:bg-secondary-container transition-all"
                >
                  Request Contact Consent
                </button>
              )}

              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-highest transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Exhausted / Upgrade Modal */}
      {trialUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">workspace_premium</span>
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                Trial Sourcing Complete
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                You have reached your 5 free candidate searches. Choose a flexible recruiter subscription plan to unlock unlimited marketplace searches, verified resume downloads, and direct candidate sourcing.
              </p>
            </div>

            <div className="p-3 bg-surface-container-high rounded-2xl text-xs font-semibold text-primary">
              Plans start from only ₹10 / month (Silver Tier)
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setTrialUpgradeModalOpen(false)}
                className="px-4 py-2.5 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-highest transition-all"
              >
                Cancel
              </button>
              <Link
                href="/recruiter/billing"
                className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-md"
              >
                View Subscription Plans
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Contact Request Consent Modal (Diamond/Platinum) */}
      {contactRequestModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-on-surface">
              Request Contact Details from {selectedCandidate.name}
            </h3>
            <p className="text-xs text-on-surface-variant">
              The candidate will receive an in-app notification and can choose to share their direct personal phone, verified email, or both.
            </p>

            <textarea
              rows={3}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Introduce your role and company (optional)..."
              className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setContactRequestModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendContactRequest}
                disabled={actionLoading}
                className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all"
              >
                {actionLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
