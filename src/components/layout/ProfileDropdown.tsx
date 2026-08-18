"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

interface ProfileDropdownProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ProfileDropdown({ isOpen: externalIsOpen, onClose }: ProfileDropdownProps) {
  const { user, logout } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = typeof externalIsOpen !== "undefined";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
      />

      {/* Dropdown Container anchored below Avatar */}
      <div className="fixed sm:absolute right-0 sm:right-4 top-16 sm:top-14 w-full sm:w-72 bg-surface-container-lowest border-0 sm:border border-outline-variant/30 rounded-none sm:rounded-3xl shadow-2xl z-50 overflow-hidden divide-y divide-outline-variant/15 p-2 space-y-1 animate-scale-in">
        {/* User Header */}
        <div className="p-3 flex items-center gap-3 bg-surface-container-low/50 rounded-2xl">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
            alt={user?.name || "User Avatar"}
            className="w-11 h-11 rounded-2xl object-cover border border-outline-variant/40 flex-shrink-0"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface truncate">
              {user?.name || "User"}
            </h4>
            <p className="text-[10px] text-on-surface-variant truncate">
              {user?.email || "user@nexthire.cloud"}
            </p>
            <div>
              <VerifiedBadge role={user?.role} size="sm" />
            </div>
          </div>
        </div>

        {/* Group 1: Role-Based Navigation */}
        <div className="py-1 text-xs font-label-md space-y-0.5 text-on-surface">
          {user?.role === "JOB_SEEKER" && (
            <>
              <Link
                href="/dashboard"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">grid_view</span>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/profile"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">account_circle</span>
                <span>My Profile & Resume</span>
              </Link>
              <Link
                href="/resume-studio"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">description</span>
                <span>Resume Studio</span>
              </Link>
              <Link
                href="/applications"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">assignment</span>
                <span>Application Tracker</span>
              </Link>
            </>
          )}

          {user?.role === "RECRUITER" && (
            <>
              <Link
                href="/recruiter"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span>Recruiter Suite</span>
              </Link>
              <Link
                href="/recruiter/company"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">business</span>
                <span>Company Profile</span>
              </Link>
              <Link
                href="/recruiter/applicants"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">view_kanban</span>
                <span>Candidate Pipeline</span>
              </Link>
              <Link
                href="/recruiter/candidates"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">badge</span>
                <span>Search Candidates</span>
              </Link>
              <Link
                href="/recruiter/billing"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">credit_card</span>
                <span>Billing & Subscription</span>
              </Link>
            </>
          )}

          {user?.role === "PLATFORM_ADMIN" && (
            <>
              <Link
                href="/admin"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                <span>Admin Operations</span>
              </Link>
              <Link
                href="/admin/users"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">group</span>
                <span>User Directory</span>
              </Link>
              <Link
                href="/admin/companies"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Company Moderation</span>
              </Link>
              <Link
                href="/admin/subscriptions"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">payments</span>
                <span>SaaS Subscriptions</span>
              </Link>
            </>
          )}

          <Link
            href="/settings"
            onClick={handleClose}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">settings</span>
            <span>Account Settings</span>
          </Link>
        </div>

        {/* Group 2: Support */}
        <div className="py-1 text-xs space-y-0.5 text-on-surface">
          <Link
            href="/help"
            onClick={handleClose}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">help</span>
            <span>Help Centre & Support</span>
          </Link>
        </div>

        {/* Footer: Sign Out */}
        <div className="pt-1">
          <button
            onClick={() => { logout(); handleClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-error-container/20 text-error font-bold transition-colors text-left text-xs"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
