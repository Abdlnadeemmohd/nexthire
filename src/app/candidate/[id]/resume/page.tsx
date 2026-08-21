"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { EmptyState } from "@/components/ui/EmptyState";

interface PublicResumeData {
  id: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  avatar: string | null;
  email: string;
  phone: string | null;
  employmentStatus: string;
  resumeTemplate: "modern" | "classic" | "minimal" | string;
  skills: string;
  skillsList: string[];
  experience: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    graduationYear?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer?: string;
    issueDate?: string;
  }>;
  projects: Array<{
    name: string;
    description?: string;
    url?: string;
  }>;
  links: Array<{
    title: string;
    url: string;
  }>;
  updatedAt: string;
}

export default function PublicCandidateResumePage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<PublicResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<"NOT_FOUND" | "PRIVATE" | "ERROR" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function fetchPublicResume() {
      try {
        setLoading(true);
        setErrorStatus(null);
        const res = await fetch(`/api/candidate/${params.id}/resume`, {
          cache: "no-store",
        });

        if (res.status === 404) {
          setErrorStatus("NOT_FOUND");
          setErrorMessage("The requested candidate resume does not exist or may have been removed.");
          return;
        }

        if (res.status === 403) {
          const json = await res.json().catch(() => ({}));
          setErrorStatus("PRIVATE");
          setErrorMessage(json.error || "This candidate's resume is private or currently unavailable.");
          return;
        }

        if (!res.ok) {
          setErrorStatus("ERROR");
          setErrorMessage("Failed to load candidate resume. Please try again later.");
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setErrorStatus("NOT_FOUND");
          setErrorMessage("Candidate resume details could not be loaded.");
        }
      } catch (err) {
        console.error("Error loading public candidate resume:", err);
        setErrorStatus("ERROR");
        setErrorMessage("An unexpected network error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchPublicResume();
    }
  }, [params.id]);

  const handlePrintPdf = () => {
    window.print();
  };

  const template = data?.resumeTemplate === "classic" || data?.resumeTemplate === "minimal"
    ? data.resumeTemplate
    : "modern";

  return (
    <>
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

      <main className="pt-20 pb-24 bg-surface min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="glass-card rounded-3xl p-12 text-center space-y-4 border border-outline-variant/20 my-12 max-w-xl mx-auto shadow-sm">
              <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-bold text-on-surface">Loading Verified Resume...</p>
              <p className="text-xs text-on-surface-variant">Connecting to candidate profile records</p>
            </div>
          )}

          {/* 404 Not Found State */}
          {!loading && errorStatus === "NOT_FOUND" && (
            <div className="py-12">
              <EmptyState
                icon="person_off"
                title="Candidate Resume Not Found"
                description={errorMessage}
                actionLabel="Explore Jobs"
                actionHref="/jobs"
              />
            </div>
          )}

          {/* 403 Private State */}
          {!loading && errorStatus === "PRIVATE" && (
            <div className="py-12">
              <EmptyState
                icon="lock"
                title="Resume Unavailable"
                description={errorMessage}
                actionLabel="Back to Home"
                actionHref="/"
              />
            </div>
          )}

          {/* General Error State */}
          {!loading && errorStatus === "ERROR" && (
            <div className="py-12">
              <EmptyState
                icon="error"
                title="Unable to Load Resume"
                description={errorMessage}
                actionLabel="Try Again"
                onAction={() => window.location.reload()}
              />
            </div>
          )}

          {/* Successfully Loaded Resume */}
          {!loading && data && !errorStatus && (
            <div className="space-y-6">
              {/* Top Meta & Action Bar */}
              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">
                      NextHire Verified Resume
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                      {data.employmentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">
                    Shared by <strong className="text-on-surface font-semibold">{data.name}</strong> • Updated {new Date(data.updatedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                  <button
                    onClick={handlePrintPdf}
                    className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-2 touch-target"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Export (PDF)
                  </button>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-all flex items-center gap-1.5 touch-target"
                  >
                    <span className="material-symbols-outlined text-base">person_add</span>
                    Join NextHire
                  </Link>
                </div>
              </div>

              {/* Printable Resume Sheet Formatted to Candidate's Chosen Template */}
              <div
                id="printable-resume"
                className={`bg-white text-slate-900 border border-outline-variant/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto shadow-md transition-all ${
                  template === "classic"
                    ? "font-serif"
                    : template === "minimal"
                    ? "font-mono text-[11px]"
                    : "font-sans"
                }`}
              >
                {/* Modern Template Header */}
                {template === "modern" && (
                  <div className="border-b border-primary/20 pb-5 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                          {data.name}
                        </h1>
                        <p className="text-sm font-bold text-primary mt-0.5">{data.headline}</p>
                      </div>
                      <div className="text-xs text-slate-500 sm:text-right space-y-0.5 font-sans">
                        <p>{data.email}</p>
                        {data.phone && <p>{data.phone}</p>}
                        <p>{data.location}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Classic Template Header */}
                {template === "classic" && (
                  <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-slate-900">
                      {data.name}
                    </h1>
                    <p className="text-sm italic text-slate-700">{data.headline}</p>
                    <p className="text-xs text-slate-600">
                      {data.email} {data.phone ? `• ${data.phone}` : ""} • {data.location}
                    </p>
                  </div>
                )}

                {/* Minimal Template Header */}
                {template === "minimal" && (
                  <div className="border-b border-slate-300 pb-4 mb-6 space-y-1">
                    <div className="flex justify-between items-baseline flex-wrap gap-2">
                      <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        {data.name}
                      </h1>
                      <span className="text-xs text-slate-500">
                        {data.email} {data.phone ? `| ${data.phone}` : ""} | {data.location}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{data.headline}</p>
                  </div>
                )}

                {/* Resume Body */}
                <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
                  {/* Summary */}
                  {data.bio && (
                    <div>
                      <h2
                        className={`font-bold uppercase tracking-wider mb-2 ${
                          template === "modern"
                            ? "text-primary text-xs border-b border-slate-200 pb-1"
                            : template === "classic"
                            ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                            : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                        }`}
                      >
                        Professional Summary
                      </h2>
                      <p className="text-slate-700 leading-relaxed">{data.bio}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {data.experience && data.experience.length > 0 && (
                    <div>
                      <h2
                        className={`font-bold uppercase tracking-wider mb-3 ${
                          template === "modern"
                            ? "text-primary text-xs border-b border-slate-200 pb-1"
                            : template === "classic"
                            ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                            : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                        }`}
                      >
                        Experience
                      </h2>
                      <div className="space-y-4">
                        {data.experience.map((exp, idx) => (
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
                  )}

                  {/* Skills */}
                  {data.skillsList && data.skillsList.length > 0 && (
                    <div>
                      <h2
                        className={`font-bold uppercase tracking-wider mb-2.5 ${
                          template === "modern"
                            ? "text-primary text-xs border-b border-slate-200 pb-1"
                            : template === "classic"
                            ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                            : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                        }`}
                      >
                        Core Skills & Technologies
                      </h2>
                      {template === "modern" ? (
                        <div className="flex flex-wrap gap-1.5">
                          {data.skillsList.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : template === "classic" ? (
                        <p className="text-slate-700 text-xs">{data.skillsList.join(" • ")}</p>
                      ) : (
                        <p className="text-slate-700 text-[11px] font-mono">{data.skillsList.join(", ")}</p>
                      )}
                    </div>
                  )}

                  {/* Education */}
                  {data.education && data.education.length > 0 && (
                    <div>
                      <h2
                        className={`font-bold uppercase tracking-wider mb-2 ${
                          template === "modern"
                            ? "text-primary text-xs border-b border-slate-200 pb-1"
                            : template === "classic"
                            ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                            : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                        }`}
                      >
                        Education
                      </h2>
                      <div className="space-y-2">
                        {data.education.map((edu, idx) => (
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

                  {/* Projects */}
                  {data.projects && data.projects.length > 0 && (
                    <div>
                      <h2
                        className={`font-bold uppercase tracking-wider mb-2 ${
                          template === "modern"
                            ? "text-primary text-xs border-b border-slate-200 pb-1"
                            : template === "classic"
                            ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                            : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                        }`}
                      >
                        Key Projects
                      </h2>
                      <div className="space-y-3">
                        {data.projects.map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline">
                              <span className="font-semibold text-slate-800">{proj.name}</span>
                              {proj.url && (
                                <a
                                  href={proj.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-[11px]"
                                >
                                  View Project ↗
                                </a>
                              )}
                            </div>
                            {proj.description && (
                              <p className="text-slate-600 text-xs leading-relaxed">{proj.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {data.certifications && data.certifications.length > 0 && (
                    <div>
                      <h2
                        className={`font-bold uppercase tracking-wider mb-2 ${
                          template === "modern"
                            ? "text-primary text-xs border-b border-slate-200 pb-1"
                            : template === "classic"
                            ? "text-slate-900 text-xs border-b border-slate-300 pb-1"
                            : "text-slate-700 text-[11px] border-b border-slate-200 pb-0.5"
                        }`}
                      >
                        Certifications
                      </h2>
                      <div className="space-y-1.5">
                        {data.certifications.map((cert, idx) => (
                          <div key={idx} className="flex justify-between items-baseline">
                            <span className="font-semibold text-slate-800">
                              {cert.name} {cert.issuer ? `— ${cert.issuer}` : ""}
                            </span>
                            {cert.issueDate && (
                              <span className="text-[11px] text-slate-500">{cert.issueDate}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
