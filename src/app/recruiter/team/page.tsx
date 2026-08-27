"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";

type TabType =
  | "overview"
  | "workload"
  | "handoffs"
  | "tasks"
  | "duplicate"
  | "productivity"
  | "funnel"
  | "activity";

export default function RecruiterTeamPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [productivity, setProductivity] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);

  // Task Creation Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("NORMAL");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");

  // Handoff Creation Modal State
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffCandidateId, setHandoffCandidateId] = useState("");
  const [handoffToRecruiterId, setHandoffToRecruiterId] = useState("");
  const [handoffReason, setHandoffReason] = useState("");
  const [handoffStage, setHandoffStage] = useState("REVIEWING");
  const [handoffPendingWork, setHandoffPendingWork] = useState("");

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [teamRes, taskRes, handoffRes, prodRes, funnelRes, actRes] = await Promise.all([
        fetch("/api/recruiter/team"),
        fetch("/api/recruiter/team/tasks"),
        fetch("/api/recruiter/team/handoffs"),
        fetch("/api/recruiter/team/productivity"),
        fetch("/api/recruiter/team/funnel"),
        fetch("/api/recruiter/team/activity"),
      ]);

      if (teamRes.ok) {
        const d = await teamRes.json();
        if (d.success) setTeamData(d.data);
      }
      if (taskRes.ok) {
        const d = await taskRes.json();
        if (d.success) setTasks(d.data);
      }
      if (handoffRes.ok) {
        const d = await handoffRes.json();
        if (d.success) setHandoffs(d.data);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        if (d.success) setProductivity(d.data);
      }
      if (funnelRes.ok) {
        const d = await funnelRes.json();
        if (d.success) setFunnel(d.data);
      }
      if (actRes.ok) {
        const d = await actRes.json();
        if (d.success) setActivity(d.data);
      }
    } catch (err) {
      console.error("Error loading team data:", err);
      showToast("Failed to load team data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskAssigneeId) {
      showToast("Please provide title and assignee", "error");
      return;
    }

    try {
      const res = await fetch("/api/recruiter/team/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          assigneeId: taskAssigneeId,
          dueAt: taskDueAt || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Hiring task created successfully", "success");
        setShowTaskModal(false);
        setTaskTitle("");
        setTaskDesc("");
        loadAllData();
      } else {
        showToast(data.error || "Failed to create task", "error");
      }
    } catch {
      showToast("Network error creating task", "error");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/recruiter/team/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Task marked as ${newStatus}`, "success");
        loadAllData();
      } else {
        showToast(data.error || "Failed to update task", "error");
      }
    } catch {
      showToast("Error updating task", "error");
    }
  };

  const handleHandoffAction = async (handoffId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const res = await fetch(`/api/recruiter/team/handoffs/${handoffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Handoff ${action === "ACCEPT" ? "accepted and candidate assigned" : "rejected"}`, "success");
        loadAllData();
      } else {
        showToast(data.error || "Failed to process handoff", "error");
      }
    } catch {
      showToast("Error processing handoff", "error");
    }
  };

  const handleCreateHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoffCandidateId || !handoffToRecruiterId || !handoffReason) {
      showToast("Please fill in required fields", "error");
      return;
    }

    try {
      const res = await fetch("/api/recruiter/team/handoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: handoffCandidateId,
          toRecruiterId: handoffToRecruiterId,
          reason: handoffReason,
          currentStage: handoffStage,
          pendingWork: handoffPendingWork ? handoffPendingWork.split("\n").filter(Boolean) : [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Handoff request sent successfully", "success");
        setShowHandoffModal(false);
        setHandoffReason("");
        setHandoffPendingWork("");
        loadAllData();
      } else {
        showToast(data.error || "Failed to create handoff", "error");
      }
    } catch {
      showToast("Network error creating handoff", "error");
    }
  };

  const isManager =
    user?.role === "RECRUITER_MANAGER" ||
    user?.role === "COMPANY_ADMIN" ||
    user?.role === "PLATFORM_ADMIN";


  if (!isManager) {
    return (
      <ProtectedRoute requiredPortal="recruiter">
        <TopAppBar />
        <div className="flex bg-surface min-h-screen pt-16">
          <SidebarNav portal="recruiter" />
          <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
            <main className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full flex items-center justify-center">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm max-w-lg">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">lock</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-on-surface">Management Access Required</h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    The Recruiting Team operations workspace is restricted to Recruiter Managers and Administrators. You can manage your personal candidate pipeline, outreach, and assigned jobs from your dashboard.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/recruiter"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">dashboard</span>
                    Return to Recruiter Dashboard
                  </Link>
                </div>
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPortal="recruiter">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="recruiter" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-16">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">groups</span>
                    Collaborative Recruiting Operations
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    TEAM OS
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {teamData?.companyName || "Recruiting"} Team Workspace
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage candidate ownership, balance operational capacity, coordinate handoffs, and eliminate duplicate recruiting effort.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-xl transition flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-lg">add_task</span>
                  New Task
                </button>
                <button
                  onClick={() => setShowHandoffModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-lg">swap_horiz</span>
                  Initiate Handoff
                </button>
              </div>
            </div>

            {/* Navigation Tabs - One line on desktop, controlled container scrolling on mobile */}
            <div className="w-full border-b border-slate-200 dark:border-slate-800 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-px">
              <div className="flex items-center justify-between xl:justify-start gap-1 xl:gap-2 min-w-max lg:min-w-0">
                {[
                  { id: "overview", label: "Overview", icon: "dashboard" },
                  { id: "workload", label: "Team Workload", icon: "monitoring" },
                  { id: "handoffs", label: `Handoffs (${handoffs.filter((h) => h.status === "PENDING").length})`, icon: "swap_horiz" },
                  { id: "tasks", label: `Hiring Tasks (${tasks.filter((t) => t.status !== "COMPLETED").length})`, icon: "checklist" },
                  { id: "duplicate", label: `Duplicate Work (${teamData?.duplicateWorkAlerts?.length || 0})`, icon: "warning" },
                  { id: "productivity", label: "Productivity", icon: "speed" },
                  { id: "funnel", label: "Team Funnel", icon: "insights" },
                  { id: "activity", label: "Activity Log", icon: "history" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-1 xl:gap-1.5 px-2.5 lg:px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base xl:text-lg flex-shrink-0">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl animate-spin text-blue-600 mb-2">sync</span>
                <p>Loading team recruiting operations...</p>
              </div>
            ) : (
              <>
                {/* ---------------------------------------------------- */}
                {/* TAB 1: OVERVIEW */}
                {/* ---------------------------------------------------- */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider">Recruiters</span>
                          <span className="material-symbols-outlined text-blue-600">badge</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {teamData?.members?.length || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Active team recruiters</p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider">Unassigned Candidates</span>
                          <span className="material-symbols-outlined text-amber-500">person_search</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {teamData?.workload?.unassignedCandidatesCount || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Awaiting queue assignment</p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider">Pending Handoffs</span>
                          <span className="material-symbols-outlined text-indigo-500">swap_horiz</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {handoffs.filter((h) => h.status === "PENDING").length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Awaiting acceptance</p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider">Duplicate Warnings</span>
                          <span className="material-symbols-outlined text-rose-500">warning</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {teamData?.duplicateWorkAlerts?.length || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Overlapping candidate actions</p>
                      </div>
                    </div>

                    {/* Team Members Grid */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">group</span>
                        Recruiter Roster & Queue Status
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teamData?.members?.map((m: any) => (
                          <div key={m.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{m.name}</div>
                                  <div className="text-xs text-slate-500">{m.teamRole}</div>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                m.workloadStatus === "NORMAL" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                                m.workloadStatus === "BUSY" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                                m.workloadStatus === "OVERLOADED" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                {m.workloadStatus}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 text-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                              <div>
                                <span className="text-slate-500 block">Candidates</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{m.assignedCandidatesCount}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Pending Reviews</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{m.pendingReviewsCount}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Active Tasks</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{m.activeTasksCount}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unassigned Work Alert */}
                    {teamData?.unassignedCandidates?.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-6 rounded-2xl border border-amber-200 dark:border-amber-900">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-600">assignment_late</span>
                            Unassigned Candidate Applications ({teamData.unassignedCandidates.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {teamData.unassignedCandidates.map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-white">{c.candidateName}</div>
                                <div className="text-xs text-slate-500">Applied for: {c.jobTitle} • {new Date(c.assignedAt).toLocaleDateString()}</div>
                              </div>
                              <button
                                onClick={() => {
                                  setHandoffCandidateId(c.candidateId);
                                  setShowHandoffModal(true);
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg"
                              >
                                Assign Recruiter
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 2: TEAM WORKLOAD */}
                {/* ---------------------------------------------------- */}
                {activeTab === "workload" && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">monitoring</span>
                        Operational Capacity Matrix
                      </h2>

                      <div className="space-y-4">
                        {teamData?.members?.map((m: any) => (
                          <div key={m.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center">
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{m.name}</div>
                                  <div className="text-xs text-slate-500">{m.email} • {m.teamRole}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-xs text-slate-500 block">Workload Score</span>
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{m.workloadScore}/100</span>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                  m.workloadStatus === "NORMAL" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                                  m.workloadStatus === "BUSY" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                                  m.workloadStatus === "OVERLOADED" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}>
                                  {m.workloadStatus}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  m.workloadScore < 35 ? "bg-emerald-500" :
                                  m.workloadScore < 55 ? "bg-blue-500" :
                                  m.workloadScore < 75 ? "bg-amber-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(100, m.workloadScore)}%` }}
                              />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                              <div>• Assigned Jobs: <strong className="text-slate-900 dark:text-white">{m.assignedJobsCount}</strong></div>
                              <div>• Active Candidates: <strong className="text-slate-900 dark:text-white">{m.assignedCandidatesCount}</strong></div>
                              <div>• Pending Reviews: <strong className="text-slate-900 dark:text-white">{m.pendingReviewsCount}</strong></div>
                              <div>• Overdue SLA Tasks: <strong className="text-slate-900 dark:text-white">{m.overdueTasksCount}</strong></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 3: HANDOFFS */}
                {/* ---------------------------------------------------- */}
                {activeTab === "handoffs" && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-600">swap_horiz</span>
                          Candidate Handoff Requests
                        </h2>
                        <button
                          onClick={() => setShowHandoffModal(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
                        >
                          New Handoff
                        </button>
                      </div>

                      {handoffs.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm">
                          No candidate handoff requests recorded.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {handoffs.map((h: any) => (
                            <div key={h.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    {h.candidateName}
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-800 font-normal">
                                      Stage: {h.currentStage}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    From: <strong>{h.fromRecruiterName}</strong> → To: <strong>{h.toRecruiterName}</strong>
                                    {h.jobTitle && ` • Job: ${h.jobTitle}`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                    h.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                                    h.status === "REJECTED" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" :
                                    h.isOverdue ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" :
                                    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  }`}>
                                    {h.isOverdue ? "OVERDUE SLA" : h.status}
                                  </span>

                                  {h.status === "PENDING" && h.toRecruiterId === user?.id && (
                                    <>
                                      <button
                                        onClick={() => handleHandoffAction(h.id, "ACCEPT")}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleHandoffAction(h.id, "REJECT")}
                                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                <div><strong>Reason:</strong> {h.reason}</div>
                                {h.pendingWork?.length > 0 && (
                                  <div><strong>Pending Actions:</strong> {h.pendingWork.join(", ")}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 4: HIRING TASKS */}
                {/* ---------------------------------------------------- */}
                {activeTab === "tasks" && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-600">checklist</span>
                          Hiring Operations Task Board
                        </h2>
                        <button
                          onClick={() => setShowTaskModal(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
                        >
                          New Task
                        </button>
                      </div>

                      {tasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm">
                          No hiring tasks recorded.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tasks.map((t: any) => (
                            <div key={t.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                    t.priority === "CRITICAL" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" :
                                    t.priority === "HIGH" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                    "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  }`}>
                                    {t.priority}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</span>
                                </div>
                                {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                                <div className="text-xs text-slate-400">
                                  Assignee: <strong>{t.assigneeName}</strong>
                                  {t.candidateName && ` • Candidate: ${t.candidateName}`}
                                  {t.dueAt && ` • Due: ${new Date(t.dueAt).toLocaleDateString()}`}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                  t.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                                  t.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                                  "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}>
                                  {t.status}
                                </span>
                                {t.status !== "COMPLETED" && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(t.id, "COMPLETED")}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg"
                                  >
                                    Done
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 5: DUPLICATE WORK */}
                {/* ---------------------------------------------------- */}
                {activeTab === "duplicate" && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-600">warning</span>
                        Duplicate Recruiting Work Alerts
                      </h2>

                      {teamData?.duplicateWorkAlerts?.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm">
                          <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2 block">verified_user</span>
                          No duplicate outreach campaigns, conflicting reviews, or redundant assignments detected.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {teamData?.duplicateWorkAlerts?.map((a: any) => (
                            <div key={a.id} className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                    {a.severity}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{a.type}</span>
                                </div>
                                <span className="text-xs text-slate-400">{new Date(a.detectedAt).toLocaleTimeString()}</span>
                              </div>

                              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{a.description}</p>

                              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                                <div className="text-slate-500"><strong>Observed Activity:</strong> {a.existingActivity}</div>
                                <div className="text-blue-600 dark:text-blue-400"><strong>Recommended Resolution:</strong> {a.recommendedResolution}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 6: PRODUCTIVITY */}
                {/* ---------------------------------------------------- */}
                {activeTab === "productivity" && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">speed</span>
                        Evidence-Based Recruiter Productivity & SLA Adherence
                      </h2>
                      <p className="text-xs text-slate-500 mb-6">
                        Metrics are computed directly from PostgreSQL audit events. Rankings without context are strictly disabled.
                      </p>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold uppercase">
                            <tr>
                              <th className="p-3 rounded-l-lg">Recruiter</th>
                              <th className="p-3">Reviews</th>
                              <th className="p-3">Progressed</th>
                              <th className="p-3">Scorecards</th>
                              <th className="p-3">Tasks</th>
                              <th className="p-3">Avg Review Time</th>
                              <th className="p-3">SLA Adherence</th>
                              <th className="p-3 rounded-r-lg">Data Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {productivity.map((p: any) => (
                              <tr key={p.recruiterId}>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">{p.recruiterName}</td>
                                <td className="p-3">{p.applicationsReviewed}</td>
                                <td className="p-3">{p.candidatesProgressed}</td>
                                <td className="p-3">{p.scorecardsCompleted}</td>
                                <td className="p-3">{p.tasksCompleted}</td>
                                <td className="p-3">{p.avgReviewTimeHours !== null ? `${p.avgReviewTimeHours}h` : "N/A"}</td>
                                <td className="p-3 font-bold text-slate-900 dark:text-white">
                                  {p.slaAdherenceRate !== null ? `${p.slaAdherenceRate}%` : "100%"}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    p.isSufficientData
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                  }`}>
                                    {p.isSufficientData ? `Sufficient (n=${p.sampleSize})` : `Limited (n=${p.sampleSize})`}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 7: TEAM FUNNEL */}
                {/* ---------------------------------------------------- */}
                {activeTab === "funnel" && funnel && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">insights</span>
                        Team Hiring Funnel Conversion
                      </h2>
                      <p className="text-xs text-slate-500 mb-6">
                        Aggregated across all {funnel.totalApplications} company candidate applications.
                      </p>

                      <div className="space-y-3">
                        {funnel.stages?.map((s: any) => (
                          <div key={s.stage} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-900 dark:text-white">{s.stage}</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {s.entrants} candidate(s) ({s.conversionRate !== null ? `${s.conversionRate}% conversion` : "N/A"})
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${s.conversionRate !== null ? s.conversionRate : 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 8: ACTIVITY LOG */}
                {/* ---------------------------------------------------- */}
                {activeTab === "activity" && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">history</span>
                        Real-Time Team Activity Feed
                      </h2>

                      {activity.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm">
                          No recent recruiting activity logged.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activity.map((a: any) => (
                            <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs">
                              <span className="material-symbols-outlined text-blue-600 text-base mt-0.5">radio_button_checked</span>
                              <div className="flex-1">
                                <div className="text-slate-800 dark:text-slate-200">{a.summary}</div>
                                <div className="text-slate-400 mt-0.5">{new Date(a.timestamp).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Task Creation Modal */}
            {showTaskModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Hiring Task</h3>
                    <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleCreateTask} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Task Title *</label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="e.g., Review technical assessment submission"
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Assignee *</label>
                      <select
                        value={taskAssigneeId}
                        onChange={(e) => setTaskAssigneeId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                        required
                      >
                        <option value="">Select Recruiter</option>
                        {teamData?.members?.map((m: any) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.workloadStatus})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                      <textarea
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                        rows={2}
                        placeholder="Additional task instructions..."
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowTaskModal(false)}
                        className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Create Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Handoff Creation Modal */}
            {showHandoffModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Initiate Candidate Handoff</h3>
                    <button onClick={() => setShowHandoffModal(false)} className="text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleCreateHandoff} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Candidate ID *</label>
                      <input
                        type="text"
                        value={handoffCandidateId}
                        onChange={(e) => setHandoffCandidateId(e.target.value)}
                        placeholder="Enter candidate user ID"
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Receiving Recruiter *</label>
                      <select
                        value={handoffToRecruiterId}
                        onChange={(e) => setHandoffToRecruiterId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                        required
                      >
                        <option value="">Select Recruiter</option>
                        {teamData?.members?.map((m: any) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.workloadStatus})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Current Stage</label>
                      <select
                        value={handoffStage}
                        onChange={(e) => setHandoffStage(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                      >
                        <option value="REVIEWING">Reviewing</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="ASSESSMENT">Assessment</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Handoff Reason *</label>
                      <input
                        type="text"
                        value={handoffReason}
                        onChange={(e) => setHandoffReason(e.target.value)}
                        placeholder="e.g., Transferring to technical recruiting lead for panel round"
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pending Actions (one per line)</label>
                      <textarea
                        value={handoffPendingWork}
                        onChange={(e) => setHandoffPendingWork(e.target.value)}
                        rows={2}
                        placeholder="Schedule panel interview&#10;Verify system design scorecard"
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowHandoffModal(false)}
                        className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Submit Handoff
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
