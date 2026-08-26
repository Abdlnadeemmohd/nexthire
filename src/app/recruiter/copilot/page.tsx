"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { CandidateIntelligenceModal } from "@/components/recruiter/CandidateIntelligenceModal";
import {
  CopilotChatResponse,
  ExplainableCandidateFit,
  RecruiterActionProposal,
} from "@/lib/copilot/types";

interface MessageItem {
  id: string;
  sender: "USER" | "COPILOT";
  text: string;
  timestamp: string;
  data?: CopilotChatResponse["data"];
  suggestions?: string[];
}

export default function RecruiterCopilotPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-1",
      sender: "COPILOT",
      text: "Hello! I am your NextHire Recruiter Copilot. I analyze your real PostgreSQL pipeline, candidate marketplace, and application stages to provide explainable hiring intelligence and safe recruiting actions.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: [
        "Find senior backend engineers with 5+ years experience",
        "Why is this job not progressing?",
        "Show me candidates requiring action",
        "How many candidates are currently in my pipeline?",
        "Find previous finalists who match this opening",
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFit, setSelectedFit] = useState<ExplainableCandidateFit | null>(null);
  const [fitModalOpen, setFitModalOpen] = useState(false);
  const [fitLoading, setFitLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<RecruiterActionProposal | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendPrompt = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "USER",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/recruiter/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to communicate with Copilot");
      }

      const copilotMsg: MessageItem = {
        id: `copilot-${Date.now()}`,
        sender: "COPILOT",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        data: data.data,
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, copilotMsg]);

      if (data.data?.actionProposal) {
        setPendingAction(data.data.actionProposal);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to get response", "error");
      setMessages((prev) => [
        ...prev,
        {
          id: `copilot-err-${Date.now()}`,
          sender: "COPILOT",
          text: `⚠ Error: ${err.message || "Unable to reach recruiter services. Please try again."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectFit = async (candidateId: string, jobId?: string) => {
    setFitModalOpen(true);
    setFitLoading(true);
    try {
      const res = await fetch("/api/recruiter/copilot/explain-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, jobId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to evaluate candidate fit");
      }
      setSelectedFit(data.fitAnalysis);
    } catch (err: any) {
      showToast(err.message || "Failed to load candidate intelligence", "error");
      setFitModalOpen(false);
    } finally {
      setFitLoading(false);
    }
  };

  const handleExecuteConfirmedAction = async (confirmed: boolean) => {
    if (!pendingAction) return;
    if (!confirmed) {
      setPendingAction(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `cancelled-${Date.now()}`,
          sender: "COPILOT",
          text: "Action cancelled by recruiter.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/recruiter/copilot/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: pendingAction, confirmed: true }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to execute action");
      }

      showToast(data.message, "success");
      setMessages((prev) => [
        ...prev,
        {
          id: `confirmed-${Date.now()}`,
          sender: "COPILOT",
          text: `✅ ${data.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setPendingAction(null);
    } catch (err: any) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <div className="min-h-screen bg-surface flex flex-col">
        <TopAppBar />
        <div className="flex flex-1 pt-16">
          <SidebarNav portal="recruiter" />
          <main className="flex-1 lg:pl-[270px] flex flex-col bg-surface min-h-[calc(100vh-4rem)]">
            <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-4">
              <Breadcrumbs
                items={[
                  { label: "Dashboard", href: "/recruiter" },
                  { label: "Recruiter Copilot", href: "/recruiter/copilot" },
                ]}
              />

              {/* Copilot Header */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-on-surface flex items-center gap-2">
                      NextHire Recruiter Copilot
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Grounded AI
                      </span>
                    </h1>
                    <p className="text-xs text-on-surface-variant">
                      Real PostgreSQL data • Explainable matching • Safe human-in-the-loop actions
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMessages([
                      {
                        id: "welcome-reset",
                        sender: "COPILOT",
                        text: "Conversation refreshed. How can I assist with your recruitment pipeline today?",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        suggestions: [
                          "Find senior backend engineers with 5+ years experience",
                          "Why is this job not progressing?",
                          "Show me candidates requiring action",
                        ],
                      },
                    ])
                  }
                  className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-outline-variant/30 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  Clear History
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-6 min-h-[480px]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"} space-y-2`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <span className="font-semibold">{msg.sender === "USER" ? "You" : "NextHire Copilot"}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.sender === "USER"
                          ? "bg-primary text-on-primary rounded-tr-none shadow-md"
                          : "bg-surface-container-low text-on-surface rounded-tl-none border border-outline-variant/30"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Candidate Results Widget */}
                      {msg.data?.candidates && msg.data.candidates.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-3">
                          <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
                            Matched Candidates ({msg.data.candidates.length})
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {msg.data.candidates.map((cand) => (
                              <div
                                key={cand.id}
                                className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors"
                              >
                                <div>
                                  <div className="flex items-start justify-between">
                                    <div className="text-xs font-bold text-on-surface">{cand.name}</div>
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                      {cand.matchScore}% Fit
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-on-surface-variant truncate mt-0.5">
                                    {cand.headline}
                                  </div>
                                  <div className="text-[10px] text-on-surface-variant/80 flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                                    {cand.location || "Remote"}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {cand.skills.slice(0, 3).map((s, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleInspectFit(cand.id)}
                                  className="w-full py-1.5 text-[11px] font-semibold text-primary border border-primary/20 hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                                  Explain Fit & Evidence
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pipeline Diagnosis Widget */}
                      {msg.data?.pipelineDiagnosis && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-3">
                          <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
                            Pipeline Funnel Conversion
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-center">
                              <div className="text-xs text-on-surface-variant">Applications</div>
                              <div className="text-lg font-bold text-on-surface">{msg.data.pipelineDiagnosis.totalApplications}</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-center">
                              <div className="text-xs text-on-surface-variant">Screened</div>
                              <div className="text-lg font-bold text-primary">{msg.data.pipelineDiagnosis.conversionRates.screenToShortlist}%</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-center">
                              <div className="text-xs text-on-surface-variant">Interviewed</div>
                              <div className="text-lg font-bold text-emerald-600">{msg.data.pipelineDiagnosis.conversionRates.shortlistToInterview}%</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-center">
                              <div className="text-xs text-on-surface-variant">Offers</div>
                              <div className="text-lg font-bold text-on-surface">{msg.data.pipelineDiagnosis.conversionRates.overallOfferRate}%</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rediscovered Candidates Widget */}
                      {msg.data?.rediscoveredCandidates && msg.data.rediscoveredCandidates.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2">
                          <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-amber-500">history_edu</span>
                            Past Applicants & Silver Medalists ({msg.data.rediscoveredCandidates.length})
                          </div>
                          <div className="space-y-2">
                            {msg.data.rediscoveredCandidates.map((cand) => (
                              <div
                                key={cand.candidateId}
                                className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-on-surface">{cand.name}</span>
                                    {cand.isSilverMedalist && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                        Silver Medalist
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-on-surface-variant">
                                    Applied to: {cand.previousJobTitle} ({cand.appliedDate})
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleInspectFit(cand.candidateId)}
                                  className="px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                  View Fit
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Needs Attention Tasks Widget */}
                      {msg.data?.needsAttentionTasks && msg.data.needsAttentionTasks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2">
                          <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-rose-500">notification_important</span>
                            Immediate Action Required
                          </div>
                          <div className="space-y-2">
                            {msg.data.needsAttentionTasks.map((t) => (
                              <div
                                key={t.id}
                                className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between"
                              >
                                <div>
                                  <div className="text-xs font-bold text-on-surface">{t.title}</div>
                                  <div className="text-[11px] text-on-surface-variant">{t.description}</div>
                                </div>
                                <Link
                                  href={t.ctaUrl}
                                  className="px-3 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors shrink-0"
                                >
                                  {t.ctaText}
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Confirmation Banner */}
                    {pendingAction && msg.data?.actionProposal && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 w-full max-w-2xl animate-scaleUp">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-amber-600 text-[20px] mt-0.5">help</span>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-on-surface">Confirmation Required</div>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {pendingAction.confirmationMessage}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                disabled={actionLoading}
                                onClick={() => handleExecuteConfirmedAction(true)}
                                className="px-4 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
                              >
                                {actionLoading ? "Processing..." : "Confirm Action"}
                              </button>
                              <button
                                disabled={actionLoading}
                                onClick={() => handleExecuteConfirmedAction(false)}
                                className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Suggestion Chips */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendPrompt(sug)}
                            className="px-3 py-1 rounded-full text-xs bg-surface-container-high text-on-surface-variant hover:text-primary hover:border-primary/30 border border-transparent transition-all"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-start space-y-2">
                    <div className="p-4 rounded-2xl rounded-tl-none bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Analyzing PostgreSQL hiring records...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder="Ask Copilot about candidates, job bottlenecks, SLAs, or search with natural language..."
                  className="flex-1 bg-transparent border-none text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none px-3"
                  disabled={loading}
                />

                <button
                  onClick={() => handleSendPrompt()}
                  disabled={!inputPrompt.trim() || loading}
                  className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-xs hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Send</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
            <Footer />
          </main>
        </div>

        {/* Candidate Intelligence Modal */}
        <CandidateIntelligenceModal
          isOpen={fitModalOpen}
          onClose={() => setFitModalOpen(false)}
          fitData={selectedFit}
          loading={fitLoading}
          onShortlist={(candId) => {
            handleSendPrompt(`Shortlist candidate ${candId}`);
          }}
          onMessage={(candId) => {
            showToast("Opening candidate messaging thread...", "info");
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
