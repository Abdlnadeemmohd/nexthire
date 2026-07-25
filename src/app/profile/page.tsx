"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { PROFILE_DATA } from "@/lib/mockData";

export default function ProfilePage() {
  const [profile, setProfile] = useState(PROFILE_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [reparsing, setReparsing] = useState(false);

  const handleReparse = () => {
    setReparsing(true);
    setTimeout(() => {
      setReparsing(false);
      setProfile((prev) => ({
        ...prev,
        resumeScore: Math.min(100, prev.resumeScore + 2),
      }));
    }, 1200);
  };

  return (
    <>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Profile Banner Card */}
          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary-fixed shadow-md">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                      {profile.name}
                    </h1>
                    <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm rounded-full text-xs font-bold">
                      VERIFIED CANDIDATE
                    </span>
                  </div>
                  <p className="text-on-surface-variant font-label-md text-sm font-semibold">
                    {profile.headline}
                  </p>
                  <p className="text-outline text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {profile.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleReparse}
                  disabled={reparsing}
                  className="px-5 py-2.5 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-full hover:bg-primary-container/20 hover:text-primary transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  {reparsing ? "Analyzing..." : "Re-parse Resume AI"}
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm"
                >
                  {isEditing ? "Save Profile" : "Edit Profile"}
                </button>
              </div>
            </div>

            <p className="text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/10 pt-4">
              {profile.bio}
            </p>
          </div>

          {/* AI Score & Profile Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Resume Match Score Radial Widget */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 text-center flex flex-col items-center justify-center">
              <span className="text-xs font-label-md font-bold uppercase tracking-wider text-outline">
                AI Resume Match Score
              </span>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    stroke="#e6e8ea"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    stroke="#006242"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={282}
                    strokeDashoffset={282 - (282 * profile.resumeScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute font-display text-2xl font-bold text-tertiary">
                  {profile.resumeScore}%
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-label-md">
                Optimized for Tier-1 Tech Companies & Executive Search
              </p>
            </div>

            {/* Profile Completeness Card */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 md:col-span-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Profile Completeness
                  </h3>
                  <span className="font-bold text-primary text-sm">
                    {profile.completeness}%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-700"
                    style={{ width: `${profile.completeness}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">check_circle</span>
                  <span>Work Experience Verified</span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">check_circle</span>
                  <span>Portfolio Links Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Experience Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Work Experience */}
              <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                  Work Experience
                </h3>
                <div className="space-y-6">
                  {profile.experience.map((exp, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-primary/30 pl-4 space-y-1 relative"
                    >
                      <div className="w-3 h-3 bg-primary rounded-full absolute -left-[7px] top-1.5"></div>
                      <h4 className="font-headline-sm text-base font-bold text-on-surface">
                        {exp.title}
                      </h4>
                      <p className="text-xs font-label-md text-primary font-bold">
                        {exp.company} • {exp.period}
                      </p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Showcase */}
              <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                  Portfolio & Case Studies
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.portfolio.map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-5 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary transition-all group block space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-headline-sm text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <span className="material-symbols-outlined text-outline text-base group-hover:text-primary">
                          launch
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2">
                        {item.description}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Skills */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Verified Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-surface-container-high text-on-surface rounded-full text-xs font-label-md font-semibold border border-outline-variant/10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
