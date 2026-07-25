"use client";

import React from "react";
import Link from "next/link";

interface JobAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
}

export function JobAuthModal({ isOpen, onClose, jobTitle = "this role" }: JobAuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 animate-scale-in text-center">
        <div className="w-14 h-14 bg-primary-container/30 dark:bg-slate-800 text-primary rounded-2xl flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-on-surface dark:text-slate-100">
            Sign in to Apply
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
            Please log in or create a NextHire account to submit your application for <span className="font-bold text-on-surface dark:text-slate-200">{jobTitle}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full py-3 bg-primary text-on-primary font-label-md font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="w-full py-3 border border-outline-variant/40 dark:border-slate-700 font-label-md font-bold text-xs text-on-surface dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Create Free Account
          </Link>
        </div>

        <button
          onClick={onClose}
          className="text-xs font-label-md font-bold text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
