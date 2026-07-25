"use client";

import React, { useState } from "react";
import { Job } from "@/lib/mockData";

interface JobApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (job: Job) => void;
}

export function JobApplyModal({
  job,
  isOpen,
  onClose,
  onSuccess,
}: JobApplyModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [selectedResume, setSelectedResume] = useState("Alex_Rivers_Resume_2026.pdf");

  if (!isOpen || !job) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess(job);
        onClose();
        setSubmitted(false);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-tertiary-fixed text-on-tertiary-fixed rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="font-headline-md text-2xl text-on-surface font-bold">
              Application Submitted!
            </h3>
            <p className="text-on-surface-variant font-body-md text-sm">
              Your profile and resume were sent directly to the recruiting team at{" "}
              <span className="font-semibold text-primary">{job.companyName}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-outline-variant/20 p-2 overflow-hidden shadow-xs">
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Apply for {job.title}
                </h3>
                <p className="text-on-surface-variant font-label-md text-xs">
                  {job.companyName} • {job.location}
                </p>
              </div>
            </div>

            <div className="p-4 bg-tertiary-container/10 border border-tertiary/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary text-2xl">
                  verified
                </span>
                <div>
                  <h4 className="font-label-md font-bold text-on-surface text-xs">
                    AI Match Verification
                  </h4>
                  <p className="text-on-surface-variant text-[11px]">
                    Your profile matches {job.matchScore}% of the requirements.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm font-bold text-xs rounded-full">
                {job.matchScore}% Match
              </span>
            </div>

            {/* Resume Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                Select Resume
              </label>
              <div className="p-3 border border-primary/40 bg-primary-fixed/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    description
                  </span>
                  <div>
                    <p className="text-sm font-label-md font-bold text-on-surface">
                      {selectedResume}
                    </p>
                    <p className="text-[11px] text-outline">
                      Uploaded • Updated 2 days ago
                    </p>
                  </div>
                </div>
                <span className="text-xs text-primary font-bold">Selected</span>
              </div>
            </div>

            {/* Cover Note */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                Cover Note / Message to Recruiter (Optional)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Share a brief introduction or highlight your key achievements..."
                rows={3}
                className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl font-body-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-on-surface-variant hover:bg-surface-container font-label-md text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-sm hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
