"use client";

import React, { useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export const ExecutiveReportGeneratorModal: React.FC<ModalProps> = ({ isOpen, onClose, onGenerated }) => {
  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY" | "QUARTERLY">("MONTHLY");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/recruiter/executive/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, title: title || undefined }),
      });

      const data = await res.json();
      if (data.success) {
        onGenerated();
        onClose();
      } else {
        setError(data.error || "Failed to compile report");
      }
    } catch (err: any) {
      setError(err.message || "Network error compiling executive report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Compile Executive Hiring Report</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Generates a structured, audit-ready executive intelligence report containing KPIs, risks, time-to-hire, and recommendations.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Report Cadence Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="WEEKLY">Weekly Hiring Digest (7 Days)</option>
              <option value="MONTHLY">Monthly Hiring Report (30 Days)</option>
              <option value="QUARTERLY">Quarterly Executive Review (90 Days)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Custom Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Q3 Leadership Talent Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {loading ? "Compiling..." : "Generate & Save Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
