"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

interface SequenceStep {
  id: string;
  stepOrder: number;
  delayDays: number;
  messageType: string;
  personalizationLevel: string;
  subjectTemplate: string;
  bodyTemplate: string;
  isEnabled: boolean;
}

interface RecipientMessage {
  id: string;
  stepId?: string | null;
  subject: string;
  body: string;
  status: string;
  recruiterApproved: boolean;
  sentAt?: string | null;
  deliveredAt?: string | null;
}

interface Recipient {
  id: string;
  candidateId: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    headline?: string | null;
    location?: string | null;
    avatar?: string | null;
    profile?: any;
  };
  status: string;
  currentStep: number;
  lastContactedAt?: string | null;
  repliedAt?: string | null;
  responseClassification?: string | null;
  responseSentiment?: string | null;
  recommendedNextAction?: string | null;
  engagementIntent?: string | null;
  optedOutAt?: string | null;
  messages: RecipientMessage[];
}

interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  job?: { id: string; title: string; location: string } | null;
  recruiter: { id: string; name: string; email: string };
  sequenceSteps: SequenceStep[];
  recipients: Recipient[];
  metrics?: {
    totalRecipients: number;
    draftCount: number;
    approvedCount: number;
    sentCount: number;
    deliveredCount: number;
    repliedCount: number;
    positiveReplyCount: number;
    interviewsCount: number;
    optedOutCount: number;
    bouncedCount: number;
    deliveryRate: number | null;
    replyRate: number | null;
    positiveReplyRate: number | null;
    interviewConversionRate: number | null;
  };
  duplicateWarnings?: any[];
}

interface JobOption {
  id: string;
  title: string;
  skills: string;
}

interface CandidateOption {
  id: string;
  name: string;
  headline?: string;
  skills: string[];
  avatar?: string;
}

export default function OutreachPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Campaign Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [personalizationLevel, setPersonalizationLevel] = useState<"STANDARD" | "PERSONALIZED" | "EVIDENCE_BASED">("PERSONALIZED");
  const [customContext, setCustomContext] = useState("");
  const [creating, setCreating] = useState(false);

  // Available jobs and candidates for creation wizard
  const [availableJobs, setAvailableJobs] = useState<JobOption[]>([]);
  const [availableCandidates, setAvailableCandidates] = useState<CandidateOption[]>([]);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState("");

  // Approval Modal State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvingCampaign, setApprovingCampaign] = useState<Campaign | null>(null);
  const [editableMessages, setEditableMessages] = useState<Record<string, { subject: string; body: string }>>({});
  const [approving, setApproving] = useState(false);

  // Load Campaigns
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recruiter/outreach/campaigns");
      const json = await res.json();
      if (res.ok && json.success) {
        setCampaigns(json.data || []);

        const activeId = searchParams.get("campaignId");
        if (activeId && json.data) {
          const found = json.data.find((c: Campaign) => c.id === activeId);
          if (found) setSelectedCampaign(found);
        }
      } else {
        showToast(json.error || "Failed to load campaigns", "error");
      }
    } catch (err) {
      console.error("Failed to load outreach campaigns:", err);
      showToast("Network error fetching outreach campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load wizard data (jobs & discoverable candidates)
  const loadWizardData = async () => {
    try {
      const [jobsRes, candsRes] = await Promise.all([
        fetch("/api/recruiter/jobs"),
        fetch("/api/recruiter/candidates?limit=25"),
      ]);

      if (jobsRes.ok) {
        const jobsJson = await jobsRes.json();
        if (jobsJson.success) setAvailableJobs(jobsJson.data || []);
      }

      if (candsRes.ok) {
        const candsJson = await candsRes.json();
        if (candsJson.success) {
          const mapped = (candsJson.data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            headline: c.headline,
            skills: c.skills || [],
            avatar: c.avatar,
          }));
          setAvailableCandidates(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to load wizard resources:", err);
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadWizardData();

    // Check if candidates were pre-selected from Talent Radar / Candidate search URL
    const preCandidateIds = searchParams.get("candidateIds");
    if (preCandidateIds) {
      setSelectedCandidates(preCandidateIds.split(",").filter(Boolean));
      setCreateModalOpen(true);
    }
  }, []);

  // Aggregate Top Analytics Bar Metrics
  const aggregateMetrics = useMemo(() => {
    let totalEnrolled = 0;
    let totalDelivered = 0;
    let totalReplied = 0;
    let totalPositive = 0;
    let totalOptOut = 0;
    let totalBounced = 0;

    for (const c of campaigns) {
      if (c.metrics) {
        totalEnrolled += c.metrics.totalRecipients;
        totalDelivered += c.metrics.deliveredCount;
        totalReplied += c.metrics.repliedCount;
        totalPositive += c.metrics.positiveReplyCount;
        totalOptOut += c.metrics.optedOutCount;
        totalBounced += c.metrics.bouncedCount;
      }
    }

    const overallDeliveryRate = totalEnrolled > 0 ? Math.round((totalDelivered / totalEnrolled) * 100) : null;
    const overallReplyRate = totalDelivered > 0 ? Math.round((totalReplied / totalDelivered) * 100) : null;
    const overallPositiveRate = totalReplied > 0 ? Math.round((totalPositive / totalReplied) * 100) : null;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
      totalEnrolled,
      totalDelivered,
      totalReplied,
      totalPositive,
      totalOptOut,
      totalBounced,
      overallDeliveryRate,
      overallReplyRate,
      overallPositiveRate,
    };
  }, [campaigns]);

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (c.job?.title && c.job.title.toLowerCase().includes(searchFilter.toLowerCase()));
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [campaigns, searchFilter, statusFilter]);

  // Actions
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      showToast("Campaign name is required", "error");
      return;
    }
    if (selectedCandidates.length === 0) {
      showToast("Please select at least one candidate recipient", "error");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/recruiter/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCampaignName.trim(),
          description: newCampaignDesc.trim() || undefined,
          jobId: selectedJobId || undefined,
          candidateIds: selectedCandidates,
          preferredLevel: personalizationLevel,
          customNotes: customContext.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Outreach campaign created successfully!", "success");
        setCreateModalOpen(false);
        setNewCampaignName("");
        setNewCampaignDesc("");
        setSelectedJobId("");
        setSelectedCandidates([]);
        setCustomContext("");
        await loadCampaigns();
        if (json.data) setSelectedCampaign(json.data);
      } else {
        showToast(json.error || "Failed to create campaign", "error");
      }
    } catch (err) {
      console.error("Error creating outreach campaign:", err);
      showToast("Network error creating campaign", "error");
    } finally {
      setCreating(false);
    }
  };

  const handlePauseResume = async (campaign: Campaign) => {
    const isPaused = campaign.status === "PAUSED";
    const endpoint = isPaused
      ? `/api/recruiter/outreach/campaigns/${campaign.id}/resume`
      : `/api/recruiter/outreach/campaigns/${campaign.id}/pause`;

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || `Campaign ${isPaused ? "resumed" : "paused"}`, "success");
        loadCampaigns();
      } else {
        showToast(json.error || "Failed to update campaign state", "error");
      }
    } catch {
      showToast("Network error updating campaign", "error");
    }
  };

  const handleCancel = async (campaign: Campaign) => {
    if (!confirm(`Are you sure you want to cancel campaign "${campaign.name}"? Pending sequence steps will stop.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/recruiter/outreach/campaigns/${campaign.id}/cancel`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Campaign cancelled", "success");
        loadCampaigns();
      } else {
        showToast(json.error || "Failed to cancel campaign", "error");
      }
    } catch {
      showToast("Network error cancelling campaign", "error");
    }
  };

  const openApprovalModal = (campaign: Campaign) => {
    setApprovingCampaign(campaign);
    const initialEdits: Record<string, { subject: string; body: string }> = {};
    for (const r of campaign.recipients) {
      const step1Msg = r.messages.find((m) => m.stepId === campaign.sequenceSteps[0]?.id) || r.messages[0];
      if (step1Msg) {
        initialEdits[r.id] = { subject: step1Msg.subject, body: step1Msg.body };
      }
    }
    setEditableMessages(initialEdits);
    setApprovalModalOpen(true);
  };

  const handleApproveAndDispatch = async () => {
    if (!approvingCampaign) return;

    try {
      setApproving(true);
      const recipientEdits = Object.entries(editableMessages).map(([recipientId, data]) => ({
        recipientId,
        subject: data.subject,
        body: data.body,
      }));

      const res = await fetch(`/api/recruiter/outreach/campaigns/${approvingCampaign.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          recipientEdits,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Campaign approved! Dispatched outreach to ${json.dispatchedCount} candidate(s).`, "success");
        setApprovalModalOpen(false);
        setApprovingCampaign(null);
        await loadCampaigns();
      } else {
        showToast(json.error || "Failed to dispatch campaign", "error");
      }
    } catch (err) {
      console.error("Error approving campaign:", err);
      showToast("Network error approving campaign", "error");
    } finally {
      setApproving(false);
    }
  };

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-16">
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/recruiter" },
                { label: "AI Outreach & Engagement", href: "/recruiter/outreach" },
              ]}
            />

            {/* Header Title + Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">campaign</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                        AI Recruiter Outreach
                      </h1>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                        Zero-Fabrication Engine
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-xs sm:text-sm font-body-md mt-0.5">
                      Grounded candidate sequences, human approval gate, dual-channel dispatch & response intelligence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/recruiter/copilot"
                  className="px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-label-md font-bold text-xs hover:bg-surface-container-highest border border-outline-variant/30 transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-lg text-primary">smart_toy</span>
                  Ask Copilot
                </Link>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-bold text-xs hover:bg-primary-container transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Create Campaign
                </button>
              </div>
            </div>

            {/* Overview Analytics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-2xl shadow-2xs">
                <p className="text-xs font-label-md uppercase font-semibold text-outline">Active Campaigns</p>
                <p className="text-2xl font-bold text-on-surface mt-1">
                  {aggregateMetrics.activeCampaigns}
                  <span className="text-xs text-on-surface-variant font-normal ml-1">/ {aggregateMetrics.totalCampaigns}</span>
                </p>
              </div>
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-2xl shadow-2xs">
                <p className="text-xs font-label-md uppercase font-semibold text-outline">Enrolled Candidates</p>
                <p className="text-2xl font-bold text-primary mt-1">{aggregateMetrics.totalEnrolled}</p>
              </div>
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-2xl shadow-2xs">
                <p className="text-xs font-label-md uppercase font-semibold text-outline">Delivered Messages</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {aggregateMetrics.totalDelivered}
                  {aggregateMetrics.overallDeliveryRate !== null && (
                    <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-normal ml-1">({aggregateMetrics.overallDeliveryRate}%)</span>
                  )}
                </p>
              </div>
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-2xl shadow-2xs">
                <p className="text-xs font-label-md uppercase font-semibold text-outline">Replies Received</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {aggregateMetrics.totalReplied}
                  {aggregateMetrics.overallReplyRate !== null && (
                    <span className="text-xs text-amber-600/80 dark:text-amber-400/80 font-normal ml-1">({aggregateMetrics.overallReplyRate}%)</span>
                  )}
                </p>
              </div>
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-2xl shadow-2xs">
                <p className="text-xs font-label-md uppercase font-semibold text-outline">Positive Interest</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {aggregateMetrics.totalPositive}
                  {aggregateMetrics.overallPositiveRate !== null && (
                    <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-normal ml-1">({aggregateMetrics.overallPositiveRate}%)</span>
                  )}
                </p>
              </div>
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-2xl shadow-2xs">
                <p className="text-xs font-label-md uppercase font-semibold text-outline">Opt-Outs</p>
                <p className="text-2xl font-bold text-on-surface-variant mt-1">{aggregateMetrics.totalOptOut}</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-2xs">
              <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search campaigns by name or job role..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-on-surface-variant">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft (Needs Review)</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Campaign Listing */}
            {loading ? (
              <div className="p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading outreach campaigns...
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <EmptyState
                icon="campaign"
                title="No Outreach Campaigns Found"
                description={
                  searchFilter || statusFilter !== "ALL"
                    ? "Try adjusting your search query or status filter."
                    : "Create your first AI personalized outreach campaign to engage top verified candidates."
                }
                actionLabel="Create Outreach Campaign"
                onAction={() => setCreateModalOpen(true)}
              />
            ) : (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => {
                  const m = campaign.metrics;
                  const isDraft = campaign.status === "DRAFT";

                  return (
                    <div
                      key={campaign.id}
                      className={`bg-surface-container-lowest border rounded-2xl p-5 transition shadow-2xs hover:border-outline-variant/40 ${
                        selectedCampaign?.id === campaign.id ? "border-primary/60 ring-1 ring-primary/20" : "border-outline-variant/20"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-lg font-bold text-on-surface">{campaign.name}</h3>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                campaign.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : campaign.status === "DRAFT"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : campaign.status === "PAUSED"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  : "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                              }`}
                            >
                              {campaign.status}
                            </span>
                            {campaign.job && (
                              <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md border border-outline-variant/30">
                                💼 {campaign.job.title}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            Created {new Date(campaign.createdAt).toLocaleDateString()} by {campaign.recruiter.name} &bull; {campaign.recipients.length} candidate(s) enrolled
                          </p>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isDraft && (
                            <button
                              onClick={() => openApprovalModal(campaign)}
                              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-base">rate_review</span>
                              Review & Approve ({campaign.recipients.length})
                            </button>
                          )}

                          {campaign.status === "ACTIVE" && (
                            <button
                              onClick={() => handlePauseResume(campaign)}
                              className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium border border-outline-variant/30 transition flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-base text-primary">pause</span>
                              Pause
                            </button>
                          )}

                          {campaign.status === "PAUSED" && (
                            <button
                              onClick={() => handlePauseResume(campaign)}
                              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/30 transition flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">play_arrow</span>
                              Resume
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
                            className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium border border-outline-variant/30 transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-base text-primary">
                              {selectedCampaign?.id === campaign.id ? "expand_less" : "expand_more"}
                            </span>
                            {selectedCampaign?.id === campaign.id ? "Hide Details" : "View Sequence & Candidates"}
                          </button>

                          {campaign.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleCancel(campaign)}
                              title="Cancel campaign"
                              className="p-2 rounded-xl bg-surface-container-high hover:bg-rose-500/10 hover:text-rose-600 text-on-surface-variant text-xs border border-outline-variant/30 transition"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Performance Bar */}
                      {m && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-on-surface-variant">Delivered: </span>
                            <span className="text-on-surface font-semibold">{m.deliveredCount}</span>
                            {m.deliveryRate !== null && <span className="text-emerald-600 dark:text-emerald-400 ml-1">({m.deliveryRate}%)</span>}
                          </div>
                          <div>
                            <span className="text-on-surface-variant">Replies: </span>
                            <span className="text-on-surface font-semibold">{m.repliedCount}</span>
                            {m.replyRate !== null && <span className="text-amber-600 dark:text-amber-400 ml-1">({m.replyRate}%)</span>}
                          </div>
                          <div>
                            <span className="text-on-surface-variant">Positive Interest: </span>
                            <span className="text-on-surface font-semibold">{m.positiveReplyCount}</span>
                            {m.positiveReplyRate !== null && <span className="text-emerald-600 dark:text-emerald-400 ml-1">({m.positiveReplyRate}%)</span>}
                          </div>
                          <div>
                            <span className="text-on-surface-variant">Opt-Outs / Bounces: </span>
                            <span className="text-on-surface font-semibold">{m.optedOutCount} / {m.bouncedCount}</span>
                          </div>
                        </div>
                      )}

                      {/* Expanded Campaign Details: Sequence Steps & Recipient Roster */}
                      {selectedCampaign?.id === campaign.id && (
                        <div className="mt-6 pt-6 border-t border-outline-variant/20 space-y-6">
                          {/* Multi-Step Sequence Flow */}
                          <div>
                            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                              <span className="material-symbols-outlined text-base text-primary">schedule</span>
                              Outreach Sequence Schedule
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {campaign.sequenceSteps.map((step) => (
                                <div key={step.id} className="bg-surface-container-low border border-outline-variant/20 p-3.5 rounded-xl space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-primary">Step {step.stepOrder}</span>
                                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px]">
                                      Day {step.delayDays}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-on-surface truncate">{step.subjectTemplate}</p>
                                  <p className="text-[11px] text-on-surface-variant line-clamp-2">{step.bodyTemplate}</p>
                                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-[11px] text-outline">
                                    <span>{step.messageType.replace(/_/g, " ")}</span>
                                    <span>{step.isEnabled ? "🟢 Active" : "⚪ Disabled"}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recipient Engagement Roster */}
                          <div>
                            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                              <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">people</span>
                              Candidate Recipients & Engagement ({campaign.recipients.length})
                            </h4>

                            <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden divide-y divide-outline-variant/20">
                              {campaign.recipients.map((recipient) => {
                                const isOptOut = recipient.status === "OPTED_OUT";
                                const isPositive = recipient.responseClassification === "POSITIVE_INTEREST";

                                return (
                                  <div key={recipient.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-on-surface">{recipient.candidate.name}</p>
                                        <span
                                          className={`text-[11px] px-2 py-0.5 rounded font-semibold border ${
                                            isPositive
                                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                              : isOptOut
                                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
                                              : recipient.status === "REPLIED"
                                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                                              : recipient.status === "DELIVERED"
                                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                                              : "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                                          }`}
                                        >
                                          {recipient.status}
                                        </span>
                                        {recipient.engagementIntent && (
                                          <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
                                            {recipient.engagementIntent}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-on-surface-variant">
                                        {recipient.candidate.headline || "Technical Professional"} &bull; {recipient.candidate.location || "Remote"}
                                      </p>

                                      {/* Recommended Next Action Banner */}
                                      {recipient.recommendedNextAction && (
                                        <div className="mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-xs flex items-center justify-between gap-2">
                                          <span className="text-on-surface">
                                            💡 <strong>Next Action:</strong> {recipient.recommendedNextAction}
                                          </span>
                                          {isPositive && (
                                            <Link
                                              href={`/messages?contactId=${recipient.candidateId}`}
                                              className="px-2.5 py-1 rounded bg-primary hover:bg-primary-container text-on-primary font-medium transition text-[11px] shrink-0"
                                            >
                                              Chat & Schedule
                                            </Link>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Links */}
                                    <div className="flex items-center gap-2">
                                      <Link
                                        href={`/messages?contactId=${recipient.candidateId}`}
                                        className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium border border-outline-variant/30 transition flex items-center gap-1"
                                      >
                                        <span className="material-symbols-outlined text-sm text-primary">chat</span>
                                        Open Chat
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>

        {/* --- CREATE CAMPAIGN WIZARD MODAL --- */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 text-on-surface">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  <h3 className="text-lg font-bold text-on-surface">Create AI Outreach Campaign</h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Backend Engineer - Q3 Sourcing"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Associate Job Opening</label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="">General Engineering Role</option>
                      {availableJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Personalization Level</label>
                    <select
                      value={personalizationLevel}
                      onChange={(e) => setPersonalizationLevel(e.target.value as any)}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="STANDARD">Standard (Role Relevance)</option>
                      <option value="PERSONALIZED">Personalized (Verified Skills)</option>
                      <option value="EVIDENCE_BASED">Evidence-Based (Assessment Scores)</option>
                    </select>
                  </div>
                </div>

                {/* Candidate Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-on-surface-variant">
                      Select Candidates ({selectedCandidates.length} selected) *
                    </label>
                    <span className="text-[11px] text-primary font-medium">Zero-Fabrication Guard Enabled</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto bg-surface-container-low border border-outline-variant/30 rounded-xl p-2 divide-y divide-outline-variant/20">
                    {availableCandidates.map((cand) => {
                      const isSelected = selectedCandidates.includes(cand.id);
                      return (
                        <div
                          key={cand.id}
                          onClick={() => {
                            setSelectedCandidates((prev) =>
                              isSelected ? prev.filter((id) => id !== cand.id) : [...prev, cand.id]
                            );
                          }}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition ${
                            isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-surface-container-high text-on-surface"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-on-surface">{cand.name}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">{cand.headline || cand.skills.join(", ")}</p>
                          </div>
                          <span
                            className={`material-symbols-outlined text-base ${
                              isSelected ? "text-primary" : "text-outline"
                            }`}
                          >
                            {isSelected ? "check_box" : "check_box_outline_blank"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Recruiter Custom Context / Value Pitch (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. We just closed our Series B and are scaling our database team..."
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium border border-outline-variant/30 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || selectedCandidates.length === 0}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 text-xs font-semibold shadow-xs transition flex items-center gap-2"
                  >
                    {creating ? "Generating Drafts..." : "Generate Grounded Drafts"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- HUMAN APPROVAL GATE MODAL --- */}
        {approvalModalOpen && approvingCampaign && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8 text-on-surface">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">rate_review</span>
                    Human Approval Gate: {approvingCampaign.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Review and customize each candidate's personalized draft before approving and dispatching.
                  </p>
                </div>
                <button
                  onClick={() => setApprovalModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Safety & Duplicate Warnings Banner */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base mt-0.5">verified_user</span>
                <div>
                  <strong>Mandatory Approval Policy:</strong> NextHire will never send an AI-generated cold message without your explicit approval. Approving dispatches Step 1 via in-app chat & Resend transactional email.
                </div>
              </div>

              {/* Editable Recipient Drafts */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {approvingCampaign.recipients.map((recipient, idx) => {
                  const draft = editableMessages[recipient.id] || { subject: "", body: "" };

                  return (
                    <div key={recipient.id} className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-on-surface">{recipient.candidate.name}</span>
                          <span className="text-[11px] text-on-surface-variant">({recipient.candidate.headline || "Candidate"})</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Step 1 Draft
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Subject</label>
                        <input
                          type="text"
                          value={draft.subject}
                          onChange={(e) =>
                            setEditableMessages((prev) => ({
                              ...prev,
                              [recipient.id]: { ...prev[recipient.id], subject: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Message Body</label>
                        <textarea
                          rows={4}
                          value={draft.body}
                          onChange={(e) =>
                            setEditableMessages((prev) => ({
                              ...prev,
                              [recipient.id]: { ...prev[recipient.id], body: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <p className="text-xs text-on-surface-variant">
                  Ready to send to <strong>{approvingCampaign.recipients.length}</strong> candidate(s)
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium border border-outline-variant/30 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={approving}
                    onClick={handleApproveAndDispatch}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {approving ? "Dispatching..." : "Approve & Send Step 1"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </ProtectedRoute>
  );
}
