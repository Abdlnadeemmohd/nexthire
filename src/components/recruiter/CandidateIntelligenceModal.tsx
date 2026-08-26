"use client";

import React, { useState, useEffect } from "react";
import { ExplainableCandidateFit } from "@/lib/copilot/types";

interface CandidateIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  fitData: ExplainableCandidateFit | null;
  loading?: boolean;
  onShortlist?: (candidateId: string) => void;
  onMessage?: (candidateId: string) => void;
}

interface EvidenceMatrixRow {
  skill: string;
  resumeClaim: string;
  assessmentEvidence: "STRONGLY_DEMONSTRATED" | "DEMONSTRATED" | "UNVERIFIED" | "REQUIRES_REVIEW" | "CLAIMED";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidenceSnippet?: string;
  gapSnippet?: string;
}

interface TargetedQuestion {
  skill: string;
  question: string;
  rationale: string;
  suggestedFollowUp?: string;
}

export function CandidateIntelligenceModal({
  isOpen,
  onClose,
  fitData,
  loading = false,
  onShortlist,
  onMessage,
}: CandidateIntelligenceModalProps) {
  const [activeTab, setActiveTab] = useState<"fit" | "evidence">("fit");
  const [evidenceData, setEvidenceData] = useState<{
    hasAssessmentData: boolean;
    latestSubmission: any;
    skillVerificationMatrix: EvidenceMatrixRow[];
    recommendedQuestions: TargetedQuestion[];
  } | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && fitData?.candidateId) {
      fetchAssessmentEvidence(fitData.candidateId);
    }
  }, [isOpen, fitData?.candidateId]);

  const fetchAssessmentEvidence = async (candidateId: string) => {
    try {
      setLoadingEvidence(true);
      const res = await fetch(`/api/recruiter/candidates/${candidateId}/assessment-evidence`);
      const json = await res.json();
      if (json.success) {
        setEvidenceData(json.data);
      }
    } catch (err) {
      console.error("Failed to load assessment evidence:", err);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIdx(idx);
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-6 border-b border-outline-variant/20 flex items-start justify-between bg-surface-container-low/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                Candidate Intelligence
              </span>
              {fitData && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    fitData.confidenceLevel === "HIGH"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : fitData.confidenceLevel === "MEDIUM"
                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      : "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                  }`}
                >
                  {fitData.confidenceLevel} Confidence
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-on-surface">
              {loading ? "Analyzing Candidate Fit..." : fitData?.candidateName || "Candidate Analysis"}
            </h2>
            <p className="text-xs text-on-surface-variant">
              Evaluating fit for: <strong className="text-on-surface">{fitData?.jobTitle || "Active Job Opening"}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-outline-variant/20 bg-surface-container-low/20">
          <button
            onClick={() => setActiveTab("fit")}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "fit"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Fit & Keyword Analysis
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "evidence"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Skills Evidence Matrix ({evidenceData?.skillVerificationMatrix?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-on-surface-variant">Cross-referencing verified profile and resume evidence...</p>
            </div>
          ) : activeTab === "fit" && fitData ? (
            <>
              {/* Fit Score Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant font-medium">Overall Match Alignment</span>
                  <div className="text-3xl font-extrabold text-primary flex items-baseline gap-1">
                    {fitData.overallScore}
                    <span className="text-sm font-normal text-on-surface-variant">/ 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-on-surface-variant">Verified Skills Matched</span>
                  <div className="text-sm font-semibold text-on-surface">
                    {fitData.sourceSummary.skillsMatchedCount} of {fitData.sourceSummary.skillsTotalCount} requirements
                  </div>
                </div>
              </div>

              {/* Strong Evidence */}
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                  Strong Evidence ({fitData.strongEvidence.length})
                </h3>
                <div className="space-y-2">
                  {fitData.strongEvidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-container-low/60 border border-emerald-500/15 flex items-start gap-3"
                    >
                      <span className="material-symbols-outlined text-emerald-600 text-[18px] mt-0.5">check_circle</span>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-on-surface">{ev.skill}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">{ev.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Potential Gaps */}
              {fitData.potentialGaps.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
                    Potential Gaps ({fitData.potentialGaps.length})
                  </h3>
                  <div className="space-y-2">
                    {fitData.potentialGaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-container-low/60 border border-amber-500/15 flex items-start gap-3"
                      >
                        <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5">report_problem</span>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-on-surface">{gap.skillOrRequirement}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">{gap.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : activeTab === "evidence" ? (
            /* Skills Evidence Matrix & Verification View */
            loadingEvidence ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-on-surface-variant">Extracting candidate assessment proof...</p>
              </div>
            ) : evidenceData ? (
              <div className="space-y-6">
                {/* Assessment Score Badge if completed */}
                {evidenceData.latestSubmission && (
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-on-surface-variant font-medium">Verified Assessment Score</span>
                      <div className="text-2xl font-black text-emerald-600 flex items-baseline gap-1">
                        {evidenceData.latestSubmission.overallScore}/100
                        <span className="text-xs font-normal text-on-surface-variant">
                          ({evidenceData.latestSubmission.assessmentTitle})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Evaluated & Verified
                    </span>
                  </div>
                )}

                {/* Skills Evidence Matrix Table */}
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">table_chart</span>
                    Resume Claim vs Demonstrated Evidence
                  </h3>
                  <div className="rounded-xl border border-outline-variant/30 overflow-hidden bg-surface-container-lowest">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low/60 text-on-surface-variant uppercase font-bold border-b border-outline-variant/20">
                        <tr>
                          <th className="px-4 py-2.5">Skill</th>
                          <th className="px-4 py-2.5">Resume Claim</th>
                          <th className="px-4 py-2.5">Assessment Evidence</th>
                          <th className="px-4 py-2.5">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/15">
                        {evidenceData.skillVerificationMatrix.map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-low/20">
                            <td className="px-4 py-3 font-bold text-on-surface">{row.skill}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{row.resumeClaim}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  row.assessmentEvidence === "STRONGLY_DEMONSTRATED"
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : row.assessmentEvidence === "DEMONSTRATED"
                                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                    : row.assessmentEvidence === "REQUIRES_REVIEW"
                                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                    : "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                                }`}
                              >
                                {row.assessmentEvidence.replace("_", " ")}
                              </span>
                              {row.gapSnippet && (
                                <div className="text-[10px] text-amber-600 mt-1">{row.gapSnippet}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-on-surface-variant">{row.confidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Targeted Interview Verification Questions */}
                {evidenceData.recommendedQuestions?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">psychology_alt</span>
                      Gap-Targeted Interview Verification Questions
                    </h3>
                    <div className="space-y-2.5">
                      {evidenceData.recommendedQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-primary uppercase">
                              Target Skill: {q.skill}
                            </span>
                            <button
                              onClick={() => handleCopyQuestion(q.question, idx)}
                              className="px-2 py-0.5 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary hover:text-on-primary rounded transition-all flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px]">
                                {copiedQuestionIdx === idx ? "check" : "content_copy"}
                              </span>
                              {copiedQuestionIdx === idx ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <p className="text-xs font-semibold text-on-surface leading-relaxed">{q.question}</p>
                          <p className="text-[11px] text-on-surface-variant italic">Rationale: {q.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                No assessment evidence on record.
              </div>
            )
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-low/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {fitData && (
              <a
                href={`/recruiter/outreach?candidateId=${fitData.candidateId}`}
                className="px-4 py-2 text-xs font-semibold text-tertiary border border-tertiary/20 hover:bg-tertiary/10 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">outgoing_mail</span>
                Prepare AI Outreach
              </a>
            )}
            {onMessage && fitData && (
              <button
                onClick={() => {
                  onMessage(fitData.candidateId);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                Message Candidate
              </button>
            )}
            {onShortlist && fitData && (
              <button
                onClick={() => {
                  onShortlist(fitData.candidateId);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                Shortlist Candidate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
