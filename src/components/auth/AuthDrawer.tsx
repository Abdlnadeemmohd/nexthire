"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetJobId?: string | null;
  targetJobTitle?: string | null;
  onSuccess?: () => void;
}

export function AuthDrawer({ isOpen, onClose, targetJobId, targetJobTitle, onSuccess }: AuthDrawerProps) {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"candidate_signin" | "candidate_signup" | "recruiter_signin">("candidate_signin");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    officialEmail: "",
  });

  if (!isOpen) return null;

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidateEmail = formData.email || "jobseeker@nexthire.com";
    const candidatePassword = formData.password || "password123";
    await login(candidateEmail, candidatePassword, "JOB_SEEKER", true);
    showToast(`Signed in as Candidate! Preserving job context for ${targetJobTitle || "this vacancy"}.`, "success");
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleRecruiterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const recruiterEmail = formData.officialEmail || "recruiter@nexthire.com";
    const recruiterPassword = formData.password || "password123";
    await login(recruiterEmail, recruiterPassword, "RECRUITER", true);
    showToast("Signed in as Recruiter! Welcome to Recruiter Workspace.", "success");
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleQuickFill = (role: "seeker" | "recruiter") => {
    if (role === "seeker") {
      setFormData({ ...formData, email: "jobseeker@nexthire.com", password: "password123" });
      setActiveTab("candidate_signin");
    } else {
      setFormData({ ...formData, officialEmail: "recruiter@nexthire.com", password: "password123" });
      setActiveTab("recruiter_signin");
    }
    showToast(`Demo ${role === "seeker" ? "Candidate" : "Recruiter"} credentials filled!`, "info");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop overlay click */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-Over Drawer Container */}
      <div className="w-full max-w-md bg-surface-container-lowest border-l border-outline-variant/30 h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slide-in-right">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                Enterprise Authentication
              </span>
              <h2 className="font-display text-xl font-bold text-on-surface">
                {targetJobTitle ? `Apply to ${targetJobTitle}` : "Sign In to NextHire"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {targetJobTitle && (
            <div className="p-3 bg-primary-container/20 border border-primary/30 rounded-2xl text-xs text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">bookmark_added</span>
              Job context saved! You will return to apply immediately after sign in.
            </div>
          )}

          {/* Role Switcher Tabs */}
          <div className="flex bg-surface-container-high p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("candidate_signin")}
              className={`flex-1 py-2 text-center rounded-xl transition-all ${
                activeTab === "candidate_signin"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              Candidate Login
            </button>
            <button
              onClick={() => setActiveTab("candidate_signup")}
              className={`flex-1 py-2 text-center rounded-xl transition-all ${
                activeTab === "candidate_signup"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              Candidate Sign Up
            </button>
            <button
              onClick={() => setActiveTab("recruiter_signin")}
              className={`flex-1 py-2 text-center rounded-xl transition-all ${
                activeTab === "recruiter_signin"
                  ? "bg-surface text-tertiary shadow-xs"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              Recruiter Login
            </button>
          </div>

          {/* Candidate Sign In Form */}
          {activeTab === "candidate_signin" && (
            <form onSubmit={handleCandidateLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@gmail.com or john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container shadow-md transition-all text-xs"
              >
                Sign In as Candidate & Apply
              </button>
            </form>
          )}

          {/* Candidate Sign Up Form */}
          {activeTab === "candidate_signup" && (
            <form onSubmit={handleCandidateLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Email Address (Personal or Professional)</label>
                <input
                  type="email"
                  required
                  placeholder="john@gmail.com, john@outlook.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container shadow-md transition-all text-xs"
              >
                Create Candidate Account & Apply
              </button>
            </form>
          )}

          {/* Recruiter Sign In Form */}
          {activeTab === "recruiter_signin" && (
            <form onSubmit={handleRecruiterLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Official Corporate Email (@company.com)</label>
                <input
                  type="email"
                  required
                  placeholder="careers@company.com or john@company.com"
                  value={formData.officialEmail}
                  onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-tertiary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-tertiary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-tertiary text-on-tertiary font-bold rounded-xl hover:bg-tertiary-container shadow-md transition-all text-xs"
              >
                Sign In to Recruiter Workspace
              </button>
            </form>
          )}

          {/* Social OAuth Sign In Section */}
          <div className="space-y-3 pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-outline-variant/20"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-outline uppercase">Or Continue With</span>
              <div className="flex-grow border-t border-outline-variant/20"></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickFill("seeker")}
                className="p-2.5 bg-surface border border-outline-variant/30 hover:bg-surface-container-high rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span>🌐</span> Google
              </button>
              <button
                onClick={() => handleQuickFill("seeker")}
                className="p-2.5 bg-surface border border-outline-variant/30 hover:bg-surface-container-high rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span>💼</span> LinkedIn
              </button>
            </div>
          </div>
        </div>

        {/* Demo Quick Fill Shortcuts */}
        <div className="pt-6 border-t border-outline-variant/20 space-y-2 text-[11px]">
          <span className="font-bold text-outline uppercase text-[9px] block">Demo Environment Accounts</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickFill("seeker")}
              className="flex-1 p-2 bg-surface-container-high hover:bg-primary/10 text-primary font-bold rounded-lg text-center"
            >
              Demo Candidate
            </button>
            <button
              onClick={() => handleQuickFill("recruiter")}
              className="flex-1 p-2 bg-surface-container-high hover:bg-tertiary/10 text-tertiary font-bold rounded-lg text-center"
            >
              Demo Recruiter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
