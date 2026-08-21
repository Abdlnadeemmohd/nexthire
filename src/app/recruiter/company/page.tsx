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
import { CompanyBenefit, CompanyLocation } from "@/lib/auth";

export default function RecruiterCompanyProfilePage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [isEditingStory, setIsEditingStory] = useState(false);

  // Enrichment Modal State
  const [enrichModalOpen, setEnrichModalOpen] = useState(false);
  const [enrichDomainInput, setEnrichDomainInput] = useState("");
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichSuggestions, setEnrichSuggestions] = useState<any | null>(null);

  // Company State
  const [company, setCompany] = useState({
    id: "",
    name: "",
    industry: "Information Technology & Services",
    location: "San Francisco, CA",
    headquarters: "San Francisco, CA",
    website: "",
    description: "",
    tagline: "",
    mission: "",
    vision: "",
    culture: "",
    companyType: "Private",
    companySize: "51-200 employees",
    foundedYear: 2021,
    remotePolicy: "Hybrid",
    logo: "",
    coverImage: "",
    isVerified: false,
    activeRoles: 0,
    totalApplicants: 0,
    techStack: ["TypeScript", "Next.js", "PostgreSQL", "TailwindCSS", "Docker", "AWS"],
    benefits: [
      { id: "b-1", title: "Comprehensive Health, Dental & Vision", category: "Health", description: "100% premium coverage for employees and dependents." },
      { id: "b-2", title: "401(k) Matching", category: "Finance", description: "4% dollar-for-dollar 401(k) company match." },
      { id: "b-3", title: "Flexible Remote & WFH Stipend", category: "Workplace", description: "$1,500 home office setup stipend plus flexible remote schedule." },
      { id: "b-4", title: "Annual Learning & Conference Budget", category: "Learning", description: "$2,000 yearly stipend for education, courses, and conferences." },
    ] as CompanyBenefit[],
    locations: [
      { id: "loc-1", city: "San Francisco", state: "CA", country: "United States", isHeadquarters: true, address: "500 Howard St" },
      { id: "loc-2", city: "Remote", country: "Global", isHeadquarters: false },
    ] as CompanyLocation[],
    values: [] as any[],
    links: [] as any[],
    completeness: 85,
    missingSections: [] as string[],
    recommendations: [] as string[],
  });

  const [techStackInput, setTechStackInput] = useState("");

  const loadCompany = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recruiter/company", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setCompany({
            id: d.id || "",
            name: d.name || "",
            industry: d.industry || "Technology",
            location: d.location || "San Francisco, CA",
            headquarters: d.headquarters || d.location || "San Francisco, CA",
            website: d.website || "",
            description: d.description || "",
            tagline: d.tagline || "",
            mission: d.mission || "",
            vision: d.vision || "",
            culture: d.culture || "",
            companyType: d.companyType || "Private",
            companySize: d.companySize || "51-200 employees",
            foundedYear: d.foundedYear || 2021,
            remotePolicy: d.remotePolicy || "Hybrid",
            logo: d.logo || "",
            coverImage: d.coverImage || "",
            isVerified: d.isVerified ?? false,
            activeRoles: d.activeRoles || 0,
            totalApplicants: d.totalApplicants || 0,
            techStack: Array.isArray(d.techStack) && d.techStack.length > 0 ? d.techStack : company.techStack,
            benefits: Array.isArray(d.benefits) && d.benefits.length > 0 ? d.benefits : company.benefits,
            locations: Array.isArray(d.locations) && d.locations.length > 0 ? d.locations : company.locations,
            values: Array.isArray(d.values) ? d.values : [],
            links: Array.isArray(d.links) ? d.links : [],
            completeness: typeof d.completeness === "number" ? d.completeness : 85,
            missingSections: d.missingSections || [],
            recommendations: d.recommendations || [],
          });
          setTechStackInput(
            (Array.isArray(d.techStack) && d.techStack.length > 0 ? d.techStack : company.techStack).join(", ")
          );
        }
      }
    } catch (err) {
      console.error("Failed to load company profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, []);

  const saveCompany = async (overrides: Record<string, any> = {}) => {
    try {
      setSaving(true);
      const payload = {
        name: company.name,
        industry: company.industry,
        location: company.location,
        description: company.description,
        website: company.website,
        logo: company.logo,
        coverImage: company.coverImage,
        companyType: company.companyType,
        companySize: company.companySize,
        foundedYear: company.foundedYear,
        tagline: company.tagline,
        mission: company.mission,
        vision: company.vision,
        culture: company.culture,
        remotePolicy: company.remotePolicy,
        techStack: company.techStack,
        benefits: company.benefits,
        locations: company.locations,
        values: company.values,
        links: company.links,
        ...overrides,
      };

      const res = await fetch("/api/recruiter/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (typeof json.data?.completeness === "number") {
          setCompany((prev) => ({
            ...prev,
            completeness: json.data.completeness,
            missingSections: json.data.missingSections || [],
            recommendations: json.data.recommendations || [],
          }));
        }
        showToast("Company profile updated successfully!", "success");
        return true;
      } else {
        showToast(json.error || "Failed to update company profile.", "error");
        return false;
      }
    } catch (err) {
      console.error("Error saving company profile:", err);
      showToast("Network error saving company profile.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Trigger External Company Suggestion (No scraping, official DB/metadata provider)
  const handleFetchEnrichment = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchInput = enrichDomainInput.trim();
    if (!searchInput) {
      showToast("Please provide a company domain or name.", "error");
      return;
    }

    try {
      setEnrichLoading(true);
      const isDomain = searchInput.includes(".");
      const res = await fetch("/api/companies/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: isDomain ? searchInput : "",
          name: isDomain ? "" : searchInput,
        }),
      });

      const json = await res.json();
      const suggestionData = json.data || json.suggestion;
      if (res.ok && json.success && suggestionData) {
        setEnrichSuggestions(suggestionData);
        showToast(`Enrichment suggestions loaded for ${suggestionData.name}.`, "info");
      } else {
        setEnrichSuggestions(null);
        showToast(json.error || json.message || "No verified enrichment profile found for this search.", "info");
      }
    } catch (err) {
      console.error("Enrichment error:", err);
      showToast("Failed to fetch enrichment suggestions.", "error");
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleApplySuggestion = async () => {
    if (!enrichSuggestions) return;

    const domainPart = (enrichSuggestions.website || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const safeLogo = enrichSuggestions.logoUrl || (domainPart ? `https://www.google.com/s2/favicons?domain=${domainPart}&sz=128` : company.logo);
    const safeCover = enrichSuggestions.coverImageUrl || company.coverImage;

    const updated = {
      ...company,
      name: enrichSuggestions.name || company.name,
      website: enrichSuggestions.website || company.website,
      tagline: enrichSuggestions.tagline || company.tagline,
      description: enrichSuggestions.description || company.description,
      mission: enrichSuggestions.mission || company.mission,
      culture: enrichSuggestions.culture || company.culture,
      remotePolicy: enrichSuggestions.remotePolicy || company.remotePolicy,
      industry: enrichSuggestions.industry || company.industry,
      companySize: enrichSuggestions.companySize || company.companySize,
      foundedYear: enrichSuggestions.foundedYear || company.foundedYear,
      location: enrichSuggestions.headquarters || company.location,
      headquarters: enrichSuggestions.headquarters || company.headquarters,
      logo: safeLogo,
      coverImage: safeCover,
      techStack: enrichSuggestions.techStack?.length ? enrichSuggestions.techStack : company.techStack,
      benefits: enrichSuggestions.benefits?.length ? enrichSuggestions.benefits : company.benefits,
      values: enrichSuggestions.values?.length ? enrichSuggestions.values : company.values,
      locations: enrichSuggestions.locations?.length ? enrichSuggestions.locations : company.locations,
      links: enrichSuggestions.links?.length ? enrichSuggestions.links : company.links,
    };

    setCompany(updated);
    setTechStackInput(updated.techStack.join(", "));
    await saveCompany(updated);
    setEnrichModalOpen(false);
    setEnrichSuggestions(null);
    setEnrichDomainInput("");
    await loadCompany();
    showToast("Enrichment suggestions confirmed and applied!", "success");
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8 pb-20 sm:pb-24">
            {/* 1. Completeness Score Gauge */}
            <ProfileCompletenessWidget
              score={company.completeness}
              missingSections={company.missingSections}
              recommendations={company.recommendations}
              role="company"
            />

            {/* 2. Employer Brand Auto-Enrichment Suggestion Banner */}
            <div className="glass-card bg-primary/5 rounded-3xl p-6 sm:p-8 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">auto_fix_high</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Auto-Suggest Employer Brand Metadata</h3>
                  <p className="text-xs text-on-surface-variant pt-0.5">
                    Pre-fill mission, tech stack, and logo from verified corporate databases with full recruiter review.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEnrichDomainInput(company.website || company.name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com");
                  setEnrichSuggestions(null);
                  setEnrichModalOpen(true);
                }}
                className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-sm">cloud_sync</span>
                Suggest Company Data
              </button>
            </div>

            {/* 3. Company Cover & Identity Card */}
            <div className="glass-card rounded-3xl overflow-hidden border border-outline-variant/20 shadow-md">
              {/* Cover Banner */}
              <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-primary/30 to-secondary-container relative">
                {company.coverImage && (
                  <img src={company.coverImage} alt="Cover Banner" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Identity Header */}
              <div className="p-4 sm:p-6 md:p-8 relative -mt-12 sm:-mt-16 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3.5 sm:gap-5 min-w-0 flex-1">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-surface border-4 border-surface shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary">domain</span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-on-surface truncate">
                          {company.name || "Company Name"}
                        </h1>
                        {company.isVerified && <VerifiedBadge role="RECRUITER" size="md" />}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-primary truncate">
                        {company.tagline || "Innovating the future of modern software."}
                      </p>
                      <p className="text-xs text-outline flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>📍 {company.location}</span>
                        <span>• 🏢 {company.companySize}</span>
                        <span>• 💼 {company.remotePolicy}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingBrand(!isEditingBrand)}
                    className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto touch-target"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isEditingBrand ? "close" : "edit"}
                    </span>
                    {isEditingBrand ? "Cancel" : "Edit Employer Brand"}
                  </button>
                </div>

                {/* Edit Brand Form */}
                {isEditingBrand && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const ok = await saveCompany();
                      if (ok) setIsEditingBrand(false);
                    }}
                    className="pt-6 border-t border-outline-variant/20 space-y-4 text-xs font-body-md"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={company.name}
                          onChange={(e) => setCompany({ ...company, name: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Tagline / Headline</label>
                        <input
                          type="text"
                          placeholder="e.g. Next-generation AI infrastructure for enterprises"
                          value={company.tagline}
                          onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Industry *</label>
                        <input
                          type="text"
                          required
                          value={company.industry}
                          onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Company Size</label>
                        <select
                          value={company.companySize}
                          onChange={(e) => setCompany({ ...company, companySize: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="1-10 employees">1-10 employees (Seed)</option>
                          <option value="11-50 employees">11-50 employees (Early Stage)</option>
                          <option value="51-200 employees">51-200 employees (Growth)</option>
                          <option value="201-500 employees">201-500 employees (Scale-up)</option>
                          <option value="500+ employees">500+ employees (Enterprise)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Remote Policy</label>
                        <select
                          value={company.remotePolicy}
                          onChange={(e) => setCompany({ ...company, remotePolicy: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Remote-First">100% Remote-First</option>
                          <option value="Hybrid">Hybrid (Flexible)</option>
                          <option value="Onsite">Onsite Hub</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-outline uppercase text-[10px] pb-1">Website URL</label>
                        <input
                          type="url"
                          placeholder="https://acme.com"
                          value={company.website}
                          onChange={(e) => setCompany({ ...company, website: e.target.value })}
                          className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/20">
                      <div>
                        <ImageUpload
                          label="Company Logo"
                          currentImageUrl={company.logo}
                          onImageChange={(url) => setCompany({ ...company, logo: url || "" })}
                          shape="rounded"
                          size="md"
                          fallbackInitial={company.name || "C"}
                        />
                      </div>

                      <div>
                        <ImageUpload
                          label="Company Cover Banner"
                          currentImageUrl={company.coverImage}
                          onImageChange={(url) => setCompany({ ...company, coverImage: url || "" })}
                          shape="square"
                          size="md"
                          fallbackInitial="B"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingBrand(false)}
                        className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-primary-container shadow-sm"
                      >
                        {saving ? "Saving..." : "Save Identity"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* 4. Company Story, Mission & Culture */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-xl">auto_stories</span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                      Company Story & Culture
                    </h2>
                    <p className="text-xs text-on-surface-variant font-body-md pt-0.5">
                      Tell candidates what makes your engineering team unique.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingStory(!isEditingStory)}
                  className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-sm">{isEditingStory ? "close" : "edit"}</span>
                  {isEditingStory ? "Cancel" : "Edit Story & Mission"}
                </button>
              </div>

              {!isEditingStory ? (
                <div className="space-y-4 text-xs sm:text-sm">
                  {company.description ? (
                    <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/15 text-on-surface leading-relaxed whitespace-pre-line">
                      {company.description}
                    </div>
                  ) : (
                    <p className="text-xs text-outline italic">No company description added yet.</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {company.mission && (
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Our Mission</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{company.mission}</p>
                      </div>
                    )}

                    {company.culture && (
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Engineering Culture</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{company.culture}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await saveCompany();
                    if (ok) setIsEditingStory(false);
                  }}
                  className="space-y-4 text-xs font-body-md"
                >
                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">About Company *</label>
                    <textarea
                      rows={4}
                      required
                      value={company.description}
                      onChange={(e) => setCompany({ ...company, description: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Mission Statement</label>
                      <textarea
                        rows={3}
                        placeholder="Why does your organization exist?"
                        value={company.mission}
                        onChange={(e) => setCompany({ ...company, mission: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Engineering Culture</label>
                      <textarea
                        rows={3}
                        placeholder="Describe your engineering values, mentorship, and autonomy..."
                        value={company.culture}
                        onChange={(e) => setCompany({ ...company, culture: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingStory(false)}
                      className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-sm"
                    >
                      Save Story
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 5. Tech Stack & Engineering Tools */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-xl">code</span>
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                    Engineering Tech Stack
                  </h2>
                  <p className="text-xs text-on-surface-variant font-body-md pt-0.5">
                    Technologies, frameworks, and infrastructure powering your products.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex flex-wrap gap-2">
                  {company.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-surface-container-high text-on-surface font-bold rounded-xl border border-outline-variant/30 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add tech stack (Comma-separated: e.g. React, Go, Kafka, Kubernetes)..."
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    className="flex-1 p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={async () => {
                      const list = techStackInput.split(",").map((s) => s.trim()).filter(Boolean);
                      setCompany({ ...company, techStack: list });
                      await saveCompany({ techStack: list });
                      showToast("Tech stack updated!", "success");
                    }}
                    className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-xs"
                  >
                    Update Stack
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Perks & Benefits */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
                  <span className="material-symbols-outlined text-xl">redeem</span>
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                    Perks & Comprehensive Benefits
                  </h2>
                  <p className="text-xs text-on-surface-variant font-body-md pt-0.5">
                    Health coverage, 401(k), equity packages, learning stipends, and flexible time-off.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.benefits.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/20 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-on-surface">{b.title}</h4>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded-md">
                        {b.category}
                      </span>
                    </div>
                    {b.description && (
                      <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                        {b.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>

      {/* Enrichment Review Modal */}
      {enrichModalOpen && (
        <Modal
          isOpen={enrichModalOpen}
          onClose={() => setEnrichModalOpen(false)}
          title="Auto-Suggest Employer Brand Data"
        >
          <div className="space-y-4 text-xs font-body-md">
            <p className="text-on-surface-variant">
              Lookup company verified brand data, mission, and technologies without web scraping. All fetched information requires your confirmation before applying.
            </p>

            <form onSubmit={handleFetchEnrichment} className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  required
                  placeholder="Enter company name or domain (e.g. Amazon, Google, Stripe, amazon.com)"
                  value={enrichDomainInput}
                  onChange={(e) => setEnrichDomainInput(e.target.value)}
                  className="w-full h-11 px-3.5 bg-surface border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={enrichLoading || !enrichDomainInput.trim()}
                className="h-11 px-5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {enrichLoading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">search</span>
                )}
                <span>Fetch Suggestions</span>
              </button>
            </form>

            {enrichSuggestions && (
              <div className="p-4 sm:p-5 bg-surface-container-low rounded-2xl border border-primary/30 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-on-surface text-sm">
                      {enrichSuggestions.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-outline font-mono bg-surface px-2 py-0.5 rounded border border-outline-variant/20">
                    Source: {enrichSuggestions.source}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase block">Industry & HQ</span>
                    <p className="text-on-surface font-medium pt-0.5">{enrichSuggestions.industry} • {enrichSuggestions.headquarters}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase block">Website</span>
                    <a href={enrichSuggestions.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-[11px] pt-0.5 block truncate">
                      {enrichSuggestions.website}
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-outline uppercase block">Tagline</span>
                  <p className="text-on-surface-variant italic pt-0.5">"{enrichSuggestions.tagline || "N/A"}"</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-outline uppercase block">Description</span>
                  <p className="text-on-surface leading-relaxed text-xs pt-0.5 line-clamp-3">{enrichSuggestions.description}</p>
                </div>

                {enrichSuggestions.techStack && enrichSuggestions.techStack.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase block pb-1">Tech Stack</span>
                    <div className="flex flex-wrap gap-1">
                      {enrichSuggestions.techStack.map((tech: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-surface text-primary border border-outline-variant/20 rounded-md text-[10px] font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEnrichSuggestions(null)}
                    className="px-4 py-2 bg-surface-container text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySuggestion}
                    className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container shadow-xs flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Apply to Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
