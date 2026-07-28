"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { RecruitmentEngine } from "@/services/recruitmentEngine";

interface JobApplyModalProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function JobApplyModal({ jobId, jobTitle, companyName, isOpen, onClose }: JobApplyModalProps) {
  const { showToast } = useToast();
  const [coverNote, setCoverNote] = useState("");
  const [useDefaultResume, setUseDefaultResume] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const app = RecruitmentEngine.applyForJob(jobId, {
      name: "Alex Rivers",
      email: "alex.rivers@example.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    });

    if (app) {
      showToast(`Application submitted for ${jobTitle} at ${companyName}! Added to recruiter ATS.`, "success");
    } else {
      showToast(`Position ${jobTitle} is closed or filled.`, "error");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-scale-in">
        <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-label-sm font-bold text-outline dark:text-slate-400 uppercase tracking-wider block">
              Quick Application
            </span>
            <h2 className="font-display text-xl font-bold text-on-surface dark:text-slate-100">
              Apply to {companyName}
            </h2>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">{jobTitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Default Resume Option */}
          <div className="p-4 bg-surface-container-low dark:bg-slate-800/60 rounded-2xl border border-outline-variant/20 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">description</span>
              <div>
                <h4 className="text-xs font-bold text-on-surface dark:text-slate-100">Primary Resume Attached</h4>
                <p className="text-[11px] text-on-surface-variant dark:text-slate-400">Alex_Rivers_Senior_Engineer_2026.pdf</p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={useDefaultResume}
              onChange={(e) => setUseDefaultResume(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-outline-variant/40 dark:border-slate-700"
            />
          </div>

          {/* Cover Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-label-md font-bold text-on-surface dark:text-slate-200 block">
              Cover Note (Optional)
            </label>
            <textarea
              rows={3}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Highlight key engineering achievements or why you are a strong fit..."
              className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border border-outline-variant/40 dark:border-slate-700 rounded-2xl text-xs text-on-surface dark:text-slate-100 placeholder-outline dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-label-md font-bold text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-label-md font-bold bg-primary text-on-primary rounded-xl hover:bg-primary-container transition-all shadow-sm"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
