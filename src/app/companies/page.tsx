"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

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

const FEATURED_COMPANIES: CompanyItem[] = [
  {
    id: "c-1",
    name: "Stellar Systems Inc.",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUSY4HuOhQnp99RQGM7nj2qJaAWM49iI9uWz43APGGY9elmswm8Xhx8Hx3opdXODLdtZq0n-bxGcH7MRRbeOar3uNrgkHm1g4eL86ilUFWlHgKQHoc0-DqJsvor7xRNbZXRHP0WvFXR_dNDhMolXMQPnmQg4Jl_XDs_ssI9JsQ_WcIV4LJRpTCzOkZnd3pXcC9vurP6zcFOrmGm5bUwPACA1hF1P7gnmLUPkIZbbhMPh5kRmRcRFnUqsykv9lu5Rpjm64oHzTH_oyL",
    industry: "Enterprise SaaS",
    location: "San Francisco, CA",
    size: "250 - 500 Employees",
    description: "Building next-generation distributed cloud infrastructure and AI developer tools.",
    verified: true,
    activeJobsCount: 14,
  },
  {
    id: "c-2",
    name: "NeuralScale AI Labs",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    industry: "Artificial Intelligence",
    location: "New York, NY",
    size: "100 - 250 Employees",
    description: "Pioneering foundation models and autonomous neural infrastructure for enterprise automation.",
    verified: true,
    activeJobsCount: 8,
  },
  {
    id: "c-3",
    name: "QuantumPay Systems",
    logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80",
    industry: "Fintech",
    location: "Austin, TX",
    size: "500 - 1000 Employees",
    description: "Ultra-fast global payment gateway operating zero-latency ledger settlements.",
    verified: true,
    activeJobsCount: 19,
  },
];

export default function CompaniesDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("ALL");

  const filteredCompanies = FEATURED_COMPANIES.filter((company: CompanyItem) => {
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
                  <option value="Enterprise SaaS">Enterprise SaaS</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                  <option value="Fintech">Fintech</option>
                </select>
              </div>
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company: CompanyItem) => (
              <div
                key={company.id}
                className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-primary/40 transition-all shadow-xs"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-outline-variant/40 flex-shrink-0"
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
        </main>

        <Footer />
      </div>
    </>
  );
}
