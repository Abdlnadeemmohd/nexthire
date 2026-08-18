"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { MobileScrollableChips } from "@/components/ui/MobileInteractionUtils";

function JobSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const queryQ = searchParams.get("q") || "";
  const queryLoc = searchParams.get("location") || "";
  const queryType = searchParams.get("type") || "ALL";

  const [dbJobs, setDbJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(queryQ);
  const [location, setLocation] = useState(queryLoc);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>(queryType);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minSalary, setMinSalary] = useState(0);
  const [sortBy, setSortBy] = useState<"match" | "newest" | "salary">("newest");
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setDbJobs(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  useEffect(() => {
    if (queryQ) setKeyword(queryQ);
    if (queryLoc) setLocation(queryLoc);
    if (queryType !== "ALL") setSelectedEmploymentType(queryType);
  }, [queryQ, queryLoc, queryType]);

  const filteredJobs = useMemo(() => {
    return dbJobs.filter((job) => {
      if (
        keyword &&
        !job.title.toLowerCase().includes(keyword.toLowerCase()) &&
        !job.companyName.toLowerCase().includes(keyword.toLowerCase()) &&
        !job.tags?.some((t) => t.toLowerCase().includes(keyword.toLowerCase()))
      ) {
        return false;
      }
      if (
        location &&
        !job.location?.toLowerCase().includes(location.toLowerCase()) &&
        !job.country?.toLowerCase().includes(location.toLowerCase())
      ) {
        return false;
      }
      if (selectedCategory !== "ALL" && job.category !== selectedCategory) {
        return false;
      }
      if (
        selectedEmploymentType !== "ALL" &&
        job.employmentType !== selectedEmploymentType
      ) {
        return false;
      }
      if (remoteOnly && !job.isRemote) {
        return false;
      }
      if (minSalary > 0 && job.salaryMax < minSalary) {
        return false;
      }
      return true;
    });
  }, [dbJobs, keyword, location, selectedCategory, selectedEmploymentType, remoteOnly, minSalary]);

  const sortedJobs = useMemo(() => {
    const sorted = [...filteredJobs];
    if (sortBy === "salary") {
      sorted.sort((a, b) => b.salaryMax - a.salaryMax);
    } else if (sortBy === "match") {
      sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
    return sorted;
  }, [filteredJobs, sortBy]);

  const portalType = user?.role === "RECRUITER" ? "recruiter" : user?.role === "PLATFORM_ADMIN" ? "admin" : "seeker";

  return (
    <>
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        {isAuthenticated && <SidebarNav portal={portalType} />}

        <div className={`flex-1 flex flex-col min-h-[calc(100vh-4rem)] ${isAuthenticated ? "lg:pl-[270px]" : ""}`}>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-4">
            <Breadcrumbs items={[{ label: "Home", href: portalType === "recruiter" ? "/recruiter" : portalType === "admin" ? "/admin" : "/dashboard" }, { label: "Jobs" }, ...(keyword ? [{ label: keyword }] : [])]} />

            {/* Header Title & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-outline-variant/20 pb-3">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Enterprise Job Search
                </h1>
                <p className="text-on-surface-variant font-body-sm text-xs sm:text-sm pt-0.5">
                  Showing <strong>{sortedJobs.length}</strong> active roles {keyword && `for "${keyword}"`} {location && `in ${location}`}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 px-3.5 py-1.5 rounded-xl text-xs">
                <span className="font-label-md text-outline font-semibold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-label-md font-bold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="match">Highest AI Match</option>
                  <option value="salary">Salary (High to Low)</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            {(keyword || location || selectedCategory !== "ALL" || selectedEmploymentType !== "ALL" || remoteOnly || minSalary > 0) && (
              <div className="flex items-center gap-2 flex-wrap text-xs bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
                <span className="font-bold text-outline text-[11px] uppercase tracking-wider">Active Filters:</span>

                {keyword && (
                  <span className="px-3 py-1 bg-surface text-primary font-bold rounded-full border border-primary/30 flex items-center gap-1.5">
                    Query: "{keyword}"
                    <button onClick={() => setKeyword("")} className="hover:text-error text-base leading-none">×</button>
                  </span>
                )}

                {location && (
                  <span className="px-3 py-1 bg-surface text-primary font-bold rounded-full border border-primary/30 flex items-center gap-1.5">
                    Location: "{location}"
                    <button onClick={() => setLocation("")} className="hover:text-error text-base leading-none">×</button>
                  </span>
                )}

                {selectedCategory !== "ALL" && (
                  <span className="px-3 py-1 bg-surface text-tertiary font-bold rounded-full border border-tertiary/30 flex items-center gap-1.5">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory("ALL")} className="hover:text-error text-base leading-none">×</button>
                  </span>
                )}

                {selectedEmploymentType !== "ALL" && (
                  <span className="px-3 py-1 bg-surface text-tertiary font-bold rounded-full border border-tertiary/30 flex items-center gap-1.5">
                    Type: {selectedEmploymentType}
                    <button onClick={() => setSelectedEmploymentType("ALL")} className="hover:text-error text-base leading-none">×</button>
                  </span>
                )}

                {remoteOnly && (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    Remote Only
                    <button onClick={() => setRemoteOnly(false)} className="hover:text-error text-base leading-none">×</button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setKeyword("");
                    setLocation("");
                    setSelectedCategory("ALL");
                    setSelectedEmploymentType("ALL");
                    setRemoteOnly(false);
                    setMinSalary(0);
                  }}
                  className="text-xs text-error font-bold hover:underline ml-auto"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Mobile Sticky Search */}
            <div className="sticky top-16 z-20 bg-surface/95 backdrop-blur-md pt-2 pb-3 border-b border-outline-variant/20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:static lg:bg-transparent lg:p-0 lg:border-0 lg:m-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Search jobs by title, skills..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                </div>
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className={`lg:hidden px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold transition-all flex items-center gap-1.5 touch-target ${
                    showMobileFilters ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">filter_list</span>
                  <span>Filters</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-2">
              {/* Filters Sidebar */}
              <aside className={`space-y-6 lg:col-span-1 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 h-fit shadow-xs ${showMobileFilters ? "block" : "hidden lg:block"}`}>
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20">
                  <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">filter_list</span>
                    Search Filters
                  </h3>
                  <button
                    onClick={() => {
                      setKeyword("");
                      setLocation("");
                      setSelectedCategory("ALL");
                      setSelectedEmploymentType("ALL");
                      setRemoteOnly(false);
                      setMinSalary(0);
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Reset
                  </button>
                </div>

                {/* Location Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md font-bold text-outline uppercase">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md font-bold text-outline uppercase">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ENGINEERING">Software Engineering</option>
                    <option value="DESIGN">Product Design</option>
                    <option value="PRODUCT">Product Management</option>
                    <option value="DATA">Data & Analytics</option>
                  </select>
                </div>

                {/* Employment Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md font-bold text-outline uppercase">
                    Employment Type
                  </label>
                  <select
                    value={selectedEmploymentType}
                    onChange={(e) => setSelectedEmploymentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ALL">All Types</option>
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>

                {/* Remote Toggle */}
                <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  Remote Roles Only
                </label>
              </aside>

              {/* Jobs List Grid */}
              <div className="lg:col-span-3 space-y-4">
                {loading ? (
                  <div className="py-16 text-center text-on-surface-variant text-xs">
                    Loading live job openings...
                  </div>
                ) : sortedJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        id={job.id}
                        title={job.title}
                        company={job.companyName}
                        companyId={job.companyId || ""}
                        logo={job.companyLogo}
                        location={job.location}
                        salary={`$${Math.round(job.salaryMin / 1000)}k - $${Math.round(job.salaryMax / 1000)}k`}
                        type={job.employmentType}
                        tags={job.tags}
                        description={job.description}
                        aiMatchScore={job.matchScore || 95}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No jobs found matching your criteria"
                    description="Try adjusting your keywords or clearing filter criteria to discover more opportunities."
                    icon="search_off"
                    actionLabel="Reset Search"
                    onAction={() => {
                      setKeyword("");
                      setLocation("");
                      setSelectedCategory("ALL");
                      setSelectedEmploymentType("ALL");
                      setRemoteOnly(false);
                      setMinSalary(0);
                    }}
                  />
                )}
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>

      <JobApplyModal
        jobId={selectedJobToApply?.id || ""}
        jobTitle={selectedJobToApply?.title || ""}
        companyName={selectedJobToApply?.companyName || ""}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
      />
    </>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center text-xs">Loading Search...</div>}>
      <JobSearchContent />
    </Suspense>
  );
}
