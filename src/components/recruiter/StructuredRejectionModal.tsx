"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface RejectionFeedbackData {
  reason: "MISSING_EXPERIENCE" | "MISSING_SKILLS" | "SALARY_MISMATCH" | "COMMUNICATION" | "TECHNICAL_PERFORMANCE" | "ROLE_CLOSED" | "CULTURE_FIT" | "POSITION_CANCELLED" | "OTHER";
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
  const [recruiterComments, setRecruiterComments] = useState("");
  const [missingSkillsInput, setMissingSkillsInput] = useState("");
  const [suggestedCertificationsInput, setSuggestedCertificationsInput] = useState("");
  const [resumeImprovementAdvice, setResumeImprovementAdvice] = useState("");
  const [interviewImprovementAdvice, setInterviewImprovementAdvice] = useState("");
  const [reapplicationEligibilityMonths, setReapplicationEligibilityMonths] = useState(6);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recruiterComments.trim() || recruiterComments.trim().length < 10) {
      showToast("Recruiter feedback comments must be at least 10 characters.", "error");
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
      recruiterComments: recruiterComments.trim(),
      missingSkills,
      suggestedCertifications,
      resumeImprovementAdvice: resumeImprovementAdvice.trim(),
      interviewImprovementAdvice: interviewImprovementAdvice.trim(),
      reapplicationEligibilityMonths,
      sendEmailNotification,
      createdAt: new Date().toISOString(),
    };

    onConfirmRejection(feedback);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Rejection Feedback: ${candidateName}`}>
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
          Please select a rejection reason and provide constructive feedback for the candidate.
        </p>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Rejection Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as any)}
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="MISSING_SKILLS">Skills mismatch</option>
            <option value="MISSING_EXPERIENCE">Experience mismatch</option>
            <option value="ROLE_CLOSED">Role requirements mismatch / Position closed</option>
            <option value="TECHNICAL_PERFORMANCE">Technical assessment / coding performance</option>
            <option value="SALARY_MISMATCH">Salary expectations mismatch</option>
            <option value="CULTURE_FIT">Candidate profile not aligned</option>
            <option value="COMMUNICATION">Communication / Presentation</option>
            <option value="POSITION_CANCELLED">Position cancelled / filled</option>
            <option value="OTHER">Other specific reason</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Recruiter Feedback Comments *
          </label>
          <textarea
            rows={3}
            value={recruiterComments}
            onChange={(e) => setRecruiterComments(e.target.value)}
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[72px]"
            placeholder="e.g. This position requires stronger production experience with Kubernetes and AWS infrastructure."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
              Missing Skills (Comma-separated)
            </label>
            <input
              type="text"
              value={missingSkillsInput}
              onChange={(e) => setMissingSkillsInput(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Kubernetes, AWS, GraphQL"
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
              placeholder="e.g. AWS Solutions Architect"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-outline uppercase tracking-wider text-[10px] pb-1">
            Additional Improvement Advice (Optional)
          </label>
          <textarea
            rows={2}
            value={resumeImprovementAdvice}
            onChange={(e) => setResumeImprovementAdvice(e.target.value)}
            className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[56px]"
            placeholder="Specific suggestions to strengthen candidate's profile for future openings..."
          />
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 sm:py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container transition-colors text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 sm:py-2 bg-error text-on-error font-bold text-xs rounded-xl hover:bg-error/90 transition-all shadow-sm flex items-center justify-center gap-1.5 touch-target"
          >
            <span className="material-symbols-outlined text-base">cancel</span>
            Confirm Rejection & Send Feedback
          </button>
        </div>
      </form>
    </Modal>
  );
}
