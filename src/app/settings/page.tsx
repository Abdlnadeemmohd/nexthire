"use client";

import React, { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Modal } from "@/components/ui/Modal";
import { MobileScrollableChips } from "@/components/ui/MobileInteractionUtils";
import { useAuth } from "@/context/AuthContext";
import { exportToCSV } from "@/lib/utils";

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"security" | "notifications" | "danger">("security");

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [marketingAlerts, setMarketingAlerts] = useState(false);
  const [recruiterAlerts, setRecruiterAlerts] = useState(true);

  // Deletion Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    setPasswordMsg("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleExportData = () => {
    const accountData = [
      {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        status: user?.status,
        country: user?.country,
        exportDate: new Date().toISOString(),
      },
    ];
    exportToCSV(accountData, `NextHire_Account_Data_${user?.email}`);
  };

  const handlePermanentDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteConfirmPassword) {
      setDeleteError("Password confirmation is required.");
      return;
    }
    setIsDeleteModalOpen(false);
    logout();
  };

  return (
    <ProtectedRoute>
      <TopAppBar />

      <div className="flex bg-surface min-h-screen pt-16">
        <SidebarNav portal={user?.role === "PLATFORM_ADMIN" ? "admin" : user?.role === "RECRUITER" ? "recruiter" : "seeker"} />

        <div className="flex-1 lg:pl-[270px] flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-6 md:p-10 space-y-8 max-w-[1600px] w-full">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">settings</span>
                <h1 className="font-display text-3xl font-bold text-on-surface">
                  Account & System Settings
                </h1>
              </div>
              <p className="text-on-surface-variant text-sm font-body-md mt-1">
                Manage authentication credentials, role-specific notification preferences, and privacy controls.
              </p>
            </div>

          {/* Settings Tabs */}
          <MobileScrollableChips
            items={[
              { id: "security", label: "Password & Security", icon: "shield" },
              { id: "notifications", label: "Notification Preferences", icon: "notifications" },
              { id: "danger", label: "Data Privacy & Deletion", icon: "delete_forever" },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            ariaLabel="Settings category tabs"
          />

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 max-w-2xl space-y-6">
              <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                Change Password
              </h3>

              {passwordMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  passwordMsg.includes("successfully")
                    ? "bg-tertiary-container/30 text-tertiary"
                    : "bg-error-container/40 text-error"
                }`}>
                  {passwordMsg}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs font-body-sm">
                <div className="space-y-1">
                  <label className="block font-label-md font-bold uppercase text-on-surface-variant">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase text-on-surface-variant">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase text-on-surface-variant">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold rounded-full text-xs hover:bg-primary-container shadow-md"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 max-w-2xl space-y-6">
              <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                Notification Alert Settings
              </h3>

              <div className="space-y-4 text-xs font-body-sm">
                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/20">
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Application Status Alerts</h4>
                    <p className="text-on-surface-variant text-xs">Receive email when recruiters update your application pipeline status.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-5 h-5 text-primary rounded border-outline-variant cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/20">
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Direct Recruiter Messages</h4>
                    <p className="text-on-surface-variant text-xs">Notify me when a recruiter sends an interview invitation or message.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={recruiterAlerts}
                    onChange={(e) => setRecruiterAlerts(e.target.checked)}
                    className="w-5 h-5 text-primary rounded border-outline-variant cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/20">
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Platform Updates & Newsletter</h4>
                    <p className="text-on-surface-variant text-xs">Occasional feature announcements and career growth insights.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={marketingAlerts}
                    onChange={(e) => setMarketingAlerts(e.target.checked)}
                    className="w-5 h-5 text-primary rounded border-outline-variant cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && (
            <div className="glass-card rounded-2xl p-8 border border-error/30 max-w-2xl space-y-6 bg-error-container/10">
              <div className="space-y-1">
                <h3 className="font-headline-sm text-xl font-bold text-error flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span> Data Privacy & Permanent Deletion
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Download a copy of your personal account data or permanently erase your profile from NextHire.
                </p>
              </div>

              <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-on-surface text-xs">Export Account Data</h4>
                  <p className="text-[11px] text-on-surface-variant">Download a CSV/JSON file of all your applications, resume profile info, and settings.</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-5 py-2 bg-surface-container-high hover:bg-primary-container/20 text-primary font-label-md font-bold text-xs rounded-full flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Export Data
                </button>
              </div>

              <div className="p-4 bg-error-container/30 rounded-xl border border-error/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-error text-xs">Permanently Delete Account</h4>
                  <p className="text-[11px] text-on-surface-variant">Once deleted, your profile, resume, and application history cannot be recovered.</p>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-5 py-2 bg-error text-on-error font-label-md font-bold text-xs rounded-full hover:opacity-90 shadow-md"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </main>
          <Footer />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
      >
        <form onSubmit={handlePermanentDelete} className="space-y-4 text-xs font-body-sm">
          <div className="p-3 bg-error-container/40 border border-error/40 text-error rounded-xl space-y-1">
            <strong>Warning:</strong> This action is permanent and irreversible. All personal candidate records, resumes, and active applications will be wiped.
          </div>

          {deleteError && <div className="text-error font-bold">{deleteError}</div>}

          <div className="space-y-1">
            <label className="block text-outline font-label-md font-semibold">Enter Password to Confirm</label>
            <input
              type="password"
              required
              placeholder="Your password"
              value={deleteConfirmPassword}
              onChange={(e) => setDeleteConfirmPassword(e.target.value)}
              className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-error text-on-error font-label-md font-bold rounded-full hover:opacity-90 shadow-md"
            >
              Permanently Erase My Account
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
