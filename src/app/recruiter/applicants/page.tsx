"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface CandidateApplication {
  id: string;
  applicantName: string;
  applicantAvatar: string;
  jobTitle: string;
  appliedDate: string;
  stage: "NEW" | "REVIEWING" | "INTERVIEW" | "OFFER" | "REJECTED";
  aiMatchScore: number;
  resumeScore: number;
  experience: string;
  location: string;
  availability: string;
  salaryExpectation: string;
  skills: string[];
}

const INITIAL_APPLICANTS: CandidateApplication[] = [
  {
    id: "app-101",
    applicantName: "Sarah Jenkins",
    applicantAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    jobTitle: "Senior Full-Stack Engineer (Next.js & TypeScript)",
    appliedDate: "2 hours ago",
    stage: "NEW",
    aiMatchScore: 96,
    resumeScore: 94,
    experience: "7+ years",
    location: "San Francisco, CA (Remote)",
    availability: "Immediate (2 weeks notice)",
    salaryExpectation: "$160k - $180k/yr",
    skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL"],
  },
  {
    id: "app-102",
    applicantName: "David Chen",
    applicantAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    jobTitle: "Lead DevOps & Platform Engineer",
    appliedDate: "1 day ago",
    stage: "REVIEWING",
    aiMatchScore: 92,
    resumeScore: 89,
    experience: "9+ years",
    location: "Austin, TX (Hybrid)",
    availability: "1 month notice",
    salaryExpectation: "$185k - $205k/yr",
    skills: ["Kubernetes", "AWS", "Terraform", "Docker", "CI/CD"],
  },
  {
    id: "app-103",
    applicantName: "Elena Rostova",
    applicantAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    jobTitle: "Staff AI/ML Engineer",
    appliedDate: "3 days ago",
    stage: "INTERVIEW",
    aiMatchScore: 98,
    resumeScore: 97,
    experience: "6+ years",
    location: "Seattle, WA (Remote)",
    availability: "Immediate",
    salaryExpectation: "$190k - $220k/yr",
    skills: ["PyTorch", "Python", "LLMs", "LangChain", "Vector DBs"],
  },
  {
    id: "app-104",
    applicantName: "Marcus Vance",
    applicantAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    jobTitle: "Product Designer (Design Systems)",
    appliedDate: "4 days ago",
    stage: "OFFER",
    aiMatchScore: 91,
    resumeScore: 88,
    experience: "5+ years",
    location: "New York, NY",
    availability: "Immediate",
    salaryExpectation: "$140k - $160k/yr",
    skills: ["Figma", "Design Tokens", "Design Systems", "Prototyping"],
  },
];

export default function RecruiterApplicantsPage() {
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState<CandidateApplication[]>(INITIAL_APPLICANTS);
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null);

  const filteredApplicants = applicants.filter(
    (app) => selectedStage === "ALL" || app.stage === selectedStage
  );

  const handleMoveStage = (id: string, newStage: CandidateApplication["stage"]) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, stage: newStage } : app))
    );
    showToast(`Moved candidate application to ${newStage} stage!`, "success");
    if (selectedCandidate?.id === id) setSelectedCandidate(null);
  };

  const handleScheduleInterview = (candidateName: string) => {
    showToast(`Opening calendar invite scheduler for ${candidateName}...`, "info");
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Candidate Pipeline" }]} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">view_kanban</span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Candidate Recruitment Pipeline
                </h1>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">
                Review AI-matched candidate applications, schedule technical interviews, and advance hiring stages.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-primary-container text-primary font-bold text-xs rounded-full">
                {applicants.length} Total Applicants
              </span>
            </div>
          </div>

          {/* Stage Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-outline-variant/20 font-label-md text-xs">
            {["ALL", "NEW", "REVIEWING", "INTERVIEW", "OFFER", "REJECTED"].map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedStage === stage
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {stage === "ALL" ? "All Applicants" : stage} (
                {stage === "ALL" ? applicants.length : applicants.filter((a) => a.stage === stage).length})
              </button>
            ))}
          </div>

          {/* Candidate Card Pipeline List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredApplicants.map((candidate) => (
              <div
                key={candidate.id}
                className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Candidate Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={candidate.applicantAvatar}
                        alt={candidate.applicantName}
                        className="w-12 h-12 rounded-2xl object-cover border border-outline-variant/30 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-base font-bold text-on-surface truncate">
                            {candidate.applicantName}
                          </h3>
                          <VerifiedBadge role="JOB_SEEKER" size="sm" showIconOnly />
                        </div>
                        <p className="text-xs text-primary font-bold truncate">{candidate.jobTitle}</p>
                        <span className="text-[11px] text-outline">Applied {candidate.appliedDate}</span>
                      </div>
                    </div>

                    {/* AI Match & Stage Badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="px-2.5 py-1 bg-tertiary-container/30 border border-tertiary/20 text-tertiary text-xs font-bold rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                        {candidate.aiMatchScore}% AI Match
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          candidate.stage === "OFFER"
                            ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                            : candidate.stage === "INTERVIEW"
                            ? "bg-purple-500/15 text-purple-700 border border-purple-500/30"
                            : candidate.stage === "REJECTED"
                            ? "bg-rose-500/15 text-rose-700 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                        }`}
                      >
                        {candidate.stage}
                      </span>
                    </div>
                  </div>

                  {/* Candidate Specs Card */}
                  <div className="bg-surface-container-low/60 rounded-2xl p-3 text-xs space-y-2 border border-outline-variant/20">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-outline font-label-md">Experience & Location:</span>
                      <span className="font-bold text-on-surface">{candidate.experience} • {candidate.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-outline font-label-md">Availability:</span>
                      <span className="font-bold text-on-surface">{candidate.availability}</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-outline font-label-md">Salary Expectations:</span>
                      <span className="font-mono font-bold text-primary">{candidate.salaryExpectation}</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-outline font-label-md">AI Resume Match Score:</span>
                      <span className="font-mono font-bold text-tertiary">{candidate.resumeScore}/100</span>
                    </div>
                  </div>

                  {/* Candidate Skill Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {candidate.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Candidate Action Buttons */}
                <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCandidate(candidate)}
                    className="px-3.5 py-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">description</span>
                    View Resume
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleScheduleInterview(candidate.applicantName)}
                      className="px-3.5 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 border border-purple-600/30 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base">event</span>
                      Interview
                    </button>
                    <button
                      onClick={() => handleMoveStage(candidate.id, "INTERVIEW")}
                      className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs"
                    >
                      Advance Stage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Candidate Resume Preview Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCandidate.applicantAvatar}
                  alt={selectedCandidate.applicantName}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    {selectedCandidate.applicantName}
                  </h3>
                  <p className="text-xs text-primary font-bold">{selectedCandidate.jobTitle}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1 text-on-surface-variant hover:bg-surface-container rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-surface-container-low rounded-2xl space-y-2">
                <span className="font-bold text-on-surface uppercase tracking-wider text-[10px] block text-outline">
                  Executive Resume Abstract & AI Match Summary
                </span>
                <p className="text-on-surface-variant leading-relaxed">
                  Highly skilled software engineer with {selectedCandidate.experience} of industry experience building cloud-native microservices and frontend web applications. Demonstrated expertise in {selectedCandidate.skills.join(", ")}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/20">
              <button
                onClick={() => handleMoveStage(selectedCandidate.id, "REJECTED")}
                className="px-4 py-2 bg-rose-500/10 text-rose-700 border border-rose-500/30 text-xs font-bold rounded-xl hover:bg-rose-500/20"
              >
                Reject Candidate
              </button>
              <button
                onClick={() => handleMoveStage(selectedCandidate.id, "OFFER")}
                className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
              >
                Extend Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
