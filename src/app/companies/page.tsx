"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { EmptyState } from "@/components/ui/EmptyState";

interface CompanyItem {
  id: string;
  name: string;
  logo: string | null;
  industry: string;
  location: string;
  description: string;
  verified: boolean;
  activeJobsCount: number;
}

export default function CompaniesDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("ALL");
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/companies");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setCompanies(
              data.data.map((c: any) => ({
                id: c.id,
                name: c.name,
                logo: c.logo || null,
                industry: c.industry || "Technology",
                location: c.location || "Location not specified",
                description: c.description || "Hiring organization on NextHire.",
                verified: Boolean(c.isVerified),
                activeJobsCount: Array.isArray(c.jobs) ? c.jobs.length : 0,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load companies directory:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q);
    const matchesIndustry =
      selectedIndustry === "ALL" ||
      c.industry.toLowerCase().includes(selectedIndustry.toLowerCase());

    return matchesQuery && matchesIndustry;
  });

  return (
    <>
      <TopAppBar />

      <main className="pt-16 flex-1 min-h-screen bg-surface">
        {/* Header */}
        <section className="bg-mesh py-12 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
          <div className="max-w-5xl mx-auto space-y-4 text-center">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm uppercase font-bold text-xs">
              Verified Organizations
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface">
              Explore Hiring Companies
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto font-body-md">
              Discover verified technology employers actively hiring engineering talent on NextHire Cloud.
            </p>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto pt-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-xl">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by company name, technology, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Directory Grid */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {loading ? (
            <div className="py-20 text-center text-xs text-on-surface-variant">
              Loading company directory from database...
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((comp) => (
                <div
                  key={comp.id}
                  className="glass-card rounded-2xl p-6 border border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      {comp.logo ? (
                        <img src={comp.logo} alt={comp.name} className="w-14 h-14 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center font-bold text-primary text-xl">
                          {comp.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-base text-on-surface truncate">{comp.name}</h3>
                          {comp.verified && <VerifiedBadge role="RECRUITER" size="sm" />}
                        </div>
                        <p className="text-xs text-primary font-bold">{comp.industry}</p>
                        <p className="text-[11px] text-on-surface-variant">📍 {comp.location}</p>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-3">
                      {comp.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">
                      {comp.activeJobsCount > 0 ? `${comp.activeJobsCount} Open Positions` : "Registered Partner"}
                    </span>

                    <Link
                      href={`/companies/${comp.id}`}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      View Profile <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No companies found"
              description={
                searchQuery
                  ? `No hiring partners matched "${searchQuery}".`
                  : "No employer organizations have been registered yet."
              }
              icon="domain_disabled"
              actionLabel={searchQuery ? "Clear Search" : undefined}
              onAction={searchQuery ? () => setSearchQuery("") : undefined}
            />
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
