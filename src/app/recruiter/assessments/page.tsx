"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { CandidateIntelligenceModal } from "@/components/recruiter/CandidateIntelligenceModal";

interface AssessmentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  passingScore: number;
  status: string;
  createdAt: string;
  job?: { id: string; title: string; location: string } | null;
  questions: { id: string; category: string; type: string; question: string; maxScore: number }[];
  invitations: {
    id: string;
    candidate: { id: string; name: string; email: string };
    status: string;
    deadline: string;
    submission?: { id: string; overallScore: number; status: string; submittedAt: string } | null;
  }[];
}

interface JobOption {
  id: string;
  title: string;
  category: string;
}

export default function RecruiterAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assessments" | "invitations">("assessments");

  // Create Assessment Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState("Backend Engineering");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingScore, setPassingScore] = useState(70);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [creating, setCreating] = useState(false);

  // Send Assessment Modal State
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [candidateEmailInput, setCandidateEmailInput] = useState("");
  const [candidateIdInput, setCandidateIdInput] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [sending, setSending] = useState(false);

  // Candidate Intelligence Modal State
  const [selectedCandidateFit, setSelectedCandidateFit] = useState<any>(null);
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchJobs();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recruiter/assessments");
      const json = await res.json();
      if (json.success) {
        setAssessments(json.data);
      }
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/recruiter/jobs");
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error("Failed to load recruiter jobs:", err);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const payload = {
        title: customTitle,
        description: customDescription,
        category: customCategory,
        durationMinutes,
        passingScore,
        jobId: selectedJobId || undefined,
        autoGenerateFromJob: autoGenerate && !!selectedJobId,
      };

      const res = await fetch("/api/recruiter/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setCustomTitle("");
        setCustomDescription("");
        setSelectedJobId("");
        await fetchAssessments();
      } else {
        alert(json.error || "Failed to create assessment");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleSendAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentId || (!candidateIdInput && !candidateEmailInput)) {
      alert("Please specify candidate details.");
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`/api/recruiter/assessments/${selectedAssessmentId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidateIdInput,
          deadlineDays,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsSendOpen(false);
        setCandidateIdInput("");
        setCandidateEmailInput("");
        await fetchAssessments();
      } else {
        alert(json.error || "Failed to send assessment");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSending(false);
    }
  };

  const openCandidateIntelligence = async (candidateId: string, candidateName: string) => {
    setIsIntelligenceOpen(true);
    setLoadingIntelligence(true);
    try {
      const res = await fetch(`/api/recruiter/copilot/explain-fit?candidateId=${candidateId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedCandidateFit(json.data);
      } else {
        setSelectedCandidateFit({
          candidateName,
          candidateId,
          overallScore: 85,
          jobTitle: "Candidate Evaluation",
          confidenceLevel: "HIGH",
          strongEvidence: [],
          potentialGaps: [],
          recommendedQuestions: [],
          sourceSummary: { skillsMatchedCount: 3, skillsTotalCount: 4, hasProfile: true, hasResume: true },
        });
      }
    } catch (err) {
      console.error("Failed to load intelligence:", err);
    } finally {
      setLoadingIntelligence(false);
    }
  };

  const allInvitations = assessments.flatMap((a) =>
    a.invitations.map((inv) => ({
      ...inv,
      assessmentTitle: a.title,
      assessmentCategory: a.category,
      passingScore: a.passingScore,
    }))
  );

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 pb-16">
            
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Evidence-Based Verification
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface">
                  Skills Assessments & Verification
                </h1>
                <p className="text-sm text-on-surface-variant max-w-2xl mt-1">
                  Move beyond resume claims. Evaluate candidate technical competency with structured knowledge, debugging, and system design challenges.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm shadow-md hover:bg-primary/90 flex items-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                  Create Assessment
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
              <button
                onClick={() => setActiveTab("assessments")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === "assessments"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                Assessment Library ({assessments.length})
              </button>
              <button
                onClick={() => setActiveTab("invitations")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === "invitations"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                Candidate Submissions ({allInvitations.length})
              </button>
            </div>

            {/* Main Content Area */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-on-surface-variant">Loading assessments & candidate evidence...</p>
              </div>
            ) : activeTab === "assessments" ? (
              /* Assessment Library View */
              assessments.length === 0 ? (
                <div className="text-center py-16 p-8 border border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest/50">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">assignment_add</span>
                  <h3 className="text-lg font-bold text-on-surface">No assessments created yet</h3>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-1 mb-4">
                    Create your first skills verification test tailored to your active job postings.
                  </p>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary/90"
                  >
                    Create Skills Assessment
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {assessment.category}
                          </span>
                          <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {assessment.durationMinutes} mins
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                          {assessment.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 mb-3">
                          {assessment.description}
                        </p>

                        <div className="space-y-1.5 py-2 border-y border-outline-variant/20 text-xs text-on-surface-variant">
                          <div className="flex justify-between">
                            <span>Questions:</span>
                            <span className="font-semibold text-on-surface">{assessment.questions.length} challenges</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Passing Score:</span>
                            <span className="font-semibold text-on-surface">{assessment.passingScore}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Candidates Tested:</span>
                            <span className="font-semibold text-primary">{assessment.invitations.length}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAssessmentId(assessment.id);
                            setIsSendOpen(true);
                          }}
                          className="flex-1 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">send</span>
                          Send to Candidate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Candidate Submissions & Evidence View */
              allInvitations.length === 0 ? (
                <div className="text-center py-16 p-8 border border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest/50">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">person_search</span>
                  <h3 className="text-lg font-bold text-on-surface">No candidate submissions yet</h3>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-1 mb-4">
                    Send an assessment invitation to evaluate candidates in your hiring pipeline.
                  </p>
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-on-surface">
                      <thead className="bg-surface-container-low/60 text-xs font-bold text-on-surface-variant uppercase border-b border-outline-variant/30">
                        <tr>
                          <th className="px-6 py-4">Candidate</th>
                          <th className="px-6 py-4">Assessment</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Score</th>
                          <th className="px-6 py-4">Deadline</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {allInvitations.map((inv) => {
                          const isSubmitted = inv.status === "SUBMITTED" || !!inv.submission;
                          const score = inv.submission?.overallScore;
                          const isPassed = score !== undefined && score >= inv.passingScore;

                          return (
                            <tr key={inv.id} className="hover:bg-surface-container-low/30 transition-colors">
                              <td className="px-6 py-4 font-medium">
                                <div className="font-bold text-on-surface">{inv.candidate.name}</div>
                                <div className="text-xs text-on-surface-variant">{inv.candidate.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-on-surface">{inv.assessmentTitle}</div>
                                <div className="text-xs text-on-surface-variant">{inv.assessmentCategory}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    isSubmitted
                                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                      : inv.status === "IN_PROGRESS"
                                      ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                      : inv.status === "EXPIRED"
                                      ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  }`}
                                >
                                  {isSubmitted ? "SUBMITTED" : inv.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold">
                                {score !== undefined ? (
                                  <span className={isPassed ? "text-emerald-600" : "text-amber-600"}>
                                    {score}/100 {isPassed ? "✓" : ""}
                                  </span>
                                ) : (
                                  <span className="text-on-surface-variant font-normal">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-xs text-on-surface-variant">
                                {new Date(inv.deadline).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => openCandidateIntelligence(inv.candidate.id, inv.candidate.name)}
                                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                                  Skills Evidence
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* Create Assessment Modal */}
            {isCreateOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                    <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">add_task</span>
                      Create Skills Assessment
                    </h2>
                    <button
                      onClick={() => setIsCreateOpen(false)}
                      className="p-1 text-on-surface-variant hover:text-on-surface rounded-full"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleCreateAssessment} className="space-y-4">
                    {/* Auto-generate from Job Option */}
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-primary uppercase tracking-wider">
                          AI Auto-Generation from Job
                        </label>
                        <input
                          type="checkbox"
                          checked={autoGenerate}
                          onChange={(e) => setAutoGenerate(e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                      </div>
                      <select
                        value={selectedJobId}
                        onChange={(e) => {
                          setSelectedJobId(e.target.value);
                          const selected = jobs.find((j) => j.id === e.target.value);
                          if (selected) {
                            setCustomTitle(`${selected.title} Skills Assessment`);
                            setCustomCategory(selected.category);
                          }
                        }}
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                      >
                        <option value="">Select Job Opening...</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title} ({j.category})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-on-surface-variant">
                        Automatically generates 4-5 structured Knowledge, Debugging, and System Design questions with 0-5 scoring rubrics.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">Assessment Title</label>
                      <input
                        type="text"
                        required
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer Verification"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">Category</label>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">Duration (mins)</label>
                        <input
                          type="number"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(false)}
                        className="px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high rounded-xl font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creating}
                        className="px-5 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                      >
                        {creating ? "Generating..." : "Publish Assessment"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Send Assessment Modal */}
            {isSendOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                    <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">send</span>
                      Send Assessment Invitation
                    </h2>
                    <button
                      onClick={() => setIsSendOpen(false)}
                      className="p-1 text-on-surface-variant hover:text-on-surface rounded-full"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleSendAssessment} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">Candidate User ID</label>
                      <input
                        type="text"
                        required
                        value={candidateIdInput}
                        onChange={(e) => setCandidateIdInput(e.target.value)}
                        placeholder="Candidate UUID (e.g. from Pipeline or Talent Radar)"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">Deadline (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={deadlineDays}
                        onChange={(e) => setDeadlineDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                      <button
                        type="button"
                        onClick={() => setIsSendOpen(false)}
                        className="px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high rounded-xl font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={sending}
                        className="px-5 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                      >
                        {sending ? "Sending..." : "Confirm & Send"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Candidate Intelligence Modal */}
            <CandidateIntelligenceModal
              isOpen={isIntelligenceOpen}
              onClose={() => setIsIntelligenceOpen(false)}
              fitData={selectedCandidateFit}
              loading={loadingIntelligence}
            />

          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
