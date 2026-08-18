"use client";

import React from "react";
import Link from "next/link";

interface AuthHeaderProps {
  currentAction?: "login" | "register" | "reset";
}

export function AuthHeader({ currentAction }: AuthHeaderProps) {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      {/* Brand Logo - Navigates to Homepage */}
      <Link
        href="/"
        className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl p-1"
        aria-label="NextHire home"
      >
        <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-xl shadow-xs group-hover:scale-105 transition-transform">
          N
        </div>
        <span className="font-display font-bold text-xl text-on-surface tracking-tight">
          Next<span className="text-primary">Hire</span>
        </span>
      </Link>

      {/* Right Navigation: Home Action Link */}
      <nav aria-label="Authentication Header Navigation" className="flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          aria-label="Return to NextHire Homepage"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            home
          </span>
          <span>Home</span>
        </Link>
      </nav>
    </header>
  );
}
