"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { INITIAL_JOBS, Job } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

export default function JobSearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>("ALL");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minSalary, setMinSalary] = useState(100000);
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);

  const filteredJobs = useMemo(() => {
    return INITIAL_JOBS.filter((job) => {
      if (
        keyword &&
        !job.title.toLowerCase().includes(keyword.toLowerCase()) &&
        !job.companyName.toLowerCase().includes(keyword.toLowerCase()) &&
        !job.tags.some((t) => t.toLowerCase().includes(keyword.toLowerCase()))
      ) {
        return false;
      }
      if (
        location &&
        !job.location.toLowerCase().includes(location.toLowerCase()) &&
        !job.country.toLowerCase().includes(location.toLowerCase())
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
      if (job.salaryMax < minSalary) {
        return false;
      }
      return true;
    });
  }, [keyword, location, selectedCategory, selectedEmploymentType, remoteOnly, minSalary]);

  const handleApplyClick = (job: Job) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/jobs/${job.id}&message=Please sign in or create an account to continue with your application.`);
    } else {
      setSelectedJobToApply(job);
    }
  };

  return (
    <>
      <TopAppBar />

      <main className="pt-20 pb-20 flex-1 bg-surface max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
        {/* Breadcrumbs & Header Title */}
        <div className="py-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
            <span>Home</span>
            <span>/</span>
            <span className="text-primary font-bold">Search Jobs</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                Global Job Search
              </h1>
              <p className="text-on-surface-variant font-body-sm text-sm">
                Showing {filteredJobs.length} AI-matched roles
              </p>
            </div>

            <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 px-4 py-2 rounded-xl">
              <span className="text-xs font-label-md text-outline font-semibold">Sort by:</span>
              <select className="bg-transparent text-xs font-label-md font-bold text-on-surface focus:outline-none cursor-pointer">
                <option value="match">Highest AI Match</option>
                <option value="newest">Newest First</option>
                <option value="salary">Salary (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
          {/* Filters Sidebar */}
          <aside className="space-y-6 lg:col-span-1 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 h-fit shadow-xs">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">
                  filter_list
                </span>
                Search Filters
              </h3>
              <button
                onClick={() => {
                  setKeyword("");
                  setLocation("");
                  setSelectedCategory("ALL");
                  setSelectedEmploymentType("ALL");
                  setRemoteOnly(false);
                  setMinSalary(100000);
                }}
                className="text-xs text-primary font-bold hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Keyword Input */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md font-bold text-outline uppercase">
                Title, Skill, or Keyphrase
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. React, Next.js, Product Manager"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base">
                  search
                </span>
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md font-bold text-outline uppercase">
                Location or Country
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. San Francisco, Remote, London"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base">
                  location_on
                </span>
              </div>
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md font-bold text-outline uppercase">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs font-label-md text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Engineering">Software Engineering</option>
                <option value="Product">Product Management</option>
                <option value="AI / ML">Artificial Intelligence & ML</option>
                <option value="Design">UI/UX & Product Design</option>
                <option value="Data">Data & Analytics</option>
              </select>
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md font-bold text-outline uppercase">
                Employment Type
              </label>
              <div className="space-y-2 text-xs font-body-sm">
                {["ALL", "Full-time", "Contract", "Part-time"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-on-surface-variant hover:text-on-surface">
                    <input
                      type="radio"
                      name="employmentType"
                      checked={selectedEmploymentType === type}
                      onChange={() => setSelectedEmploymentType(type)}
                      className="text-primary focus:ring-primary"
                    />
                    <span>{type === "ALL" ? "Any Type" : type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Remote Only Toggle */}
            <div className="pt-2 border-t border-outline-variant/10">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-label-md font-bold text-on-surface">
                  Remote Positions Only
                </span>
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-outline-variant"
                />
              </label>
            </div>

            {/* Salary Range Slider */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/10">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-label-md font-bold text-outline uppercase">
                  Minimum Salary
                </label>
                <span className="text-xs font-bold text-primary">
                  ${(minSalary / 1000).toFixed(0)}k+ / yr
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="300000"
                step="10000"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </aside>

          {/* Job Listings Column */}
          <div className="lg:col-span-3 space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline">
                  search_off
                </span>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  No matching jobs found
                </h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Try adjusting your keywords, lowering minimum salary, or clearing filters.
                </p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApplyClick={handleApplyClick}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />

      <JobApplyModal
        job={selectedJobToApply}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
        onSuccess={(job) => console.log("Applied for", job.title)}
      />
    </>
  );
}
