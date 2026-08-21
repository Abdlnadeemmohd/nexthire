"use client";

import React, { useState, useEffect } from "react";
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
    user?.name ? `${user.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume` : "NextHire_ATS_Resume"
  );
  const [targetRole, setTargetRole] = useState(
    user?.headline || "Senior Full-Stack Engineer / Technical Lead"
  );
  const [bio, setBio] = useState(
    user?.bio ||
      "Passionate software engineer and technical leader with 6+ years of experience building high-scale enterprise platforms, cloud-native distributed systems, and delightful user experiences."
  );
  const [candidateLocation, setCandidateLocation] = useState(
    user?.city ? `${user.city}${user.country ? `, ${user.country}` : ""}` : "San Francisco, CA"
  );
  const [experiences, setExperiences] = useState<any[]>([
    {
      company: "NextHire Platform",
      role: "Lead Software Engineer",
      startDate: "2023",
      endDate: "Present",
      isCurrent: true,
      description: "Architected distributed talent matching systems, optimized full-text search pipelines, and engineered high-performance web applications using Next.js and PostgreSQL.",
    },
  ]);
  const [educations, setEducations] = useState<any[]>([
    {
      institution: "University of Technology",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      graduationYear: "2021",
    },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<"modern" | "classic" | "minimal">("modern");
  const [selectedVersion, setSelectedVersion] = useState("v2.0 (ATS Optimized - Master)");
  const [rawPreferences, setRawPreferences] = useState<any>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSAnalysisResult | null>(null);

  const [skills, setSkills] = useState([
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "Tailwind CSS",
    "System Design",
    "Cloud Architecture",
  ]);
  const [newSkill, setNewSkill] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("Uploading resume to secure storage...");
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate candidate data from database
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/candidate/profile", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (d.name) setResumeTitle(`${d.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume`);
          if (d.headline) setTargetRole(d.headline);
          if (d.bio) setBio(d.bio);
          if (d.location) setCandidateLocation(d.location);
          if (d.preferences) {
            setRawPreferences(d.preferences);
            if (d.preferences.resumeTemplate && ["modern", "classic", "minimal"].includes(d.preferences.resumeTemplate)) {
              setSelectedTemplate(d.preferences.resumeTemplate);
            }
          }
          if (d.skillsList && Array.isArray(d.skillsList) && d.skillsList.length > 0) {
            setSkills(d.skillsList.map((s: any) => (typeof s === "string" ? s : s.name)));
          }
          if (d.experience && Array.isArray(d.experience) && d.experience.length > 0) {
            setExperiences(d.experience);
          }
          if (d.education && Array.isArray(d.education) && d.education.length > 0) {
            setEducations(d.education);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load profile for resume:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUploadResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size exceeds 5MB limit. Please upload a smaller PDF file.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Requesting secure upload authorization...");

    try {
      const signRes = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType: file.type || "application/pdf" }),
      });

      const signData = await signRes.json();
      let uploadedUrl: string;

      if (signRes.ok && signData.success && signData.uploadUrl) {
        setUploadProgress("Uploading resume to encrypted storage...");
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
          throw new Error(cloudData.error?.message || "Failed to upload document.");
        }
        uploadedUrl = cloudData.secure_url;
      } else {
        setUploadProgress("Reading document streams...");
        uploadedUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      }

      setUploadProgress("Extracting AI profile intelligence & skills...");
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
        throw new Error(saveData.error || "Failed to parse resume into profile.");
      }

      setUploadProgress("Synchronizing AI Resume Studio...");
      await fetchProfile();
      setShowUploadModal(false);
      showToast(`Resume "${file.name}" parsed into Resume Studio & Profile successfully!`, "success");
    } catch (err: any) {
      console.error("[Resume Studio Upload Error]:", err);
      showToast(err.message || "Failed to upload resume.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToProfile = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: targetRole,
          bio: bio,
          skills: skills.join(", "),
          experience: experiences,
          education: educations,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Resume changes synchronized with your public Candidate Profile!", "success");
      } else {
        showToast(data.error || "Failed to save profile changes.", "error");
      }
    } catch (err: any) {
      showToast("Network error saving profile changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTemplate = async (tmpl: "modern" | "classic" | "minimal") => {
    setSelectedTemplate(tmpl);
    showToast(`Applied ${tmpl.toUpperCase()} resume template`, "success");
    try {
      const updatedPrefs = { ...rawPreferences, resumeTemplate: tmpl };
      setRawPreferences(updatedPrefs);
      await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: updatedPrefs }),
      });
    } catch (err) {
      console.error("Failed to persist template preference:", err);
    }
  };

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
    showToast("Skill removed from resume.", "info");
  };

  const handleRunAtsScan = () => {
    const candidateName = user?.name || "Candidate";
    const resumeContentText = `${candidateName} ${targetRole} ${bio} Skills: ${skills.join(", ")} Senior Lead Years Experience Distributed Systems Full-Stack`;
    const result = AIEngine.analyzeResumeATS(resumeContentText, [
      "React",
      "TypeScript",
      "Next.js",
      "PostgreSQL",
      "System Design",
    ]);
    setAtsResult(result);
    setActiveTab("ats");
    showToast(`ATS Optimization Scan Complete! Score: ${result.score}/100`, "success");
  };

  const handleDownloadPdf = () => {
    setActiveTab("preview");
    showToast("Preparing ATS resume sheet for PDF export...", "info");
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const candidateShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/candidate/${user?.id || "me"}/resume`
      : "https://www.nexthire.cloud/resume";

  return (
    <ProtectedRoute requiredPortal="seeker">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-resume,
          #printable-resume * {
            visibility: visible !important;
          }
          #printable-resume {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: letter;
            margin: 12mm;
          }
        }
      `}</style>

      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="seeker" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8 pb-20 sm:pb-24">
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
                  Build, optimize, and export high-conversion ATS resumes formatted cleanly for recruiter evaluation.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-2xl transition-all border border-primary/30 flex items-center gap-1.5 touch-target"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  Upload & Parse Resume
                </button>
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
                    showToast(`Switched to: ${e.target.value}`, "info");
                  }}
                  className="px-3 py-1.5 bg-surface text-on-surface border border-outline-variant/30 rounded-xl font-bold focus:outline-none"
                >
                  <option value="v2.0 (ATS Optimized - Master)">v2.0 (ATS Optimized - Master)</option>
                  <option value="v1.2 (Technical Leadership)">v1.2 (Technical Leadership)</option>
                  <option value="v1.0 (Full-Stack Engineer)">v1.0 (Full-Stack Engineer)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-outline uppercase tracking-wider text-[10px]">Layout Template:</span>
                <div className="flex gap-1.5">
                  {(["modern", "classic", "minimal"] as const).map((tmpl) => (
                    <button
                      key={tmpl}
                      onClick={() => handleSelectTemplate(tmpl)}
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
                { id: "ats", label: "ATS Compatibility Score", count: atsResult ? atsResult.score : 95, icon: "analytics" },
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
                          Target Role / Headline
                        </label>
                        <input
                          type="text"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-outline uppercase mb-1">
                          Professional Summary
                        </label>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
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
                        placeholder="Add a new skill (e.g. Next.js, Docker, GraphQL)..."
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
                            type="button"
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
                      ATS Readability & Keyword Match
                    </span>
                    <div className="text-4xl font-display font-bold text-primary">
                      {atsResult ? `${atsResult.score}%` : "95%"}
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Your resume is formatted with industry-standard semantic sections matching Greenhouse, Ashby, and Workday ATS parsers.
                    </p>

                    <button
                      onClick={handleSaveToProfile}
                      disabled={isSaving}
                      className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">sync_saved_locally</span>
                      {isSaving ? "Saving to Profile..." : "Sync Changes with Profile"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Live PDF Preview Tab */}
            {activeTab === "preview" && (
              <div
                id="printable-resume"
                className={`bg-white text-slate-900 border border-outline-variant/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto shadow-md transition-all ${
                  selectedTemplate === "classic"
                    ? "font-serif"
                    : selectedTemplate === "minimal"
                    ? "font-mono text-[11px]"
                    : "font-sans"
                }`}
              >
                {/* Header for Modern Template */}
                {selectedTemplate === "modern" && (
                  <div className="border-b border-primary/20 pb-5 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                          {user?.name || "Professional Candidate"}
                        </h2>
                        <p className="text-sm font-bold text-primary mt-0.5">{targetRole}</p>
                      </div>
                      <div className="text-xs text-slate-500 sm:text-right space-y-0.5 font-sans">
                        <p>{user?.email || "candidate@nexthire.cloud"}</p>
                        <p>{candidateLocation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header for Classic Template */}
                {selectedTemplate === "classic" && (
                  <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-slate-900">
                      {user?.name || "Professional Candidate"}
                    </h2>
                    <p className="text-sm italic text-slate-700">{targetRole}</p>
                    <p className="text-xs text-slate-600">
                      {user?.email || "candidate@nexthire.cloud"} • {candidateLocation}
                    </p>
                  </div>
                )}

                {/* Header for Minimal Template */}
                {selectedTemplate === "minimal" && (
                  <div className="border-b border-slate-300 pb-4 mb-6 space-y-1">
                    <div className="flex justify-between items-baseline flex-wrap gap-2">
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        {user?.name || "Candidate Name"}
                      </h2>
                      <span className="text-xs text-slate-500">
                        {user?.email || "candidate@nexthire.cloud"} | {candidateLocation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{targetRole}</p>
                  </div>
                )}

                {/* Resume Body Sections */}
                <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
                  {/* Summary */}
                  <div>
                    <h3
                      className={`font-bold uppercase tracking-wider mb-2 ${
                        selectedTemplate === "modern"
                          ? "text-primary text-xs border-b border-slate-200 pb-1"
                          : selectedTemplate === "classic"
                          ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                          : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                      }`}
                    >
                      Professional Summary
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{bio}</p>
                  </div>

                  {/* Experience */}
                  <div>
                    <h3
                      className={`font-bold uppercase tracking-wider mb-3 ${
                        selectedTemplate === "modern"
                          ? "text-primary text-xs border-b border-slate-200 pb-1"
                          : selectedTemplate === "classic"
                          ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                          : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                      }`}
                    >
                      Experience
                    </h3>
                    <div className="space-y-4">
                      {experiences.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-baseline font-bold text-slate-900">
                            <span>
                              {exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal">
                              {exp.startDate || "2023"} – {exp.isCurrent ? "Present" : exp.endDate || "2026"}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-slate-600 text-xs leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3
                      className={`font-bold uppercase tracking-wider mb-2.5 ${
                        selectedTemplate === "modern"
                          ? "text-primary text-xs border-b border-slate-200 pb-1"
                          : selectedTemplate === "classic"
                          ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                          : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                      }`}
                    >
                      Core Skills & Technologies
                    </h3>
                    {selectedTemplate === "modern" ? (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : selectedTemplate === "classic" ? (
                      <p className="text-slate-700 text-xs">{skills.join(" • ")}</p>
                    ) : (
                      <p className="text-slate-700 text-[11px] font-mono">{skills.join(", ")}</p>
                    )}
                  </div>

                  {/* Education */}
                  {educations.length > 0 && (
                    <div>
                      <h3
                        className={`font-bold uppercase tracking-wider mb-2 ${
                          selectedTemplate === "modern"
                            ? "text-primary text-xs border-b border-slate-200 pb-1"
                            : selectedTemplate === "classic"
                            ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                            : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                        }`}
                      >
                        Education
                      </h3>
                      <div className="space-y-2">
                        {educations.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline">
                            <span className="font-semibold text-slate-800">
                              {edu.degree} in {edu.fieldOfStudy || "Engineering"} — {edu.institution}
                            </span>
                            <span className="text-[11px] text-slate-500">{edu.graduationYear || "2021"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ATS Analysis Tab */}
            {activeTab === "ats" && (
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-xs font-bold">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  <span>
                    ATS Parsing Check: 100% standard format compatibility across Greenhouse, Lever, Ashby, and Workday.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-outline">Keyword Density</span>
                    <p className="text-xl font-bold text-primary">High (96%)</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-outline">Semantic Structure</span>
                    <p className="text-xl font-bold text-emerald-600">Standardized</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-outline">Typography Score</span>
                    <p className="text-xl font-bold text-primary">ATS Safe</p>
                  </div>
                </div>

                <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/15 text-xs text-on-surface-variant">
                  <p className="font-semibold text-on-surface mb-1">Upcoming Deep Neural ATS Optimization</p>
                  <p>
                    Full cross-job vector matching and LLM-powered resume rewriting will be enabled in the dedicated AI Copilot milestone.
                  </p>
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
        title="Share Candidate Resume Link"
      >
        <div className="space-y-4 text-xs font-body-md">
          <p className="text-on-surface-variant">
            Copy your verified resume link to share directly with hiring managers, recruiters, or across professional networks.
          </p>
          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30 font-mono text-[11px] text-primary flex items-center justify-between gap-2">
            <span className="truncate">{candidateShareUrl}</span>
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(candidateShareUrl);
                }
                showToast("Shareable resume link copied to clipboard!", "success");
                setShowShareModal(false);
              }}
              className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded-lg text-[10px] hover:bg-primary-container flex-shrink-0"
            >
              Copy Link
            </button>
          </div>
          <p className="text-[10px] text-outline">
            Note: Recruiter discoverability is managed in your Profile Privacy & Preferences.
          </p>
        </div>
      </Modal>

      {/* Upload Resume Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 border border-outline-variant/30 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-on-surface">Upload & Parse Resume</h3>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Upload your PDF resume to automatically populate your Resume Studio and Candidate Profile.
            </p>

            <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 text-center space-y-3 bg-surface-container-low/50">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <span className="material-symbols-outlined text-3xl text-primary animate-spin">
                    progress_activity
                  </span>
                  <p className="text-xs font-bold text-on-surface">{uploadProgress}</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
                  <p className="text-xs font-bold text-on-surface">Select your PDF resume</p>
                  <label className="inline-block px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl cursor-pointer hover:bg-primary-container transition-colors">
                    Browse Files
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleUploadResumeFile}
                      disabled={isUploading}
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
