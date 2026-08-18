"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { AIEngine, ATSAnalysisResult } from "@/lib/aiEngine";
import { MobileScrollableChips } from "@/components/ui/MobileInteractionUtils";
import { Modal } from "@/components/ui/Modal";

export default function ResumeStudioPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"builder" | "preview" | "ats">("builder");
  const [resumeTitle, setResumeTitle] = useState(
    user?.name ? `${user.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume_2026` : "NextHire_ATS_Resume_2026"
  );
  const [targetRole, setTargetRole] = useState("Senior Product Designer / Lead UX Engineer");
  const [selectedTemplate, setSelectedTemplate] = useState<"modern" | "classic" | "minimal">("modern");
  const [selectedVersion, setSelectedVersion] = useState("v2.0 (AI Optimized - Current)");
  const [showShareModal, setShowShareModal] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSAnalysisResult | null>(null);

  const [skills, setSkills] = useState([
    "Design Systems",
    "Figma",
    "React",
    "Next.js",
    "Tailwind CSS",
    "TypeScript",
    "User Research",
    "AI UX",
  ]);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
    showToast(`Skill '${newSkill}' added to resume!`, "success");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    showToast(`Skill removed.`, "info");
  };

  const handleRunAtsScan = () => {
    const candidateName = user?.name || "Candidate";
    const resumeContentText = `${candidateName} ${targetRole} Skills: ${skills.join(", ")} Senior Lead Years Experience Frontend Architect`;
    const result = AIEngine.analyzeResumeATS(resumeContentText, ["React", "TypeScript", "Next.js", "AI UX", "System Design"]);
    setAtsResult(result);
    setActiveTab("ats");
    showToast(`ATS Optimization Scan Complete! Score: ${result.score}/100`, "success");
  };

  const handleDownloadPdf = () => {
    showToast("Generating high-resolution ATS-formatted PDF resume...", "info");
    const downloadFilename = `${resumeTitle}.pdf`;
    setTimeout(() => {
      showToast(`Download started: ${downloadFilename}`, "success");
    }, 1500);
  };

  return (
    <ProtectedRoute requiredPortal="seeker">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="seeker" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">description</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                    AI Resume Studio
                  </h1>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">
                  Build, optimize, and export high-conversion ATS resumes tailored to target job descriptions.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRunAtsScan}
                  className="px-4 py-2 bg-secondary-container text-on-secondary-container font-bold text-xs rounded-2xl hover:bg-secondary-container/80 transition-all shadow-xs flex items-center gap-1.5 touch-target"
                >
                  <span className="material-symbols-outlined text-base text-primary">auto_awesome</span>
                  Run AI ATS Scan
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-2xl border border-outline-variant/30 hover:bg-surface-container transition-all flex items-center gap-1.5 touch-target"
                >
                  <span className="material-symbols-outlined text-base">share</span>
                  Share Link
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-2 touch-target"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Export (PDF)
                </button>
              </div>
            </div>

            {/* Template & Version Selection Bar */}
            <div className="glass-card rounded-2xl p-4 border border-outline-variant/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-outline uppercase tracking-wider text-[10px]">Resume Version:</span>
                <select
                  value={selectedVersion}
                  onChange={(e) => {
                    setSelectedVersion(e.target.value);
                    showToast(`Switched to version: ${e.target.value}`, "info");
                  }}
                  className="px-3 py-1.5 bg-surface text-on-surface border border-outline-variant/30 rounded-xl font-bold focus:outline-none"
                >
                  <option value="v2.0 (AI Optimized - Current)">v2.0 (AI Optimized - Current)</option>
                  <option value="v1.2 (Frontend Engineering)">v1.2 (Frontend Engineering)</option>
                  <option value="v1.0 (Baseline Master)">v1.0 (Baseline Master)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-outline uppercase tracking-wider text-[10px]">Layout Template:</span>
                <div className="flex gap-1.5">
                  {(["modern", "classic", "minimal"] as const).map((tmpl) => (
                    <button
                      key={tmpl}
                      onClick={() => {
                        setSelectedTemplate(tmpl);
                        showToast(`Applied ${tmpl.toUpperCase()} resume template`, "success");
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition-all ${
                        selectedTemplate === tmpl
                          ? "bg-primary text-on-primary shadow-xs"
                          : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <MobileScrollableChips
              items={[
                { id: "builder", label: "Resume Editor", icon: "edit_note" },
                { id: "preview", label: "Live PDF Preview", icon: "visibility" },
                { id: "ats", label: "ATS Optimization Score", count: atsResult ? atsResult.score : 92, icon: "analytics" },
              ]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
              ariaLabel="Resume Studio navigation tabs"
            />

            {/* Resume Builder Section */}
            {activeTab === "builder" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* General Profile Section */}
                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4">
                    <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">badge</span>
                      Target Job Role & Title
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-outline uppercase mb-1">
                          Resume Document Name
                        </label>
                        <input
                          type="text"
                          value={resumeTitle}
                          onChange={(e) => setResumeTitle(e.target.value)}
                          className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-outline uppercase mb-1">
                          Target Role / Heading
                        </label>
                        <input
                          type="text"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4">
                    <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                      Core Competencies & Tech Stack
                    </h3>

                    <form onSubmit={handleAddSkill} className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a new skill (e.g. GraphQL, Figma, Node)..."
                        className="flex-1 px-3.5 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl"
                      >
                        Add Skill
                      </button>
                    </form>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-surface-container-low border border-outline-variant/40 text-xs font-medium text-on-surface rounded-xl flex items-center gap-1.5"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-outline hover:text-error text-sm font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ATS Widget Sidebar */}
                <div className="space-y-6">
                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-4 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">
                      ATS Compatibility Score
                    </span>
                    <div className="text-4xl font-display font-bold text-primary">98%</div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Your resume contains high-frequency keywords found in senior recruiter searches across Enterprise SaaS roles.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Live Preview Tab */}
            {activeTab === "preview" && (
              <div className="surface-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-4xl mx-auto space-y-6 shadow-md">
                <div className="border-b border-outline-variant/20 pb-4 text-center space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface">{user?.name || "Candidate Name"}</h2>
                  <p className="text-xs text-primary font-bold">{targetRole}</p>
                  <p className="text-[11px] text-outline break-anywhere">
                    {user?.email || "candidate@nexthire.cloud"}{user?.city ? ` • ${user.city}` : ""}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h3 className="font-bold text-on-surface uppercase border-b border-outline-variant/20 pb-1 mb-2">
                      Executive Summary
                    </h3>
                    <p className="text-on-surface-variant leading-relaxed">
                      Passionate product designer and engineer with 7+ years of experience building enterprise SaaS platforms, complex design systems, and AI-driven interfaces.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-on-surface uppercase border-b border-outline-variant/20 pb-1 mb-2">
                      Key Competencies
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-surface-container-low text-on-surface rounded text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ATS Analysis Tab */}
            {activeTab === "ats" && (
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-xs font-bold">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  <span>Your resume passes 100% of standard ATS parser checks (Greenhouse, Ashby, Workday, Lever).</span>
                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Public Resume Link"
      >
        <div className="space-y-4 text-xs font-body-md">
          <p className="text-on-surface-variant">
            Generate a secure, password-protected public link to share your live ATS resume with recruiters or hiring managers.
          </p>
          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30 font-mono text-[11px] text-primary flex items-center justify-between">
            <span>https://nexthire.ai/r/alex-rivers-2026</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText("https://nexthire.ai/r/alex-rivers-2026");
                showToast("Public resume link copied to clipboard!", "success");
                setShowShareModal(false);
              }}
              className="px-3 py-1 bg-primary text-on-primary font-bold rounded-lg text-[10px] hover:bg-primary-container"
            >
              Copy Link
            </button>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
