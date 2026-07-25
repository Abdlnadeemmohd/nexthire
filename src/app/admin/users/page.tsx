"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

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
  const [users] = useState<UserRecord[]>(INITIAL_USERS);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const filteredUsers = users.filter((u) => roleFilter === "ALL" || u.role === roleFilter);

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex pt-16 min-h-screen bg-surface">
        <SidebarNav portal="admin" />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">group</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">User Directory</h1>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">Manage platform user accounts, role permissions, and access status.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 bg-primary-container text-primary font-bold text-xs rounded-full">
                  {users.length} Total Users
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-1 text-xs font-label-md">
              {["ALL", "JOB_SEEKER", "RECRUITER", "PLATFORM_ADMIN"].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    roleFilter === role ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {role === "ALL" ? "All Accounts" : role.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="glass-card bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role & Verification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold">{u.name}</div>
                        <div className="text-on-surface-variant text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <VerifiedBadge role={u.role} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-700 font-bold rounded-full text-[10px]">
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
    </ProtectedRoute>
  );
}
