"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { UserRole, useAuth } from "@/context/AuthContext";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: { name: string; email: string; avatar?: string; role: UserRole } | null;
}

export function MobileDrawer({ isOpen, onClose, isAuthenticated, user }: MobileDrawerProps) {
  const { logout } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-surface-container-lowest border-r border-outline-variant/30 shadow-2xl flex flex-col pt-safe pb-safe animate-slide-in">
        {/* Drawer Header */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-lg">
              N
            </div>
            <span className="font-display font-bold text-lg text-on-surface">
              Next<span className="text-primary">Hire</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors touch-target"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Drawer Body Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Platform Links */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider">Platform</h4>
            <nav className="space-y-1">
              <Link href="/jobs" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-primary text-lg">work</span>
                Browse Jobs
              </Link>
              <Link href="/companies" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-primary text-lg">domain</span>
                Company Directory
              </Link>
              <Link href="/about" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
                About NextHire
              </Link>
              <Link href="/recruiter/billing" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-primary text-lg">payments</span>
                Pricing & Plans
              </Link>
            </nav>
          </div>

          {/* Account / Role Specific Links */}
          {isAuthenticated && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider">Workspace Actions</h4>
              <nav className="space-y-1">
                {user?.role === "RECRUITER" ? (
                  <>
                    <Link href="/recruiter" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-tertiary text-lg">dashboard</span>
                      Recruiter Pipeline
                    </Link>
                    <Link href="/recruiter/profile" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-tertiary text-lg">badge</span>
                      My Recruiter Profile
                    </Link>
                    <Link href="/recruiter/company" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-tertiary text-lg">corporate_fare</span>
                      Employer Branding
                    </Link>
                    <Link href="/recruiter/jobs/new" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-tertiary text-lg">add_box</span>
                      Post a New Job
                    </Link>
                  </>
                ) : user?.role === "PLATFORM_ADMIN" ? (
                  <>
                    <Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-error text-lg">admin_panel_settings</span>
                      Platform Admin Overview
                    </Link>
                    <Link href="/admin/users" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-error text-lg">group</span>
                      User Directory
                    </Link>
                    <Link href="/admin/subscriptions" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-error text-lg">analytics</span>
                      SaaS Subscriptions
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-primary text-lg">space_dashboard</span>
                      Candidate Dashboard
                    </Link>
                    <Link href="/profile" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-primary text-lg">person</span>
                      My Candidate Profile
                    </Link>
                    <Link href="/resume-studio" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-primary text-lg">description</span>
                      Resume Studio
                    </Link>
                    <Link href="/applications" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                      <span className="material-symbols-outlined text-primary text-lg">assignment_turned_in</span>
                      Applications Tracker
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}

          {/* Support & Legal */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider">Support & Legal</h4>
            <nav className="space-y-1">
              <Link href="/help" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-outline text-lg">help</span>
                Help Centre & FAQs
              </Link>
              <Link href="/privacy" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-outline text-lg">privacy_tip</span>
                Privacy Policy
              </Link>
              <Link href="/terms" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-outline text-lg">gavel</span>
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        {/* Drawer Footer Auth Buttons & Logout */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low">
          {!isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link
                href="/login?role=seeker"
                onClick={onClose}
                className="w-full py-2.5 text-center text-xs font-bold border border-primary/30 text-primary bg-primary/10 rounded-xl touch-target"
              >
                Candidate Login
              </Link>
              <Link
                href="/login?role=recruiter"
                onClick={onClose}
                className="w-full py-2.5 text-center text-xs font-bold border border-tertiary/30 text-tertiary bg-tertiary/10 rounded-xl touch-target"
              >
                Recruiter Login
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="w-full py-2.5 text-center text-xs font-bold bg-primary text-on-primary rounded-xl touch-target shadow-xs"
              >
                Create Account / Sign Up
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                    alt={user?.name || "User Avatar"}
                    className="w-9 h-9 rounded-full object-cover border border-outline-variant flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-on-surface truncate">{user?.name}</h4>
                    <p className="text-[10px] text-on-surface-variant truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full py-2.5 text-center text-xs font-bold bg-error/10 text-error hover:bg-error/20 border border-error/30 rounded-xl transition-colors flex items-center justify-center gap-2 touch-target"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out & Return Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
