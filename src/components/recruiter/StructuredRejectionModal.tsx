"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface RejectionFeedbackData {
  reason: "MISSING_EXPERIENCE" | "MISSING_SKILLS" | "SALARY_MISMATCH" | "TECHNICAL_PERFORMANCE" | "CULTURE_FIT" | "ROLE_CLOSED" | "OTHER";
  recruiterComments: string;
  missingSkills: string[];
  suggestedCertifications: string[];
  resumeImprovementAdvice: string;
  interviewImprovementAdvice: string;
  reapplicationEligibilityMonths: number;
  sendEmailNotification: boolean;
  createdAt: string;
}

interface StructuredRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  jobTitle: string;
  onConfirmRejection: (feedback: RejectionFeedbackData) => void;
}

export function StructuredRejectionModal({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  onConfirmRejection,
}: StructuredRejectionModalProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState<RejectionFeedbackData["reason"]>("MISSING_SKILLS");
  const [recruiterComments, setRecruiterComments] = useState(
    "Candidate demonstrated strong core problem solving skills, but lacks hands-on experience with production Kubernetes cluster orchestration and distributed GraphQL APIs."
  );
  const [missingSkillsInput, setMissingSkillsInput] = useState("Kubernetes, GraphQL, Distributed Systems");
  const [suggestedCertificationsInput, setSuggestedCertificationsInput] = useState("CKAD (Certified Kubernetes Application Developer)");
  const [resumeImprovementAdvice, setResumeImprovementAdvice] = useState(
    "Add more quantified metrics detailing team size, infrastructure scale, and latency improvements."
  );
  const [interviewImprovementAdvice, setInterviewImprovementAdvice] = useState(
    "Practice system architecture whiteboard exercises focusing on failover strategies."
  );
  const [reapplicationEligibilityMonths, setReapplicationEligibilityMonths] = useState(6);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recruiterComments.trim() || recruiterComments.trim().length < 20) {
      showToast("Mandatory field: Recruiter constructive feedback comments must be at least 20 characters.", "error");
      return;
    }

    if (!resumeImprovementAdvice.trim()) {
      showToast("Mandatory field: Please provide resume improvement advice.", "error");
      return;
    }

    const missingSkills = missingSkillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const suggestedCertifications = suggestedCertificationsInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const feedback: RejectionFeedbackData = {
      reason,
      recruiterComments,
      missingSkills,
      suggestedCertifications,
      resumeImprovementAdvice,
      interviewImprovementAdvice,
      reapplicationEligibilityMonths,
      sendEmailNotification,
      createdAt: new Date().toISOString(),
    };

    onConfirmRejection(feedback);
    showToast(`Constructive rejection feedback logged for ${candidateName}. Candidate notified.`, "success");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mandatory Rejection Feedback: ${candidateName}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body-md">
        <div className="p-3 bg-error-container/20 border border-error-container/40 rounded-2xl flex items-center justify-between">
          <div>
            <span className="font-bold text-on-surface text-sm">{candidateName}</span>
            <p className="text-on-surface-variant text-[11px]">{jobTitle}</p>
          </div>
          <span className="px-3 py-1 bg-error-container text-on-error-container font-bold rounded-full uppercase text-[10px]">
            Rejection Workflow
          </span>
        </div>

        <p className="text-on-surface-variant leading-relaxed text-[11px]">
          NextHire requires structured, constructive feedback for every rejected applicant. This feedback will be formatted into a career growth guide for the candidate.
        </p>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Primary Rejection Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as any)}
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="MISSING_SKILLS">Missing Key Technical Competencies</option>
            <option value="MISSING_EXPERIENCE">Insufficient Years of Senior Experience</option>
            <option value="TECHNICAL_PERFORMANCE">Technical Coding / Architecture Assessment Performance</option>
            <option value="SALARY_MISMATCH">Salary Expectation Mismatch</option>
            <option value="CULTURE_FIT">Cross-functional Team & Culture Fit Alignment</option>
            <option value="ROLE_CLOSED">Position Filled / Role Closed</option>
            <option value="OTHER">Other Specific Feedback</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Recruiter Detailed Feedback & Comments * (Min 20 characters)
          </label>
          <textarea
            rows={3}
            value={recruiterComments}
            onChange={(e) => setRecruiterComments(e.target.value)}
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Explain constructive reasons for non-selection..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Missing Technical Skills (Comma-separated)
            </label>
            <input
              type="text"
              value={missingSkillsInput}
              onChange={(e) => setMissingSkillsInput(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Kubernetes, GraphQL, System Architecture"
            />
          </div>

          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Recommended Certifications / Courses
            </label>
            <input
              type="text"
              value={suggestedCertificationsInput}
              onChange={(e) => setSuggestedCertificationsInput(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. AWS Certified Solutions Architect"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Resume Improvement Advice *
          </label>
          <textarea
            rows={2}
            value={resumeImprovementAdvice}
            onChange={(e) => setResumeImprovementAdvice(e.target.value)}
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Specific suggestions to strengthen candidate's resume for future applications..."
            required
          />
        </div>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Interview Improvement Advice
          </label>
          <textarea
            rows={2}
            value={interviewImprovementAdvice}
            onChange={(e) => setInterviewImprovementAdvice(e.target.value)}
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Suggestions for future candidate interview delivery or whiteboard prep..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Reapplication Eligibility Buffer
            </label>
            <select
              value={reapplicationEligibilityMonths}
              onChange={(e) => setReapplicationEligibilityMonths(Number(e.target.value))}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={0}>Eligible Immediately</option>
              <option value={3}>Eligible in 3 Months</option>
              <option value={6}>Eligible in 6 Months (Recommended)</option>
              <option value={12}>Eligible in 1 Year</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
              <input
                type="checkbox"
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant cursor-pointer"
              />
              <span>Deliver Constructive Feedback Email to Candidate</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-error text-on-error font-bold text-xs rounded-xl hover:bg-error/90 transition-all shadow-sm flex items-center gap-1.5 touch-target"
          >
            <span className="material-symbols-outlined text-base">cancel</span>
            Confirm Rejection & Send Feedback
          </button>
        </div>
      </form>
    </Modal>
  );
}
