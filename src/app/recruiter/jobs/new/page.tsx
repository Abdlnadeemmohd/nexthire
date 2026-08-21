"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { useToast } from "@/components/ui/Toast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function PostJobPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("United States");
  const [salaryMin, setSalaryMin] = useState<string | number>("");
  const [salaryMax, setSalaryMax] = useState<string | number>("");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [experienceLevel, setExperienceLevel] = useState("Mid-Senior");
  const [isRemote, setIsRemote] = useState(false);
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast("Please fill in the job title and description.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          location: location.trim() || (isRemote ? "Remote" : "Not specified"),
          country,
          salaryMin: salaryMin ? Number(salaryMin) : 0,
          salaryMax: salaryMax ? Number(salaryMax) : 0,
          employmentType,
          experienceLevel,
          isRemote,
          description: description.trim(),
          skills: skills.trim(),
          responsibilities: [],
          requirements: [],
          benefits: [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        showToast("Job opening published successfully to Neon PostgreSQL!", "success");
        setTimeout(() => {
          router.push("/recruiter");
        }, 1200);
      } else {
        showToast(data.error || "Failed to create job posting", "error");
      }
    } catch (err) {
      showToast("Network error publishing job", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <main className="flex-1 lg:pl-[270px] p-6 md:p-10 space-y-8 max-w-4xl pb-20 sm:pb-24">
          <Breadcrumbs items={[{ label: "Home", href: "/recruiter" }, { label: "Post a New Job" }]} />

          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Create & Publish Job Opening
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Publishing to NextHire saves the position directly into Neon PostgreSQL.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
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
                    Job Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Full-Stack Engineer, Lead Cloud Architect"
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
                      <option value="Engineering">Engineering</option>
                      <option value="AI/ML">AI / Machine Learning</option>
                      <option value="Design">Design</option>
                      <option value="Product">Product</option>
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
                      placeholder="e.g. 120000"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
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
                      placeholder="e.g. 160000"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
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

                {/* Location */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                    Job Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Austin, TX or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                    Required Skills / Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TypeScript, React, Node.js, PostgreSQL"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Role Description */}
                <div className="space-y-2">
                  <label className="block text-xs font-label-md uppercase font-bold text-on-surface-variant">
                    Job Description & Expectations *
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

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-on-surface-variant hover:bg-surface-container font-label-md text-xs font-bold text-center touch-target"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-primary text-on-primary rounded-full font-label-md text-xs font-bold hover:bg-primary-container transition-all shadow-md disabled:opacity-50 text-center touch-target"
                  >
                    {isSubmitting ? "Publishing to Neon..." : "Publish Opening Now"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
