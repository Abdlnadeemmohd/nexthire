"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Modal } from "@/components/ui/Modal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  joinedDate: string;
}

const INITIAL_USERS: UserRecord[] = [
  { id: "u-101", name: "Alex Rivers", email: "alex.rivers@gmail.com", role: "JOB_SEEKER", status: "ACTIVE", joinedDate: "2026-01-15" },
  { id: "u-102", name: "Sarah Jenkins", email: "sarah.jenkins@techcorp.io", role: "RECRUITER", status: "ACTIVE", joinedDate: "2026-02-10" },
  { id: "u-103", name: "David Chen", email: "david.chen@cybershield.sec", role: "RECRUITER", status: "PENDING", joinedDate: "2026-03-04" },
  { id: "u-104", name: "System Admin", email: "owner@nexthire.com", role: "PLATFORM_ADMIN", status: "ACTIVE", joinedDate: "2025-11-01" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [modalInfo, setModalInfo] = useState<{ title: string; message: string } | null>(null);

  const filteredUsers = users.filter((u) => roleFilter === "ALL" || u.role === roleFilter);

  // Statistics calculation
  const totalCount = users.length;
  const seekersCount = users.filter((u) => u.role === "JOB_SEEKER").length;
  const recruitersCount = users.filter((u) => u.role === "RECRUITER").length;
  const adminCount = users.filter((u) => u.role === "PLATFORM_ADMIN").length;
  const pendingCount = users.filter((u) => u.status === "PENDING").length;

  const handleExportUsersCSV = () => {
    const headers = ["User ID", "Name", "Email", "Role", "Status", "Joined Date"];
    const rows = users.map((u) => [u.id, u.name, u.email, u.role, u.status, u.joinedDate]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexthire_user_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setModalInfo({
      title: "User Directory Exported",
      message: `Successfully generated and downloaded CSV report for all ${users.length} registered platform accounts.`,
    });
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-6">
            <Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "User Directory" }]} />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">group</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">User Directory</h1>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">
                  Supervise user accounts, assign security roles, and monitor account verification status.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportUsersCSV}
                  className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export User CSV
                </button>
              </div>
            </div>

            {/* Comprehensive User Directory Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Accounts</span>
                <div className="text-2xl font-bold text-on-surface font-display">{totalCount}</div>
                <p className="text-[11px] text-emerald-700 font-medium">100% Active Platform Coverage</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Job Seekers</span>
                <div className="text-2xl font-bold text-primary font-display">{seekersCount}</div>
                <p className="text-[11px] text-on-surface-variant">Candidates & Applicants</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Recruiters</span>
                <div className="text-2xl font-bold text-tertiary font-display">{recruitersCount}</div>
                <p className="text-[11px] text-on-surface-variant">Verified Employers</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Platform Owners</span>
                <div className="text-2xl font-bold text-indigo-500 font-display">{adminCount}</div>
                <p className="text-[11px] text-on-surface-variant">System Administrators</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Pending Verification</span>
                <div className="text-2xl font-bold text-amber-700 font-display">{pendingCount}</div>
                <p className="text-[11px] text-amber-700 font-medium">Requires Document Audit</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-1 text-xs font-label-md overflow-x-auto">
              {["ALL", "JOB_SEEKER", "RECRUITER", "PLATFORM_ADMIN"].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    roleFilter === role ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {role === "ALL" ? "All Accounts" : role.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* User Directory Table */}
            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role & Badge</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface">{u.name}</div>
                        <div className="text-on-surface-variant text-[11px] font-mono">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <VerifiedBadge role={u.role} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-700"
                              : u.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-700"
                              : "bg-error/15 text-error"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant font-mono">{u.joinedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>

          <Footer />
        </div>
      </div>

      {modalInfo && (
        <Modal isOpen={!!modalInfo} onClose={() => setModalInfo(null)} title={modalInfo.title}>
          <div className="space-y-4">
            <p className="text-xs text-on-surface-variant leading-relaxed">{modalInfo.message}</p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalInfo(null)}
                className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
