"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserRole } from "@/context/AuthContext";
import { getHomeRouteForRole } from "@/lib/auth";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { MobileSearchScreen } from "@/components/layout/MobileSearchScreen";

interface MobileHeaderProps {
  isAuthenticated: boolean;
  user: { name: string; email: string; avatar?: string; role: UserRole } | null;
}

export function MobileHeader({ isAuthenticated, user }: MobileHeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchScreenOpen, setIsSearchScreenOpen] = useState(false);
  const homeHref = getHomeRouteForRole(isAuthenticated ? user?.role : null);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 sm:h-16 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 px-2.5 sm:px-4 flex items-center justify-between pt-safe transition-all">
        {/* Left: Hamburger Menu & Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-shrink-1">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-on-surface hover:text-primary rounded-xl hover:bg-surface-container transition-colors touch-target flex-shrink-0"
            aria-label="Open Mobile Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <Link
            href={homeHref}
            className="flex items-center gap-1.5 sm:gap-2 min-w-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl p-0.5 transition-all"
            aria-label="NextHire home"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary text-on-primary rounded-lg sm:rounded-xl flex items-center justify-center font-bold font-display text-base sm:text-lg shadow-xs flex-shrink-0">
              N
            </div>
            <span className="font-display font-bold text-base sm:text-lg text-on-surface tracking-tight truncate">
              Next<span className="text-primary">Hire</span>
            </span>
          </Link>
        </div>


        {/* Right: Search Trigger, Notifications & Auth Controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setIsSearchScreenOpen(true)}
            className="p-2 sm:p-2.5 bg-surface-container border border-outline-variant/30 text-primary rounded-full hover:bg-surface-container-high transition-colors touch-target flex-shrink-0"
            aria-label="Open Full-Screen Search"
            title="Search roles, skills, or companies"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">search</span>
          </button>

          {isAuthenticated && (
            <Link
              href="/messages"
              className="p-2 sm:p-2.5 bg-surface-container border border-outline-variant/30 text-on-surface-variant rounded-full hover:bg-surface-container-high transition-colors touch-target relative flex-shrink-0"
              title="Notifications & Messages"
              aria-label="Notifications and Messages"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-error rounded-full ring-2 ring-surface animate-pulse" />
            </Link>
          )}

          {!isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Link
                href="/login?role=seeker"
                className="hidden sm:inline-flex px-2.5 py-1.5 text-xs font-bold text-on-surface hover:text-primary rounded-full hover:bg-surface-container transition-all touch-target whitespace-nowrap flex-shrink-0"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-primary text-on-primary rounded-full hover:bg-primary-container transition-all shadow-xs touch-target whitespace-nowrap flex-shrink-0"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <Link
              href={user?.role === "RECRUITER" || user?.role === "RECRUITER_MANAGER" || user?.role === "COMPANY_ADMIN" ? "/recruiter/profile" : "/profile"}
              className="touch-target flex items-center justify-center p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="View Profile"
            >
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={user?.name || "Profile"}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-outline-variant flex-shrink-0"
              />
            </Link>
          )}
        </div>
      </header>

      {/* Full-Screen Mobile Search Overlay */}
      <MobileSearchScreen
        isOpen={isSearchScreenOpen}
        onClose={() => setIsSearchScreenOpen(false)}
      />

      {/* Multi-Section Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
      />
    </>
  );
}
