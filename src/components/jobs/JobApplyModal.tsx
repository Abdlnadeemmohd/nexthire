"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface JobApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (job: Job) => void;
}

export function JobApplyModal({ job, isOpen, onClose, onSuccess }: JobApplyModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!job) return null;

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    await new Promise((res) => setTimeout(res, 800));

    setSubmitting(false);
    setSubmitted(true);

    showToast(`Successfully submitted application for ${job.title}!`, "success");

    if (onSuccess) onSuccess(job);

    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apply for ${job.title}`}>
      {submitted ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-16 h-16 bg-tertiary-container/30 text-tertiary rounded-full flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h3 className="font-headline-sm text-xl font-bold text-on-surface">
            Application Submitted!
          </h3>
          <p className="text-xs text-on-surface-variant font-body-md max-w-sm mx-auto">
            Your profile and resume have been delivered directly to <span className="font-bold text-on-surface">{job.companyName}</span>'s hiring pipeline.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs font-body-sm">
          {/* Candidate Profile Fast Summary */}
          <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 space-y-2">
            <span className="text-[10px] font-label-sm font-bold uppercase tracking-wider text-primary">
              ⚡ 1-Click Profile Attachment
            </span>
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                alt={user?.name || "Candidate"}
                className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
              />
              <div>
                <h4 className="font-bold text-sm text-on-surface">{user?.name || "Alex Rivers"}</h4>
                <p className="text-[11px] text-on-surface-variant">{user?.email || "alex.rivers@gmail.com"} • Resume attached (Alex_Rivers_Resume.pdf)</p>
              </div>
            </div>
          </div>

          {/* Optional Cover Letter */}
          <div className="space-y-1">
            <label className="block text-outline font-label-md font-semibold">
              Cover Letter / Note to Recruiter (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Introduce yourself or highlight specific achievements..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary text-on-primary font-label-md font-bold rounded-full hover:bg-primary-container shadow-md flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Submitting Application...
                </>
              ) : (
                "Submit 1-Click Application"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
