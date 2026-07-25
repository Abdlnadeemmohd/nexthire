"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { PROFILE_DATA } from "@/lib/mockData";
import { useToast } from "@/components/ui/Toast";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(PROFILE_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const handleAction = (actionName: string) => {
    setShowMoreActions(false);
    showToast(`Triggered: ${actionName}`, "info");
  };

  return (
    <>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Clean Profile Header */}
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

              {/* Action Buttons: Clean Edit Profile + More Actions Dropdown */}
              <div className="flex items-center gap-3 relative">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    {isEditing ? "check" : "edit"}
                  </span>
                  {isEditing ? "Save Profile" : "Edit Profile"}
                </button>

                {/* More Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreActions(!showMoreActions)}
                    className="p-2.5 bg-surface-container-high text-on-surface hover:text-primary rounded-full transition-colors border border-outline-variant/30 flex items-center justify-center"
                    aria-label="More Profile Actions"
                  >
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>

                  {showMoreActions && (
                    <div className="absolute right-0 mt-2 w-52 bg-surface border border-outline-variant/20 rounded-2xl shadow-xl p-2 z-30 space-y-1 text-xs font-label-md">
                      <button
                        onClick={() => handleAction("Download Resume PDF")}
                        className="w-full text-left px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        Download Resume
                      </button>
                      <button
                        onClick={() => handleAction("Upload New Resume")}
                        className="w-full text-left px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">upload_file</span>
                        Upload New Resume
                      </button>
                      <button
                        onClick={() => handleAction("AI Skill Gap Analysis")}
                        className="w-full text-left px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">analytics</span>
                        Resume AI Analysis
                      </button>
                      <button
                        onClick={() => handleAction("Delete Current Resume")}
                        className="w-full text-left px-3 py-2 text-error hover:bg-error-container/20 rounded-xl flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Delete Resume
                      </button>
                    </div>
                  )}
                </div>
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
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    stroke="#006242"
                    strokeWidth="8"
                    strokeDasharray={283}
                    strokeDashoffset={283 - (283 * profile.resumeScore) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute font-display font-bold text-2xl text-on-surface">
                  {profile.resumeScore}%
                </span>
              </div>
              <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm font-bold text-xs rounded-full">
                ATS Optimized
              </span>
            </div>

            {/* Profile Completion Card */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                    Profile Strength
                  </h3>
                  <span className="text-primary font-bold text-sm">92% Complete</span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-[92%]" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-body-sm pt-2">
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20">
                  <span className="text-outline font-label-md">Skill Tags</span>
                  <p className="font-bold text-on-surface text-sm">14 Added</p>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20">
                  <span className="text-outline font-label-md font-bold">Experience</span>
                  <p className="font-bold text-on-surface text-sm">6+ Years</p>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20">
                  <span className="text-outline font-label-md font-bold">Education</span>
                  <p className="font-bold text-on-surface text-sm">B.S. CompSci</p>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20">
                  <span className="text-outline font-label-md font-bold">Certifications</span>
                  <p className="font-bold text-on-surface text-sm">AWS Dev</p>
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Skills Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Experience */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-6">
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                  Work Experience
                </h3>
                <div className="space-y-6">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="flex items-start gap-4 pb-6 border-b border-outline-variant/10 last:border-0 last:pb-0">
                      <div className="w-10 h-10 bg-primary-fixed text-on-primary-fixed rounded-xl flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined">work</span>
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-on-surface text-base">{exp.title}</h4>
                          <span className="text-outline text-xs font-label-md">{exp.period}</span>
                        </div>
                        <p className="text-primary font-label-md text-xs font-semibold">{exp.company}</p>
                        <p className="text-on-surface-variant text-xs leading-relaxed pt-1">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Sidebar */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Verified Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-surface-container-high text-on-surface font-label-sm font-bold text-xs rounded-full border border-outline-variant/30"
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

      <Footer />
    </>
  );
}
