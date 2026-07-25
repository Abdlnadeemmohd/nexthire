"use client";

import React, { useState, useMemo } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StatusBadge, RoleBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { INITIAL_USERS, UserItem } from "@/lib/mockData";
import { exportToCSV } from "@/lib/utils";

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (
        search &&
        !u.name.toLowerCase().includes(search.toLowerCase()) &&
        !u.email.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleStatusChange = (id: string, newStatus: UserItem["status"]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
    );
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Are you sure you want to delete this user profile?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? selectedUser : u))
    );
    setIsEditOpen(false);
  };

  return (
    <ProtectedRoute requiredPortal="admin">
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal="admin" />

        <main className="flex-1 lg:ml-72 p-6 md:p-10 space-y-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                User Management Console
              </h1>
              <p className="text-on-surface-variant text-sm font-body-md">
                Manage global candidates, recruiters, verification statuses, and subscriptions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => exportToCSV(filteredUsers, "NextHire_Users_Export")}
                className="px-5 py-2.5 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-full hover:bg-primary-container/20 hover:text-primary transition-all flex items-center gap-2 shadow-xs"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Export CSV
              </button>
            </div>
          </div>

          {/* Search & Filter Control Toolbar */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-label-md text-outline font-semibold">Role:</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex-1 p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs font-label-md font-bold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="JOB_SEEKER">Job Seekers</option>
                  <option value="RECRUITER">Recruiters</option>
                  <option value="COMPANY_ADMIN">Company Admins</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-label-md text-outline font-semibold">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 p-2.5 bg-surface border border-outline-variant/30 rounded-xl text-xs font-label-md font-bold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Data Table */}
          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                Registered Users ({filteredUsers.length})
              </h3>
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState
                icon="person_search"
                title="No Users Match Criteria"
                description="Try clearing search filters or modifying role criteria to view active platform users."
                actionText="Reset Filters"
                onAction={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-body-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-outline uppercase font-label-md font-semibold">
                      <th className="pb-3 px-4">User</th>
                      <th className="pb-3 px-4">Role</th>
                      <th className="pb-3 px-4">Country</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Plan Tier</th>
                      <th className="pb-3 px-4">Joined Date</th>
                      <th className="pb-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                    {loading ? (
                      <>
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                      </>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-surface-container/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
                              />
                              <div>
                                <h4 className="font-bold text-sm text-on-surface">{user.name}</h4>
                                <p className="text-[11px] text-on-surface-variant">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="py-4 px-4 font-semibold text-on-surface-variant">
                            {user.country}
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge status={user.status} />
                          </td>
                          <td className="py-4 px-4 font-bold text-primary">
                            {user.subscription}
                          </td>
                          <td className="py-4 px-4 text-outline font-label-sm">
                            {user.createdAt}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditOpen(true);
                                }}
                                className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                                title="Edit User"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    user.id,
                                    user.status === "VERIFIED" ? "BLOCKED" : "VERIFIED"
                                  )
                                }
                                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-surface-container rounded-lg transition-colors"
                                title={user.status === "VERIFIED" ? "Block User" : "Verify User"}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {user.status === "VERIFIED" ? "block" : "verified"}
                                </span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 text-outline hover:text-error hover:bg-surface-container rounded-lg transition-colors"
                                title="Delete Profile"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedUser && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit User: ${selectedUser.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-body-sm">
            <div className="space-y-1">
              <label className="block text-outline font-label-md font-semibold">Full Name</label>
              <input
                type="text"
                value={selectedUser.name}
                onChange={(e) =>
                  setSelectedUser({ ...selectedUser, name: e.target.value })
                }
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-outline font-label-md font-semibold">Email Address</label>
              <input
                type="email"
                value={selectedUser.email}
                onChange={(e) =>
                  setSelectedUser({ ...selectedUser, email: e.target.value })
                }
                className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-outline font-label-md font-semibold">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: e.target.value as UserItem["role"],
                    })
                  }
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl"
                >
                  <option value="JOB_SEEKER">Job Seeker</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="COMPANY_ADMIN">Company Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-outline font-label-md font-semibold">Status</label>
                <select
                  value={selectedUser.status}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      status: e.target.value as UserItem["status"],
                    })
                  }
                  className="w-full p-2.5 bg-surface border border-outline-variant/30 rounded-xl"
                >
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-on-primary font-label-md font-bold rounded-full hover:bg-primary-container shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
