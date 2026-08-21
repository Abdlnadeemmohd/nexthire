"use client";

import React, { useState, useEffect } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { ProfileCompletenessWidget } from "@/components/profile/ProfileCompletenessWidget";
import { Modal } from "@/components/ui/Modal";
import { RecruiterProfileData, CompanyAssociation, RecruiterHiringStatus } from "@/lib/auth";

export default function RecruiterProfilePage() {
  const { showToast } = useToast();
  const { user, updateUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingHiring, setIsEditingHiring] = useState(false);
  const [isEditingExpertise, setIsEditingExpertise] = useState(false);

  // Recruiter Profile Data
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    headline: user?.headline || "",
    bio: user?.bio || "",
    location: user?.city ? `${user.city}, ${user.country}` : "San Francisco, CA",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
    company: user?.companyName || "",
    companyId: user?.companyId || "",
    recruiterData: {
      status: "ACTIVELY_HIRING" as RecruiterHiringStatus,
      recruiterRole: "Technical Talent Partner",
      yearsExperience: 5,
      industryFocus: ["Software Engineering", "Cloud & DevOps", "AI & Data"],
      recruitingSpecialties: ["Full-Stack Engineering", "Infrastructure", "Engineering Leadership"],
      recruitingSkills: ["Technical Sourcing", "Executive Search", "Candidate Assessment"],
      languages: ["English"],
      targetRoles: ["Senior Full-Stack Engineer", "Staff Backend Architect", "Cloud Lead"],
      departments: ["Engineering", "Product", "Infrastructure"],
      seniorityLevels: ["Mid-Level", "Senior", "Lead / Staff"],
      hiringLocations: ["San Francisco, CA", "Remote"],
      remotePreferences: ["Remote", "Hybrid"],
      employmentTypes: ["Full-time", "Contract"],
      hiringVolume: "3-5 hires per month",
      links: [],
      achievements: [],
      companyAssociations: [] as CompanyAssociation[],
    } as RecruiterProfileData,
    metrics: {
      activeVacancies: 0,
      totalApplicants: 0,
      candidatesHired: 0,
      avgResponseTime: "7-Day SLA",
    },
    completeness: 85,
    missingSections: [] as string[],
    recommendations: [] as string[],
  });

  // Company Association Modal State
  const [assocModalOpen, setAssocModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingCompanies, setSearchingCompanies] = useState(false);
  const [newAssoc, setNewAssoc] = useState<CompanyAssociation>({
    companyId: "",
    companyName: "",
    relationship: "CURRENT_EMPLOYER",
    role: "Technical Recruiter",
    startDate: new Date().getFullYear().toString(),
    isCurrent: true,
  });

  const loadRecruiterProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recruiter/profile", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setProfileData({
            name: d.name || "",
            headline: d.headline || "",
            bio: d.bio || "",
            location: d.location || "",
            phone: d.phone || "",
            avatar: d.avatar || "",
            company: d.company || "",
            companyId: d.companyId || "",
            recruiterData: d.recruiterData || profileData.recruiterData,
            metrics: d.metrics || profileData.metrics,
            completeness: typeof d.completeness === "number" ? d.completeness : 85,
            missingSections: d.missingSections || [],
            recommendations: d.recommendations || [],
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
    loadRecruiterProfile();
  }, []);

  const saveRecruiterProfile = async (overrides: Record<string, any> = {}) => {
    try {
      setSaving(true);
      const payload = {
        name: profileData.name,
        headline: profileData.headline,
        bio: profileData.bio,
        location: profileData.location,
        phone: profileData.phone,
        avatar: profileData.avatar,
        companyId: profileData.companyId,
        recruiterData: profileData.recruiterData,
        ...overrides,
      };

      const res = await fetch("/api/recruiter/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (typeof json.data?.completeness === "number") {
          setProfileData((prev) => ({
            ...prev,
            completeness: json.data.completeness,
            missingSections: json.data.missingSections || [],
            recommendations: json.data.recommendations || [],
          }));
        }
        updateUserProfile({
          name: profileData.name,
          headline: profileData.headline,
          avatar: profileData.avatar || undefined,
        });
        showToast("Recruiter profile updated successfully!", "success");
        return true;
      } else {
        showToast(json.error || "Failed to update recruiter profile.", "error");
        return false;
      }
    } catch (err) {
      console.error("Error saving recruiter profile:", err);
      showToast("Network error saving profile.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Search Companies for Association
  const handleSearchCompanies = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingCompanies(true);
      const res = await fetch(`/api/companies?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.companies || json.data || []);
      }
    } catch (err) {
      console.error("Error searching companies:", err);
    } finally {
      setSearchingCompanies(false);
    }
  };

  const handleSelectCompanyResult = (comp: any) => {
    setNewAssoc({
      ...newAssoc,
      companyId: comp.id,
      companyName: comp.name,
      logoUrl: comp.logo,
      isVerifiedCompany: comp.isVerified,
    });
    setSearchResults([]);
    setSearchQuery(comp.name);
  };

  const handleSaveAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssoc.companyName.trim()) {
      showToast("Please select or enter a company name.", "error");
      return;
    }

    const currentAssociations = profileData.recruiterData.companyAssociations || [];
    const updatedAssociations = [
      ...currentAssociations.filter((a) => a.companyName.toLowerCase() !== newAssoc.companyName.toLowerCase()),
      {
        ...newAssoc,
        companyName: newAssoc.companyName.trim(),
      },
    ];

    const updatedRecruiterData: RecruiterProfileData = {
      ...profileData.recruiterData,
      companyAssociations: updatedAssociations,
    };

    setProfileData((prev) => ({
      ...prev,
      recruiterData: updatedRecruiterData,
    }));

    await saveRecruiterProfile({ recruiterData: updatedRecruiterData });
    setAssocModalOpen(false);
    showToast("Company association saved!", "success");
  };

  const handleRemoveAssociation = async (compName: string) => {
    const next = (profileData.recruiterData.companyAssociations || []).filter(
      (a) => a.companyName !== compName
    );
    const updatedRecruiterData = {
      ...profileData.recruiterData,
      companyAssociations: next,
    };
    setProfileData((prev) => ({ ...prev, recruiterData: updatedRecruiterData }));
    await saveRecruiterProfile({ recruiterData: updatedRecruiterData });
    showToast("Company association removed", "info");
  };

  const getStatusBadge = (st: RecruiterHiringStatus) => {
    switch (st) {
      case "ACTIVELY_HIRING":
        return { label: "Actively Hiring (Priority)", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
      case "HIRING":
        return { label: "Hiring Open Roles", color: "bg-primary/15 text-primary border-primary/30" };
      case "OPEN_TO_OUTREACH":
        return { label: "Open to Candidate Outreach", color: "bg-secondary-container text-on-secondary-container border-outline-variant/30" };
      case "BUILDING_PIPELINE":
        return { label: "Building Talent Pipeline", color: "bg-amber-500/15 text-amber-800 border-amber-500/30" };
      case "HIRING_MULTIPLE":
        return { label: "Hiring Across Multiple Teams", color: "bg-primary text-on-primary border-primary" };
      case "NOT_HIRING":
        return { label: "Not Currently Hiring", color: "bg-surface-container-high text-outline border-outline-variant/30" };
      default:
        return { label: "Actively Hiring", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
    }
  };

  const hiringBadge = getStatusBadge(profileData.recruiterData.status || "ACTIVELY_HIRING");

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8 pb-20 sm:pb-24">
            {/* 1. Recruiter Completeness Gauge */}
            <ProfileCompletenessWidget
              score={profileData.completeness}
              missingSections={profileData.missingSections}
              recommendations={profileData.recommendations}
              role="recruiter"
            />

            {/* 2. Recruiter Identity Header */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-md relative">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
                  {isEditingHeader ? (
                    <ImageUpload
                      currentImageUrl={profileData.avatar}
                      onImageChange={(url) => setProfileData({ ...profileData, avatar: url || "" })}
                      shape="circle"
                      size="md"
                      fallbackInitial={profileData.name || "R"}
                    />
                  ) : (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-md flex-shrink-0">
                      <img
                        src={profileData.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"}
                        alt={profileData.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-on-surface truncate">
                        {profileData.name || "Verified Talent Partner"}
                      </h1>
                      <VerifiedBadge role="RECRUITER" size="md" />
                    </div>

                    <p className="text-primary font-bold text-xs sm:text-sm">
                      {profileData.headline || "Technical Recruiter & Talent Partner"}
                      {profileData.company ? ` • ${profileData.company}` : ""}
                    </p>

                    <p className="text-outline text-xs flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {profileData.location || "San Francisco, CA"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingHeader(!isEditingHeader)}
                  className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-base">
                    {isEditingHeader ? "close" : "edit"}
                  </span>
                  {isEditingHeader ? "Cancel Edit" : "Edit Recruiter Info"}
                </button>
              </div>

              {!isEditingHeader && profileData.bio && (
                <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/15 text-xs sm:text-sm text-on-surface-variant leading-relaxed italic">
                  "{profileData.bio}"
                </div>
              )}

              {isEditingHeader && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await saveRecruiterProfile({
                      name: profileData.name,
                      headline: profileData.headline,
                      bio: profileData.bio,
                      location: profileData.location,
                      phone: profileData.phone,
                      avatar: profileData.avatar,
                    });
                    if (ok) setIsEditingHeader(false);
                  }}
                  className="pt-4 border-t border-outline-variant/20 space-y-4 text-xs font-body-md"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Recruiter Headline / Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lead Technical Recruiter | AI & Systems"
                        value={profileData.headline}
                        onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Location</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Phone</label>
                      <input
                        type="text"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">About / Recruiter Philosophy</label>
                    <textarea
                      rows={3}
                      placeholder="Share your hiring philosophy, the engineering teams you support, and how you partner with candidates..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingHeader(false)}
                      className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-primary-container shadow-sm"
                    >
                      {saving ? "Saving..." : "Save Identity Info"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 3. Hiring Status & Active Sourcing Priorities */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
                    <span className="material-symbols-outlined text-xl">campaign</span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                      Hiring Status & Active Sourcing Focus
                    </h2>
                    <p className="text-xs text-on-surface-variant font-body-md pt-0.5">
                      Signal active hiring pipelines to candidate search algorithms.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingHiring(!isEditingHiring)}
                  className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-sm">{isEditingHiring ? "close" : "edit"}</span>
                  {isEditingHiring ? "Cancel" : "Edit Sourcing Priorities"}
                </button>
              </div>

              {!isEditingHiring ? (
                <div className="space-y-5">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Current Hiring Status</span>
                      <span className={`inline-block mt-1 px-3 py-1 font-bold text-xs rounded-full border ${hiringBadge.color}`}>
                        {hiringBadge.label}
                      </span>
                    </div>

                    <div className="text-xs text-on-surface-variant">
                      Target Volume: <strong className="text-on-surface">{profileData.recruiterData.hiringVolume || "3-5 roles"}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-1">
                      <span className="text-[10px] font-bold text-outline uppercase">Target Roles</span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(profileData.recruiterData.targetRoles || []).map((r, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-surface-container-high rounded text-on-surface font-semibold text-[11px]">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-1">
                      <span className="text-[10px] font-bold text-outline uppercase">Departments</span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(profileData.recruiterData.departments || []).map((d, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-primary/10 rounded text-primary font-semibold text-[11px]">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-1">
                      <span className="text-[10px] font-bold text-outline uppercase">Seniority Levels</span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(profileData.recruiterData.seniorityLevels || []).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-surface-container-high rounded text-on-surface font-semibold text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await saveRecruiterProfile({ recruiterData: profileData.recruiterData });
                    setIsEditingHiring(false);
                  }}
                  className="space-y-4 text-xs font-body-md"
                >
                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Hiring Status *</label>
                    <select
                      value={profileData.recruiterData.status}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          recruiterData: { ...profileData.recruiterData, status: e.target.value as any },
                        })
                      }
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="ACTIVELY_HIRING">Actively Hiring (Priority)</option>
                      <option value="HIRING">Hiring Open Roles</option>
                      <option value="HIRING_MULTIPLE">Hiring Across Multiple Teams</option>
                      <option value="OPEN_TO_OUTREACH">Open to Candidate Outreach</option>
                      <option value="BUILDING_PIPELINE">Building Talent Pipeline</option>
                      <option value="NOT_HIRING">Not Currently Hiring</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Target Roles (Comma-separated)</label>
                      <input
                        type="text"
                        value={profileData.recruiterData.targetRoles?.join(", ") || ""}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            recruiterData: {
                              ...profileData.recruiterData,
                              targetRoles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            },
                          })
                        }
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Departments (Comma-separated)</label>
                      <input
                        type="text"
                        value={profileData.recruiterData.departments?.join(", ") || ""}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            recruiterData: {
                              ...profileData.recruiterData,
                              departments: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            },
                          })
                        }
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingHiring(false)}
                      className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-sm"
                    >
                      Save Sourcing Focus
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 4. Multi-Company Associations */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-xl">domain</span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                      Hiring Company Associations
                    </h2>
                    <p className="text-xs text-on-surface-variant font-body-md pt-0.5">
                      Companies and venture portfolios you represent and hire for.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewAssoc({
                      companyId: "",
                      companyName: "",
                      relationship: "CURRENT_EMPLOYER",
                      role: profileData.headline || "Technical Recruiter",
                      startDate: new Date().getFullYear().toString(),
                      isCurrent: true,
                    });
                    setSearchQuery("");
                    setSearchResults([]);
                    setAssocModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-sm">add_business</span>
                  Associate Company
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(profileData.recruiterData.companyAssociations || []).map((assoc, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 bg-surface-container-low/50 rounded-2xl border border-outline-variant/20 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                        {assoc.logoUrl ? (
                          <img src={assoc.logoUrl} alt={assoc.companyName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="material-symbols-outlined text-xl">domain</span>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs sm:text-sm text-on-surface">{assoc.companyName}</h4>
                          {assoc.isVerifiedCompany && (
                            <span className="text-primary material-symbols-outlined text-sm" title="Verified Company">verified</span>
                          )}
                        </div>
                        <p className="text-xs text-primary font-semibold">{assoc.role || "Recruiter"}</p>
                        <span className="inline-block px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant">
                          {assoc.relationship === "CURRENT_EMPLOYER"
                            ? "Current Employer"
                            : assoc.relationship === "RETAINED_AGENCY"
                            ? "Retained Agency Partner"
                            : assoc.relationship === "VENTURE_PORTFOLIO"
                            ? "Venture Partner"
                            : "Talent Advisor"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveAssociation(assoc.companyName)}
                      className="p-1.5 text-outline hover:text-error rounded-lg"
                      title="Remove Association"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Sourcing Expertise & Domains */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-xl">psychology</span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                      Recruiting Expertise & Domains
                    </h2>
                    <p className="text-xs text-on-surface-variant font-body-md pt-0.5">
                      Your recruiting specialties, technical depth, and candidate assessment competencies.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingExpertise(!isEditingExpertise)}
                  className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-sm">{isEditingExpertise ? "close" : "edit"}</span>
                  {isEditingExpertise ? "Cancel" : "Edit Expertise"}
                </button>
              </div>

              {!isEditingExpertise ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-2">
                    <span className="text-[10px] font-bold text-outline uppercase">Industry Focus</span>
                    <div className="flex flex-wrap gap-1">
                      {(profileData.recruiterData.industryFocus || []).map((i, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-surface-container-high text-on-surface font-semibold rounded-lg text-xs">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-2">
                    <span className="text-[10px] font-bold text-outline uppercase">Specialties</span>
                    <div className="flex flex-wrap gap-1">
                      {(profileData.recruiterData.recruitingSpecialties || []).map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded-lg text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-2">
                    <span className="text-[10px] font-bold text-outline uppercase">Recruiting Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {(profileData.recruiterData.recruitingSkills || []).map((sk, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-surface-container-high text-on-surface font-semibold rounded-lg text-xs">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await saveRecruiterProfile({ recruiterData: profileData.recruiterData });
                    setIsEditingExpertise(false);
                  }}
                  className="space-y-4 text-xs font-body-md"
                >
                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Industry Focus (Comma-separated)</label>
                    <input
                      type="text"
                      value={profileData.recruiterData.industryFocus?.join(", ") || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          recruiterData: {
                            ...profileData.recruiterData,
                            industryFocus: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Recruiting Specialties (Comma-separated)</label>
                    <input
                      type="text"
                      value={profileData.recruiterData.recruitingSpecialties?.join(", ") || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          recruiterData: {
                            ...profileData.recruiterData,
                            recruitingSpecialties: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Recruiting Skills (Comma-separated)</label>
                    <input
                      type="text"
                      value={profileData.recruiterData.recruitingSkills?.join(", ") || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          recruiterData: {
                            ...profileData.recruiterData,
                            recruitingSkills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingExpertise(false)}
                      className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-sm"
                    >
                      Save Expertise
                    </button>
                  </div>
                </form>
              )}
            </div>
          </main>

          <Footer />
        </div>
      </div>

      {/* Associate Company Modal */}
      {assocModalOpen && (
        <Modal
          isOpen={assocModalOpen}
          onClose={() => setAssocModalOpen(false)}
          title="Associate with Hiring Company"
        >
          <form onSubmit={handleSaveAssociation} className="space-y-4 text-xs font-body-md">
            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Company Name * (Search or type new)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Type to search existing companies (e.g. Acme, NextHire)..."
                  value={searchQuery}
                  onChange={(e) => {
                    handleSearchCompanies(e.target.value);
                    setNewAssoc({ ...newAssoc, companyName: e.target.value });
                  }}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {searchingCompanies && (
                  <span className="absolute right-3 top-3 material-symbols-outlined text-sm animate-spin text-primary">
                    progress_activity
                  </span>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant/30 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    {searchResults.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => handleSelectCompanyResult(comp)}
                        className="p-2.5 hover:bg-primary/10 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-bold text-on-surface">{comp.name}</span>
                        <span className="text-[10px] text-outline">{comp.industry || "Company"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Relationship Type *
              </label>
              <select
                value={newAssoc.relationship}
                onChange={(e) => setNewAssoc({ ...newAssoc, relationship: e.target.value as any })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CURRENT_EMPLOYER">Current In-House Employer</option>
                <option value="RETAINED_AGENCY">Retained Agency Partner</option>
                <option value="VENTURE_PORTFOLIO">Venture / Portfolio Company</option>
                <option value="ADVISORY">Talent Advisor / Consultant</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Your Role at Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Technical Recruiter"
                  value={newAssoc.role}
                  onChange={(e) => setNewAssoc({ ...newAssoc, role: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                  Start Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2023"
                  value={newAssoc.startDate || ""}
                  onChange={(e) => setNewAssoc({ ...newAssoc, startDate: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssocModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-sm"
              >
                Save Association
              </button>
            </div>
          </form>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
