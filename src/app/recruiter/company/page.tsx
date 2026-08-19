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
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function RecruiterCompanyProfilePage() {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCompany, setHasCompany] = useState(true);

  const [companyInfo, setCompanyInfo] = useState({
    id: "",
    name: "",
    industry: "",
    headquarters: "",
    website: "",
    about: "",
    logoUrl: "",
    isVerified: false,
    activeRoles: 0,
    totalApplicants: 0,
  });

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recruiter/company");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setHasCompany(true);
          setCompanyInfo({
            id: data.data.id || "",
            name: data.data.name || "",
            industry: data.data.industry || "",
            headquarters: data.data.location || data.data.headquarters || "",
            about: data.data.description || data.data.about || "",
            website: data.data.website || "",
            logoUrl: data.data.logoUrl || data.data.logo || "",
            isVerified: data.data.isVerified || false,
            activeRoles: data.data.activeRoles ?? 0,
            totalApplicants: data.data.totalApplicants ?? 0,
          });
        } else {
          setHasCompany(false);
        }
      } else if (res.status === 404) {
        setHasCompany(false);
      }
    } catch (err) {
      console.error("Failed to load company info:", err);
      setHasCompany(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/recruiter/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: companyInfo.id || undefined,
          name: companyInfo.name,
          industry: companyInfo.industry,
          location: companyInfo.headquarters,
          description: companyInfo.about,
          website: companyInfo.website,
          logo: companyInfo.logoUrl || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          hasCompany
            ? "Company profile updated successfully in Neon PostgreSQL!"
            : "Company profile created successfully in Neon PostgreSQL!",
          "success"
        );
        setIsEditing(false);
        setHasCompany(true);
        loadCompanyData();
      } else {
        showToast(data.error || "Failed to save company profile", "error");
      }
    } catch (err) {
      showToast("Network error saving company profile", "error");
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
          <main className="flex-1 p-6 md:p-10 space-y-8 max-w-[1600px] w-full">
            <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Company Profile" }]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <h1 className="font-display text-3xl font-bold text-on-surface">
                  Company Profile
                </h1>
                <p className="text-on-surface-variant text-sm font-body-md">
                  Manage your verified employer identity, company information, and job postings on NextHire Cloud.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/companies"
                  className="px-4 py-2.5 bg-surface-container-high hover:bg-primary-container/20 text-primary font-label-md font-bold text-xs rounded-full transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  View Directory
                </Link>

                {hasCompany && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">{isEditing ? "close" : "edit"}</span>
                    {isEditing ? "Cancel Edit" : "Edit Profile"}
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                Loading company profile from database...
              </div>
            ) : !hasCompany || isEditing ? (
              /* Create / Edit Company Form */
              <div className="glass-card rounded-3xl p-8 border border-outline-variant/30 shadow-xl max-w-3xl space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-on-surface">
                    {hasCompany ? "Edit Company Profile" : "Create Employer Company Profile"}
                  </h2>
                  <p className="text-xs text-on-surface-variant pt-1">
                    {hasCompany
                      ? "Update your organization details in Neon PostgreSQL."
                      : "Register your hiring company organization to publish jobs and manage applicants on NextHire."}
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-body-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-outline uppercase pb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Cloud Corp"
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-outline uppercase pb-1">Industry *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Software & Cloud Infrastructure"
                        value={companyInfo.industry}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-outline uppercase pb-1">Location / Headquarters *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Austin, TX (or Remote)"
                        value={companyInfo.headquarters}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, headquarters: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-outline uppercase pb-1">Website URL</label>
                      <input
                        type="url"
                        placeholder="https://acme.example.com"
                        value={companyInfo.website}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase pb-1">Company Description *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe your organization's mission, engineering focus, and hiring culture..."
                      value={companyInfo.about}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, about: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/40 rounded-xl text-on-surface"
                    />
                  </div>

                  <div className="pt-2">
                    <ImageUpload
                      label="Company Brand Logo"
                      currentImageUrl={companyInfo.logoUrl}
                      onImageChange={(url) => setCompanyInfo({ ...companyInfo, logoUrl: url || "" })}
                      shape="rounded"
                      size="md"
                      fallbackInitial={companyInfo.name || "C"}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    {hasCompany && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary-container disabled:opacity-50"
                    >
                      {saving ? "Saving to Database..." : hasCompany ? "Save Changes" : "Create Company Profile"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* View Company State */
              <div className="space-y-8">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-1">
                    <span className="text-xs font-label-md text-outline uppercase font-bold">Active Roles</span>
                    <h3 className="font-display text-2xl font-bold text-on-surface">{companyInfo.activeRoles} Openings</h3>
                    <p className="text-[11px] text-primary font-bold">Published in database</p>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-1">
                    <span className="text-xs font-label-md text-outline uppercase font-bold">Total Applicants</span>
                    <h3 className="font-display text-2xl font-bold text-tertiary">{companyInfo.totalApplicants} Candidates</h3>
                    <p className="text-[11px] text-on-surface-variant font-semibold">Live database submissions</p>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-1">
                    <span className="text-xs font-label-md text-outline uppercase font-bold">Review Target</span>
                    <h3 className="font-display text-2xl font-bold text-primary">7-Day SLA</h3>
                    <p className="text-[11px] text-on-surface-variant font-semibold">Standard review target</p>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-1">
                    <span className="text-xs font-label-md text-outline uppercase font-bold">Verification Status</span>
                    <h3 className="font-display text-2xl font-bold text-emerald-600">
                      {companyInfo.isVerified ? "Verified" : "Pending Verification"}
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-bold">Organization Status</p>
                  </div>
                </div>

                {/* Overview Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-4">
                    <div className="flex items-center gap-4">
                      {companyInfo.logoUrl ? (
                        <img
                          src={companyInfo.logoUrl}
                          alt={companyInfo.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-outline-variant/40 shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold font-display text-2xl border border-primary/20 flex-shrink-0">
                          {companyInfo.name ? companyInfo.name.charAt(0).toUpperCase() : "C"}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-2xl font-bold text-on-surface">{companyInfo.name}</h2>
                          {companyInfo.isVerified && (
                            <VerifiedBadge role="RECRUITER" customLabel="Verified Employer" size="sm" />
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">
                          {companyInfo.industry} • {companyInfo.headquarters}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {companyInfo.about || "No company description provided yet."}
                    </p>
                  </div>

                  <div className="glass-card rounded-3xl p-6 border border-outline-variant/20 space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider text-outline">
                      Company Details
                    </h3>
                    <div className="space-y-3 divide-y divide-outline-variant/10 text-on-surface">
                      <div className="pt-2 flex justify-between">
                        <span className="text-on-surface-variant">Industry</span>
                        <span className="font-bold">{companyInfo.industry || "Not specified"}</span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-on-surface-variant">Location</span>
                        <span className="font-bold">{companyInfo.headquarters || "Not specified"}</span>
                      </div>
                      {companyInfo.website && (
                        <div className="pt-2 flex justify-between">
                          <span className="text-on-surface-variant">Website</span>
                          <a
                            href={companyInfo.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary font-bold hover:underline"
                          >
                            {companyInfo.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
