"use client";

import React, { useState, useEffect } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { StatusBadge } from "@/components/ui/Badge";
import { AIMatchBadge } from "@/components/ui/AIMatchBadge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MobileScrollableChips } from "@/components/ui/MobileInteractionUtils";
import { InterviewScheduleModal, ScheduledInterviewEvent } from "@/components/recruiter/InterviewScheduleModal";
import { StructuredRejectionModal, RejectionFeedbackData } from "@/components/recruiter/StructuredRejectionModal";
import { CandidateTimelineModal, CandidateTimelineEvent } from "@/components/recruiter/CandidateTimelineModal";
import { RecruitmentEngine } from "@/services/recruitmentEngine";

export type ATSPipelineStage = 
  | "ALL"
  | "APPLIED"
  | "REVIEW"
  | "SCREENING"
  | "INTERVIEW"
  | "TECHNICAL"
  | "HR"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

interface CandidateApplication {
  id: string;
  applicantName: string;
  applicantAvatar: string;
  jobTitle: string;
  appliedDate: string;
  stage: ATSPipelineStage;
  aiMatchScore: number;
  resumeScore: number;
  experience: string;
  location: string;
  availability: string;
  salaryExpectation: string;
  skills: string[];
  starRating?: number;
  isDuplicate?: boolean;
  timeline: CandidateTimelineEvent[];
  rejectionFeedback?: RejectionFeedbackData;
  scheduledInterviews?: ScheduledInterviewEvent[];
}

const INITIAL_APPLICANTS: CandidateApplication[] = [
  {
    id: "app-101",
    applicantName: "Sarah Jenkins",
    applicantAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    jobTitle: "Senior Full-Stack Engineer (Next.js & TypeScript)",
    appliedDate: "2 hours ago",
    stage: "APPLIED",
    aiMatchScore: 96,
    resumeScore: 94,
    experience: "7+ years",
    location: "San Francisco, CA (Remote)",
    availability: "Immediate (2 weeks notice)",
    salaryExpectation: "$160k - $180k/yr",
    skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL"],
    starRating: 5,
    timeline: [
      {
        id: "evt-1",
        timestamp: "2 hours ago",
        stage: "APPLIED",
        actorName: "Sarah Jenkins",
        actorRole: "Candidate",
        description: "Application submitted via NextHire AI Direct Apply.",
        badgeType: "APPLIED",
      },
    ],
  },
  {
    id: "app-102",
    applicantName: "David Chen",
    applicantAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    jobTitle: "Lead DevOps & Platform Engineer",
    appliedDate: "1 day ago",
    stage: "REVIEW",
    aiMatchScore: 92,
    resumeScore: 89,
    experience: "9+ years",
    location: "Austin, TX (Hybrid)",
    availability: "1 month notice",
    salaryExpectation: "$185k - $205k/yr",
    skills: ["Kubernetes", "AWS", "Terraform", "Docker", "CI/CD"],
    starRating: 4,
    timeline: [
      {
        id: "evt-2",
        timestamp: "1 day ago",
        stage: "APPLIED",
        actorName: "David Chen",
        actorRole: "Candidate",
        description: "Application received.",
        badgeType: "APPLIED",
      },
      {
        id: "evt-3",
        timestamp: "4 hours ago",
        stage: "REVIEW",
        actorName: "Alex Vance",
        actorRole: "Tech Recruiter",
        description: "Moved candidate to Review stage after ATS match scan.",
        notes: "High Kubernetes experience fits platform requirements.",
        badgeType: "NOTE",
      },
    ],
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
    starRating: 5,
    timeline: [
      {
        id: "evt-4",
        timestamp: "3 days ago",
        stage: "APPLIED",
        actorName: "Elena Rostova",
        actorRole: "Candidate",
        description: "Application submitted.",
        badgeType: "APPLIED",
      },
      {
        id: "evt-5",
        timestamp: "Yesterday",
        stage: "INTERVIEW",
        actorName: "Sarah Jenkins",
        actorRole: "Lead Recruiter",
        description: "Technical interview scheduled via Google Meet.",
        notes: "Focus on LLM fine-tuning and vector indexing.",
        badgeType: "INTERVIEW",
      },
    ],
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
    starRating: 4,
    timeline: [
      {
        id: "evt-6",
        timestamp: "4 days ago",
        stage: "APPLIED",
        actorName: "Marcus Vance",
        actorRole: "Candidate",
        description: "Application received.",
        badgeType: "APPLIED",
      },
      {
        id: "evt-7",
        timestamp: "2 days ago",
        stage: "OFFER",
        actorName: "Sarah Jenkins",
        actorRole: "Lead Recruiter",
        description: "Official offer extended ($150,000 base + equity).",
        badgeType: "OFFER",
      },
    ],
  },
];

export default function RecruiterApplicantsPage() {
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState<any[]>(RecruitmentEngine.getApplications());
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [scheduleModalCandidate, setScheduleModalCandidate] = useState<CandidateApplication | null>(null);
  const [rejectionModalCandidate, setRejectionModalCandidate] = useState<CandidateApplication | null>(null);
  const [timelineModalCandidate, setTimelineModalCandidate] = useState<CandidateApplication | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const unsub = RecruitmentEngine.subscribe(() => {
      setApplicants([...RecruitmentEngine.getApplications()]);
    });
    return unsub;
  }, []);

  const filteredApplicants = applicants.filter(
    (app) => selectedStage === "ALL" || app.stage === selectedStage
  );

  const handleMoveStage = (candidate: CandidateApplication, newStage: ATSPipelineStage) => {
    if (newStage === "REJECTED") {
      setRejectionModalCandidate(candidate);
      return;
    }

    if (newStage === "INTERVIEW") {
      setScheduleModalCandidate(candidate);
      return;
    }

    if (newStage === "HIRED") {
      const ok = RecruitmentEngine.hireCandidate(candidate.id, "Sarah Jenkins");
      if (ok) {
        showToast(`Candidate ${candidate.applicantName} marked as HIRED! Job automatically closed and remaining candidates notified.`, "success");
      }
      return;
    }

    const ok = RecruitmentEngine.updateApplicationStage(candidate.id, newStage as any, "Sarah Jenkins");
    if (ok) {
      showToast(`Updated candidate status to ${newStage}! Candidate notified.`, "success");
    }
  };

  const handleInterviewScheduled = (event: ScheduledInterviewEvent) => {
    if (!scheduleModalCandidate) return;
    const newEvt: CandidateTimelineEvent = {
      id: `evt-int-${Date.now()}`,
      timestamp: "Just now",
      stage: "INTERVIEW",
      actorName: "Sarah Jenkins",
      actorRole: "Lead Recruiter",
      description: `Scheduled ${event.interviewType.replace("_", " ")} via ${event.platform.replace("_", " ")} for ${event.date} at ${event.time}.`,
      notes: event.agendaNotes,
      badgeType: "INTERVIEW",
    };

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === scheduleModalCandidate.id
          ? {
              ...app,
              stage: "INTERVIEW",
              timeline: [newEvt, ...(app.timeline || [])],
              scheduledInterviews: [...(app.scheduledInterviews || []), event],
            }
          : app
      )
    );
  };

  const handleRejectionConfirmed = (feedback: RejectionFeedbackData) => {
    if (!rejectionModalCandidate) return;
    const newEvt: CandidateTimelineEvent = {
      id: `evt-rej-${Date.now()}`,
      timestamp: "Just now",
      stage: "REJECTED",
      actorName: "Sarah Jenkins",
      actorRole: "Lead Recruiter",
      description: `Application closed. Primary reason: ${feedback.reason.replace("_", " ")}.`,
      notes: feedback.recruiterComments,
      badgeType: "REJECTED",
    };

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === rejectionModalCandidate.id
          ? {
              ...app,
              stage: "REJECTED",
              rejectionFeedback: feedback,
              timeline: [newEvt, ...(app.timeline || [])],
            }
          : app
      )
    );
  };

  const handleBulkMove = (newStage: ATSPipelineStage) => {
    if (selectedIds.length === 0) return;
    setApplicants((prev) =>
      prev.map((app) => (selectedIds.includes(app.id) ? { ...app, stage: newStage } : app))
    );
    showToast(`Bulk updated ${selectedIds.length} candidate(s) to ${newStage}!`, "success");
    setSelectedIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredApplicants.map((a) => a.id));
    else setSelectedIds([]);
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

            {/* Enterprise Header Metrics Bar */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">view_kanban</span>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                      Applicant Tracking System (ATS)
                    </h1>
                  </div>
                  <p className="text-on-surface-variant text-xs sm:text-sm">
                    Enterprise candidate recruitment pipeline, automated status workflows, structured feedback, and interview scheduling.
                  </p>
                </div>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/20 space-y-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Total Applicants</span>
                  <div className="text-xl font-bold text-on-surface font-display">{applicants.length}</div>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/20 space-y-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Interviews Scheduled</span>
                  <div className="text-xl font-bold text-purple-700 font-display">
                    {applicants.filter((a) => a.stage === "INTERVIEW" || a.stage === "TECHNICAL" || a.stage === "HR").length}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/20 space-y-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Offers Pending</span>
                  <div className="text-xl font-bold text-emerald-700 font-display">
                    {applicants.filter((a) => a.stage === "OFFER").length}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/20 space-y-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Action Required (SLA)</span>
                  <div className="text-xl font-bold text-amber-700 font-display">
                    {applicants.filter((a) => a.stage === "APPLIED" || a.stage === "REVIEW").length}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/20 space-y-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Hiring Progress</span>
                  <div className="text-xl font-bold text-primary font-display">
                    {Math.round(((applicants.filter((a) => a.stage === "HIRED" || a.stage === "OFFER").length) / Math.max(1, applicants.length)) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* 8-Stage Enterprise ATS Pipeline Chips (Read-only View Filters) */}
            <MobileScrollableChips
              items={[
                { id: "ALL", label: "All Applicants", count: applicants.length, icon: "view_kanban" },
                { id: "APPLIED", label: "Applied", count: applicants.filter((a) => a.stage === "APPLIED").length, icon: "inbox" },
                { id: "REVIEW", label: "Review", count: applicants.filter((a) => a.stage === "REVIEW").length, icon: "rate_review" },
                { id: "SCREENING", label: "Screening", count: applicants.filter((a) => a.stage === "SCREENING").length, icon: "find_in_page" },
                { id: "INTERVIEW", label: "Interview", count: applicants.filter((a) => a.stage === "INTERVIEW").length, icon: "event" },
                { id: "TECHNICAL", label: "Technical", count: applicants.filter((a) => a.stage === "TECHNICAL").length, icon: "code" },
                { id: "HR", label: "HR Round", count: applicants.filter((a) => a.stage === "HR").length, icon: "groups" },
                { id: "OFFER", label: "Offer", count: applicants.filter((a) => a.stage === "OFFER").length, icon: "verified" },
                { id: "HIRED", label: "Hired", count: applicants.filter((a) => a.stage === "HIRED").length, icon: "task_alt" },
                { id: "REJECTED", label: "Rejected", count: applicants.filter((a) => a.stage === "REJECTED").length, icon: "cancel" },
              ]}
              activeId={selectedStage}
              onChange={(id) => setSelectedStage(id)}
              ariaLabel="ATS Candidate Pipeline view filters"
            />

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
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[11px] text-outline">Applied {candidate.appliedDate}</span>
                            <span className="text-amber-500 font-bold text-xs flex items-center">
                              ★ {candidate.starRating || 5}.0
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Match & Stage Badge */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <AIMatchBadge score={candidate.aiMatchScore} size="sm" />
                        <StatusBadge status={candidate.stage} size="sm" />
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
                        <span className="text-outline font-label-md">Salary Expectation:</span>
                        <span className="font-mono font-bold text-primary">{candidate.salaryExpectation}</span>
                      </div>
                    </div>

                    {/* Skill Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(candidate.skills || []).map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Workflow Management */}
                  <div className="pt-3 border-t border-outline-variant/20 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      {/* Timeline Button */}
                      <button
                        onClick={() => setTimelineModalCandidate(candidate)}
                        className="px-3 py-1.5 bg-surface-container text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base text-primary">history</span>
                        <span>View Timeline ({candidate.timeline?.length || 1})</span>
                      </button>

                      {/* Schedule Interview */}
                      <button
                        onClick={() => setScheduleModalCandidate(candidate)}
                        className="px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 border border-purple-600/30 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base">event</span>
                        <span>Schedule Interview</span>
                      </button>

                      {/* Single Update Status Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-outline uppercase">Status:</span>
                        <select
                          value={candidate.stage}
                          onChange={(e) => handleMoveStage(candidate, e.target.value as ATSPipelineStage)}
                          className="px-3 py-1.5 bg-surface border border-outline-variant/40 rounded-xl font-bold text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="REVIEW">Review</option>
                          <option value="SCREENING">Screening</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="TECHNICAL">Technical Round</option>
                          <option value="HR">HR Round</option>
                          <option value="OFFER">Offer Extended</option>
                          <option value="HIRED">Hired</option>
                          <option value="REJECTED">Rejected (Feedback Required)</option>
                        </select>
                      </div>
                    </div>

                    {/* Resume Action Bar */}
                    <div className="p-2 bg-surface-container-low rounded-xl flex items-center justify-between text-[11px] font-bold text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base text-primary">description</span>
                        Candidate Resume
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/documents/download?applicationId=${candidate.id}`);
                              const data = await res.json();
                              if (data.success && data.downloadUrl) {
                                window.open(data.downloadUrl, "_blank");
                              } else {
                                showToast(data.error || `No verified resume found for ${candidate.applicantName}.`, "info");
                              }
                            } catch {
                              showToast("Unable to fetch candidate resume.", "error");
                            }
                          }}
                          className="hover:text-primary transition-colors cursor-pointer"
                        >
                          View / Download
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => {
                            showToast(`AI Summary for ${candidate.applicantName}: Matched ${candidate.skills?.length || 5} core competencies.`, "info");
                          }}
                          className="hover:text-tertiary transition-colors"
                        >
                          AI Summary
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`https://nexthire.ai/candidate/${candidate.id}`);
                            showToast("Candidate profile link copied!", "success");
                          }}
                          className="hover:text-primary transition-colors"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {scheduleModalCandidate && (
        <InterviewScheduleModal
          isOpen={!!scheduleModalCandidate}
          onClose={() => setScheduleModalCandidate(null)}
          candidateName={scheduleModalCandidate.applicantName}
          jobTitle={scheduleModalCandidate.jobTitle}
          onScheduleComplete={handleInterviewScheduled}
        />
      )}

      {/* Mandatory Structured Rejection Modal */}
      {rejectionModalCandidate && (
        <StructuredRejectionModal
          isOpen={!!rejectionModalCandidate}
          onClose={() => setRejectionModalCandidate(null)}
          candidateName={rejectionModalCandidate.applicantName}
          jobTitle={rejectionModalCandidate.jobTitle}
          onConfirmRejection={handleRejectionConfirmed}
        />
      )}

      {/* Candidate Hiring Timeline Modal */}
      {timelineModalCandidate && (
        <CandidateTimelineModal
          isOpen={!!timelineModalCandidate}
          onClose={() => setTimelineModalCandidate(null)}
          candidateName={timelineModalCandidate.applicantName}
          jobTitle={timelineModalCandidate.jobTitle}
          events={timelineModalCandidate.timeline || []}
        />
      )}
    </ProtectedRoute>
  );
}
