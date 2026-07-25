"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";

interface PendingCompany {
  id: string;
  name: string;
  logo: string;
  industry: string;
  recruiterName: string;
  recruiterEmail: string;
  country: string;
  size: string;
  registrationDate: string;
  taxId: string;
  businessLicense: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documents: { title: string; fileUrl: string }[];
}

const INITIAL_MODERATION_COMPANIES: PendingCompany[] = [
  {
    id: "comp-mod-1",
    name: "Apex Global Technologies",
    logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150&auto=format&fit=crop&q=80",
    industry: "Enterprise AI & Cloud Infrastructure",
    recruiterName: "Marcus Vance",
    recruiterEmail: "marcus.vance@apexglobal.tech",
    country: "United States",
    size: "250-500 employees",
    registrationDate: "2026-07-15",
    taxId: "US-TAX-88492019",
    businessLicense: "LIC-DE-2026-9921",
    status: "PENDING",
    documents: [
      { title: "Certificate of Incorporation.pdf", fileUrl: "#" },
      { title: "Tax Exemption Certificate.pdf", fileUrl: "#" },
    ],
  },
  {
    id: "comp-mod-2",
    name: "Quantum Systems Inc.",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80",
    industry: "Fintech & Blockchain",
    recruiterName: "Elena Rostova",
    recruiterEmail: "elena@quantumsys.io",
    country: "United Kingdom",
    size: "50-100 employees",
    registrationDate: "2026-07-20",
    taxId: "UK-VAT-90218320",
    businessLicense: "GB-COMP-77120",
    status: "PENDING",
    documents: [
      { title: "Companies House Registry Document.pdf", fileUrl: "#" },
    ],
  },
  {
    id: "comp-mod-3",
    name: "CyberShield Security",
    logo: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80",
    industry: "Cybersecurity Solutions",
    recruiterName: "David Chen",
    recruiterEmail: "david.chen@cybershield.sec",
    country: "Singapore",
    size: "100-250 employees",
    registrationDate: "2026-07-22",
    taxId: "SG-GST-44912093",
    businessLicense: "SG-ACRA-2026-0129",
    status: "PENDING",
    documents: [
      { title: "ACRA Singapore Business License.pdf", fileUrl: "#" },
      { title: "Director Identity Verification.pdf", fileUrl: "#" },
    ],
  },
];

export default function AdminCompanyModerationPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<PendingCompany[]>(INITIAL_MODERATION_COMPANIES);
  const [filterTab, setFilterTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<PendingCompany | null>(null);

  const filteredCompanies = companies.filter((c) => c.status === filterTab);

  const handleApprove = (id: string, name: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "APPROVED" } : c))
    );
    showToast(`Approved company profile & recruiter verification for ${name}!`, "success");
    if (selectedCompanyModal?.id === id) setSelectedCompanyModal(null);
  };

  const handleReject = (id: string, name: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "REJECTED" } : c))
    );
    showToast(`Rejected verification for ${name}. Notification sent to recruiter.`, "info");
    if (selectedCompanyModal?.id === id) setSelectedCompanyModal(null);
  };

  const handleRequestChanges = (name: string) => {
    showToast(`Sent document revision request to recruiter at ${name}`, "info");
    if (selectedCompanyModal) setSelectedCompanyModal(null);
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <main className="flex-1 lg:pl-72 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  Employer & Company Moderation
                </h1>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">
                Review business registrations, corporate tax IDs, and recruiter identity documents for platform approval.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/15 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1 border border-amber-500/30">
                <span className="material-symbols-outlined text-sm">pending</span>
                {companies.filter((c) => c.status === "PENDING").length} Awaiting Verification
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-1 font-label-md text-xs">
            <button
              onClick={() => setFilterTab("PENDING")}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                filterTab === "PENDING"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">hourglass_top</span>
              Pending Approval ({companies.filter((c) => c.status === "PENDING").length})
            </button>
            <button
              onClick={() => setFilterTab("APPROVED")}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                filterTab === "APPROVED"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              Approved Employers ({companies.filter((c) => c.status === "APPROVED").length})
            </button>
            <button
              onClick={() => setFilterTab("REJECTED")}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                filterTab === "REJECTED"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">cancel</span>
              Rejected ({companies.filter((c) => c.status === "REJECTED").length})
            </button>
          </div>

          {/* Responsive 3-Column Card Grid Container */}
          {filteredCompanies.length === 0 ? (
            /* Professional Empty State Illustration */
            <div className="glass-card rounded-3xl p-12 text-center border border-outline-variant/30 max-w-xl mx-auto space-y-4 my-12">
              <div className="w-16 h-16 bg-primary-container/20 text-primary rounded-2xl flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl">task_alt</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  No Companies Awaiting Moderation
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  All employer profile verification requests in the queue have been reviewed and processed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setFilterTab("APPROVED")}
                  className="px-4 py-2 text-xs font-bold border border-outline-variant/40 rounded-xl hover:bg-surface-container text-on-surface"
                >
                  View Approved ({companies.filter((c) => c.status === "APPROVED").length})
                </button>
                <button
                  onClick={() => setFilterTab("REJECTED")}
                  className="px-4 py-2 text-xs font-bold border border-outline-variant/40 rounded-xl hover:bg-surface-container text-on-surface"
                >
                  View Rejected ({companies.filter((c) => c.status === "REJECTED").length})
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5"
                >
                  {/* Company Card Header */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-outline-variant/30 p-1 bg-white flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-headline-sm text-base font-bold text-on-surface truncate">
                            {company.name}
                          </h3>
                          <p className="text-xs text-on-surface-variant truncate">{company.industry}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase flex-shrink-0 ${
                          company.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                            : company.status === "REJECTED"
                            ? "bg-rose-500/15 text-rose-700 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                        }`}
                      >
                        {company.status}
                      </span>
                    </div>

                    {/* Metadata Specs */}
                    <div className="bg-surface-container-low/60 rounded-2xl p-3 text-xs space-y-2 border border-outline-variant/20">
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="text-outline font-label-md">Recruiter:</span>
                        <span className="font-bold text-on-surface truncate max-w-[170px]">
                          {company.recruiterName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="text-outline font-label-md">Email:</span>
                        <span className="font-bold text-on-surface truncate max-w-[170px]">
                          {company.recruiterEmail}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="text-outline font-label-md">Country & Size:</span>
                        <span className="font-bold text-on-surface">{company.country} • {company.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="text-outline font-label-md">Tax ID:</span>
                        <span className="font-mono text-[11px] font-bold text-on-surface">{company.taxId}</span>
                      </div>
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="text-outline font-label-md">Reg Date:</span>
                        <span className="font-label-md font-bold text-on-surface">{company.registrationDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Labeled Enterprise Approval Actions */}
                  <div className="space-y-3 pt-2 border-t border-outline-variant/20">
                    <button
                      onClick={() => setSelectedCompanyModal(company)}
                      className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      Review Details & Documents ({company.documents.length})
                    </button>

                    {company.status === "PENDING" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleReject(company.id, company.name)}
                          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(company.id, company.name)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-base">check</span>
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Moderation Details & Document Verification Modal */}
      {selectedCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCompanyModal.logo}
                  alt={selectedCompanyModal.name}
                  className="w-10 h-10 rounded-xl object-cover border border-outline-variant/30 p-1 bg-white"
                />
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    {selectedCompanyModal.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">Verification Document Review</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCompanyModal(null)}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-xl"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-2xl">
                <div>
                  <span className="text-outline font-label-md uppercase tracking-wider block text-[10px]">Recruiter</span>
                  <p className="font-bold text-on-surface">{selectedCompanyModal.recruiterName}</p>
                  <p className="text-on-surface-variant text-[11px]">{selectedCompanyModal.recruiterEmail}</p>
                </div>
                <div>
                  <span className="text-outline font-label-md uppercase tracking-wider block text-[10px]">Business Registration</span>
                  <p className="font-bold text-on-surface">{selectedCompanyModal.businessLicense}</p>
                  <p className="text-on-surface-variant text-[11px]">Tax ID: {selectedCompanyModal.taxId}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-on-surface uppercase tracking-wider text-[10px] block">
                  Uploaded Legal Documents ({selectedCompanyModal.documents.length})
                </span>
                <div className="space-y-2">
                  {selectedCompanyModal.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary text-xl">description</span>
                        <span className="font-bold text-on-surface">{doc.title}</span>
                      </div>
                      <a
                        href={doc.fileUrl}
                        onClick={(e) => {
                          e.preventDefault();
                          showToast(`Opening ${doc.title} for verification`, "info");
                        }}
                        className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-primary font-bold rounded-lg transition-colors text-[11px] flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span> View PDF
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
              <button
                onClick={() => handleRequestChanges(selectedCompanyModal.name)}
                className="px-4 py-2.5 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-colors"
              >
                Request Revisions
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReject(selectedCompanyModal.id, selectedCompanyModal.name)}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">close</span> Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedCompanyModal.id, selectedCompanyModal.name)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">check</span> Approve Employer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
