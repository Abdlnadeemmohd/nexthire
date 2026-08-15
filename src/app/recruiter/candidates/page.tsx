"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { AIMatchBadge } from "@/components/ui/AIMatchBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { MobileScrollableChips } from "@/components/ui/MobileInteractionUtils";

interface Candidate {
  id: string;
  name: string;
  avatar: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  matchScore: number;
  employmentStatus: "UNEMPLOYED" | "ON_NOTICE_PERIOD" | "SEARCHING_EMPLOYED" | "OPEN_TO_OPPORTUNITIES" | "EMPLOYED";
  availability: string;
  summary: string;
}

const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "cand-1",
    name: "Alex Rivers",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    title: "Senior UX Specialist & Systems Architect",
    location: "San Francisco, CA (Remote)",
    experience: "7+ years",
    skills: ["Figma", "Next.js", "AI UX", "TypeScript", "Tailwind CSS"],
    matchScore: 98,
    employmentStatus: "ON_NOTICE_PERIOD",
    availability: "1-2 Weeks Notice",
    summary: "Passionate product designer and engineer with extensive experience building enterprise SaaS platforms, complex design systems, and AI-driven interfaces.",
  },
  {
    id: "cand-3",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    title: "Principal Machine Learning Engineer",
    location: "New York, NY (Remote)",
    experience: "6+ years",
    skills: ["PyTorch", "Transformers", "LLMs", "Vector DBs", "Python"],
    matchScore: 95,
    employmentStatus: "UNEMPLOYED",
    availability: "Immediate",
    summary: "AI research engineer focusing on large language models, retrieval-augmented generation (RAG), and model fine-tuning for production SaaS products.",
  },
  {
    id: "cand-2",
    name: "Marcus Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    title: "Lead Backend Engineer (Node/Python)",
    location: "Seattle, WA (Hybrid)",
    experience: "8+ years",
    skills: ["Node.js", "Python", "PostgreSQL", "AWS", "GraphQL"],
    matchScore: 94,
    employmentStatus: "SEARCHING_EMPLOYED",
    availability: "2-3 Weeks Notice",
    summary: "Distributed systems engineer skilled in microservices architecture, high-throughput REST/GraphQL APIs, and database optimization.",
  },
  {
    id: "cand-4",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    title: "Full Stack Engineer (React/Go)",
    location: "Austin, TX (On-site)",
    experience: "5+ years",
    skills: ["React", "Go", "Docker", "Kubernetes", "Redis"],
    matchScore: 89,
    employmentStatus: "OPEN_TO_OPPORTUNITIES",
    availability: "1 Month Notice",
    summary: "Versatile engineer with strong foundations in frontend micro-applications and ultra-fast backend microservices written in Golang.",
  },
];

const STATUS_PRIORITY = {
  UNEMPLOYED: 1,
  ON_NOTICE_PERIOD: 2,
  SEARCHING_EMPLOYED: 3,
  OPEN_TO_OPPORTUNITIES: 4,
  EMPLOYED: 5,
};

export default function CandidateSearchPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const filteredCandidates = MOCK_CANDIDATES.filter((cand) => {
    const matchesSearch =
      cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSkill = selectedSkill === "ALL" || cand.skills.includes(selectedSkill);
    const matchesStatus = selectedStatus === "ALL" || cand.employmentStatus === selectedStatus;

    return matchesSearch && matchesSkill && matchesStatus;
  }).sort((a, b) => STATUS_PRIORITY[a.employmentStatus] - STATUS_PRIORITY[b.employmentStatus]);

  const handleContactCandidate = (candName: string) => {
    showToast(`Conversation opened with ${candName}. Redirecting to Messages...`, "success");
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">badge</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                    Recruiter Candidate Search
                  </h1>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">
                  Search, filter, and directly contact top verified talent matching your open job requirements.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 text-xs font-bold text-primary">
                <span className="material-symbols-outlined text-base">stars</span>
                <span>Unlimited Candidate Search Unlocked</span>
              </div>
            </div>

            {/* Quick Skill Filter Chips */}
            <MobileScrollableChips
              items={[
                { id: "ALL", label: "All Skills", count: MOCK_CANDIDATES.length, icon: "badge" },
                { id: "Next.js", label: "Next.js & React", count: MOCK_CANDIDATES.filter((c) => c.skills.includes("Next.js") || c.skills.includes("React")).length, icon: "code" },
                { id: "Figma", label: "Figma & UI", count: MOCK_CANDIDATES.filter((c) => c.skills.includes("Figma") || c.skills.includes("Design Tokens")).length, icon: "palette" },
                { id: "PyTorch", label: "AI & PyTorch", count: MOCK_CANDIDATES.filter((c) => c.skills.includes("PyTorch") || c.skills.includes("Python")).length, icon: "psychology" },
                { id: "Go", label: "Go / Microservices", count: MOCK_CANDIDATES.filter((c) => c.skills.includes("Go") || c.skills.includes("Distributed Systems")).length, icon: "dns" },
              ]}
              activeId={selectedSkill}
              onChange={(id) => setSelectedSkill(id)}
              ariaLabel="Filter candidate profiles by skill"
            />

            {/* Filter Bar */}
            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search input */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by candidate name, role, or skill..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Skill Filter */}
                <div>
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="ALL">All Tech Stack & Skills</option>
                    <option value="Figma">Figma / UI Design</option>
                    <option value="Next.js">Next.js / React</option>
                    <option value="AI UX">AI UX</option>
                    <option value="Node.js">Node.js / Backend</option>
                    <option value="PyTorch">PyTorch / Machine Learning</option>
                    <option value="Go">Go / Golang</option>
                  </select>
                </div>

                {/* Employment Status Filter */}
                <div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="ALL">All Employment Statuses</option>
                    <option value="UNEMPLOYED">Unemployed (Immediate Start)</option>
                    <option value="ON_NOTICE_PERIOD">On Notice Period (1-2 Wks)</option>
                    <option value="SEARCHING_EMPLOYED">Searching but Employed</option>
                    <option value="OPEN_TO_OPPORTUNITIES">Open to Opportunities</option>
                    <option value="EMPLOYED">Employed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Candidate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
              {filteredCandidates.map((cand) => (
                <article
                  key={cand.id}
                  className="surface-card bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 flex flex-col justify-between space-y-5 hover:border-primary/50 hover:shadow-card-hover transition-all shadow-xs"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="w-12 h-12 rounded-xl object-cover border border-outline-variant/40 flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-on-surface">{cand.name}</h3>
                            <VerifiedBadge role="JOB_SEEKER" size="sm" />
                          </div>
                          <p className="text-xs text-on-surface-variant font-medium">{cand.title}</p>
                        </div>
                      </div>

                      <AIMatchBadge score={cand.matchScore} size="sm" />
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed font-normal">
                      {cand.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-outline">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs" aria-hidden="true">location_on</span>
                        {cand.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs" aria-hidden="true">work_history</span>
                        {cand.experience}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs" aria-hidden="true">schedule</span>
                        {cand.availability}
                      </span>
                    </div>

                    {/* Skill tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cand.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-0.5 bg-surface-container-low border border-outline-variant/30 text-[11px] font-medium text-on-surface rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pt-4 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => setSelectedCandidate(cand)}
                      className="w-full sm:flex-1 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold rounded-xl transition-all border border-outline-variant/30 flex items-center justify-center gap-1.5 touch-target focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden="true">visibility</span>
                      View Resume &amp; Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContactCandidate(cand.name)}
                      className="w-full sm:flex-1 py-2.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-on-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs touch-target focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden="true">chat</span>
                      Contact Candidate
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filteredCandidates.length === 0 && (
              <EmptyState
                icon="person_search"
                title="No candidates match your search filters"
                description="Try resetting your active skill filters or broadening your search keywords."
                actionText="Reset All Filters"
                onAction={() => {
                  setSearchQuery("");
                  setSelectedSkill("ALL");
                  setSelectedStatus("ALL");
                }}
              />
            )}
          </main>

          <Footer />
        </div>
      </div>

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCandidate.avatar}
                  alt={selectedCandidate.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/40"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-on-surface">{selectedCandidate.name}</h3>
                    <VerifiedBadge role="JOB_SEEKER" size="sm" />
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">{selectedCandidate.title}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 text-outline hover:text-on-surface rounded-xl"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-on-surface">Candidate Summary</h4>
              <p className="text-on-surface-variant leading-relaxed">{selectedCandidate.summary}</p>

              <h4 className="font-bold text-on-surface pt-2">Key Skills & Proficiencies</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate.skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-xl text-xs">
                    {s}
                  </span>
                ))}
              </div>

              <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
                <span className="font-bold text-on-surface block">Resume Verification Document</span>
                <p className="text-on-surface-variant text-[11px]">
                  Verified PDF resume on file (Last updated July 2026).
                </p>
                <a
                  href="/resumes/Alex_Rivers_Resume_2026.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download Verified Candidate Resume (PDF)
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-surface-container-low text-on-surface font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleContactCandidate(selectedCandidate.name);
                  setSelectedCandidate(null);
                }}
                className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs"
              >
                Start Direct Message
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
