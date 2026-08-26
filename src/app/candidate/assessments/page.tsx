"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";

interface CandidateInvitation {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  questionsCount: number;
  companyName: string;
  companyLogo?: string | null;
  jobTitle?: string | null;
  deadline: string;
  isExpired: boolean;
  status: string;
  invitedAt: string;
  submission?: {
    id: string;
    overallScore: number;
    status: string;
    submittedAt: string;
  } | null;
}

interface TestQuestion {
  id: string;
  category: string;
  type: string;
  question: string;
  codeSnippet?: string | null;
  maxScore: number;
  order: number;
}

export default function CandidateAssessmentsPage() {
  const [invitations, setInvitations] = useState<CandidateInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Assessment Test-taking state
  const [activeTest, setActiveTest] = useState<any>(null);
  const [activeQuestions, setActiveQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/candidate/assessments");
      const json = await res.json();
      if (json.success) {
        setInvitations(json.data);
      }
    } catch (err) {
      console.error("Failed to load candidate assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (invitationId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/candidate/assessments/${invitationId}`);
      const json = await res.json();
      if (json.success) {
        setActiveTest(json.data);
        setActiveQuestions(json.data.questions || []);
        setAnswers({});
        setCurrentQuestionIdx(0);
        setIsTakingTest(true);
      } else {
        alert(json.error || "Failed to start assessment");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmitAssessment = async () => {
    if (!confirm("Are you ready to submit your assessment answers for technical evaluation?")) {
      return;
    }

    try {
      setSubmitting(true);
      const formattedAnswers = activeQuestions.map((q) => ({
        questionId: q.id,
        answerText: answers[q.id] || "",
      }));

      const res = await fetch(`/api/candidate/assessments/${activeTest.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmissionResult(json.data);
        setIsTakingTest(false);
        await fetchInvitations();
      } else {
        alert(json.error || "Failed to submit assessment");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = activeQuestions[currentQuestionIdx];
  const progressPercent =
    activeQuestions.length > 0
      ? Math.round(((currentQuestionIdx + 1) / activeQuestions.length) * 100)
      : 0;

  return (
    <ProtectedRoute requiredPortal="seeker">
      <div className="min-h-screen bg-surface flex flex-col">
        <TopAppBar />
        <div className="flex flex-1 pt-16">
          <SidebarNav portal="seeker" />
          <main className="flex-1 lg:pl-[270px] p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
            
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    Candidate Skills Verification
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface">
                  Skills Assessments
                </h1>
                <p className="text-sm text-on-surface-variant max-w-2xl mt-1">
                  Demonstrate your technical expertise to recruiters with structured scenario, knowledge, and system design challenges.
                </p>
              </div>
            </div>

            {/* Test Taking Modal / View */}
            {isTakingTest && activeTest && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                  
                  {/* Test Header */}
                  <div className="p-5 border-b border-outline-variant/20 bg-surface-container-low/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {activeTest.companyName}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {activeTest.durationMinutes} mins timer
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-on-surface">{activeTest.title}</h2>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-primary">
                        Question {currentQuestionIdx + 1} of {activeQuestions.length}
                      </div>
                      <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    {currentQ && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface-variant uppercase tracking-wider">
                            {currentQ.type} • {currentQ.category}
                          </span>
                          <span className="text-xs text-on-surface-variant">Max Score: {currentQ.maxScore} pts</span>
                        </div>

                        <h3 className="text-base font-semibold text-on-surface leading-relaxed">
                          {currentQ.question}
                        </h3>

                        {currentQ.codeSnippet && (
                          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                            <pre>{currentQ.codeSnippet}</pre>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-bold text-on-surface-variant block mb-1.5">
                            Your Technical Explanation / Solution:
                          </label>
                          <textarea
                            rows={8}
                            value={answers[currentQ.id] || ""}
                            onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                            placeholder="Provide your comprehensive reasoning, trade-offs, and technical implementation details..."
                            className="w-full p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary font-sans leading-relaxed"
                          />
                          <p className="text-[11px] text-on-surface-variant mt-1">
                            Tip: Discuss concrete production considerations, architecture trade-offs, and edge cases.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Test Navigation Footer */}
                  <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/30 flex items-center justify-between">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                      className="px-4 py-2 text-sm font-semibold rounded-xl text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {currentQuestionIdx < activeQuestions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                          className="px-5 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90"
                        >
                          Next Challenge
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitAssessment}
                          disabled={submitting}
                          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          {submitting ? "Evaluating..." : "Submit Assessment"}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Submission Result Modal */}
            {submissionResult && (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
                  <span className="material-symbols-outlined">verified</span>
                  Assessment Evaluated Successfully!
                </div>
                <p className="text-sm text-on-surface">
                  Your overall evidence score: <strong className="text-emerald-600 text-base">{submissionResult.overallScore}/100</strong>. Your demonstrated technical skills have been added to your verified candidate profile.
                </p>
                <button
                  onClick={() => setSubmissionResult(null)}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Invitations List */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-on-surface-variant">Loading your skills assessments...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-16 p-8 border border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest/50">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">quiz</span>
                <h3 className="text-lg font-bold text-on-surface">No pending assessments</h3>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-1">
                  When employers invite you to complete a skills evaluation, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((inv) => {
                  const isCompleted = inv.status === "SUBMITTED" || !!inv.submission;

                  return (
                    <div
                      key={inv.id}
                      className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {inv.companyName}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : inv.isExpired
                                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                          >
                            {isCompleted ? "COMPLETED" : inv.status}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-on-surface">{inv.title}</h2>
                        <p className="text-xs text-on-surface-variant">
                          {inv.jobTitle ? `Application: ${inv.jobTitle} • ` : ""}
                          {inv.questionsCount} Challenges • Estimated {inv.durationMinutes} mins • Deadline:{" "}
                          {new Date(inv.deadline).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <div className="text-right">
                            <span className="text-xs text-on-surface-variant block">Score Earned</span>
                            <span className="text-base font-extrabold text-emerald-600">
                              {inv.submission?.overallScore || "—"}/100 ✓
                            </span>
                          </div>
                        ) : inv.isExpired ? (
                          <span className="text-xs text-rose-500 font-semibold">Deadline Expired</span>
                        ) : (
                          <button
                            onClick={() => startAssessment(inv.id)}
                            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold shadow-md hover:bg-primary/90 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                            {inv.status === "IN_PROGRESS" ? "Resume Test" : "Start Test"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
