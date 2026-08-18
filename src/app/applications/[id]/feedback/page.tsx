"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CandidateFeedbackPage({ params }: { params: { id: string } }) {
  const [appData, setAppData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeedback() {
      try {
        setLoading(true);
        const res = await fetch(`/api/applications/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setAppData(data.data);
          } else {
            setError(data.error || "Application not found");
          }
        } else {
          setError("Failed to load application feedback");
        }
      } catch (err) {
        setError("Feedback service temporarily unavailable");
      } finally {
        setLoading(false);
      }
    }

    loadFeedback();
  }, [params.id]);

  return (
    <ProtectedRoute>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="seeker" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
                <Link href="/applications" className="hover:underline">Applications</Link>
                <span>/</span>
                <span className="text-primary font-bold">Recruiter Feedback & AI Guidance</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-on-surface pt-1">
                Application Feedback Studio
              </h1>
            </div>

            <Link
              href="/applications"
              className="px-5 py-2 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-full hover:bg-surface-container transition-all"
            >
              ← Back to Applications
            </Link>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-on-surface-variant">
              Loading recruiter feedback from database...
            </div>
          ) : error || !appData ? (
            <EmptyState
              title="Feedback not found"
              description={error || "Could not locate recruiter feedback for this application."}
              icon="search_off"
              actionLabel="Return to Applications"
              actionHref="/applications"
            />
          ) : (
            <>
              {/* Job Overview Banner */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <CompanyLogo
                    src={appData.companyLogo}
                    name={appData.companyName}
                    size="lg"
                    rounded="2xl"
                  />
                  <div className="space-y-1">
                    <h2 className="font-display text-xl font-bold text-on-surface">
                      {appData.jobTitle}
                    </h2>
                    <p className="text-xs text-on-surface-variant font-label-md font-semibold">
                      {appData.companyName} • Application Updated {appData.updatedAt}
                    </p>
                  </div>
                </div>

                <span className="px-4 py-1.5 bg-error-container text-on-error-container font-label-md font-bold text-xs rounded-full flex items-center gap-1.5 uppercase">
                  <span className="material-symbols-outlined text-base">reviews</span>
                  {appData.status}
                </span>
              </div>

              {/* Structured Recruiter Feedback Card */}
              <div className="glass-card rounded-3xl p-8 border border-outline-variant/20 space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-label-md font-bold uppercase tracking-wider text-outline">
                    STRUCTURED RECRUITER FEEDBACK
                  </span>
                  <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                    {appData.rejection?.reason ? appData.rejection.reason.replace(/_/g, " ") : "Profile / Skills Alignment"}
                  </h3>
                </div>

                {/* Recruiter Guidance Quote */}
                <div className="p-6 bg-surface-container/60 rounded-2xl border-l-4 border-primary space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">chat</span>
                    Direct Note from Recruiter
                  </div>
                  <p className="text-on-surface text-sm italic leading-relaxed">
                    "{appData.rejection?.closingMessage || "Thank you for interviewing with our team. Please review the recommendations below."}"
                  </p>
                </div>

                {/* Suggestions and Recommendations */}
                {appData.rejection?.suggestions && appData.rejection.suggestions.length > 0 && (
                  <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 space-y-3">
                    <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider text-outline">
                      Constructive Improvement Recommendations
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-on-surface-variant">
                      {appData.rejection.suggestions.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Next Steps Guidance */}
              <div className="glass-card rounded-3xl p-8 border border-primary/20 space-y-4 bg-primary-container/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                      NextHire Career Guidance
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Use the recruiter's feedback to update your skills, optimize your resume in Resume Studio, and explore other matching openings.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/resume-studio"
                    className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">edit_document</span>
                    Optimize Resume in Resume Studio
                  </Link>

                  <Link
                    href="/jobs"
                    className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">search</span>
                    Explore Other Opportunities
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </ProtectedRoute>
  );
}
