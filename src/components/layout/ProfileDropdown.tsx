"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

interface ProfileDropdownProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ProfileDropdown({ isOpen: externalIsOpen, onClose }: ProfileDropdownProps) {
  const { user, logout, login } = useAuth();
  const { showToast } = useToast();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexthire_theme");
      const isDark = saved === "dark" || document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    } catch {
      // ignore
    }
  }, []);

  const isControlled = typeof externalIsOpen !== "undefined";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("nexthire_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("nexthire_theme", "light");
    }
    showToast(`Switched to ${nextDark ? "Dark" : "Light"} theme`, "info");
  };

  const isDev = process.env.NODE_ENV === "development";

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
      />

      {/* Floating Dropdown */}
      <div className="fixed sm:absolute right-0 sm:right-4 top-16 sm:top-14 w-full sm:w-72 bg-surface-container-lowest dark:bg-slate-900 border-0 sm:border border-outline-variant/30 dark:border-slate-800 rounded-none sm:rounded-3xl shadow-2xl z-50 overflow-hidden divide-y divide-outline-variant/15 dark:divide-slate-800/80 p-2 space-y-1 animate-scale-in">
        {/* User Header */}
        <div className="p-3 flex items-center gap-3 bg-surface-container-low/50 dark:bg-slate-800/50 rounded-2xl">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
            alt={user?.name || "User Avatar"}
            className="w-11 h-11 rounded-2xl object-cover border border-outline-variant/40 dark:border-slate-700 flex-shrink-0"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface dark:text-slate-100 truncate">
              {user?.name || "Alex Rivers"}
            </h4>
            <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate">
              {user?.email || "alex.rivers@gmail.com"}
            </p>
            <div>
              <VerifiedBadge role={user?.role} size="sm" />
            </div>
          </div>
        </div>

        {/* Group 1: Role-Based Navigation */}
        <div className="py-1 text-xs font-label-md space-y-0.5 text-on-surface dark:text-slate-200">
          {user?.role === "JOB_SEEKER" && (
            <>
              <Link
                href="/dashboard"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">grid_view</span>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/profile"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">account_circle</span>
                <span>My Profile & Resume</span>
              </Link>
              <Link
                href="/applications"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
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
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span>Recruiter Suite</span>
              </Link>
              <Link
                href="/recruiter/company"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">business</span>
                <span>Company Profile</span>
              </Link>
              <Link
                href="/recruiter/applicants"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">view_kanban</span>
                <span>Candidate Pipeline</span>
              </Link>
            </>
          )}

          {user?.role === "PLATFORM_ADMIN" && (
            <>
              <Link
                href="/admin"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                <span>Admin Console</span>
              </Link>
              <Link
                href="/admin/users"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">group</span>
                <span>User Directory</span>
              </Link>
              <Link
                href="/admin/subscriptions"
                onClick={handleClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">payments</span>
                <span>Subscriptions & Revenue</span>
              </Link>
            </>
          )}

          <Link
            href="/settings"
            onClick={handleClose}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-base">settings</span>
            <span>Account Settings</span>
          </Link>
        </div>

        {/* Group 2: Development Role Switcher (ONLY rendered in NODE_ENV === 'development') */}
        {isDev && (
          <div className="py-1 text-xs space-y-1">
            <span className="px-3 text-[10px] font-bold text-outline dark:text-slate-400 uppercase tracking-wider block">
              Dev Role Switcher
            </span>
            <div className="grid grid-cols-3 gap-1 px-1">
              <button
                onClick={() => { login("jobseeker@nexthire.com", "password123"); handleClose(); }}
                className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${user?.role === "JOB_SEEKER" ? "bg-primary text-on-primary" : "bg-surface-container dark:bg-slate-800 hover:bg-surface-container-high dark:hover:bg-slate-700 text-on-surface dark:text-slate-200"}`}
              >
                Seeker
              </button>
              <button
                onClick={() => { login("recruiter@nexthire.com", "password123"); handleClose(); }}
                className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${user?.role === "RECRUITER" ? "bg-primary text-on-primary" : "bg-surface-container dark:bg-slate-800 hover:bg-surface-container-high dark:hover:bg-slate-700 text-on-surface dark:text-slate-200"}`}
              >
                Recruiter
              </button>
              <button
                onClick={() => { login("owner@nexthire.com", "password123"); handleClose(); }}
                className={`p-1.5 rounded-lg text-[10px] font-bold transition-all ${user?.role === "PLATFORM_ADMIN" ? "bg-primary text-on-primary" : "bg-surface-container dark:bg-slate-800 hover:bg-surface-container-high dark:hover:bg-slate-700 text-on-surface dark:text-slate-200"}`}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Group 3: Appearance & Theme Toggle */}
        <div className="py-1 text-xs space-y-0.5 text-on-surface dark:text-slate-200">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base">
                {isDarkMode ? "light_mode" : "dark_mode"}
              </span>
              <span>Theme Appearance</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-slate-200 rounded-full">
              {isDarkMode ? "Dark" : "Light"}
            </span>
          </button>
        </div>

        {/* Group 4: Support */}
        <div className="py-1 text-xs space-y-0.5 text-on-surface dark:text-slate-200">
          <Link
            href="/help"
            onClick={handleClose}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
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
