"use client";

import React, { useState } from "react";
import { CandidatePreferences, CandidateVisibility } from "@/lib/auth";
import { ProfileSectionCard } from "./ProfileSectionCard";
import { useToast } from "@/components/ui/Toast";

interface CareerPreferencesSectionProps {
  preferences: CandidatePreferences;
  visibility: CandidateVisibility;
  onPreferencesChange: (updated: CandidatePreferences) => void;
  onVisibilityChange: (updated: CandidateVisibility) => void;
}

export function CareerPreferencesSection({
  preferences,
  visibility,
  onPreferencesChange,
  onVisibilityChange,
}: CareerPreferencesSectionProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [formPrefs, setFormPrefs] = useState<CandidatePreferences>(preferences);
  const [formVis, setFormVis] = useState<CandidateVisibility>(visibility);
  const [rolesInput, setRolesInput] = useState(preferences.preferredRoles?.join(", ") || "");

  React.useEffect(() => {
    setFormPrefs(preferences);
    setFormVis(visibility);
    setRolesInput(preferences.preferredRoles?.join(", ") || "");
  }, [preferences, visibility]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rolesArray = rolesInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const updatedPrefs: CandidatePreferences = {
      ...formPrefs,
      preferredRoles: rolesArray,
    };

    onPreferencesChange(updatedPrefs);
    onVisibilityChange(formVis);
    setIsEditing(false);
    showToast("Career preferences and visibility settings updated!", "success");
  };

  const getStatusLabel = (status: CandidatePreferences["openToWorkStatus"]) => {
    switch (status) {
      case "ACTIVELY_LOOKING":
        return { label: "Actively Looking (Available Immediately)", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
      case "OPEN_TO_OFFERS":
        return { label: "Open to High-Fit Opportunities", color: "bg-primary/15 text-primary border-primary/30" };
      case "OPEN_TO_RECRUITERS":
        return { label: "Open to Recruiter Outreach", color: "bg-secondary-container text-on-secondary-container border-outline-variant/30" };
      case "FREELANCE_CONTRACT":
        return { label: "Available for Freelance / Contract", color: "bg-amber-500/15 text-amber-800 border-amber-500/30" };
      case "NOT_LOOKING":
        return { label: "Not Currently Looking", color: "bg-surface-container-high text-outline border-outline-variant/30" };
      default:
        return { label: "Open to Opportunities", color: "bg-primary/10 text-primary border-primary/20" };
    }
  };

  const statusBadge = getStatusLabel(preferences.openToWorkStatus);

  return (
    <ProfileSectionCard
      title="Career Preferences & Search Visibility"
      subtitle="Control how recruiters discover your profile, notice period, and compensation expectations."
      icon="tune"
      actionButton={
        <button
          onClick={() => {
            if (isEditing) {
              setFormPrefs(preferences);
              setFormVis(visibility);
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
          className={`px-3.5 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
            isEditing
              ? "bg-surface-container-high text-on-surface"
              : "bg-primary/10 hover:bg-primary/20 text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-sm">{isEditing ? "close" : "edit"}</span>
          {isEditing ? "Cancel" : "Edit Preferences"}
        </button>
      }
    >
      {!isEditing ? (
        /* View Mode */
        <div className="space-y-6">
          {/* Status Highlight Banner */}
          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Job Search Status
              </span>
              <span className={`inline-block px-3 py-1 font-bold text-xs rounded-full border ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-on-surface-variant font-medium">Recruiter Discoverability:</span>
              <span className={`font-bold flex items-center gap-1 ${visibility.isDiscoverable ? "text-emerald-700" : "text-outline"}`}>
                <span className="material-symbols-outlined text-sm">
                  {visibility.isDiscoverable ? "visibility" : "visibility_off"}
                </span>
                {visibility.isDiscoverable ? "Active in AI Talent Search" : "Hidden from Search"}
              </span>
            </div>
          </div>

          {/* Preferences Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase">Work Model & Relocation</span>
              <p className="font-bold text-on-surface">
                {preferences.remotePreference === "REMOTE" ? "100% Remote" : preferences.remotePreference === "HYBRID" ? "Hybrid / Remote" : "Onsite"}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                Relocation: <strong>{preferences.relocation === "YES" ? "Willing to relocate" : preferences.relocation === "OPEN" ? "Open to discussion" : "No relocation"}</strong>
              </p>
            </div>

            <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase">Notice Period / Availability</span>
              <p className="font-bold text-primary">
                {preferences.noticePeriod === "IMMEDIATE" ? "Available Immediately" : preferences.noticePeriod === "1_WEEK" ? "1 Week" : preferences.noticePeriod === "2_WEEKS" ? "2 Weeks (Standard)" : preferences.noticePeriod === "1_MONTH" ? "1 Month" : "2+ Months"}
              </p>
              <p className="text-[11px] text-on-surface-variant">Priority boosted in urgent hiring filters</p>
            </div>

            <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-1">
              <span className="text-[10px] font-bold text-outline uppercase">Expected Compensation</span>
              <p className="font-bold text-emerald-700 font-mono">
                {preferences.expectedSalaryMin
                  ? `${preferences.currency || "USD"} $${preferences.expectedSalaryMin.toLocaleString()} ${preferences.expectedSalaryMax ? `- $${preferences.expectedSalaryMax.toLocaleString()}` : "+"} / ${preferences.salaryPeriod === "MONTH" ? "mo" : "yr"}`
                  : "Open to market competitive offers"}
              </p>
              <p className="text-[11px] text-on-surface-variant">Visible only to verified enterprise recruiters</p>
            </div>
          </div>

          {/* Preferred Roles & Employment Types */}
          {preferences.preferredRoles && preferences.preferredRoles.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Target Job Titles & Roles
              </span>
              <div className="flex flex-wrap gap-2">
                {preferences.preferredRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-xl border border-outline-variant/30"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSave} className="space-y-6 text-xs font-body-md">
          {/* Status Selector */}
          <div>
            <label className="block font-bold text-outline uppercase text-[10px] pb-1">
              Current Job Search Status *
            </label>
            <select
              value={formPrefs.openToWorkStatus}
              onChange={(e) => setFormPrefs({ ...formPrefs, openToWorkStatus: e.target.value as any })}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-bold"
            >
              <option value="ACTIVELY_LOOKING">Actively Looking (Available Immediately / Ready to Interview)</option>
              <option value="OPEN_TO_OFFERS">Open to High-Fit Opportunities (Evaluating Roles)</option>
              <option value="OPEN_TO_RECRUITERS">Open to Recruiter Outreach</option>
              <option value="FREELANCE_CONTRACT">Available for Freelance / Contract Work</option>
              <option value="NOT_LOOKING">Not Currently Looking (Passive)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Remote Work Preference
              </label>
              <select
                value={formPrefs.remotePreference}
                onChange={(e) => setFormPrefs({ ...formPrefs, remotePreference: e.target.value as any })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="REMOTE">100% Remote Only</option>
                <option value="HYBRID">Hybrid (Flexible In-Office/Remote)</option>
                <option value="ONSITE">Onsite / Office</option>
                <option value="ANY">Open to Any Work Model</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Notice Period / Availability
              </label>
              <select
                value={formPrefs.noticePeriod}
                onChange={(e) => setFormPrefs({ ...formPrefs, noticePeriod: e.target.value as any })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="IMMEDIATE">Immediate (0 Days / Available Now)</option>
                <option value="1_WEEK">1 Week</option>
                <option value="2_WEEKS">2 Weeks (Standard Notice)</option>
                <option value="1_MONTH">1 Month</option>
                <option value="2_MONTHS">2 Months</option>
                <option value="3_MONTHS_PLUS">3+ Months</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Relocation Preference
              </label>
              <select
                value={formPrefs.relocation}
                onChange={(e) => setFormPrefs({ ...formPrefs, relocation: e.target.value as any })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="OPEN">Open to Relocation</option>
                <option value="YES">Actively Seeking Relocation</option>
                <option value="NO">No Relocation</option>
              </select>
            </div>
          </div>

          {/* Target Roles */}
          <div>
            <label className="block font-bold text-outline uppercase text-[10px] pb-1">
              Preferred Target Roles (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Full-Stack Engineer, Lead Frontend Architect, Staff Engineer"
              value={rolesInput}
              onChange={(e) => setRolesInput(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Compensation Expectations */}
          <div className="p-4 bg-surface-container-low rounded-2xl space-y-3 border border-outline-variant/20">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
              Target Compensation Range
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Currency</label>
                <select
                  value={formPrefs.currency || "USD"}
                  onChange={(e) => setFormPrefs({ ...formPrefs, currency: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Minimum Expected</label>
                <input
                  type="number"
                  placeholder="e.g. 120000"
                  value={formPrefs.expectedSalaryMin || ""}
                  onChange={(e) => setFormPrefs({ ...formPrefs, expectedSalaryMin: Number(e.target.value) || undefined })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Maximum Expected</label>
                <input
                  type="number"
                  placeholder="e.g. 160000"
                  value={formPrefs.expectedSalaryMax || ""}
                  onChange={(e) => setFormPrefs({ ...formPrefs, expectedSalaryMax: Number(e.target.value) || undefined })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">Period</label>
                <select
                  value={formPrefs.salaryPeriod || "YEAR"}
                  onChange={(e) => setFormPrefs({ ...formPrefs, salaryPeriod: e.target.value as any })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface"
                >
                  <option value="YEAR">Per Year</option>
                  <option value="MONTH">Per Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Discoverability Toggles */}
          <div className="p-4 bg-surface-container-low rounded-2xl space-y-3 border border-outline-variant/20">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
              Search Discoverability & Privacy
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formVis.isDiscoverable}
                  onChange={(e) => setFormVis({ ...formVis, isDiscoverable: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <div>
                  <span className="font-bold text-on-surface text-xs block">Allow verified recruiters to discover my profile</span>
                  <span className="text-[11px] text-on-surface-variant">When disabled, your profile will not appear in recruiter AI sourcing search results.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formVis.contactVisibility === "DIRECT"}
                  onChange={(e) => setFormVis({ ...formVis, contactVisibility: e.target.checked ? "DIRECT" : "MASKED" })}
                  className="w-4 h-4 text-primary rounded"
                />
                <div>
                  <span className="font-bold text-on-surface text-xs block">Share contact details directly with verified hiring partners</span>
                  <span className="text-[11px] text-on-surface-variant">When unchecked, contact details remain masked until you explicitly approve contact requests.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-sm"
            >
              Save Preferences
            </button>
          </div>
        </form>
      )}
    </ProfileSectionCard>
  );
}
