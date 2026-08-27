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
    isVerified: false,
    subscriptionTier: "TRIAL",
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
  const [selectedEnrichedDetails, setSelectedEnrichedDetails] = useState<any | null>(null);
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
            isVerified: d.isVerified ?? false,
            subscriptionTier: d.subscriptionTier || "TRIAL",
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

  // Search Companies for Association (Directory + Enrichment Provider)
  const handleSearchCompanies = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingCompanies(true);
      const directoryPromise = fetch(`/api/companies?q=${encodeURIComponent(q)}`).then((r) =>
        r.ok ? r.json() : { data: [] }
      );
      const enrichPromise =
        q.trim().length >= 3
          ? fetch(`/api/companies/enrich`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: q.trim() }),
            }).then((r) => (r.ok ? r.json() : { success: false }))
          : Promise.resolve({ success: false });

      const [dirRes, enrichRes] = await Promise.all([directoryPromise, enrichPromise]);

      const dirCompanies = (dirRes.companies || dirRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        logo: c.logo,
        industry: c.industry || "Technology",
        location: c.location || "Headquarters",
        website: c.website || "",
        description: c.description || "",
        isVerified: !!c.isVerified,
        source: "NextHire Directory",
      }));

      const results = [...dirCompanies];

      if (enrichRes.success && enrichRes.data) {
        const enriched = enrichRes.data;
        const exists = results.some(
          (c) => c.name.toLowerCase() === enriched.name.toLowerCase()
        );
        if (!exists) {
          results.unshift({
            id: "",
            name: enriched.name,
            logo: enriched.logoUrl || null,
            industry: enriched.industry || "Technology",
            location: enriched.headquarters || "San Francisco, CA",
            website: enriched.website || "",
            description: enriched.description || "",
            isVerified: false,
            source: enriched.source || "Canonical Company Knowledge",
            isEnriched: true,
          });
        }
      }

      setSearchResults(results);
    } catch (err) {
      console.error("Error searching companies:", err);
    } finally {
      setSearchingCompanies(false);
    }
  };

  const handleSelectCompanyResult = (comp: any) => {
    setNewAssoc({
      ...newAssoc,
      companyId: comp.id || "",
      companyName: comp.name,
      logoUrl: comp.logo || comp.logoUrl || null,
      isVerifiedCompany: !!comp.isVerified,
    });
    setSelectedEnrichedDetails({
      name: comp.name,
      website: comp.website || "",
      industry: comp.industry || "Technology",
      location: comp.location || comp.headquarters || "San Francisco, CA",
      description: comp.description || "",
      logoUrl: comp.logo || comp.logoUrl || null,
      isVerified: !!comp.isVerified,
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
        logoUrl: selectedEnrichedDetails?.logoUrl || newAssoc.logoUrl || null,
        isVerifiedCompany: selectedEnrichedDetails?.isVerified ?? newAssoc.isVerifiedCompany ?? false,
      },
    ];

    const updatedRecruiterData: RecruiterProfileData = {
      ...profileData.recruiterData,
      companyAssociations: updatedAssociations,
    };

    const isCurrent = newAssoc.relationship === "CURRENT_EMPLOYER";

    setProfileData((prev) => ({
      ...prev,
      company: isCurrent ? newAssoc.companyName.trim() : prev.company,
      companyId: isCurrent && newAssoc.companyId ? newAssoc.companyId : prev.companyId,
      isVerified: isCurrent && selectedEnrichedDetails?.isVerified ? true : prev.isVerified,
      recruiterData: updatedRecruiterData,
    }));

    await saveRecruiterProfile({
      companyId: isCurrent && newAssoc.companyId ? newAssoc.companyId : profileData.companyId,
      recruiterData: updatedRecruiterData,
    });

    setAssocModalOpen(false);
    showToast("Company association saved successfully!", "success");
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8 pb-16">
            {/* 1. Recruiter Completeness Gauge */}
            <div id="section-completeness">
              <ProfileCompletenessWidget
                score={profileData.completeness}
                missingSections={profileData.missingSections}
                recommendations={profileData.recommendations}
                role="recruiter"
              />
            </div>

            {/* 2. Recruiter Identity Header */}
            <div id="section-identity" className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-md relative">
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
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-on-surface truncate">
                        {profileData.name || "Talent Acquisition Partner"}
                      </h1>

                      <VerifiedBadge
                        isVerified={user?.isVerified ?? profileData.isVerified}
                        role="RECRUITER"
                        tier={user?.subscriptionTier || profileData.subscriptionTier}
                        size="md"
                      />

                      {/* Recruiter Hiring Availability Status */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/25 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true"></span>
                        {profileData.recruiterData?.status === "ACTIVELY_HIRING"
                          ? "Actively Hiring"
                          : profileData.recruiterData?.status === "HIRING"
                          ? "Hiring"
                          : profileData.recruiterData?.status === "OPEN_TO_OUTREACH"
                          ? "Open to Outreach"
                          : profileData.recruiterData?.status === "HIRING_MULTIPLE"
                          ? "Recruiting for Multiple Roles"
                          : profileData.recruiterData?.status === "NOT_HIRING"
                          ? "Not Currently Hiring"
                          : "Actively Hiring"}
                      </span>
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
                  className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto touch-target"
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
                      recruiterData: profileData.recruiterData,
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
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Hiring Availability Status *</label>
                      <select
                        value={profileData.recruiterData?.status || "ACTIVELY_HIRING"}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            recruiterData: {
                              ...profileData.recruiterData,
                              status: e.target.value as RecruiterHiringStatus,
                            },
                          })
                        }
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="ACTIVELY_HIRING">Actively Hiring</option>
                        <option value="HIRING">Hiring</option>
                        <option value="OPEN_TO_OUTREACH">Open to Outreach</option>
                        <option value="HIRING_MULTIPLE">Recruiting for Multiple Roles</option>
                        <option value="NOT_HIRING">Not Currently Hiring</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Location</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
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
            <div id="section-priorities" className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs items-stretch">
                    <div className="flex flex-col justify-between h-full min-h-[140px] p-5 bg-surface-container-lowest/80 rounded-2xl border border-outline-variant/20 space-y-3">
                      <div className="flex items-center gap-2 text-outline uppercase font-bold text-[10px] pb-1 border-b border-outline-variant/10">
                        <span className="material-symbols-outlined text-sm text-primary">person_search</span>
                        <span>Target Roles</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1.5 content-start pt-1">
                        {(profileData.recruiterData.targetRoles || []).map((r, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-surface-container-high rounded-lg text-on-surface font-semibold text-[11px] border border-outline-variant/20">
                            {r}
                          </span>
                        ))}
                        {(!profileData.recruiterData.targetRoles || profileData.recruiterData.targetRoles.length === 0) && (
                          <span className="text-[11px] text-outline italic">No target roles specified</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between h-full min-h-[140px] p-5 bg-surface-container-lowest/80 rounded-2xl border border-outline-variant/20 space-y-3">
                      <div className="flex items-center gap-2 text-outline uppercase font-bold text-[10px] pb-1 border-b border-outline-variant/10">
                        <span className="material-symbols-outlined text-sm text-primary">corporate_fare</span>
                        <span>Departments</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1.5 content-start pt-1">
                        {(profileData.recruiterData.departments || []).map((d, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-primary/10 rounded-lg text-primary font-semibold text-[11px] border border-primary/20">
                            {d}
                          </span>
                        ))}
                        {(!profileData.recruiterData.departments || profileData.recruiterData.departments.length === 0) && (
                          <span className="text-[11px] text-outline italic">No departments specified</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between h-full min-h-[140px] p-5 bg-surface-container-lowest/80 rounded-2xl border border-outline-variant/20 space-y-3">
                      <div className="flex items-center gap-2 text-outline uppercase font-bold text-[10px] pb-1 border-b border-outline-variant/10">
                        <span className="material-symbols-outlined text-sm text-primary">trending_up</span>
                        <span>Seniority Levels</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1.5 content-start pt-1">
                        {(profileData.recruiterData.seniorityLevels || []).map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-surface-container-high rounded-lg text-on-surface font-semibold text-[11px] border border-outline-variant/20">
                            {s}
                          </span>
                        ))}
                        {(!profileData.recruiterData.seniorityLevels || profileData.recruiterData.seniorityLevels.length === 0) && (
                          <span className="text-[11px] text-outline italic">No seniority levels specified</span>
                        )}
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
            <div id="section-associations" className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
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
                    className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex items-start justify-between gap-3 relative"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center font-bold text-sm text-primary overflow-hidden flex-shrink-0">
                        {assoc.logoUrl ? (
                          <img
                            src={assoc.logoUrl}
                            alt={assoc.companyName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          assoc.companyName.charAt(0)
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-on-surface text-sm">{assoc.companyName}</span>
                          {assoc.isVerifiedCompany && (
                            <VerifiedBadge role="COMPANY" size="sm" customLabel="Verified" />
                          )}
                          {assoc.isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-full border border-emerald-500/20">
                              Primary Employer
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">{assoc.role}</p>
                        <p className="text-[10px] text-outline">
                          {assoc.relationship.replace(/_/g, " ")} • Since {assoc.startDate || "2023"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveAssociation(assoc.companyName)}
                      className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-all"
                      title="Remove Association"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Sourcing Expertise & Domains */}
            <div id="section-expertise" className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
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
                Company Name * (Search directory or canonical company knowledge)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Type company name (e.g. Amazon, Google, Stripe, Acme)..."
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
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant/30 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-outline-variant/10">
                    {searchResults.map((comp, idx) => (
                      <div
                        key={comp.id || idx}
                        onClick={() => handleSelectCompanyResult(comp)}
                        className="p-3 hover:bg-primary/10 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {comp.logo ? (
                            <img src={comp.logo} alt={comp.name} className="w-8 h-8 rounded-lg object-contain border border-outline-variant/20 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {comp.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface text-xs truncate">{comp.name}</p>
                            <p className="text-[10px] text-outline truncate">{comp.website || comp.location || comp.industry}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-surface-container text-outline border border-outline-variant/20 flex-shrink-0">
                          {comp.industry || "Company"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Canonical Company Preview */}
            {selectedEnrichedDetails && (
              <div className="p-3.5 bg-surface-container-lowest rounded-2xl border border-primary/25 space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-outline-variant/15 pb-2">
                  <div className="flex items-center gap-2.5">
                    {selectedEnrichedDetails.logoUrl ? (
                      <img src={selectedEnrichedDetails.logoUrl} alt={selectedEnrichedDetails.name} className="w-7 h-7 rounded-md object-contain border border-outline-variant/20" />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-primary/15 text-primary font-bold text-xs flex items-center justify-center">
                        {selectedEnrichedDetails.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-on-surface text-xs">{selectedEnrichedDetails.name}</p>
                      <p className="text-[10px] text-primary">{selectedEnrichedDetails.website}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {selectedEnrichedDetails.industry}
                  </span>
                </div>
                {selectedEnrichedDetails.description && (
                  <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                    {selectedEnrichedDetails.description}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block font-bold text-outline uppercase text-[10px] pb-1">
                Relationship Type *
              </label>
              <select
                value={newAssoc.relationship}
                onChange={(e) => setNewAssoc({ ...newAssoc, relationship: e.target.value as any })}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CURRENT_EMPLOYER">Current In-House Employer (Primary Company)</option>
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
