"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";

export default function PostJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Design");
  const [location, setLocation] = useState("San Francisco, CA");
  const [country, setCountry] = useState("United States");
  const [salaryMin, setSalaryMin] = useState(160000);
  const [salaryMax, setSalaryMax] = useState(220000);
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [experienceLevel, setExperienceLevel] = useState("Senior");
  const [isRemote, setIsRemote] = useState(true);
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("Figma, Design Systems, Next.js, AI UX");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      router.push("/recruiter");
    }, 1200);
  };

  return (
    <>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-label-md text-on-surface-variant">
            <span>Employer Suite</span>
            <span>/</span>
            <span className="text-primary font-bold">Post a New Job</span>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Create & Publish Job Opening
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Publishing to NextHire AI Match Engine reaches over 250,000 verified tech talent candidates.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-tertiary-fixed text-on-tertiary-fixed rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h3 className="font-headline-md text-2xl text-on-surface font-bold">
                  Job Opening Published!
                </h3>
                <p className="text-on-surface-variant font-body-md text-sm">
                  Redirecting to Employer Dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                    Job Role Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Product Designer, Lead AI Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Category & Employment Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Design">Design</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="AI/ML">AI / Machine Learning</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                      Employment Type
                    </label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="FULL_TIME">Full-Time</option>
                      <option value="PART_TIME">Part-Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Salary Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                      Min Salary ($ / yr)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(Number(e.target.value))}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                      Max Salary ($ / yr)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(Number(e.target.value))}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Remote Checkbox & Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="flex items-center gap-3 p-3 bg-surface border border-outline-variant/30 rounded-xl">
                    <input
                      type="checkbox"
                      id="remoteCheck"
                      checked={isRemote}
                      onChange={(e) => setIsRemote(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="remoteCheck" className="text-xs font-label-md font-bold text-on-surface cursor-pointer">
                      Allow 100% Remote Candidates
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                      Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Junior">Junior (1-3 yrs)</option>
                      <option value="Mid-Senior">Mid-Senior (3-5 yrs)</option>
                      <option value="Senior">Senior (5-8 yrs)</option>
                      <option value="Lead">Lead / Staff (8+ yrs)</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                    Required Skills / Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Role Description */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                    Job Description & Expectations
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe the opportunity, main responsibilities, and team context..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-full text-on-surface-variant hover:bg-surface-container font-label-md text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-primary text-on-primary rounded-full font-label-md text-xs font-bold hover:bg-primary-container transition-all shadow-md"
                  >
                    Publish Opening Now
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
