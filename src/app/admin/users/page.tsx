"use client";

import React, { useState, useEffect } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Modal } from "@/components/ui/Modal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN";
  status: "VERIFIED" | "PENDING" | "REJECTED" | "SUSPENDED";
  verificationStatus: "VERIFIED" | "PENDING" | "REJECTED" | "SUSPENDED";
  createdAt?: string;
  joinedDate?: string;
  companyName?: string;
  isCompanyVerified?: boolean;
  avatar?: string;
  applicationsCount?: number;
  jobsCount?: number;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [modalInfo, setModalInfo] = useState<{ title: string; message: string } | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{
    user: UserRecord;
    action: "VERIFIED" | "REJECTED" | "SUSPENDED";
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to load admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: "VERIFIED" | "REJECTED" | "SUSPENDED") => {
    try {
      setUpdating(true);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`User status successfully updated to ${newStatus}!`, "success");
        setActionConfirm(null);
        loadUsers();
      } else {
        showToast(data.error || "Failed to update user status", "error");
      }
    } catch (err) {
      showToast("Network error updating user status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    switch (activeFilter) {
      case "PENDING_CANDIDATES":
        return u.role === "JOB_SEEKER" && u.status === "PENDING";
      case "VERIFIED_CANDIDATES":
        return u.role === "JOB_SEEKER" && u.status === "VERIFIED";
      case "PENDING_RECRUITERS":
        return u.role === "RECRUITER" && u.status === "PENDING";
      case "VERIFIED_RECRUITERS":
        return u.role === "RECRUITER" && u.status === "VERIFIED";
      case "PLATFORM_ADMINS":
        return u.role === "PLATFORM_ADMIN";
      case "ALL":
      default:
        return true;
    }
  });

  const totalCount = users.length;
  const seekersCount = users.filter((u) => u.role === "JOB_SEEKER").length;
  const recruitersCount = users.filter((u) => u.role === "RECRUITER").length;
  const adminCount = users.filter((u) => u.role === "PLATFORM_ADMIN").length;

  const handleExportUsersCSV = () => {
    const headers = ["User ID", "Name", "Email", "Role", "Verification Status", "Joined Date"];
    const rows = users.map((u) => [
      u.id,
      u.name || "N/A",
      u.email,
      u.role,
      u.status || "PENDING",
      formatDate(u.createdAt || u.joinedDate),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexthire_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setModalInfo({
      title: "User Directory Exported",
      message: `Successfully generated and downloaded CSV report for all ${users.length} registered platform accounts.`,
    });
  };

  const filterTabs = [
    { key: "ALL", label: "All Users", count: totalCount },
    { key: "PENDING_CANDIDATES", label: "Pending Candidates", count: users.filter(u => u.role === "JOB_SEEKER" && u.status === "PENDING").length },
    { key: "VERIFIED_CANDIDATES", label: "Verified Candidates", count: users.filter(u => u.role === "JOB_SEEKER" && u.status === "VERIFIED").length },
    { key: "PENDING_RECRUITERS", label: "Pending Recruiters", count: users.filter(u => u.role === "RECRUITER" && u.status === "PENDING").length },
    { key: "VERIFIED_RECRUITERS", label: "Verified Recruiters", count: users.filter(u => u.role === "RECRUITER" && u.status === "VERIFIED").length },
    { key: "PLATFORM_ADMINS", label: "Platform Admins", count: adminCount },
  ];

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6 pb-20 sm:pb-24">
            <Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "User Directory" }]} />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">group</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">User Directory &amp; Verification</h1>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">
                  Supervise platform accounts, review verification requests, check security roles, and enforce platform governance.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportUsersCSV}
                  className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface font-bold text-xs rounded-xl transition-all flex items-center gap-2 touch-target"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export User CSV
                </button>
              </div>
            </div>

            {/* User Directory Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Accounts</span>
                <div className="text-2xl font-bold text-on-surface font-display">{totalCount}</div>
                <p className="text-[10px] text-primary font-medium">Authoritative Database</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Job Seekers</span>
                <div className="text-2xl font-bold text-primary font-display">{seekersCount}</div>
                <p className="text-[10px] text-tertiary font-medium">Candidate accounts</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Recruiters</span>
                <div className="text-2xl font-bold text-amber-700 font-display">{recruitersCount}</div>
                <p className="text-[10px] text-amber-700 font-medium">Employer accounts</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Administrators</span>
                <div className="text-2xl font-bold text-emerald-700 font-display">{adminCount}</div>
                <p className="text-[10px] text-emerald-700 font-medium">Platform control</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 touch-target ${
                    activeFilter === tab.key
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeFilter === tab.key ? "bg-white/20 text-white" : "bg-surface text-outline"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                Loading users directory from Neon PostgreSQL...
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="glass-card rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-body-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-outline uppercase font-semibold bg-surface-container-low">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Organization</th>
                        <th className="py-3 px-4">Verification</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-surface-container/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-outline-variant/30 flex-shrink-0"
                              />
                              <div>
                                <p className="font-bold text-on-surface">{user.name || "NextHire User"}</p>
                                <p className="text-on-surface-variant text-[11px] font-mono">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <VerifiedBadge role={user.role} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {user.companyName ? (
                              <div className="flex items-center gap-1">
                                <span>{user.companyName}</span>
                                {user.isCompanyVerified && (
                                  <span className="material-symbols-outlined text-xs text-emerald-600" title="Verified Company">verified</span>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                user.status === "VERIFIED"
                                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30"
                                  : user.status === "REJECTED"
                                  ? "bg-rose-500/10 text-rose-700 border border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-700 border border-amber-500/30"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {user.status || "PENDING"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-outline font-mono">
                            {formatDate(user.createdAt || user.joinedDate)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {user.role !== "PLATFORM_ADMIN" && (
                              <div className="flex items-center justify-end gap-1.5">
                                {user.status !== "VERIFIED" ? (
                                  <button
                                    onClick={() => setActionConfirm({ user, action: "VERIFIED" })}
                                    className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold rounded-lg transition-colors shadow-2xs touch-target"
                                  >
                                    Approve
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setActionConfirm({ user, action: "SUSPENDED" })}
                                    className="px-2 py-1 border border-outline-variant text-on-surface-variant hover:bg-surface-container text-[11px] font-medium rounded-lg transition-colors touch-target"
                                  >
                                    Suspend
                                  </button>
                                )}

                                {user.status !== "REJECTED" && (
                                  <button
                                    onClick={() => setActionConfirm({ user, action: "REJECTED" })}
                                    className="px-2 py-1 border border-error/30 text-error hover:bg-error/10 text-[11px] font-medium rounded-lg transition-colors touch-target"
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No users found"
                description="No user accounts match the selected verification filter."
                icon="person_off"
                actionLabel="Reset Filter"
                onAction={() => setActiveFilter("ALL")}
              />
            )}
          </main>

          <Footer />
        </div>
      </div>

      {/* Verification Confirmation Modal */}
      {actionConfirm && (
        <Modal
          isOpen={!!actionConfirm}
          onClose={() => setActionConfirm(null)}
          title={`Confirm ${actionConfirm.action === "VERIFIED" ? "Account Approval" : actionConfirm.action === "REJECTED" ? "Account Rejection" : "Account Suspension"}`}
        >
          <div className="space-y-4 text-xs font-body-md">
            <p className="text-on-surface">
              Are you sure you want to update the verification status of{" "}
              <strong>{actionConfirm.user.name}</strong> ({actionConfirm.user.email}) to{" "}
              <strong className={actionConfirm.action === "VERIFIED" ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                {actionConfirm.action}
              </strong>
              ?
            </p>
            <p className="text-on-surface-variant text-[11px]">
              This will update the user&apos;s access permissions on NextHire and send an automated in-app notification to the account.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionConfirm(null)}
                className="px-4 py-2 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus(actionConfirm.user.id, actionConfirm.action)}
                className={`px-5 py-2 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 ${
                  actionConfirm.action === "VERIFIED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {updating ? "Updating..." : `Confirm ${actionConfirm.action}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modalInfo && (
        <Modal isOpen={!!modalInfo} onClose={() => setModalInfo(null)} title={modalInfo.title}>
          <div className="space-y-4 text-xs">
            <p className="text-on-surface-variant">{modalInfo.message}</p>
            <button
              onClick={() => setModalInfo(null)}
              className="w-full py-2 bg-primary text-on-primary font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
