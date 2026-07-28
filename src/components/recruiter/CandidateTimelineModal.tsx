"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";

export interface CandidateTimelineEvent {
  id: string;
  timestamp: string;
  stage: string;
  actorName: string;
  actorRole: string;
  description: string;
  notes?: string;
  badgeType: "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED" | "NOTE";
}

interface CandidateTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  jobTitle: string;
  events: CandidateTimelineEvent[];
}

export function CandidateTimelineModal({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  events,
}: CandidateTimelineModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Hiring Timeline: ${candidateName}`}>
      <div className="space-y-6 text-xs font-body-md">
        <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="font-bold text-on-surface text-sm">{candidateName}</span>
            <p className="text-on-surface-variant text-[11px]">{jobTitle}</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full uppercase text-[10px]">
            {events.length} Recruitment Events Recorded
          </span>
        </div>

        {/* Chronological Timeline Stream */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
          {events.map((evt) => (
            <div key={evt.id} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 top-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-xs ${
                  evt.badgeType === "OFFER"
                    ? "bg-tertiary text-on-tertiary"
                    : evt.badgeType === "REJECTED"
                    ? "bg-error text-on-error"
                    : evt.badgeType === "INTERVIEW"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-primary text-on-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {evt.badgeType === "OFFER"
                    ? "verified"
                    : evt.badgeType === "REJECTED"
                    ? "cancel"
                    : evt.badgeType === "INTERVIEW"
                    ? "event"
                    : "check_circle"}
                </span>
              </div>

              <div className="glass-card bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 flex-1 space-y-2 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface text-xs">{evt.stage}</span>
                    <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-semibold">
                      by {evt.actorName} ({evt.actorRole})
                    </span>
                  </div>
                  <span className="text-[10px] text-outline font-mono">{evt.timestamp}</span>
                </div>

                <p className="text-on-surface-variant text-xs">{evt.description}</p>

                {evt.notes && (
                  <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-[11px] text-on-surface italic">
                    "{evt.notes}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container transition-colors"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </Modal>
  );
}
