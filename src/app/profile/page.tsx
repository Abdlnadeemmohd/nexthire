"use client";

import React, { useState, useEffect } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  UserExperience,
  UserEducation,
  UserCertification,
  CandidateSkill,
  CandidateProject,
  CandidateLink,
  CandidateAchievement,
  CandidatePublication,
  CandidateLanguage,
  CandidateVolunteer,
  CandidateCourse,
  CandidatePreferences,
  CandidateVisibility,
} from "@/lib/auth";

import { ImageUpload } from "@/components/ui/ImageUpload";
import { ProfileCompletenessWidget } from "@/components/profile/ProfileCompletenessWidget";
import { ExperienceSection } from "@/components/profile/ExperienceSection";
import { EducationSection } from "@/components/profile/EducationSection";
import { SkillsSection } from "@/components/profile/SkillsSection";
import { CertificationsSection } from "@/components/profile/CertificationsSection";
import { ProjectsSection } from "@/components/profile/ProjectsSection";
import { PortfolioLinksSection } from "@/components/profile/PortfolioLinksSection";
import { AchievementsAndAwardsSection } from "@/components/profile/AchievementsAndAwardsSection";
import { PublicationsAndLanguagesSection } from "@/components/profile/PublicationsAndLanguagesSection";
import { VolunteerAndCoursesSection } from "@/components/profile/VolunteerAndCoursesSection";
import { CareerPreferencesSection } from "@/components/profile/CareerPreferencesSection";
import { PrivacyAndContactRequests } from "@/components/profile/PrivacyAndContactRequests";

export default function CandidateProfilePage() {
  const { showToast } = useToast();
  const { user, updateUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  // Candidate Data State
  const [headerData, setHeaderData] = useState({
    name: user?.name || "",
    headline: user?.headline || "",
    bio: user?.bio || "",
    location: user?.country || user?.city || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
    isDiscoverable: true,
    employmentStatus: "Open to Opportunities",
    isVerified: false,
  });

  const [skills, setSkills] = useState<string>("");
  const [skillsList, setSkillsList] = useState<CandidateSkill[]>([]);
  const [experiences, setExperiences] = useState<UserExperience[]>([]);
  const [educations, setEducations] = useState<UserEducation[]>([]);
  const [certifications, setCertifications] = useState<UserCertification[]>([]);
  const [projects, setProjects] = useState<CandidateProject[]>([]);
  const [links, setLinks] = useState<CandidateLink[]>([]);
  const [achievements, setAchievements] = useState<CandidateAchievement[]>([]);
  const [publications, setPublications] = useState<CandidatePublication[]>([]);
  const [languages, setLanguages] = useState<CandidateLanguage[]>([]);
  const [volunteer, setVolunteer] = useState<CandidateVolunteer[]>([]);
  const [courses, setCourses] = useState<CandidateCourse[]>([]);
  const [preferences, setPreferences] = useState<CandidatePreferences>({
    openToWorkStatus: "OPEN_TO_OFFERS",
    preferredRoles: [],
    preferredTypes: ["Full-time"],
    remotePreference: "HYBRID",
    relocation: "OPEN",
    currency: "USD",
    salaryPeriod: "YEAR",
    noticePeriod: "2_WEEKS",
  });
  const [visibility, setVisibility] = useState<CandidateVisibility>({
    isDiscoverable: true,
    isPublic: true,
    contactVisibility: "MASKED",
    resumeVisibility: "ALL",
  });

  // Completeness state
  const [completenessScore, setCompletenessScore] = useState(85);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Resume Document State
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState("Primary_Resume.pdf");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Load Profile from PostgreSQL via /api/candidate/profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/candidate/profile", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          const empStatus =
            d.preferences?.employmentStatus ||
            (d.preferences?.openToWorkStatus === "ACTIVELY_LOOKING"
              ? "Available for Work"
              : d.preferences?.openToWorkStatus === "NOT_LOOKING"
              ? "Not Looking"
              : "Open to Opportunities");

          setHeaderData({
            name: d.name || "",
            headline: d.headline || "",
            bio: d.bio || "",
            location: d.location || "",
            phone: d.phone || "",
            avatar: d.avatar || "",
            isDiscoverable: d.isDiscoverable ?? true,
            employmentStatus: empStatus,
            isVerified: !!d.isVerified,
          });
          setSkills(d.skills || "");
          setSkillsList(
            d.skillsList && Array.isArray(d.skillsList)
              ? d.skillsList.map((s: any, idx: number) =>
                  typeof s === "string"
                    ? { id: `skill-${idx}`, name: s, category: "Technical", level: "Advanced", isHighlighted: idx < 3 }
                    : s
                )
              : []
          );
          setExperiences(d.experience || []);
          setEducations(d.education || []);
          setCertifications(d.certifications || []);
          setProjects(d.projects || []);
          setLinks(d.links || []);
          setAchievements(d.achievements || []);
          setPublications(d.publications || []);
          setLanguages(d.languages || []);
          setVolunteer(d.volunteer || []);
          setCourses(d.courses || []);
          if (d.preferences) setPreferences(d.preferences);
          if (d.visibility) setVisibility(d.visibility);
          if (d.resumeUrl) setResumeUrl(d.resumeUrl);
          if (typeof d.completeness === "number") setCompletenessScore(d.completeness);
          if (d.missingSections) setMissingSections(d.missingSections);
          if (d.recommendations) setRecommendations(d.recommendations);
        }
      }
    } catch (err) {
      console.error("Failed to load candidate profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Atomic Profile Persistence Helper
  const persistProfile = async (overrides: Record<string, any> = {}) => {
    try {
      const payload = {
        name: headerData.name,
        headline: headerData.headline,
        bio: headerData.bio,
        location: headerData.location,
        phone: headerData.phone,
        avatar: headerData.avatar,
        isDiscoverable: headerData.isDiscoverable,
        skills,
        skillsList,
        experience: experiences,
        education: educations,
        certifications,
        projects,
        links,
        achievements,
        publications,
        languages,
        volunteer,
        courses,
        preferences,
        visibility,
        resumeUrl,
        ...overrides,
      };

      const res = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (typeof json.data?.completeness === "number") {
          setCompletenessScore(json.data.completeness);
        }
        if (json.data?.missingSections) setMissingSections(json.data.missingSections);
        if (json.data?.recommendations) setRecommendations(json.data.recommendations);
        updateUserProfile({
          name: headerData.name,
          headline: headerData.headline,
          avatar: headerData.avatar || undefined,
          bio: headerData.bio || undefined,
        });
        return true;
      } else {
        showToast(json.error || "Failed to save profile changes.", "error");
        return false;
      }
    } catch (err) {
      console.error("Network error saving profile:", err);
      showToast("Network error saving profile changes.", "error");
      return false;
    }
  };

  // Section Change Handlers (with auto-persist & toast)
  const handleExperiencesChange = async (updated: UserExperience[]) => {
    setExperiences(updated);
    await persistProfile({ experience: updated });
  };

  const handleEducationsChange = async (updated: UserEducation[]) => {
    setEducations(updated);
    await persistProfile({ education: updated });
  };

  const handleSkillsChange = async (rawSkills: string, list: CandidateSkill[]) => {
    setSkills(rawSkills);
    setSkillsList(list);
    await persistProfile({ skills: rawSkills, skillsList: list });
  };

  const handleCertificationsChange = async (updated: UserCertification[]) => {
    setCertifications(updated);
    await persistProfile({ certifications: updated });
  };

  const handleProjectsChange = async (updated: CandidateProject[]) => {
    setProjects(updated);
    await persistProfile({ projects: updated });
  };

  const handleLinksChange = async (updated: CandidateLink[]) => {
    setLinks(updated);
    await persistProfile({ links: updated });
  };

  const handleAchievementsChange = async (updated: CandidateAchievement[]) => {
    setAchievements(updated);
    await persistProfile({ achievements: updated });
  };

  const handlePublicationsChange = async (updated: CandidatePublication[]) => {
    setPublications(updated);
    await persistProfile({ publications: updated });
  };

  const handleLanguagesChange = async (updated: CandidateLanguage[]) => {
    setLanguages(updated);
    await persistProfile({ languages: updated });
  };

  const handleVolunteerChange = async (updated: CandidateVolunteer[]) => {
    setVolunteer(updated);
    await persistProfile({ volunteer: updated });
  };

  const handleCoursesChange = async (updated: CandidateCourse[]) => {
    setCourses(updated);
    await persistProfile({ courses: updated });
  };

  const handlePreferencesChange = async (updated: CandidatePreferences) => {
    setPreferences(updated);
    await persistProfile({ preferences: updated });
  };

  const handleVisibilityChange = async (updated: CandidateVisibility) => {
    setVisibility(updated);
    await persistProfile({ visibility: updated });
  };

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHeader(true);
    const updatedPreferences: CandidatePreferences = {
      ...preferences,
      employmentStatus: headerData.employmentStatus,
    };
    setPreferences(updatedPreferences);
    const success = await persistProfile({
      name: headerData.name,
      headline: headerData.headline,
      bio: headerData.bio,
      location: headerData.location,
      phone: headerData.phone,
      avatar: headerData.avatar,
      preferences: updatedPreferences,
    });
    setSavingHeader(false);
    if (success) {
      setIsEditingHeader(false);
      showToast("Profile header & employment status saved successfully!", "success");
    }
  };

  // Secure Resume Upload Handler
  const handleResumeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size exceeds 5MB limit. Please upload a smaller PDF or DOCX file.", "error");
      return;
    }

    setIsUploadingResume(true);
    showToast("Requesting secure upload authorization...", "info");

    try {
      const signRes = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType: file.type || "application/pdf" }),
      });

      const signData = await signRes.json();
      let uploadedUrl: string;

      if (signRes.ok && signData.success && signData.uploadUrl) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("api_key", signData.apiKey);
        formDataUpload.append("timestamp", signData.timestamp.toString());
        formDataUpload.append("signature", signData.signature);
        formDataUpload.append("folder", signData.folder);
        if (signData.type) formDataUpload.append("type", signData.type);

        const cloudRes = await fetch(signData.uploadUrl, {
          method: "POST",
          body: formDataUpload,
        });

        const cloudData = await cloudRes.json();
        if (!cloudRes.ok || !cloudData.secure_url) {
          throw new Error(cloudData.error?.message || "Failed to upload document to Cloudinary.");
        }
        uploadedUrl = cloudData.secure_url;
      } else {
        // Safe fallback Data URL for local development
        uploadedUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      }

      const saveRes = await fetch("/api/documents/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secureUrl: uploadedUrl,
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          fileSize: file.size,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "Failed to save document reference to database.");
      }

      setResumeUrl(uploadedUrl);
      setResumeName(file.name);
      await persistProfile({ resumeUrl: uploadedUrl });
      setShowResumeModal(false);
      showToast(`Resume "${file.name}" uploaded and saved successfully!`, "success");
    } catch (err: any) {
      console.error("[Resume Upload Error]:", err);
      showToast(err.message || "Failed to upload resume. Please try again.", "error");
    } finally {
      setIsUploadingResume(false);
    }
  };

  return (
    <ProtectedRoute requiredPortal="seeker">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8 pb-20 sm:pb-24">
            {/* 1. Completeness Score Gauge & Recommendations */}
            <ProfileCompletenessWidget
              score={completenessScore}
              missingSections={missingSections}
              recommendations={recommendations}
              role="candidate"
            />

            {/* 2. Personal & Profile Header Card */}
            <div id="section-about" className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-md relative scroll-mt-24">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
                  {isEditingHeader ? (
                    <ImageUpload
                      currentImageUrl={headerData.avatar}
                      onImageChange={(url) => setHeaderData({ ...headerData, avatar: url || "" })}
                      shape="circle"
                      size="md"
                      fallbackInitial={headerData.name || "C"}
                    />
                  ) : (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-md flex-shrink-0">
                      <img
                        src={headerData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                        alt={headerData.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-on-surface truncate">
                        {headerData.name || "Professional Candidate"}
                      </h1>

                      {/* Professional Employment / Availability Status */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                        {headerData.employmentStatus || "Open to Opportunities"}
                      </span>

                      {/* Genuine Verification Badge (only shown when platform-verified, otherwise explicit unverified state) */}
                      {headerData.isVerified ? (
                        <VerifiedBadge role="JOB_SEEKER" size="md" />
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-outline border border-outline-variant/30 select-none">
                          <span className="material-symbols-outlined text-[13px]">pending</span>
                          Unverified
                        </span>
                      )}
                    </div>

                    <p className="text-primary font-bold text-xs sm:text-sm">
                      {headerData.headline && !headerData.headline.includes("Verified via Firebase")
                        ? headerData.headline
                        : "Technical Professional • NextHire Candidate"}
                    </p>

                    <p className="text-outline text-xs flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">location_on</span>
                      {headerData.location || "Location not specified"}
                    </p>
                  </div>
                </div>

                {/* Header Edit Button */}
                <button
                  onClick={() => setIsEditingHeader(!isEditingHeader)}
                  className="px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto touch-target"
                >
                  <span className="material-symbols-outlined text-base">
                    {isEditingHeader ? "close" : "edit"}
                  </span>
                  {isEditingHeader ? "Cancel Edit" : "Edit Profile Info"}
                </button>
              </div>

              {/* Bio Summary in View Mode */}
              {!isEditingHeader && headerData.bio && (
                <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/15 text-xs sm:text-sm text-on-surface-variant leading-relaxed italic">
                  "{headerData.bio}"
                </div>
              )}

              {/* Header Editor Form */}
              {isEditingHeader && (
                <form onSubmit={handleSaveHeader} className="pt-4 border-t border-outline-variant/20 space-y-4 text-xs font-body-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={headerData.name}
                        onChange={(e) => setHeaderData({ ...headerData, name: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Employment / Availability Status *</label>
                      <select
                        value={headerData.employmentStatus}
                        onChange={(e) => setHeaderData({ ...headerData, employmentStatus: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Open to Opportunities">Open to Opportunities</option>
                        <option value="Available for Work">Available for Work</option>
                        <option value="Employed">Employed</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Not Looking">Not Looking</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Professional Headline *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Senior Full-Stack Engineer | Distributed Systems"
                        value={headerData.headline}
                        onChange={(e) => setHeaderData({ ...headerData, headline: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-outline uppercase text-[10px] pb-1">Location (City, Country)</label>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA, United States"
                        value={headerData.location}
                        onChange={(e) => setHeaderData({ ...headerData, location: e.target.value })}
                        className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">Direct Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={headerData.phone}
                      onChange={(e) => setHeaderData({ ...headerData, phone: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-outline uppercase text-[10px] pb-1">About / Professional Bio</label>
                    <textarea
                      rows={4}
                      placeholder="Write a concise professional summary highlighting your core expertise, key achievements, and passions..."
                      value={headerData.bio}
                      onChange={(e) => setHeaderData({ ...headerData, bio: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingHeader(false)}
                      className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingHeader}
                      className="px-6 py-2 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm"
                    >
                      {savingHeader ? "Saving to Database..." : "Save Identity Info"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 3. Resume Management Banner */}
            <div id="section-resume" className="glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs scroll-mt-24">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Primary Verified Resume</h3>
                  <p className="text-xs text-outline font-mono pt-0.5">{resumeName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowResumeModal(true)}
                  disabled={isUploadingResume}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold rounded-xl border border-outline-variant/30 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  {resumeUrl ? "Replace Resume" : "Upload Resume (PDF)"}
                </button>

                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    View Resume
                  </a>
                )}
              </div>
            </div>

            {/* 4. Experience Section */}
            <div id="section-experience" className="scroll-mt-24">
              <ExperienceSection
                experiences={experiences}
                onChange={handleExperiencesChange}
              />
            </div>

            {/* 5. Education Section */}
            <div id="section-education" className="scroll-mt-24">
              <EducationSection
                educations={educations}
                onChange={handleEducationsChange}
              />
            </div>

            {/* 6. Skills Section */}
            <div id="section-skills" className="scroll-mt-24">
              <SkillsSection
                skills={skills}
                skillsList={skillsList}
                onChange={handleSkillsChange}
              />
            </div>

            {/* 7. Certifications Section */}
            <div id="section-certifications" className="scroll-mt-24">
              <CertificationsSection
                certifications={certifications}
                onChange={handleCertificationsChange}
              />
            </div>

            {/* 8. Projects Section */}
            <div id="section-projects" className="scroll-mt-24">
              <ProjectsSection
                projects={projects}
                onChange={handleProjectsChange}
              />
            </div>

            {/* 9. Portfolio Links Section */}
            <div id="section-links" className="scroll-mt-24">
              <PortfolioLinksSection
                links={links}
                onChange={handleLinksChange}
              />
            </div>

            {/* 10. Achievements Section */}
            <div id="section-achievements" className="scroll-mt-24">
              <AchievementsAndAwardsSection
                achievements={achievements}
                onChange={handleAchievementsChange}
              />
            </div>

            {/* 11. Publications & Languages Dual Section */}
            <PublicationsAndLanguagesSection
              publications={publications}
              languages={languages}
              onPublicationsChange={handlePublicationsChange}
              onLanguagesChange={handleLanguagesChange}
            />

            {/* 12. Volunteer Experience & Specialized Courses */}
            <VolunteerAndCoursesSection
              volunteer={volunteer}
              courses={courses}
              onVolunteerChange={handleVolunteerChange}
              onCoursesChange={handleCoursesChange}
            />

            {/* 13. Career Preferences & Search Visibility */}
            <div id="section-preferences" className="scroll-mt-24">
              <CareerPreferencesSection
                preferences={preferences}
                visibility={visibility}
                onPreferencesChange={handlePreferencesChange}
                onVisibilityChange={handleVisibilityChange}
              />
            </div>

            {/* 14. Candidate Privacy & Recruiter Consent Center */}
            <PrivacyAndContactRequests />
          </main>

          <Footer />
        </div>
      </div>

      {/* Resume Upload Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 border border-outline-variant/30 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-on-surface">Upload Primary Resume</h3>
              <button
                onClick={() => !isUploadingResume && setShowResumeModal(false)}
                disabled={isUploadingResume}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Supported formats: PDF, DOC, DOCX (Max size 5MB).
            </p>

            <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 text-center space-y-3 bg-surface-container-low/50">
              {isUploadingResume ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <span className="material-symbols-outlined text-3xl text-primary animate-spin">
                    progress_activity
                  </span>
                  <p className="text-xs font-bold text-on-surface">Uploading to secure storage...</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
                  <p className="text-xs font-bold text-on-surface">Select your resume file</p>
                  <label className="inline-block px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl cursor-pointer hover:bg-primary-container transition-colors">
                    Browse Files
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf"
                      onChange={handleResumeFileSelected}
                      disabled={isUploadingResume}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
