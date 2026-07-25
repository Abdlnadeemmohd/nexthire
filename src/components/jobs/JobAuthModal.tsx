"use client";

import React from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";

interface JobAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetJobId?: string;
  targetJobTitle?: string;
}

export function JobAuthModal({ isOpen, onClose, targetJobId = "", targetJobTitle = "" }: JobAuthModalProps) {
  const redirectUrl = targetJobId ? `/jobs/${targetJobId}` : "/jobs";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign In to Apply">
      <div className="space-y-6 text-xs font-body-sm">
        <div className="p-4 bg-primary-container/20 border border-primary/30 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <span className="material-symbols-outlined">lock</span>
            <span>Authentication Required</span>
          </div>
          <p className="text-on-surface-variant text-xs leading-relaxed">
            To submit your application for <span className="font-bold text-on-surface">{targetJobTitle || "this position"}</span> and communicate directly with recruiters, please sign in or create a free NextHire candidate account.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-on-surface text-xs uppercase tracking-wider text-outline">
            Creating an account allows you to:
          </h4>
          <ul className="space-y-2 text-on-surface-variant text-xs">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
              <span><strong>1-Click Applications</strong> with your saved profile and resume.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
              <span><strong>Real-time Status Updates</strong> from recruiters (Applied → Hired).</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
              <span><strong>Structured Recruiter Feedback</strong> and AI Career Recommendations.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
              <span><strong>Direct Messaging & Interview Scheduling</strong> with hiring managers.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-outline-variant/10">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectUrl)}&message=${encodeURIComponent("Please sign in or create an account to continue with your application.")}`}
            className="flex-1 py-3 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full text-center hover:bg-primary-container transition-all shadow-md"
          >
            Sign In to Account
          </Link>
          <Link
            href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
            className="flex-1 py-3 bg-surface border border-outline-variant/30 text-on-surface font-label-md font-bold text-xs rounded-full text-center hover:bg-surface-container transition-all"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </Modal>
  );
}
