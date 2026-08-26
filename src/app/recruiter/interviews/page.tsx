"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface InterviewItem {
  id: string;
  round: number;
  scheduledAt: string;
  timezone: string;
  type: string;
  platform: string;
  meetingLink?: string;
  agenda?: string;
  notes?: string;
  status: string;
  applicationId: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    headline?: string;
    location?: string;
  };
  job: {
    id: string;
    title: string;
    companyName: string;
  };
  applicationStatus: string;
  matchScore: number;
  hasPlan: boolean;
  scorecardsCount: number;
  hasCompletedScorecard: boolean;
  isOverdue: boolean;
  isToday: boolean;
  isPast: boolean;
}

interface InterviewMetrics {
  totalCount: number;
  upcomingCount: number;
  todayCount: number;
  awaitingFeedbackCount: number;
  overdueCount: number;
  completedCount: number;
  cancelledCount: number;
}

export default function RecruiterInterviewsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [metrics, setMetrics] = useState<InterviewMetrics>({
    totalCount: 0,
    upcomingCount: 0,
    todayCount: 0,
    awaitingFeedbackCount: 0,
    overdueCount: 0,
    completedCount: 0,
    cancelledCount: 0,
  });

  const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming" | "awaiting_feedback" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer / Modals State
  const [selectedInterview, setSelectedInterview] = useState<InterviewItem | null>(null);
  const [prepDrawerOpen, setPrepDrawerOpen] = useState(false);
  const [prepPlan, setPrepPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Scorecard Modal State
  const [scorecardModalOpen, setScorecardModalOpen] = useState(false);
  const [rawNotesInput, setRawNotesInput] = useState("");
  const [structuringNotes, setStructuringNotes] = useState(false);
  const [structuredNotesResult, setStructuredNotesResult] = useState<any>(null);
  const [scorecardScores, setScorecardScores] = useState<Record<string, { score: number; evidence: string; opinion: string }>>({
    "Technical Depth & Architecture": { score: 4, evidence: "", opinion: "" },
    "Problem Solving & Debugging": { score: 4, evidence: "", opinion: "" },
    "System Design & Scalability": { score: 3, evidence: "", opinion: "" },
    "Communication & Collaboration": { score: 4, evidence: "", opinion: "" },
    "Ownership & Delivery Execution": { score: 4, evidence: "", opinion: "" },
  });
  const [overallRec, setOverallRec] = useState<"STRONG_YES" | "YES" | "MAYBE" | "NO" | "STRONG_NO">("YES");
  const [strongestEvidence, setStrongestEvidence] = useState("");
  const [biggestConcern, setBiggestConcern] = useState("");
  const [submittingScorecard, setSubmittingScorecard] = useState(false);

  // Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionSupport, setDecisionSupport] = useState<any>(null);
  const [loadingDecisionSupport, setLoadingDecisionSupport] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<"ADVANCE" | "HOLD" | "REJECT" | "OFFER">("ADVANCE");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionEvidenceSummary, setDecisionEvidenceSummary] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Comparison Modal State
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparisonMatrix, setComparisonMatrix] = useState<any>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Fetch Interviews
  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("tab", activeTab);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/recruiter/interviews?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInterviews(data.data.interviews);
        setMetrics(data.data.metrics);
      } else {
        showToast(data.error || "Failed to load interviews", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load interviews", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [activeTab, searchQuery]);

  // Open Preparation Plan Drawer
  const handleOpenPrep = async (interview: InterviewItem) => {
    setSelectedInterview(interview);
    setPrepDrawerOpen(true);
    setLoadingPlan(true);
    try {
      // Check existing plan or generate
      const res = await fetch(`/api/recruiter/interviews/${interview.id}/plan`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setPrepPlan(data.data);
      } else {
        showToast(data.error || "Failed to load interview plan", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error generating plan", "error");
    } finally {
      setLoadingPlan(false);
    }
  };

  // Open Scorecard Modal
  const handleOpenScorecard = (interview: InterviewItem) => {
    setSelectedInterview(interview);
    setRawNotesInput("");
    setStructuredNotesResult(null);
    setStrongestEvidence("");
    setBiggestConcern("");
    setScorecardModalOpen(true);
  };

  // Run AI Note Structuring Assistant
  const handleStructureNotes = async () => {
    if (!rawNotesInput.trim()) {
      showToast("Please enter some interviewer notes first", "info");
      return;
    }
    setStructuringNotes(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${selectedInterview?.id}/notes/structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawNotes: rawNotesInput }),
      });
      const data = await res.json();
      if (data.success) {
        setStructuredNotesResult(data.data);
        if (data.data.strengths.length > 0 && !strongestEvidence) {
          setStrongestEvidence(data.data.strengths[0]);
        }
        if (data.data.concerns.length > 0 && !biggestConcern) {
          setBiggestConcern(data.data.concerns[0]);
        }
        showToast("Notes structured into evidence & concerns!", "success");
      } else {
        showToast(data.error || "Failed to structure notes", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error structuring notes", "error");
    } finally {
      setStructuringNotes(false);
    }
  };

  // Submit Scorecard
  const handleSubmitScorecard = async () => {
    if (!selectedInterview) return;
    setSubmittingScorecard(true);
    try {
      const formattedScores = Object.entries(scorecardScores).map(([comp, val]) => ({
        competency: comp,
        score: val.score,
        observedEvidence: val.evidence || undefined,
        interviewerOpinion: val.opinion || undefined,
      }));

      const payload = {
        overallRecommendation: overallRec,
        strongestEvidence,
        biggestConcern,
        rawNotes: rawNotesInput,
        structuredNotes: structuredNotesResult,
        isComplete: true,
        scores: formattedScores,
      };

      const res = await fetch(`/api/recruiter/interviews/${selectedInterview.id}/scorecard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Scorecard submitted successfully! Candidate intelligence updated.", "success");
        setScorecardModalOpen(false);
        fetchInterviews();
      } else {
        showToast(data.error || "Failed to submit scorecard", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error submitting scorecard", "error");
    } finally {
      setSubmittingScorecard(false);
    }
  };

  // Open Decision Support Modal
  const handleOpenDecision = async (interview: InterviewItem) => {
    setSelectedInterview(interview);
    setDecisionModalOpen(true);
    setLoadingDecisionSupport(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interview.id}/decision-support`);
      const data = await res.json();
      if (data.success) {
        setDecisionSupport(data.data);
        setSelectedDecision(data.data.suggestedAction || "ADVANCE");
        setDecisionEvidenceSummary(data.data.evidenceRationale || "");
        setDecisionReason(`Candidate demonstrated solid competencies with ${data.data.scorecardsCount} scorecard(s) consensus.`);
      } else {
        showToast(data.error || "Failed to load decision support", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error loading decision support", "error");
    } finally {
      setLoadingDecisionSupport(false);
    }
  };

  // Confirm Decision
  const handleConfirmDecision = async () => {
    if (!selectedInterview || !decisionReason.trim()) {
      showToast("Please provide a reason for the hiring decision", "error");
      return;
    }
    setSubmittingDecision(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${selectedInterview.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: selectedDecision,
          decisionReason,
          evidenceSummary: decisionEvidenceSummary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Decision '${selectedDecision}' confirmed! Candidate stage updated.`, "success");
        setDecisionModalOpen(false);
        fetchInterviews();
      } else {
        showToast(data.error || "Failed to record decision", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error recording decision", "error");
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Run Comparison
  const handleRunComparison = async () => {
    if (selectedForComparison.length < 2) {
      showToast("Please select at least 2 candidates to compare", "info");
      return;
    }
    setComparisonModalOpen(true);
    setLoadingComparison(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/comparison`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: selectedForComparison }),
      });
      const data = await res.json();
      if (data.success) {
        setComparisonMatrix(data.data);
      } else {
        showToast(data.error || "Failed to generate comparison", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error running comparison", "error");
    } finally {
      setLoadingComparison(false);
    }
  };

  const toggleSelectForComparison = (appId: string) => {
    if (selectedForComparison.includes(appId)) {
      setSelectedForComparison(selectedForComparison.filter(id => id !== appId));
    } else {
      if (selectedForComparison.length >= 5) {
        showToast("Maximum 5 candidates can be compared at once", "info");
        return;
      }
      setSelectedForComparison([...selectedForComparison, appId]);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-6 lg:p-10">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">psychology</span>
              Phase 10 Intelligence
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Evidence-Backed Decisions
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            Interview Intelligence Workspace
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Prepare evidence-grounded interview plans, record structured scorecards, and make auditable hiring decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedForComparison.length >= 2 && (
            <button
              onClick={handleRunComparison}
              className="px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2 animate-fadeIn"
            >
              <span className="material-symbols-outlined text-[18px]">compare</span>
              Compare Candidates ({selectedForComparison.length})
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium">Total Scheduled</span>
            <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
          </div>
          <p className="text-2xl font-black text-on-surface mt-2">{metrics.totalCount}</p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium">Happening Today</span>
            <span className="material-symbols-outlined text-[20px] text-amber-500">today</span>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{metrics.todayCount}</p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium">Upcoming</span>
            <span className="material-symbols-outlined text-[20px] text-blue-500">schedule</span>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{metrics.upcomingCount}</p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium">Awaiting Feedback</span>
            <span className="material-symbols-outlined text-[20px] text-orange-500">rate_review</span>
          </div>
          <p className="text-2xl font-black text-orange-600 mt-2">{metrics.awaitingFeedbackCount}</p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium">Overdue SLA (&gt;24h)</span>
            <span className="material-symbols-outlined text-[20px] text-red-500">warning</span>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">{metrics.overdueCount}</p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium">Completed</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-500">check_circle</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{metrics.completedCount}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "all", label: "All Sessions" },
            { key: "today", label: `Today (${metrics.todayCount})` },
            { key: "upcoming", label: `Upcoming (${metrics.upcomingCount})` },
            { key: "awaiting_feedback", label: `Awaiting Feedback (${metrics.awaitingFeedbackCount})` },
            { key: "completed", label: `Completed (${metrics.completedCount})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate or job..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Interview List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] animate-spin text-primary mb-3">progress_activity</span>
          <p className="text-sm font-semibold">Loading interview intelligence...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] text-primary/40 mb-3">video_camera_front</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">No Interviews in this View</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-4">
            Interviews scheduled through the candidate pipeline or Talent Radar will appear here with automated preparation plans and evaluation tools.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {interviews.map(i => {
            const isSelected = selectedForComparison.includes(i.applicationId);
            return (
              <div
                key={i.id}
                className={`bg-surface-container-low border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-outline-variant/20"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectForComparison(i.applicationId)}
                        className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        title="Select for candidate comparison"
                      />
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Round {i.round} • {i.type}
                      </span>
                    </div>

                    {i.isOverdue ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        Overdue Feedback
                      </span>
                    ) : i.hasCompletedScorecard ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check</span>
                        Scorecard Submitted
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20">
                        {i.status}
                      </span>
                    )}
                  </div>

                  {/* Candidate Overview */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm uppercase">
                      {i.candidate.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">{i.candidate.name}</h3>
                      <p className="text-xs text-on-surface-variant truncate">{i.job.title}</p>
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="bg-surface-container rounded-xl p-3 text-xs text-on-surface-variant space-y-1.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        Date & Time:
                      </span>
                      <strong className="text-on-surface">{new Date(i.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">videocam</span>
                        Platform:
                      </span>
                      <strong className="text-on-surface">{i.platform}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">analytics</span>
                        Match Score:
                      </span>
                      <strong className="text-primary font-bold">{i.matchScore}%</strong>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/10">
                  <button
                    onClick={() => handleOpenPrep(i)}
                    className="px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    title="Generate/view evidence-aware interview preparation plan"
                  >
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    AI Plan
                  </button>

                  <button
                    onClick={() => handleOpenScorecard(i)}
                    className="px-2.5 py-1.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    title="Submit structured competency scorecard"
                  >
                    <span className="material-symbols-outlined text-[14px]">rate_review</span>
                    Scorecard
                  </button>

                  <button
                    onClick={() => handleOpenDecision(i)}
                    className="px-2.5 py-1.5 bg-secondary text-on-secondary hover:opacity-90 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    title="Synthesize decision support and advance candidate"
                  >
                    <span className="material-symbols-outlined text-[14px]">gavel</span>
                    Decide
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Interview Preparation Drawer */}
      {prepDrawerOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="bg-surface-container-lowest border-l border-outline-variant/30 w-full max-w-2xl h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slideInRight">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-6">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Interview Preparation Plan
                  </span>
                  <h2 className="text-xl font-bold text-on-surface mt-1">
                    {selectedInterview.candidate.name} — {selectedInterview.job.title}
                  </h2>
                </div>
                <button
                  onClick={() => setPrepDrawerOpen(false)}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {loadingPlan ? (
                <div className="py-20 text-center">
                  <span className="material-symbols-outlined text-[40px] animate-spin text-primary mb-2">progress_activity</span>
                  <p className="text-xs text-on-surface-variant">Cross-referencing verified skills against job requirements...</p>
                </div>
              ) : prepPlan ? (
                <div className="space-y-6">
                  {/* Skill Status Breakdown */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                      <span className="text-[11px] font-bold text-emerald-700 block mb-1">Verified Skills ({prepPlan.verifiedCompetencies?.length || 0})</span>
                      <p className="text-xs text-emerald-800 font-medium truncate">
                        {prepPlan.verifiedCompetencies?.join(", ") || "None yet"}
                      </p>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <span className="text-[11px] font-bold text-amber-700 block mb-1">Partially Verified ({prepPlan.partiallyVerifiedCompetencies?.length || 0})</span>
                      <p className="text-xs text-amber-800 font-medium truncate">
                        {prepPlan.partiallyVerifiedCompetencies?.join(", ") || "None"}
                      </p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <span className="text-[11px] font-bold text-red-700 block mb-1">Unverified Gaps ({prepPlan.unverifiedGaps?.length || 0})</span>
                      <p className="text-xs text-red-800 font-medium truncate">
                        {prepPlan.unverifiedGaps?.join(", ") || "None"}
                      </p>
                    </div>
                  </div>

                  {/* Objectives */}
                  <div>
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Session Objectives</h4>
                    <ul className="space-y-1.5">
                      {prepPlan.objectives?.map((obj: string, idx: number) => (
                        <li key={idx} className="text-xs text-on-surface-variant flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Grounded Questions */}
                  <div>
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">
                      Evidence-Aware Question Checklist ({prepPlan.questions?.length || 0})
                    </h4>
                    <div className="space-y-4">
                      {prepPlan.questions?.map((q: any, idx: number) => (
                        <div key={idx} className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {q.category} • {q.competency}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              q.verificationStatus === "VERIFIED"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : q.verificationStatus === "PARTIALLY_VERIFIED"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-red-500/10 text-red-600"
                            }`}>
                              {q.verificationStatus}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-on-surface mb-2">{q.question}</p>
                          <p className="text-xs text-primary font-medium mb-3"><strong>Follow-up Probe:</strong> {q.followUp}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-surface-container-low p-2.5 rounded-lg">
                            <div>
                              <strong className="text-emerald-700 block mb-0.5">Evidence to look for:</strong>
                              <span className="text-on-surface-variant">{q.evidenceToLookFor}</span>
                            </div>
                            <div>
                              <strong className="text-red-700 block mb-0.5">Red flags:</strong>
                              <span className="text-on-surface-variant">{q.redFlags}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-outline-variant/20 mt-6 flex justify-end">
              <button
                onClick={() => {
                  setPrepDrawerOpen(false);
                  if (selectedInterview) handleOpenScorecard(selectedInterview);
                }}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow hover:opacity-90"
              >
                Proceed to Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Scorecard Modal */}
      {scorecardModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/40">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Structured Scorecard
                </span>
                <h2 className="text-lg font-bold text-on-surface mt-1">
                  Evaluate: {selectedInterview.candidate.name} ({selectedInterview.job.title})
                </h2>
              </div>
              <button onClick={() => setScorecardModalOpen(false)} className="p-1.5 text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* AI Note Assistant Scratchpad */}
              <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                    <h4 className="text-xs font-bold text-on-surface">AI Note Assistant</h4>
                  </div>
                  <button
                    onClick={handleStructureNotes}
                    disabled={structuringNotes}
                    className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                  >
                    {structuringNotes ? "Structuring..." : "Structure Notes with AI"}
                  </button>
                </div>

                <textarea
                  value={rawNotesInput}
                  onChange={(e) => setRawNotesInput(e.target.value)}
                  placeholder="Paste your raw interview scratch notes here (e.g. Candidate explained database indexes well, but struggled with distributed caching...)"
                  className="w-full h-24 p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary"
                />

                {structuredNotesResult && (
                  <div className="mt-3 p-3 bg-surface-container-low border border-primary/20 rounded-xl text-xs space-y-2">
                    {structuredNotesResult.strengths?.length > 0 && (
                      <div>
                        <strong className="text-emerald-700 block">Identified Strengths:</strong>
                        <ul className="list-disc pl-4 text-on-surface-variant space-y-0.5">
                          {structuredNotesResult.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {structuredNotesResult.concerns?.length > 0 && (
                      <div>
                        <strong className="text-red-700 block">Identified Concerns:</strong>
                        <ul className="list-disc pl-4 text-on-surface-variant space-y-0.5">
                          {structuredNotesResult.concerns.map((c: string, i: number) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Competency 1-5 Scoring */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Competency Ratings (1 to 5 Scale) & Evidence Separation
                </h4>

                {Object.entries(scorecardScores).map(([competency, state]) => (
                  <div key={competency} className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <strong className="text-xs text-on-surface">{competency}</strong>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() =>
                              setScorecardScores({
                                ...scorecardScores,
                                [competency]: { ...state, score: num },
                              })
                            }
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                              state.score === num
                                ? "bg-primary text-on-primary shadow-sm"
                                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-emerald-700 block mb-1">
                          Observed Evidence (Facts demonstrated):
                        </label>
                        <input
                          type="text"
                          value={state.evidence}
                          onChange={(e) =>
                            setScorecardScores({
                              ...scorecardScores,
                              [competency]: { ...state, evidence: e.target.value },
                            })
                          }
                          placeholder="e.g. Explained indexing and B-Tree tradeoffs on live demo"
                          className="w-full px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-amber-700 block mb-1">
                          Interviewer Opinion (Perception):
                        </label>
                        <input
                          type="text"
                          value={state.opinion}
                          onChange={(e) =>
                            setScorecardScores({
                              ...scorecardScores,
                              [competency]: { ...state, opinion: e.target.value },
                            })
                          }
                          placeholder="e.g. Appeared confident and articulated answers clearly"
                          className="w-full px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Recommendation Selector */}
              <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Overall Recommendation</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(["STRONG_YES", "YES", "MAYBE", "NO", "STRONG_NO"] as const).map(rec => (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => setOverallRec(rec)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        overallRec === rec
                          ? rec === "STRONG_YES" || rec === "YES"
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                            : rec === "MAYBE"
                            ? "bg-amber-500 text-white border-amber-600 shadow-md"
                            : "bg-red-500 text-white border-red-600 shadow-md"
                          : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {rec.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strongest Evidence & Concern */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Strongest Supporting Evidence:</label>
                  <input
                    type="text"
                    value={strongestEvidence}
                    onChange={(e) => setStrongestEvidence(e.target.value)}
                    placeholder="Key proof point supporting candidate..."
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Biggest Concern / Risk:</label>
                  <input
                    type="text"
                    value={biggestConcern}
                    onChange={(e) => setBiggestConcern(e.target.value)}
                    placeholder="Potential risk or unverified area..."
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant/20 flex justify-end gap-2 bg-surface-container-low/40">
              <button
                onClick={() => setScorecardModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-highest"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitScorecard}
                disabled={submittingScorecard}
                className="px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50"
              >
                {submittingScorecard ? "Saving Scorecard..." : "Submit Scorecard"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Support & Confirmation Modal */}
      {decisionModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/40">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  Decision Support & Confirmation Gate
                </span>
                <h2 className="text-lg font-bold text-on-surface mt-1">
                  Authoritative Hiring Decision: {selectedInterview.candidate.name}
                </h2>
              </div>
              <button onClick={() => setDecisionModalOpen(false)} className="p-1.5 text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {loadingDecisionSupport ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-[36px] animate-spin text-primary mb-2">progress_activity</span>
                  <p className="text-xs text-on-surface-variant">Synthesizing scorecards and evidence...</p>
                </div>
              ) : decisionSupport ? (
                <>
                  {/* Synthesis Metrics */}
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-on-surface-variant">Average Competency Score</span>
                      <p className="text-2xl font-black text-primary">{decisionSupport.averageCompetencyScore}/5</p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant">Completed Scorecards</span>
                      <p className="text-2xl font-black text-on-surface">{decisionSupport.scorecardsCount}</p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant">Consensus</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 block mt-1">
                        {decisionSupport.overallRecommendationConsensus}
                      </span>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs">
                      <strong className="text-emerald-700 block mb-1">Key Strengths (Pros):</strong>
                      <ul className="list-disc pl-4 text-on-surface-variant space-y-1">
                        {decisionSupport.pros?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-xs">
                      <strong className="text-red-700 block mb-1">Areas of Concern (Cons):</strong>
                      <ul className="list-disc pl-4 text-on-surface-variant space-y-1">
                        {decisionSupport.cons?.length > 0 ? (
                          decisionSupport.cons.map((c: string, i: number) => <li key={i}>{c}</li>)
                        ) : (
                          <li>No critical risks observed</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Decision Selector */}
                  <div>
                    <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
                      Select Action to Confirm (Requires Recruiter Approval):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "ADVANCE", label: "Advance Stage", icon: "trending_up" },
                        { key: "HOLD", label: "Keep on Hold", icon: "pause" },
                        { key: "OFFER", label: "Extend Offer", icon: "celebration" },
                        { key: "REJECT", label: "Reject Candidate", icon: "cancel" },
                      ].map(act => (
                        <button
                          key={act.key}
                          type="button"
                          onClick={() => setSelectedDecision(act.key as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            selectedDecision === act.key
                              ? act.key === "REJECT"
                                ? "bg-red-600 text-white border-red-700 shadow-md"
                                : "bg-primary text-on-primary border-primary shadow-md"
                              : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{act.icon}</span>
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Decision Reason & Confirmation Input */}
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      Recruiter Decision Rationale (Logged to Audit Trail):
                    </label>
                    <textarea
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      placeholder="State the objective reasons supporting this hiring decision..."
                      className="w-full h-20 p-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-outline-variant/20 flex justify-end gap-2 bg-surface-container-low/40">
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-highest"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={submittingDecision || !decisionReason.trim()}
                className="px-5 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                {submittingDecision ? "Confirming..." : "Confirm Decision & Update ATS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Comparison Modal */}
      {comparisonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/40">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  Candidate Comparison Matrix
                </span>
                <h2 className="text-lg font-bold text-on-surface mt-1">
                  Side-by-Side Finalist Evaluation ({comparisonMatrix?.jobTitle || "Role"})
                </h2>
              </div>
              <button onClick={() => setComparisonModalOpen(false)} className="p-1.5 text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {loadingComparison ? (
                <div className="py-16 text-center">
                  <span className="material-symbols-outlined text-[40px] animate-spin text-primary mb-2">progress_activity</span>
                  <p className="text-xs text-on-surface-variant">Generating multi-candidate matrix...</p>
                </div>
              ) : comparisonMatrix ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container">
                        <th className="p-3 font-bold text-on-surface">Evaluation Dimension</th>
                        {comparisonMatrix.candidates.map((c: any) => (
                          <th key={c.candidateId} className="p-3 font-bold text-on-surface">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold uppercase">
                                {c.candidateName.charAt(0)}
                              </div>
                              <span>{c.candidateName}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      <tr>
                        <td className="p-3 font-semibold text-on-surface-variant">Match Score</td>
                        {comparisonMatrix.candidates.map((c: any) => (
                          <td key={c.candidateId} className="p-3 font-bold text-primary">{c.overallMatchScore}%</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-on-surface-variant">Skills Assessment Score</td>
                        {comparisonMatrix.candidates.map((c: any) => (
                          <td key={c.candidateId} className="p-3 font-bold text-on-surface">
                            {c.skillsAssessmentScore ? `${c.skillsAssessmentScore}/100` : "N/A"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-on-surface-variant">Interview Avg Score</td>
                        {comparisonMatrix.candidates.map((c: any) => (
                          <td key={c.candidateId} className="p-3 font-bold text-emerald-700">
                            {c.interviewAverageScore ? `${c.interviewAverageScore}/5` : "In Progress"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-on-surface-variant">Consensus Recommendation</td>
                        {comparisonMatrix.candidates.map((c: any) => (
                          <td key={c.candidateId} className="p-3">
                            <span className="font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {c.recommendationConsensus || "PENDING"}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-on-surface-variant">Key Strengths</td>
                        {comparisonMatrix.candidates.map((c: any) => (
                          <td key={c.candidateId} className="p-3 text-on-surface-variant">
                            {c.keyStrengths?.join(", ") || "—"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-on-surface-variant">Areas of Concern</td>
                        {comparisonMatrix.candidates.map((c: any) => (
                          <td key={c.candidateId} className="p-3 text-red-600 font-medium">
                            {c.keyConcerns?.join(", ") || "None"}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-outline-variant/20 flex justify-end bg-surface-container-low/40">
              <button
                onClick={() => setComparisonModalOpen(false)}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
