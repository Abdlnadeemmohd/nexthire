"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface RecruiterFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  jobTitle: string;
  onSubmitFeedback: (feedbackData: any) => void;
}

export function RecruiterFeedbackModal({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  onSubmitFeedback,
}: RecruiterFeedbackModalProps) {
  const { showToast } = useToast();

  const [primaryReason, setPrimaryReason] = useState("Skills do not match requirements");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["AWS", "TypeScript"]);
  const [customSkill, setCustomSkill] = useState("");
  const [experienceGap, setExperienceGap] = useState("More hands-on cloud architecture experience required");
  const [suggestedCert, setSuggestedCert] = useState("AWS Certified Solutions Architect");
  const [recruiterNotes, setRecruiterNotes] = useState(
    "Your background in frontend engineering is strong. Gaining certification and experience in cloud infrastructure will make your profile very competitive for senior roles."
  );

  const availableSkills = ["React", "Python", "TypeScript", "AWS", "SQL", "Docker", "Kubernetes", "GraphQL", "Leadership", "PMP"];

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkill && !selectedSkills.includes(customSkill)) {
      setSelectedSkills((prev) => [...prev, customSkill]);
      setCustomSkill("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const feedback = {
      primaryReason,
      missingSkills: selectedSkills,
      experienceGap,
      suggestedCert,
      recruiterNotes,
      dateUpdated: new Date().toISOString(),
    };
    onSubmitFeedback(feedback);
    showToast(`Feedback sent to ${candidateName}`, "success");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Structured Feedback for ${candidateName}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body-sm">
        <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/20 space-y-1">
          <span className="text-[10px] font-label-sm font-bold uppercase text-outline">Candidate Feedback Guidance</span>
          <p className="text-on-surface-variant text-[11px]">
            Providing constructive feedback helps candidates improve their skills and maintains a positive employer brand image for <span className="font-bold text-on-surface">{jobTitle}</span>.
          </p>
        </div>

        {/* Primary Reason */}
        <div className="space-y-1">
          <label className="block text-outline font-label-md font-bold uppercase">
            Primary Rejection Reason
          </label>
          <select
            value={primaryReason}
            onChange={(e) => setPrimaryReason(e.target.value)}
            className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface"
          >
            <option value="Skills do not match requirements">Skills do not match requirements</option>
            <option value="Insufficient years of experience">Insufficient years of experience</option>
            <option value="Education / Certification requirements not met">Education / Certification requirements not met</option>
            <option value="Position already filled internally">Position already filled internally</option>
            <option value="Location / Timezone mismatch">Location / Timezone mismatch</option>
            <option value="Salary expectation mismatch">Salary expectation mismatch</option>
          </select>
        </div>

        {/* Missing Skills Tags */}
        <div className="space-y-2">
          <label className="block text-outline font-label-md font-bold uppercase">
            Missing Skills / Competencies
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableSkills.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {skill} {isSelected ? "✓" : "+"}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Add specific missing skill..."
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              className="flex-1 p-2 bg-surface border border-outline-variant/30 rounded-lg text-xs"
            />
            <button
              type="button"
              onClick={addCustomSkill}
              className="px-3 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-lg hover:bg-primary-container hover:text-primary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Experience Gap */}
        <div className="space-y-1">
          <label className="block text-outline font-label-md font-bold uppercase">
            Experience Gap Guidance
          </label>
          <input
            type="text"
            placeholder="e.g. More leadership experience required"
            value={experienceGap}
            onChange={(e) => setExperienceGap(e.target.value)}
            className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl"
          />
        </div>

        {/* Suggested Certifications */}
        <div className="space-y-1">
          <label className="block text-outline font-label-md font-bold uppercase">
            Suggested Certifications
          </label>
          <input
            type="text"
            placeholder="e.g. PMP, AWS Certified Solutions Architect"
            value={suggestedCert}
            onChange={(e) => setSuggestedCert(e.target.value)}
            className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl"
          />
        </div>

        {/* Personal Recruiter Notes */}
        <div className="space-y-1">
          <label className="block text-outline font-label-md font-bold uppercase">
            Personal Recruiter Guidance Notes
          </label>
          <textarea
            rows={3}
            placeholder="Provide personalized advice for the candidate..."
            value={recruiterNotes}
            onChange={(e) => setRecruiterNotes(e.target.value)}
            className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container rounded-full"
          >
            Skip Feedback
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-error text-on-error font-label-md font-bold rounded-full hover:opacity-90 shadow-md"
          >
            Send Feedback & Reject
          </button>
        </div>
      </form>
    </Modal>
  );
}
