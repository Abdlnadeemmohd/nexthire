"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { PROFILE_DATA } from "@/lib/mockData";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { EmploymentStatus, UserExperience, UserEducation, UserCertification } from "@/lib/auth";

import { CertificateUploadModal, CertificateRecord } from "@/components/profile/CertificateUploadModal";
import { RecruitmentEngine } from "@/services/recruitmentEngine";
import { useEffect } from "react";

export default function ProfilePage() {
  const { showToast } = useToast();
  const { user, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certs, setCerts] = useState<CertificateRecord[]>([]);

  // Editable Profile Form State initialized from Auth Context
  const [formData, setFormData] = useState({
    name: user?.name || "Stage 1 Candidate",
    headline: user?.headline || "Senior Full-Stack Engineer",
    phone: user?.phone || "+1 (555) 890-1234",
    address: user?.address || "742 Market Street",
    city: user?.city || "San Francisco",
    country: user?.country || "United States",
    bio: user?.bio || "Dedicated candidate profile on NextHire Cloud.",
    employmentStatus: (user?.employmentStatus || "OPEN_TO_OPPORTUNITIES") as EmploymentStatus,
    portfolioLinks: {
      linkedin: user?.portfolioLinks?.linkedin || "https://linkedin.com",
      github: user?.portfolioLinks?.github || "https://github.com",
      website: user?.portfolioLinks?.website || "",
      behance: user?.portfolioLinks?.behance || "",
      dribbble: user?.portfolioLinks?.dribbble || "",
    },
  });

  // Experience, Education & Certification Items State
  const [experiences, setExperiences] = useState<UserExperience[]>(user?.experience || []);
  const [educations, setEducations] = useState<UserEducation[]>(user?.education || []);
  const [certifications, setCertifications] = useState<UserCertification[]>(user?.certifications || []);

  // Resume State
  const [resumeUrl, setResumeUrl] = useState<string | null>(user?.resumeUrl || null);
  const [resumeName, setResumeName] = useState(
    user?.resumeFileName || (user?.resumeUrl ? "Primary_Resume.pdf" : "No resume uploaded")
  );
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Fetch verified profile document on load
  useEffect(() => {
    async function loadProfileDocument() {
      try {
        const res = await fetch("/api/documents/download");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.downloadUrl) {
            setResumeUrl(data.downloadUrl);
            setResumeName(data.fileName || "Verified_Resume.pdf");
          }
        }
      } catch {
        // Fallback to local user context if unauthenticated or offline
      }
    }
    loadProfileDocument();
  }, []);

  const handleSaveProfile = () => {
    updateUserProfile({
      name: formData.name,
      headline: formData.headline,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      bio: formData.bio,
      employmentStatus: formData.employmentStatus,
      experience: experiences,
      education: educations,
      certifications: certifications,
      portfolioLinks: formData.portfolioLinks,
      resumeFileName: resumeName,
      resumeUrl: resumeUrl || undefined,
    });
    setIsEditing(false);
    showToast("Profile and Employment Status saved successfully!", "success");
  };

  const handleAddExperience = () => {
    const newExp: UserExperience = {
      id: `exp-${Date.now()}`,
      company: "New Company",
      role: "Software Engineer",
      startDate: "2024-01",
      endDate: "Present",
      description: "Described core technical responsibilities.",
    };
    setExperiences([...experiences, newExp]);
    showToast("Added new experience record", "info");
  };

  const handleRemoveExperience = (id: string) => {
    setExperiences(experiences.filter((e) => e.id !== id));
    showToast("Removed experience entry", "info");
  };

  const handleAddCertification = () => {
    const newCert: UserCertification = {
      id: `cert-${Date.now()}`,
      name: "Professional Cloud Developer",
      issuer: "Google Cloud",
      issueDate: "2025-05-10",
      verificationLink: "https://cloud.google.com/certification",
      certificateFileUrl: "/certs/gcp_developer.pdf",
    };
    setCertifications([...certifications, newCert]);
    showToast("Added new professional certification", "info");
  };

  const handleResumeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Client-side validation: Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size exceeds 5MB limit. Please upload a smaller PDF or DOCX file.", "error");
      return;
    }

    const permittedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (file.type && !permittedTypes.includes(file.type)) {
      showToast("Unsupported format. Allowed: PDF, DOC, DOCX, PNG, JPEG, WEBP.", "error");
      return;
    }

    setIsUploadingResume(true);
    showToast("Requesting secure upload authorization...", "info");

    try {
      // 1. Fetch Cloudinary signed parameters from server
      const signRes = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType: file.type || "application/pdf" }),
      });

      const signData = await signRes.json();
      if (!signRes.ok || !signData.success) {
        throw new Error(signData.error || "Failed to initialize document upload session.");
      }

      showToast("Uploading document to Cloudinary storage...", "info");

      // 2. Upload directly to Cloudinary
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("api_key", signData.apiKey);
      formDataUpload.append("timestamp", signData.timestamp.toString());
      formDataUpload.append("signature", signData.signature);
      formDataUpload.append("folder", signData.folder);
      if (signData.type) {
        formDataUpload.append("type", signData.type);
      }

      const cloudRes = await fetch(signData.uploadUrl, {
        method: "POST",
        body: formDataUpload,
      });

      const cloudData = await cloudRes.json();
      if (!cloudRes.ok || !cloudData.secure_url) {
        throw new Error(cloudData.error?.message || "Failed to upload document to Cloudinary.");
      }

      showToast("Saving document reference to profile...", "info");

      // 3. Save reference in Neon PostgreSQL Profile
      const saveRes = await fetch("/api/documents/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secureUrl: cloudData.secure_url,
          publicId: cloudData.public_id,
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          fileSize: file.size,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "Failed to save document reference to database.");
      }

      setResumeUrl(cloudData.secure_url);
      setResumeName(file.name);
      updateUserProfile({
        resumeFileName: file.name,
        resumeUrl: cloudData.secure_url,
      });

      setShowResumeModal(false);
      showToast(`Resume "${file.name}" uploaded and saved successfully!`, "success");
    } catch (err: any) {
      console.error("[Resume Upload Error]:", err);
      showToast(err.message || "Failed to upload resume. Please try again.", "error");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleAction = (actionName: string) => {
    setShowMoreActions(false);
    showToast(`Triggered: ${actionName}`, "info");
  };

  // Profile Completion Percentage Calculation
  const calculateProfileCompletion = () => {
    let score = 0;
    if (formData.name) score += 15;
    if (formData.headline) score += 15;
    if (formData.bio) score += 15;
    if (experiences.length > 0) score += 20;
    if (educations.length > 0) score += 15;
    if (certs.length > 0) score += 20;
    return Math.min(100, score);
  };

  const completionPercentage = calculateProfileCompletion();

  return (
    <ProtectedRoute requiredPortal="seeker">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8">
            {/* Profile Completion Score Gauge */}
            <div className="glass-card bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-on-surface">
                    Profile Completeness Score ({completionPercentage}%)
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Complete your profile details to rank higher in recruiter AI sourcing searches.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-full self-start sm:self-auto">
                  {completionPercentage === 100 ? "Verified All-Star Profile" : "Optimizing Profile"}
                </span>
              </div>

              <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
                <div className={`p-2 rounded-xl border ${formData.name ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-surface text-outline border-outline-variant/20"}`}>
                  ✓ Personal Info
                </div>
                <div className={`p-2 rounded-xl border ${experiences.length > 0 ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-surface text-outline border-outline-variant/20"}`}>
                  ✓ Work Experience
                </div>
                <div className={`p-2 rounded-xl border ${educations.length > 0 ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-surface text-outline border-outline-variant/20"}`}>
                  ✓ Education & Degree
                </div>
                <div className={`p-2 rounded-xl border ${certs.length > 0 ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-surface text-outline border-outline-variant/20"}`}>
                  {certs.length > 0 ? "✓ Certifications Verified" : "+ Add Certification"}
                </div>
              </div>
            </div>

            {/* Profile Header */}
            <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 border border-outline-variant/20 space-y-6 relative">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-primary-fixed shadow-md flex-shrink-0">
                    <img
                      src={user?.avatar || PROFILE_DATA.avatar}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="font-display text-xl sm:text-2xl font-bold text-on-surface bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30 focus:outline-none w-full sm:w-auto"
                        />
                      ) : (
                        <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-on-surface truncate">
                          {formData.name}
                        </h1>
                      )}
                      <VerifiedBadge role="JOB_SEEKER" size="md" />
                    </div>

                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        className="text-on-surface-variant text-sm font-semibold w-full bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30 focus:outline-none"
                      />
                    ) : (
                      <p className="text-on-surface-variant font-label-md text-xs sm:text-sm font-semibold">
                        {formData.headline}
                      </p>
                    )}

                    <p className="text-outline text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">location_on</span>
                      {formData.city}, {formData.country}
                    </p>
                  </div>
                </div>

                {/* Edit & Action Controls */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative w-full md:w-auto">
                  <button
                    onClick={() => {
                      if (isEditing) handleSaveProfile();
                      else setIsEditing(true);
                    }}
                    className="px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isEditing ? "save" : "edit"}
                    </span>
                    {isEditing ? "Save Profile" : "Edit Profile"}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowMoreActions(!showMoreActions)}
                      className="p-2.5 bg-surface-container-high text-on-surface hover:text-primary rounded-full transition-colors border border-outline-variant/30 flex items-center justify-center"
                      aria-label="More Profile Actions"
                    >
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>

                    {showMoreActions && (
                      <div className="absolute right-0 mt-2 w-56 bg-surface border border-outline-variant/20 rounded-2xl shadow-xl p-2 z-30 space-y-1 text-xs font-label-md">
                        <button
                          onClick={() => {
                            setShowMoreActions(false);
                            setShowResumeModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">upload_file</span>
                          Manage Resume
                        </button>
                        <button
                          onClick={() => handleAction("Download Resume PDF")}
                          className="w-full text-left px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          Download Resume PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Employment Status Selector */}
              <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-outline uppercase tracking-wider">
                    Professional Employment Status
                  </span>
                  <p className="text-xs text-on-surface-variant">
                    Used by NextHire AI to prioritize recruiter search matches and interview availability.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, employmentStatus: e.target.value as EmploymentStatus })
                    }
                    className="px-4 py-2 bg-surface text-on-surface border border-outline-variant/30 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="UNEMPLOYED">Unemployed (Available Immediately)</option>
                    <option value="ON_NOTICE_PERIOD">On Notice Period (1-2 Weeks)</option>
                    <option value="SEARCHING_EMPLOYED">Searching but Currently Employed</option>
                    <option value="OPEN_TO_OPPORTUNITIES">Open to Opportunities</option>
                    <option value="EMPLOYED">Employed (Not Actively Looking)</option>
                  </select>

                  <span className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Priority Boosted
                  </span>
                </div>
              </div>

              {/* Bio & Contact Details */}
              <div className="space-y-3 pt-2">
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-3 bg-surface-container text-xs text-on-surface rounded-xl border border-outline-variant/30 focus:outline-none"
                    placeholder="Write a concise professional bio..."
                  />
                ) : (
                  <p className="text-on-surface-variant text-sm leading-relaxed">{formData.bio}</p>
                )}
              </div>
            </div>

            {/* Resume Management Banner */}
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Primary Resume File</h3>
                  <p className="text-xs text-outline font-mono">{resumeName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowResumeModal(true)}
                  disabled={isUploadingResume}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold rounded-xl border border-outline-variant/30 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  {isUploadingResume ? "Uploading..." : "Replace / Upload"}
                </button>
                {resumeUrl ? (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary-container transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    View / Download Resume
                  </a>
                ) : (
                  <button
                    onClick={() => setShowResumeModal(true)}
                    className="px-4 py-2 bg-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/30 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Upload Resume
                  </button>
                )}
              </div>
            </div>

            {/* Experience & Certifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Experience CRUD */}
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline-sm text-xl font-bold text-on-surface">Work Experience</h3>
                    <button
                      onClick={handleAddExperience}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Position
                    </button>
                  </div>

                  <div className="space-y-6">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-start gap-4 pb-6 border-b border-outline-variant/10 last:border-0 last:pb-0"
                      >
                        <div className="w-10 h-10 bg-primary-fixed text-on-primary-fixed rounded-xl flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined">work</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-on-surface text-base">{exp.role}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-outline text-xs font-label-md">
                                {exp.startDate} - {exp.endDate}
                              </span>
                              <button
                                onClick={() => handleRemoveExperience(exp.id)}
                                className="text-outline hover:text-error transition-colors p-1"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-primary font-label-md text-xs font-semibold">{exp.company}</p>
                          <p className="text-on-surface-variant text-xs leading-relaxed pt-1">
                            {exp.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications with Uploaded Certificate & Document Verification */}
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                        Certifications & Document Verification
                      </h3>
                      <p className="text-xs text-on-surface-variant font-label-md">
                        Upload certificates for admin verification & recruiter trust badges.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCertModal(true)}
                      className="px-3.5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      Upload Certificate
                    </button>
                  </div>

                  <div className="space-y-4">
                    {certs.map((cert) => (
                      <div
                        key={cert.id}
                        className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-on-surface">{cert.name}</h4>
                            <span
                              className={`px-2 py-0.5 font-bold text-[10px] rounded-md ${
                                cert.status === "VERIFIED"
                                  ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                                  : cert.status === "PENDING"
                                  ? "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                                  : "bg-error/15 text-error"
                              }`}
                            >
                              {cert.status === "VERIFIED" ? "✓ VERIFIED CREDENTIAL" : "PENDING VERIFICATION"}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant">
                            Category: <strong>{cert.category}</strong> • Authority: <strong>{cert.issuingAuthority}</strong>
                          </p>
                          <p className="text-[11px] text-outline font-mono">
                            Issued: {cert.issueDate} {cert.noExpiryDate ? "• No Expiry" : `• Expires: ${cert.expiryDate}`}
                          </p>
                        </div>

                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                          >
                            Credential Link
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Portfolio & Skills */}
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">Portfolio & Links</h3>
                  <div className="space-y-2 text-xs">
                    <a
                      href={formData.portfolioLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-surface-container-low hover:bg-surface-container rounded-xl flex items-center justify-between text-on-surface font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">link</span>
                        LinkedIn Profile
                      </span>
                      <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                    </a>
                    <a
                      href={formData.portfolioLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-surface-container-low hover:bg-surface-container rounded-xl flex items-center justify-between text-on-surface font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">code</span>
                        GitHub Repositories
                      </span>
                      <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                    </a>
                    <a
                      href={formData.portfolioLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-surface-container-low hover:bg-surface-container rounded-xl flex items-center justify-between text-on-surface font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">language</span>
                        Personal Portfolio Site
                      </span>
                      <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Resume Upload Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 border border-outline-variant/30 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-on-surface">Upload Resume File</h3>
              <button
                onClick={() => !isUploadingResume && setShowResumeModal(false)}
                disabled={isUploadingResume}
                className="text-outline hover:text-on-surface disabled:opacity-40"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Supported formats: PDF, DOC, DOCX, PNG, JPEG, WEBP (Max size 5MB).
            </p>

            <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 text-center space-y-3">
              {isUploadingResume ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <span className="material-symbols-outlined text-3xl text-primary animate-spin">
                    progress_activity
                  </span>
                  <p className="text-xs font-bold text-on-surface">Uploading to secure storage...</p>
                  <p className="text-[11px] text-on-surface-variant">Saving reference to database</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
                  <p className="text-xs font-bold text-on-surface">Drag & drop your resume file here</p>
                  <label className="inline-block px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl cursor-pointer hover:bg-primary-container transition-colors">
                    Browse Files
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp"
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

      <CertificateUploadModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        onCertificateUploaded={(cert) => {
          RecruitmentEngine.addCertificate(cert);
        }}
      />
    </ProtectedRoute>
  );
}
