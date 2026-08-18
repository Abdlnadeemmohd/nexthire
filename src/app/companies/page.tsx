"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { EmptyState } from "@/components/ui/EmptyState";

interface CompanyItem {
  id: string;
  name: string;
  logo: string;
  industry: string;
  location: string;
  size: string;
  description: string;
  verified: boolean;
  activeJobsCount: number;
}

export default function CompaniesDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("ALL");
  const [companies, setCompanies] = useState<CompanyItem[]>([
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "NextHire Simulation Corp",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      industry: "Enterprise SaaS & AI Recruitment",
      location: "San Francisco, CA",
      size: "100 - 250 Employees",
      description: "Official Stage 1 employer simulation corporation on NextHire Cloud.",
      verified: true,
      activeJobsCount: 1,
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/admin/companies");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setCompanies(
              data.data.map((c: any) => ({
                id: c.id,
                name: c.name,
                logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
                industry: c.industry || "Technology",
                location: c.location || "San Francisco, CA",
                size: "100 - 250 Employees",
                description: c.description || "Verified technology employer on NextHire.",
                verified: c.isVerified,
                activeJobsCount: c.jobs?.length || 0,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    }

    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((company: CompanyItem) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      selectedIndustry === "ALL" || company.industry === selectedIndustry;

    return matchesSearch && matchesIndustry;
  });

  return (
    <>
      <TopAppBar />

      <div className="min-h-screen bg-surface pt-16 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {/* Header */}
          <div className="border-b border-outline-variant/20 pb-6 space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
              Featured Employers & Companies
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm">
              Discover top verified technology companies hiring talent on NextHire.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by company name, industry, or location..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="ALL">All Industries</option>
                  <option value="Enterprise SaaS & AI Recruitment">Enterprise SaaS & AI Recruitment</option>
                  <option value="Enterprise SaaS">Enterprise SaaS</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                  <option value="Fintech">Fintech</option>
                </select>
              </div>
            </div>
          </div>

          {/* Companies Grid */}
          {filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company: CompanyItem) => (
                <div
                  key={company.id}
                  className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-primary/40 transition-all shadow-xs"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        src={company.logo}
                        name={company.name}
                        size="md"
                        rounded="2xl"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-on-surface">{company.name}</h3>
                          {company.verified && <VerifiedBadge role="RECRUITER" size="sm" />}
                        </div>
                        <p className="text-xs text-primary font-medium">{company.industry}</p>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                      {company.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-outline pt-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {company.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">group</span>
                        {company.size}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-xl whitespace-nowrap">
                      {company.activeJobsCount} Active Jobs
                    </span>
                    <Link
                      href={`/companies/${company.id}`}
                      className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-1 touch-target whitespace-nowrap"
                    >
                      View Company
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No companies found"
              description="Try adjusting your search filters to discover more employer organizations."
              icon="domain_disabled"
              actionLabel="Reset Search"
              onAction={() => {
                setSearchQuery("");
                setSelectedIndustry("ALL");
              }}
            />
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
