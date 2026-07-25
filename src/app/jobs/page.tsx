"use client";

import React, { useState, useMemo } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { INITIAL_JOBS, Job } from "@/lib/mockData";

export default function JobSearchPage() {
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

            {/* Quick Sort Dropdown */}
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
                className="text-xs font-label-md text-primary hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Keyword Filter */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                Keyword
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Title, skill or company..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                Location
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                  location_on
                </span>
                <input
                  type="text"
                  placeholder="City, State, or Country..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Remote Toggle */}
            <div className="flex items-center justify-between p-3 bg-primary-container/10 border border-primary/20 rounded-xl">
              <span className="text-xs font-label-md font-bold text-on-surface">
                Remote Jobs Only
              </span>
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="block text-xs font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                Category
              </label>
              <div className="space-y-1.5 text-xs font-label-md text-on-surface">
                {["ALL", "Design", "Engineering", "Product"].map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="text-primary focus:ring-primary"
                      />
                      <span>{cat === "ALL" ? "All Categories" : cat}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Minimum Salary Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                  Min Salary
                </label>
                <span className="text-xs font-bold text-primary">
                  ${Math.round(minSalary / 1000)}k/yr
                </span>
              </div>
              <input
                type="range"
                min={80000}
                max={250000}
                step={10000}
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </aside>

          {/* Job Feed Grid */}
          <div className="lg:col-span-3 space-y-6">
            {filteredJobs.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center space-y-4 border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-5xl">
                  search_off
                </span>
                <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                  No matching jobs found
                </h3>
                <p className="text-on-surface-variant text-sm max-w-md mx-auto">
                  Try adjusting your filter criteria or clearing keywords to see more opportunities.
                </p>
                <button
                  onClick={() => {
                    setKeyword("");
                    setLocation("");
                    setSelectedCategory("ALL");
                    setRemoteOnly(false);
                    setMinSalary(80000);
                  }}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-xs font-bold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onApplyClick={(j) => setSelectedJobToApply(j)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <JobApplyModal
        job={selectedJobToApply}
        isOpen={!!selectedJobToApply}
        onClose={() => setSelectedJobToApply(null)}
        onSuccess={(j) => {
          console.log("Applied to", j.title);
        }}
      />
    </>
  );
}
