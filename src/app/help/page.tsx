"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Modal } from "@/components/ui/Modal";

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

const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [];

interface FaqItem {
  id: string;
  category: "AUTH" | "SEEKER" | "RECRUITER" | "PRIVACY" | "BILLING" | "AI";
  q: string;
  a: string;
}

const FAQS_DATA: FaqItem[] = [
  // Account & Authentication
  {
    id: "auth-1",
    category: "AUTH",
    q: "How do I create a NextHire account?",
    a: "Click 'Sign Up' in the top navigation or navigate to /register. Select whether you are registering as a Job Seeker (Candidate) or an Employer (Recruiter), provide your details, and verify your email address.",
  },
  {
    id: "auth-2",
    category: "AUTH",
    q: "How do I reset my password?",
    a: "Navigate to the Sign In page and click 'Forgot Password?' or visit /forgot-password. Enter your registered email address, and we will immediately dispatch a secure password reset link.",
  },
  {
    id: "auth-3",
    category: "AUTH",
    q: "How do I verify my email?",
    a: "Upon registration, a verification email is automatically sent with a confirmation link. If you did not receive it, visit /verify-email to request a new verification link.",
  },
  {
    id: "auth-4",
    category: "AUTH",
    q: "What should I do if I cannot sign in?",
    a: "Ensure your email and password are entered correctly. If you signed up via Google Single Sign-On, click 'Sign In with Google'. If you forgot your registered email, visit /recover-email to submit an account recovery inquiry.",
  },

  // Job Seeker
  {
    id: "seeker-1",
    category: "SEEKER",
    q: "How do I complete my candidate profile?",
    a: "Log into your Candidate Dashboard and navigate to 'Profile'. You can add your headline, bio, location, top skills, work experience history, and educational background.",
  },
  {
    id: "seeker-2",
    category: "SEEKER",
    q: "How do I upload and parse my resume?",
    a: "Navigate to 'Resume Studio' in your dashboard. You can upload PDF or DOCX resume files (up to 5MB). NextHire will automatically parse your skills and experience to match against published job openings.",
  },
  {
    id: "seeker-3",
    category: "SEEKER",
    q: "How do I apply for a job?",
    a: "Browse live jobs on the /jobs page. Select any listing to view requirements, salary ranges, and match breakdown, then click 'Apply Now' to submit your application and tailored resume.",
  },
  {
    id: "seeker-4",
    category: "SEEKER",
    q: "How can I track my submitted applications?",
    a: "Go to 'Applications' in your dashboard. You can monitor your application status across stages including Submitted, Under Review, Shortlisted, Interview Scheduled, and Offer.",
  },

  // Recruiter
  {
    id: "recruiter-1",
    category: "RECRUITER",
    q: "How do I create a recruiter account?",
    a: "Visit /register, select 'Register as Employer', and provide your official corporate email address, company name, and company website.",
  },
  {
    id: "recruiter-2",
    category: "RECRUITER",
    q: "How do I create and verify my company profile?",
    a: "Navigate to 'Company Profile' in the Recruiter portal. Add your logo, company description, headquarters, and submit your business verification documents to earn the Verified Employer badge.",
  },
  {
    id: "recruiter-3",
    category: "RECRUITER",
    q: "How do I post a new job opening?",
    a: "From the Recruiter portal, click 'Post a New Job' (/recruiter/jobs/new). Fill in the title, role requirements, skill tags, employment type, location (remote/onsite), and compensation details.",
  },
  {
    id: "recruiter-4",
    category: "RECRUITER",
    q: "How can I manage candidate pipelines?",
    a: "Use the visual Kanban pipeline on the Applicants page (/recruiter/applicants). You can drag or move candidates across hiring stages, schedule interviews, and log evaluation notes.",
  },

  // Account & Privacy
  {
    id: "privacy-1",
    category: "PRIVACY",
    q: "How can I update my privacy settings?",
    a: "Visit 'Settings' in your account navigation to manage profile visibility, search indexing preferences, and marketing notification preferences.",
  },
  {
    id: "privacy-2",
    category: "PRIVACY",
    q: "How can I request a complete export of my personal data?",
    a: "Under 'Account Settings > Data & Privacy', you can request a complete export of your personal profile data, applications, and documents in compliance with GDPR and CCPA.",
  },
  {
    id: "privacy-3",
    category: "PRIVACY",
    q: "How do I permanently delete my account?",
    a: "Navigate to 'Account Settings > Danger Zone' and select 'Delete Account'. This will revoke active sessions and permanently delete your profile and application history.",
  },

  // Billing
  {
    id: "billing-1",
    category: "BILLING",
    q: "What subscription plans are available for recruiters?",
    a: "NextHire offers Starter, Growth, and Enterprise plans with flexible monthly and annual billing. Check /recruiter/billing for active pricing tiers, feature limits, and outreach allowances.",
  },
  {
    id: "billing-2",
    category: "BILLING",
    q: "How do invoices and payment receipts work?",
    a: "All payments are processed securely via Stripe. Invoices and VAT receipts are available for download under 'Billing & Invoices' in the Recruiter portal.",
  },

  // AI & Matching
  {
    id: "ai-1",
    category: "AI",
    q: "How is the AI Match Score calculated?",
    a: "NextHire analyzes candidate verified skill tags, years of domain experience, and role competencies against the employer's published job criteria to calculate an objective match percentage.",
  },
  {
    id: "ai-2",
    category: "AI",
    q: "Do recruiters see my full resume and application notes?",
    a: "Yes. When you submit an application, verified recruiters on that job requisition can securely view your resume and evaluation metrics within their company portal.",
  },
];

function HelpCentreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const sectionParam = searchParams.get("section");
  const [activeTab, setActiveTab] = useState<"overview" | "contact" | "faq">(
    sectionParam === "contact" ? "contact" : sectionParam === "faq" ? "faq" : "overview"
  );

  useEffect(() => {
    if (sectionParam === "contact") setActiveTab("contact");
    else if (sectionParam === "faq") setActiveTab("faq");
    else setActiveTab("overview");
  }, [sectionParam]);

  const handleTabChange = (tab: "overview" | "contact" | "faq") => {
    setActiveTab(tab);
    if (tab === "overview") router.push("/help");
    else router.push(`/help?section=${tab}`);
  };

  // Search & FAQ filters
  const [searchQuery, setSearchQuery] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>("ALL");
  const [openFaqId, setOpenFaqId] = useState<string | null>("auth-1");

  // Contact Form State
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactUserType, setContactUserType] = useState<string>(
    user?.role === "RECRUITER" ? "RECRUITER" : "CANDIDATE"
  );
  const [contactSubject, setContactSubject] = useState("");
  const [contactCategory, setContactCategory] = useState("Account & Login");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccessMessage, setContactSuccessMessage] = useState("");
  const [contactErrorMessage, setContactErrorMessage] = useState("");

  // Admin Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyInput, setReplyInput] = useState("");

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactErrorMessage("");
    setContactSuccessMessage("");

    if (!contactName.trim() || !contactEmail.trim() || !contactSubject.trim() || !contactMessage.trim()) {
      setContactErrorMessage("Please complete all required fields.");
      return;
    }

    setIsSubmittingContact(true);

    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          userType: contactUserType,
          subject: contactSubject,
          category: contactCategory,
          message: contactMessage,
        }),
      });

      const data = await res.json();
      setIsSubmittingContact(false);

      if (res.ok && data.success) {
        setContactSuccessMessage(data.message || `Support ticket created successfully!`);
        setContactSubject("");
        setContactMessage("");
      } else {
        setContactErrorMessage(data.error || "Unable to send support request. Please try again.");
      }
    } catch {
      setIsSubmittingContact(false);
      setContactErrorMessage("Network error communicating with support service. Please try again.");
    }
  };

  const filteredFaqs = FAQS_DATA.filter((f) => {
    if (faqCategoryFilter !== "ALL" && f.category !== faqCategoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    }
    return true;
  });

  const portalType =
    user?.role === "RECRUITER"
      ? "recruiter"
      : user?.role === "PLATFORM_ADMIN"
      ? "admin"
      : "seeker";

  const hasSidebar = !!user;

  return (
    <>
      <TopAppBar />

      <div className={`flex pt-16 min-h-screen bg-surface ${hasSidebar ? "" : "flex-col"}`}>
        {hasSidebar && <SidebarNav portal={portalType} />}

        <div className={`flex-1 ${hasSidebar ? "lg:pl-[270px]" : ""} flex flex-col min-h-[calc(100vh-4rem)]`}>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-8">

            {/* PLATFORM ADMIN DESK (For Admins) */}
            {user?.role === "PLATFORM_ADMIN" && (
              <div className="glass-card rounded-2xl p-4 border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">admin_panel_settings</span>
                  <span className="font-bold text-on-surface">Platform Admin Support Operations Desk Active</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(tickets[0])}
                  className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs"
                >
                  Manage Inbound Tickets ({tickets.filter((t) => t.status === "OPEN").length})
                </button>
              </div>
            )}

            {/* Header Title & Subtitle */}
            <div className="space-y-2 border-b border-outline-variant/20 pb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl" aria-hidden="true">
                  support_agent
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                  NextHire Help Centre &amp; Support
                </h1>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm max-w-2xl leading-relaxed">
                Find answers to common questions about your account, application status, resume parsing, and employer verification, or get in touch directly with our support operations team.
              </p>
            </div>

            {/* Navigation Tabs */}
            <nav aria-label="Help Centre Navigation" className="flex border-b border-outline-variant/20 gap-2 sm:gap-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleTabChange("overview")}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-primary rounded-t ${
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-outline hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">dashboard</span>
                Help Centre Overview
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("contact")}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-primary rounded-t ${
                  activeTab === "contact"
                    ? "border-primary text-primary"
                    : "border-transparent text-outline hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">mail</span>
                Contact Support
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("faq")}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-primary rounded-t ${
                  activeTab === "faq"
                    ? "border-primary text-primary"
                    : "border-transparent text-outline hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">quiz</span>
                Frequently Asked Questions
              </button>
            </nav>

            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Search Bar */}
                <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
                  <h2 className="font-bold text-base text-on-surface">How can we help you today?</h2>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline text-xl" aria-hidden="true">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search knowledgebase, verification FAQs, resume guidelines, and documentation..."
                      className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Quick Assistance Category Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">lock</span>
                    </div>
                    <h3 className="font-bold text-sm text-on-surface">Account &amp; Security</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Password resets, email verification, two-factor access, and account recovery assistance.
                    </p>
                    <Link
                      href="/help?section=faq"
                      className="inline-block text-primary text-xs font-bold hover:underline pt-1"
                    >
                      View Account FAQs &rarr;
                    </Link>
                  </div>

                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">work</span>
                    </div>
                    <h3 className="font-bold text-sm text-on-surface">Job Applications</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Submitting applications, tracking review stages, scheduling interviews, and ATS scoring.
                    </p>
                    <Link
                      href="/help?section=faq"
                      className="inline-block text-primary text-xs font-bold hover:underline pt-1"
                    >
                      View Candidate FAQs &rarr;
                    </Link>
                  </div>

                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">domain</span>
                    </div>
                    <h3 className="font-bold text-sm text-on-surface">Employer Verification</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Verified employer badges, corporate domain validation, and candidate pipeline tools.
                    </p>
                    <Link
                      href="/help?section=faq"
                      className="inline-block text-primary text-xs font-bold hover:underline pt-1"
                    >
                      View Recruiter FAQs &rarr;
                    </Link>
                  </div>

                  <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2.5 shadow-xs">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">credit_card</span>
                    </div>
                    <h3 className="font-bold text-sm text-on-surface">Billing &amp; Subscriptions</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      SaaS growth plans, Stripe payment receipts, tax invoices, and quota allowances.
                    </p>
                    <Link
                      href="/help?section=faq"
                      className="inline-block text-primary text-xs font-bold hover:underline pt-1"
                    >
                      View Billing FAQs &rarr;
                    </Link>
                  </div>
                </div>

                {/* Direct Contact Banner */}
                <div className="glass-card bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">mark_email_read</span>
                      <h3 className="font-bold text-base text-on-surface">Need Direct Assistance from Our Support Team?</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      Our support operations desk is available to assist candidates and employer teams with technical, billing, and verification requests.
                    </p>
                    <div className="pt-2 text-xs text-outline flex flex-wrap gap-4">
                      <span><strong>Support Channel:</strong> In-App Ticket Desk</span>
                      <span><strong>Official Support Email:</strong> support@nexthire.cloud</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTabChange("contact")}
                    className="px-6 py-3 bg-primary text-on-primary font-bold text-xs sm:text-sm rounded-full hover:bg-primary-container transition-all shadow-md flex items-center gap-2 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">send</span>
                    Open Contact Support Form
                  </button>
                </div>

                {/* FAQ Highlights Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-on-surface">Frequently Asked Questions</h3>
                    <button
                      type="button"
                      onClick={() => handleTabChange("faq")}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      View All 18 FAQs &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {FAQS_DATA.slice(0, 4).map((faq) => {
                      const isOpen = openFaqId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                            aria-expanded={isOpen}
                            aria-controls={`faq-answer-${faq.id}`}
                            className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary rounded p-1"
                          >
                            <span>{faq.q}</span>
                            <span className="material-symbols-outlined text-base text-outline" aria-hidden="true">
                              {isOpen ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                          {isOpen && (
                            <p
                              id={`faq-answer-${faq.id}`}
                              className="text-xs text-on-surface-variant leading-relaxed pt-2 border-t border-outline-variant/20"
                            >
                              {faq.a}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONTACT SUPPORT TAB */}
            {activeTab === "contact" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                    Contact NextHire Support
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Submit your inquiry below. Our support operations team will review and reply via email.
                  </p>
                </div>

                {contactSuccessMessage ? (
                  <div className="glass-card bg-surface-container-lowest border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 bg-emerald-500/15 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl">
                      <span className="material-symbols-outlined text-3xl" aria-hidden="true">check_circle</span>
                    </div>
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                      Support Request Dispatched
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed max-w-md mx-auto">
                      {contactSuccessMessage}
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setContactSuccessMessage("")}
                        className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-primary-container transition-all"
                      >
                        Submit Another Request
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange("faq")}
                        className="px-5 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-full hover:bg-surface-container transition-all"
                      >
                        Browse FAQs
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs text-xs">
                    {contactErrorMessage && (
                      <div role="alert" className="p-3.5 bg-error-container/40 border border-error/40 text-error text-xs font-bold rounded-xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-base" aria-hidden="true">error</span>
                        <span>{contactErrorMessage}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label htmlFor="contactName" className="block text-outline font-bold uppercase text-[11px]">
                          Full Name <span className="text-error">*</span>
                        </label>
                        <input
                          id="contactName"
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Alex Rivers"
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label htmlFor="contactEmail" className="block text-outline font-bold uppercase text-[11px]">
                          Email Address <span className="text-error">*</span>
                        </label>
                        <input
                          id="contactEmail"
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* User Type */}
                      <div className="space-y-1">
                        <label htmlFor="contactUserType" className="block text-outline font-bold uppercase text-[11px]">
                          User / Account Type
                        </label>
                        <select
                          id="contactUserType"
                          value={contactUserType}
                          onChange={(e) => setContactUserType(e.target.value)}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        >
                          <option value="CANDIDATE">Candidate / Job Seeker</option>
                          <option value="RECRUITER">Employer / Recruiter</option>
                          <option value="OTHER">Other Platform Visitor</option>
                        </select>
                      </div>

                      {/* Category */}
                      <div className="space-y-1">
                        <label htmlFor="contactCategory" className="block text-outline font-bold uppercase text-[11px]">
                          Inquiry Category
                        </label>
                        <select
                          id="contactCategory"
                          value={contactCategory}
                          onChange={(e) => setContactCategory(e.target.value)}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        >
                          <option value="Account & Login">Account &amp; Login</option>
                          <option value="Profile & Resume">Profile &amp; Resume Parsing</option>
                          <option value="Job Applications">Job Applications &amp; Tracking</option>
                          <option value="Recruiter & Verification">Recruiter &amp; Company Verification</option>
                          <option value="Billing & Invoicing">Billing &amp; Invoicing</option>
                          <option value="Technical Issue">Technical Bug or Issue</option>
                          <option value="Other">Other Question</option>
                        </select>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1">
                      <label htmlFor="contactSubject" className="block text-outline font-bold uppercase text-[11px]">
                        Subject <span className="text-error">*</span>
                      </label>
                      <input
                        id="contactSubject"
                        type="text"
                        required
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Brief summary of your question or issue..."
                        className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-1">
                      <label htmlFor="contactMessage" className="block text-outline font-bold uppercase text-[11px]">
                        Message Details <span className="text-error">*</span>
                      </label>
                      <textarea
                        id="contactMessage"
                        rows={5}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Provide details, relevant URLs, or steps to reproduce..."
                        className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingContact}
                      className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs sm:text-sm rounded-full hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 mt-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {isSubmittingContact ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending Support Request...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base" aria-hidden="true">send</span>
                          Send Support Request
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* 3. FAQS TAB */}
            {activeTab === "faq" && (
              <div className="space-y-6">
                <div className="text-center space-y-2 max-w-xl mx-auto">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Browse answers organized by topic, or search specifically for what you need.
                  </p>
                </div>

                {/* Search & Category Filter Pills */}
                <div className="space-y-4">
                  <div className="relative max-w-md mx-auto">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline text-lg" aria-hidden="true">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter FAQs by keyword..."
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    {[
                      { id: "ALL", label: "All Questions" },
                      { id: "AUTH", label: "Account & Login" },
                      { id: "SEEKER", label: "Job Seekers" },
                      { id: "RECRUITER", label: "Employers" },
                      { id: "PRIVACY", label: "Privacy & Data" },
                      { id: "BILLING", label: "Billing & Plans" },
                      { id: "AI", label: "AI Match Engine" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFaqCategoryFilter(cat.id)}
                        className={`px-3.5 py-1.5 rounded-full font-bold transition-all focus:outline-none focus:ring-1 focus:ring-primary ${
                          faqCategoryFilter === cat.id
                            ? "bg-primary text-on-primary shadow-xs"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQ List */}
                <div className="space-y-3 max-w-3xl mx-auto">
                  {filteredFaqs.length === 0 ? (
                    <div className="text-center py-12 text-outline text-xs">
                      No questions matched your search query. Try another term or{" "}
                      <button
                        type="button"
                        onClick={() => handleTabChange("contact")}
                        className="text-primary font-bold hover:underline"
                      >
                        Contact Support
                      </button>.
                    </div>
                  ) : (
                    filteredFaqs.map((faq) => {
                      const isOpen = openFaqId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-2 shadow-xs"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                            aria-expanded={isOpen}
                            aria-controls={`faq-answer-${faq.id}`}
                            className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary rounded p-1"
                          >
                            <span>{faq.q}</span>
                            <span className="material-symbols-outlined text-base text-outline" aria-hidden="true">
                              {isOpen ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                          {isOpen && (
                            <p
                              id={`faq-answer-${faq.id}`}
                              className="text-xs text-on-surface-variant leading-relaxed pt-2 border-t border-outline-variant/20"
                            >
                              {faq.a}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>

      {/* ADMIN TICKET REPLY MODAL */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Support Ticket ${selectedTicket.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-surface-container-low rounded-2xl space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-on-surface">{selectedTicket.submitterName} ({selectedTicket.submitterEmail})</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">
                  {selectedTicket.category}
                </span>
              </div>
              <p className="font-semibold text-on-surface">{selectedTicket.subject}</p>
              <p className="text-on-surface-variant leading-relaxed">{selectedTicket.description}</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-on-surface">Admin Response / Resolution Note</label>
              <textarea
                rows={3}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Type response to submitter..."
                className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setTickets((prev) =>
                    prev.map((t) =>
                      t.id === selectedTicket.id
                        ? { ...t, status: "RESOLVED", replyText: replyInput || "Resolved by support desk." }
                        : t
                    )
                  );
                  setSelectedTicket(null);
                  setReplyInput("");
                }}
                className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-all"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default function HelpCentrePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center text-xs font-bold text-outline">Loading Help Centre...</div>}>
      <HelpCentreContent />
    </Suspense>
  );
}
