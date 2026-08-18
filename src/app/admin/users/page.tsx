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

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN";
  createdAt: string;
  company?: { name: string };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [modalInfo, setModalInfo] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    async function loadUsers() {
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
    }

    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => roleFilter === "ALL" || u.role === roleFilter);

  const totalCount = users.length;
  const seekersCount = users.filter((u) => u.role === "JOB_SEEKER").length;
  const recruitersCount = users.filter((u) => u.role === "RECRUITER").length;
  const adminCount = users.filter((u) => u.role === "PLATFORM_ADMIN").length;

  const handleExportUsersCSV = () => {
    const headers = ["User ID", "Name", "Email", "Role", "Joined Date"];
    const rows = users.map((u) => [u.id, u.name || "N/A", u.email, u.role, u.createdAt]);
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
                  Supervise verified user accounts, check security roles, and inspect database records.
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

            {/* User Directory Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Accounts</span>
                <div className="text-2xl font-bold text-on-surface font-display">{totalCount}</div>
                <p className="text-[10px] text-primary font-medium">PostgreSQL</p>
              </div>

              <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Job Seekers</span>
                <div className="text-2xl font-bold text-primary font-display">{seekersCount}</div>
                <p className="text-[10px] text-tertiary font-medium">Verified candidates</p>
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

            {/* Filter Chips */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-outline uppercase">Filter:</span>
              {["ALL", "JOB_SEEKER", "RECRUITER", "PLATFORM_ADMIN"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                    roleFilter === r
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="py-20 text-center text-xs text-on-surface-variant">
                Loading users directory from Neon PostgreSQL...
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="glass-card rounded-2xl border border-outline-variant/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-body-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-outline uppercase font-semibold bg-surface-container-low">
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-surface-container/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-on-surface">
                            {user.name || "NextHire User"}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant font-mono">{user.email}</td>
                          <td className="py-3.5 px-4">
                            <VerifiedBadge role={user.role} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {user.company?.name || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-outline font-mono">
                            {new Date(user.createdAt).toLocaleDateString()}
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
                description="No user accounts match the selected role filter."
                icon="person_off"
                actionLabel="Reset Filter"
                onAction={() => setRoleFilter("ALL")}
              />
            )}
          </main>

          <Footer />
        </div>
      </div>

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
