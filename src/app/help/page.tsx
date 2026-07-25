"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { Modal } from "@/components/ui/Modal";

export default function HelpCentrePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"ALL" | "SEEKER" | "RECRUITER" | "ACCOUNT">("ALL");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const faqs = [
    {
      id: 1,
      category: "SEEKER",
      question: "How does the AI Match Score work?",
      answer: "Our AI matching engine analyzes the skill tags, work experience, and education listed in your profile and uploaded resume, comparing them against the employer's published job requirements to calculate an objective percentage match score.",
    },
    {
      id: 2,
      category: "SEEKER",
      question: "Can I apply for jobs without creating an account?",
      answer: "You can browse all public job listings without an account. However, to submit applications and upload a resume, you must register for a free Job Seeker account to ensure secure candidate tracking.",
    },
    {
      id: 3,
      category: "RECRUITER",
      question: "How do I get a Verified Employer Badge?",
      answer: "Verified Recruiter status requires submitting your official company email, website domain, and tax identification number in the Company Moderation portal. Our Admin team audits these documents within 24-48 hours.",
    },
    {
      id: 4,
      category: "RECRUITER",
      question: "How does candidate pipeline management work?",
      answer: "Recruiters access a visual Kanban board with stage columns (Applied, Under Review, Shortlisted, Interview, Offer, Hired, Rejected). You can move candidates between stages and schedule interviews with 1 click.",
    },
    {
      id: 5,
      category: "ACCOUNT",
      question: "How do I request account deletion or data download?",
      answer: "Navigate to Account Settings (/settings) -> Account Deletion tab. You can download a complete JSON export of your personal data before permanently deleting your account.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    if (activeCategory !== "ALL" && faq.category !== activeCategory) return false;
    if (search && !faq.question.toLowerCase().includes(search.toLowerCase()) && !faq.answer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setIsTicketOpen(false);
      setTicketSubject("");
      setTicketDescription("");
    }, 1500);
  };

  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh pt-24 pb-20 px-4 sm:px-6 lg:px-8 space-y-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container font-label-sm uppercase tracking-wider text-xs font-bold shadow-xs">
            SUPPORT & HELP CENTRE
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-on-surface">
            How Can We <span className="text-primary">Help You?</span>
          </h1>
          <p className="text-on-surface-variant text-sm font-body-md">
            Search user guides, recruiter verification FAQs, or submit a direct support ticket.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto pt-2">
            <span className="material-symbols-outlined absolute left-4 top-5 text-outline">search</span>
            <input
              type="text"
              placeholder="Search help articles, FAQs, or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant/40 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
        </section>

        {/* Quick Help Action Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">person_search</span>
            </div>
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">Job Seeker Guides</h3>
            <p className="text-xs text-on-surface-variant">Profile setup, resume optimization, AI match scores, and 1-click applications.</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-3">
            <div className="w-10 h-10 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">domain</span>
            </div>
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">Employer & Recruiter Guides</h3>
            <p className="text-xs text-on-surface-variant">Company verification, Tax ID audits, job posting studio, and applicant pipelines.</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">Need Direct Assistance?</h3>
              <p className="text-xs text-on-surface-variant">Our support team is available 24/7 to resolve technical or billing inquiries.</p>
            </div>
            <button
              onClick={() => setIsTicketOpen(true)}
              className="w-full py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-xs mt-2"
            >
              Submit Support Ticket
            </button>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="glass-card rounded-3xl p-8 sm:p-12 border border-outline-variant/20 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="font-headline-sm text-2xl font-bold text-on-surface">
              Frequently Asked Questions
            </h2>

            <div className="flex gap-2 text-xs font-label-md font-bold">
              {(["ALL", "SEEKER", "RECRUITER", "ACCOUNT"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full p-5 text-left font-bold text-sm text-on-surface flex justify-between items-center gap-4 hover:bg-surface-container-low"
                  >
                    <span>{faq.question}</span>
                    <span className="material-symbols-outlined text-outline">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/10">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />

      {/* Support Ticket Modal */}
      <Modal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        title="Submit a Support Ticket"
      >
        {ticketSubmitted ? (
          <div className="p-6 text-center space-y-2 text-tertiary">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
            <h4 className="font-bold text-base">Ticket Submitted!</h4>
            <p className="text-xs text-on-surface-variant">Our support engineering team will respond via email within 2 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs font-body-sm">
            <div className="space-y-1">
              <label className="block text-outline font-label-md font-semibold">Subject / Topic</label>
              <input
                type="text"
                required
                placeholder="e.g. Recruiter verification document inquiry"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-outline font-label-md font-semibold">Issue Description</label>
              <textarea
                rows={4}
                required
                placeholder="Provide details about the issue..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTicketOpen(false)}
                className="px-4 py-2 text-on-surface-variant font-label-md hover:bg-surface-container rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-on-primary font-label-md font-bold rounded-full hover:bg-primary-container shadow-md"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
