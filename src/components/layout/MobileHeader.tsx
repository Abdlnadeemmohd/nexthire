"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserRole } from "@/context/AuthContext";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { MobileSearchScreen } from "@/components/layout/MobileSearchScreen";

interface MobileHeaderProps {
  isAuthenticated: boolean;
  user: { name: string; email: string; avatar?: string; role: UserRole } | null;
}

export function MobileHeader({ isAuthenticated, user }: MobileHeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchScreenOpen, setIsSearchScreenOpen] = useState(false);

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 px-4 flex items-center justify-between">
        {/* Left: Hamburger Menu & Brand Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-on-surface hover:text-primary rounded-xl hover:bg-surface-container transition-colors touch-target"
            aria-label="Open Mobile Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-lg shadow-xs">
              N
            </div>
            <span className="font-display font-bold text-lg text-on-surface tracking-tight truncate">
              Next<span className="text-primary">Hire</span>
            </span>
          </Link>
        </div>

        {/* Right: Search Icon Trigger & Primary Action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsSearchScreenOpen(true)}
            className="p-2.5 bg-surface-container border border-outline-variant/30 text-primary rounded-full hover:bg-surface-container-high transition-colors touch-target"
            aria-label="Open Full-Screen Search"
            title="Search roles, skills, or companies"
          >
            <span className="material-symbols-outlined text-xl">search</span>
          </button>

          {!isAuthenticated ? (
            <Link
              href="/register"
              className="px-3.5 py-1.5 text-xs font-bold bg-primary text-on-primary rounded-full hover:bg-primary-container transition-all shadow-xs touch-target whitespace-nowrap flex-shrink-0"
            >
              Sign Up
            </Link>
          ) : (
            <Link href={user?.role === "RECRUITER" ? "/recruiter/profile" : "/profile"}>
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={user?.name || "Profile"}
                className="w-8 h-8 rounded-full object-cover border border-outline-variant flex-shrink-0"
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
