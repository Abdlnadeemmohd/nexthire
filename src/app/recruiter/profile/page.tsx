"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function MyRecruiterProfilePage() {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [recruiterData, setRecruiterData] = useState({
    id: "",
    name: "",
    title: "",
    company: "",
    email: "",
    avatar: "",
    location: "",
    bio: "",
    metrics: {
      activeVacancies: 0,
      totalApplicants: 0,
    },
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recruiter/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setRecruiterData({
            id: data.data.id || "",
            name: data.data.name || "",
            email: data.data.email || "",
            title: data.data.headline || data.data.title || "",
            bio: data.data.bio || "",
            location: data.data.location || "",
            avatar: data.data.avatar || "",
            company: data.data.company || "",
            metrics: {
              activeVacancies: data.data.metrics?.activeVacancies ?? 0,
              totalApplicants: data.data.metrics?.totalApplicants ?? 0,
            },
          });
        }
      }
    } catch (err) {
      console.error("Failed to load recruiter profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/recruiter/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recruiterData.name,
          headline: recruiterData.title,
          bio: recruiterData.bio,
          location: recruiterData.location,
          avatar: recruiterData.avatar,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Recruiter profile updated in Neon PostgreSQL!", "success");
        setIsEditing(false);
        loadProfile();
      } else {
        showToast(data.error || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast("Network error updating profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "My Recruiter Profile" }]} />

            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Recruiter Profile
                </h1>
                <p className="text-on-surface-variant text-xs sm:text-sm font-body-md">
                  Manage your personal recruiter identity displayed on job postings and candidate communications.
                </p>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-base">{isEditing ? "close" : "edit"}</span>
                {isEditing ? "Cancel Edit" : "Edit Recruiter Profile"}
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                Loading recruiter profile from database...
              </div>
            ) : (
              <>
                {/* Recruiter Overview Hero Card */}
                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 relative shadow-md">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="relative flex-shrink-0">
                      {recruiterData.avatar ? (
                        <img
                          src={recruiterData.avatar}
                          alt={recruiterData.name}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-primary/30 shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-surface-container-high flex items-center justify-center border-4 border-primary/30 text-primary text-3xl font-bold">
                          {recruiterData.name ? recruiterData.name.charAt(0).toUpperCase() : "R"}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white" title="Active Account">
                        <span className="material-symbols-outlined text-xs block">check_circle</span>
                      </div>
                    </div>

                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="font-display text-2xl font-bold text-on-surface">
                          {recruiterData.name || "Recruiter"}
                        </h2>
                        <VerifiedBadge role="RECRUITER" size="md" />
                      </div>

                      <p className="text-sm font-bold text-primary">
                        {recruiterData.title || "Technical Recruiter"}
                      </p>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {recruiterData.company ? `${recruiterData.company}` : "Employer Organization"}
                        {recruiterData.location ? ` • 📍 ${recruiterData.location}` : ""}
                      </p>

                      {recruiterData.bio ? (
                        <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 italic">
                          "{recruiterData.bio}"
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Recruiter Statistics Metric Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
                    <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                      <span className="text-[10px] font-bold text-outline uppercase block">Active Vacancies</span>
                      <span className="font-bold text-on-surface font-mono text-base">{recruiterData.metrics.activeVacancies} Roles</span>
                    </div>

                    <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                      <span className="text-[10px] font-bold text-outline uppercase block">Total Applicants</span>
                      <span className="font-bold text-primary font-mono text-base">{recruiterData.metrics.totalApplicants} Applicants</span>
                    </div>

                    <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                      <span className="text-[10px] font-bold text-outline uppercase block">Response SLA</span>
                      <span className="font-bold text-emerald-700 font-mono text-base">7-Day Target</span>
                    </div>

                    <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 shadow-xs">
                      <span className="text-[10px] font-bold text-outline uppercase block">Account Status</span>
                      <span className="font-bold text-primary font-mono text-base">Verified</span>
                    </div>
                  </div>
                </div>

                {/* Recruiter Profile Edit Form */}
                {isEditing && (
                  <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/30 space-y-6 text-xs font-body-md shadow-xl">
                    <h3 className="font-bold text-base text-on-surface border-b pb-2">Edit My Recruiter Credentials</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={recruiterData.name}
                          onChange={(e) => setRecruiterData({ ...recruiterData, name: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Professional Title</label>
                        <input
                          type="text"
                          required
                          value={recruiterData.title}
                          onChange={(e) => setRecruiterData({ ...recruiterData, title: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Location</label>
                        <input
                          type="text"
                          value={recruiterData.location}
                          onChange={(e) => setRecruiterData({ ...recruiterData, location: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Avatar Image URL</label>
                        <input
                          type="url"
                          value={recruiterData.avatar}
                          onChange={(e) => setRecruiterData({ ...recruiterData, avatar: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Recruiter Bio & Focus</label>
                      <textarea
                        rows={3}
                        value={recruiterData.bio}
                        onChange={(e) => setRecruiterData({ ...recruiterData, bio: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary-container disabled:opacity-50"
                      >
                        {saving ? "Saving to Neon..." : "Save to Database"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
