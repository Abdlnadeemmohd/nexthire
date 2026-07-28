"use client";

import React from "react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export interface RecruiterIdentity {
  id: string;
  name: string;
  avatar: string;
  title: string;
  department: string;
  company: string;
  isVerified: boolean;
  activeJobsCount: number;
  avgResponseTime: string;
  rating: number;
  linkedinUrl?: string;
  summary: string;
}

interface RecruiterProfileCardProps {
  recruiter: RecruiterIdentity;
}

export function RecruiterProfileCard({ recruiter }: RecruiterProfileCardProps) {
  return (
    <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 md:p-6 space-y-4 shadow-xs">
      <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
        Hiring Recruiter Details
      </span>

      <div className="flex items-start gap-4">
        <img
          src={recruiter.avatar}
          alt={recruiter.name}
          className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/30 flex-shrink-0 shadow-xs"
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-headline-sm text-base font-bold text-on-surface truncate">
              {recruiter.name}
            </h4>
            {recruiter.isVerified && <VerifiedBadge role="RECRUITER" size="sm" showIconOnly />}
          </div>

          <p className="text-xs text-primary font-bold">{recruiter.title}</p>
          <p className="text-[11px] text-on-surface-variant">{recruiter.company} • {recruiter.department}</p>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed italic bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
        "{recruiter.summary}"
      </p>

      <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
        <div className="bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/20">
          <span className="text-[10px] font-bold text-outline uppercase block">Active Jobs</span>
          <span className="font-bold text-on-surface font-mono">{recruiter.activeJobsCount} roles</span>
        </div>

        <div className="bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/20">
          <span className="text-[10px] font-bold text-outline uppercase block">Response Time</span>
          <span className="font-bold text-emerald-700 font-mono">{recruiter.avgResponseTime}</span>
        </div>

        <div className="bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/20">
          <span className="text-[10px] font-bold text-outline uppercase block">Candidate Rating</span>
          <span className="font-bold text-amber-500 font-mono">★ {recruiter.rating}</span>
        </div>
      </div>
    </div>
  );
}
