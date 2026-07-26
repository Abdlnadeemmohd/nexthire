"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

interface SupportTicket {
  id: string;
  submitterName: string;
  submitterEmail: string;
  submitterRole: "JOB_SEEKER" | "RECRUITER";
  subject: string;
  category: "BILLING" | "VERIFICATION" | "TECHNICAL" | "GENERAL";
  priority: "P0_CRITICAL" | "P1_HIGH" | "P2_NORMAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  submittedAt: string;
  description: string;
  replyText?: string;
}

const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "TICK-901",
    submitterName: "David Chen",
    submitterEmail: "david.chen@cybershield.sec",
    submitterRole: "RECRUITER",
    subject: "Employer Tax ID Document Verification Pending",
    category: "VERIFICATION",
    priority: "P1_HIGH",
    status: "OPEN",
    submittedAt: "2026-07-26 09:14 AM",
    description: "Uploaded W9 tax certificate and domain validation for CyberShield Sec. Requesting expedited verification badge approval.",
  },
  {
    id: "TICK-899",
    submitterName: "Alex Rivers",
    submitterEmail: "alex.rivers@gmail.com",
    submitterRole: "JOB_SEEKER",
    subject: "AI Resume ATS Score Match Query for Senior UX Role",
    category: "TECHNICAL",
    priority: "P2_NORMAL",
    status: "IN_PROGRESS",
    submittedAt: "2026-07-25 04:30 PM",
    description: "Resume Studio ATS parser calculated 98% match. Wanted to confirm if recruiter sees exact keyword breakdown.",
    replyText: "NextHire AI Operations: Yes, recruiters receive full match breakdowns in candidate view.",
  },
  {
    id: "TICK-884",
    submitterName: "Sarah Jenkins",
    submitterEmail: "sarah.jenkins@techcorp.io",
    submitterRole: "RECRUITER",
    subject: "Monthly Growth Plan Invoice Invoice Receipt",
    category: "BILLING",
    priority: "P2_NORMAL",
    status: "RESOLVED",
    submittedAt: "2026-07-24 11:05 AM",
    description: "Needed tax invoice with VAT identification number for annual accounting audit.",
    replyText: "Resolved by Billing Desk: Updated invoice PDF with company VAT ID dispatched to email.",
  },
];

export default function HelpCentrePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Candidate/Recruiter Ticket Submission Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState<"BILLING" | "VERIFICATION" | "TECHNICAL" | "GENERAL">("GENERAL");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState("");

  const portalType =
    user?.role === "RECRUITER"
      ? "recruiter"
      : user?.role === "PLATFORM_ADMIN"
      ? "admin"
      : "seeker";

  const handleResolveTicket = (ticketId: string, newStatus: "IN_PROGRESS" | "RESOLVED") => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, replyText: replyInput || t.replyText || "Updated by Support Admin." }
          : t
      )
    );
    setSelectedTicket(null);
    setReplyInput("");
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    const newTicket: SupportTicket = {
      id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
      submitterName: user?.name || "User",
      submitterEmail: user?.email || "user@nexthire.com",
      submitterRole: user?.role === "RECRUITER" ? "RECRUITER" : "JOB_SEEKER",
      subject: ticketSubject,
      category: ticketCategory,
      priority: "P2_NORMAL",
      status: "OPEN",
      submittedAt: "Just now",
      description: ticketDesc,
    };

    setTickets([newTicket, ...tickets]);
    setTicketSuccessMsg(`Support Ticket ${newTicket.id} successfully created! Our support desk will respond shortly.`);
    setTicketSubject("");
    setTicketDesc("");
    setTimeout(() => {
      setTicketSuccessMsg("");
      setIsSubmitModalOpen(false);
    }, 2000);
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.submitterName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ProtectedRoute>
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal={portalType} />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8">
            {/* PLATFORM OWNER: SUPPORT OPERATIONS DASHBOARD (ZENDESK / INTERCOM INBOX) */}
            {user?.role === "PLATFORM_ADMIN" ? (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-2xl">headset_mic</span>
                      <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                        Support Operations Dashboard
                      </h1>
                    </div>
                    <p className="text-on-surface-variant text-xs sm:text-sm">
                      Supervise candidate & employer support inquiries, audit billing tickets, and resolve verification requests.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 bg-rose-500/15 text-rose-700 font-bold text-xs rounded-full border border-rose-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                      {tickets.filter((t) => t.status === "OPEN").length} Open Support Tickets
                    </span>
                  </div>
                </div>

                {/* Support Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-1">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Open Inquiries</span>
                    <div className="text-3xl font-bold text-rose-600 font-display">
                      {tickets.filter((t) => t.status === "OPEN").length}
                    </div>
                    <p className="text-[11px] text-on-surface-variant">Requires Admin Attention</p>
                  </div>

                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-1">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">In Progress</span>
                    <div className="text-3xl font-bold text-amber-600 font-display">
                      {tickets.filter((t) => t.status === "IN_PROGRESS").length}
                    </div>
                    <p className="text-[11px] text-on-surface-variant">Assigned & Under Review</p>
                  </div>

                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-1">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Resolved Tickets</span>
                    <div className="text-3xl font-bold text-emerald-700 font-display">
                      {tickets.filter((t) => t.status === "RESOLVED").length}
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">99.2% SLA Resolution Rate</p>
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-xs font-label-md overflow-x-auto w-full sm:w-auto">
                    {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                          statusFilter === st
                            ? "bg-primary text-on-primary shadow-xs"
                            : "text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        {st === "ALL" ? "All Tickets" : st.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tickets by ID or user..."
                      className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Ticket Inbox Table */}
                <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Ticket ID & Subject</th>
                        <th className="py-3 px-4">Submitter</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                      {filteredTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold font-mono text-primary text-[11px]">{t.id}</div>
                            <div className="font-semibold text-on-surface max-w-xs truncate">{t.subject}</div>
                            <div className="text-[10px] text-outline">{t.submittedAt}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold">{t.submitterName}</div>
                            <div className="text-[11px] text-on-surface-variant">{t.submitterEmail}</div>
                            <VerifiedBadge role={t.submitterRole} size="sm" />
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant font-bold rounded-md text-[10px]">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 font-bold rounded-md text-[10px] ${
                                t.priority === "P0_CRITICAL"
                                  ? "bg-rose-500/15 text-rose-700"
                                  : t.priority === "P1_HIGH"
                                  ? "bg-amber-500/15 text-amber-700"
                                  : "bg-blue-500/15 text-blue-700"
                              }`}
                            >
                              {t.priority.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] ${
                                t.status === "OPEN"
                                  ? "bg-rose-500/15 text-rose-700"
                                  : t.status === "IN_PROGRESS"
                                  ? "bg-amber-500/15 text-amber-700"
                                  : "bg-emerald-500/15 text-emerald-700"
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => { setSelectedTicket(t); setReplyInput(t.replyText || ""); }}
                              className="px-3 py-1.5 bg-primary text-on-primary font-bold text-[11px] rounded-xl hover:bg-primary-container transition-all flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">edit_note</span>
                              Inspect / Reply
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* SEEKER AND RECRUITER HELP PORTAL */
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                      Help Centre & Support Desk
                    </h1>
                    <p className="text-on-surface-variant text-xs sm:text-sm">
                      {user?.role === "RECRUITER"
                        ? "Get assistance with recruiter verification, employer billing, job postings, and API integrations."
                        : "Search platform guides, application FAQs, ATS match documentation, and contact support."}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-base">support_agent</span>
                    Submit Support Ticket
                  </button>
                </div>

                {/* Search Header */}
                <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
                  <h3 className="font-bold text-base text-on-surface">How can we help you today?</h3>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline text-xl">search</span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search knowledgebase, verification FAQs, and platform documentation..."
                      className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-on-surface">Frequently Asked Questions</h3>
                  <div className="space-y-3">
                    {[
                      {
                        q: user?.role === "RECRUITER" ? "How do I get a Verified Employer Badge?" : "How does the AI Match Score work?",
                        a: user?.role === "RECRUITER"
                          ? "Submit your official company domain and tax registration document in Company Profile. Our Admin team audits submissions within 24 hours."
                          : "Our AI matching engine compares your skill tags and work experience against published job requirements to calculate an objective match percentage.",
                      },
                      {
                        q: user?.role === "RECRUITER" ? "How does candidate pipeline management work?" : "Can I apply without an account?",
                        a: user?.role === "RECRUITER"
                          ? "Recruiters use a visual Kanban board with stages (Applied, Under Review, Shortlisted, Interview, Offer, Hired). Candidates move with 1 click."
                          : "You can search public listings without logging in. Submitting an application requires a free account to ensure candidate tracking.",
                      },
                    ].map((faq, idx) => (
                      <div
                        key={idx}
                        className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2 cursor-pointer"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      >
                        <div className="flex items-center justify-between font-bold text-xs text-on-surface">
                          <span>{faq.q}</span>
                          <span className="material-symbols-outlined text-base">
                            {openFaq === idx ? "expand_less" : "expand_more"}
                          </span>
                        </div>
                        {openFaq === idx && (
                          <p className="text-xs text-on-surface-variant leading-relaxed pt-2 border-t border-outline-variant/20">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>

      {/* ADMIN TICKET INSPECT / REPLY MODAL */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Support Ticket ${selectedTicket.id}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-on-surface">{selectedTicket.submitterName} ({selectedTicket.submitterEmail})</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">
                  {selectedTicket.category}
                </span>
              </div>
              <p className="font-semibold text-on-surface">{selectedTicket.subject}</p>
              <p className="text-on-surface-variant leading-relaxed">{selectedTicket.description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface">Admin Response / SLA Resolution Note</label>
              <textarea
                rows={3}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Type response to submitter..."
                className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                onClick={() => handleResolveTicket(selectedTicket.id, "IN_PROGRESS")}
                className="px-4 py-2 bg-amber-500/15 text-amber-700 font-bold text-xs rounded-xl"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleResolveTicket(selectedTicket.id, "RESOLVED")}
                className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-all"
              >
                Resolve Ticket & Notify User
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* USER SUBMIT TICKET MODAL */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Submit Support Ticket"
        >
          <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
            {ticketSuccessMsg ? (
              <div className="p-4 bg-emerald-500/15 text-emerald-700 rounded-2xl text-xs font-bold">
                {ticketSuccessMsg}
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Inquiry Subject</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief summary of your question or issue..."
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="GENERAL">General Platform Inquiry</option>
                    <option value="VERIFICATION">Employer Verification</option>
                    <option value="BILLING">Billing & Subscription</option>
                    <option value="TECHNICAL">Technical Issue</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Detailed Explanation</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Provide details or steps to reproduce..."
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all"
                  >
                    Submit Ticket
                  </button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
