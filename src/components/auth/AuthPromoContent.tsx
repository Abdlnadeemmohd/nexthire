"use client";

import React from "react";
import { AuthPromoVideo } from "./AuthPromoVideo";

interface AuthPromoContentProps {
  headline?: string;
  body?: string;
  supportingLine?: string;
}

export function AuthPromoContent({
  headline = "Your next opportunity starts here.",
  body = "Showcase your real skills, discover roles that fit, and connect with employers looking for what you can actually do.",
  supportingLine = "Free for job seekers. Built for meaningful careers.",
}: AuthPromoContentProps) {
  return (
    <div className="w-full flex flex-col justify-between space-y-5 lg:space-y-6">
      {/* 1. Header & Value Proposition */}
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-wide">
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">
            workspaces
          </span>
          <span>Next-Generation Recruitment</span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-on-surface leading-tight tracking-tight">
          Find the right opportunity.{" "}
          <span className="text-primary block sm:inline">Hire the right talent.</span>
        </h2>

        <p className="text-on-surface-variant text-xs sm:text-sm font-body-md leading-relaxed max-w-xl">
          NextHire connects ambitious job seekers and forward-thinking employers through a modern,
          skill-first recruitment platform built for speed, transparency, and collaboration.
        </p>
      </div>

      {/* 2. Promotional Media Showcase Area */}
      <div className="w-full">
        <AuthPromoVideo />
      </div>

      {/* 3. Core Platform Highlights (3 Benefit Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 space-y-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1.5">
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              target
            </span>
          </div>
          <h4 className="font-bold text-xs text-on-surface">Skill-First Matching</h4>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            Curated roles tailored directly to verified candidate capabilities.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 space-y-1">
          <div className="w-7 h-7 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center mb-1.5">
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              bolt
            </span>
          </div>
          <h4 className="font-bold text-xs text-on-surface">Direct Pipeline</h4>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            Structured candidate review, interview scheduling, and hiring stages.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 space-y-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center mb-1.5">
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              verified_user
            </span>
          </div>
          <h4 className="font-bold text-xs text-on-surface">Verified Profiles</h4>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            Authentic candidate credentials with enterprise security & privacy.
          </p>
        </div>
      </div>

      {/* 4. High-Converting Promotional Card (Polished Skill-First Value Box) */}
      <div className="p-4 sm:p-4.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs space-y-2 transition-all">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">
              auto_awesome
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-sm text-on-surface leading-snug">
              {headline}
            </h4>
            <p className="text-[11px] sm:text-xs text-on-surface-variant font-body-sm leading-relaxed">
              {body}
            </p>
          </div>
        </div>

        <div className="pt-1.5 border-t border-outline-variant/20 flex items-center gap-1.5 text-[11px] font-bold text-primary">
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">
            check_circle
          </span>
          <span>{supportingLine}</span>
        </div>
      </div>
    </div>
  );
}
