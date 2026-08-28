"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getHomeRouteForRole, isRecruiterOrAdmin } from "@/lib/auth";
interface AuthHeaderProps {
  currentAction?: "login" | "register" | "reset";
}
export function AuthHeader({ currentAction }: AuthHeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const homeHref = isRecruiterOrAdmin(user?.role) ? getHomeRouteForRole(user?.role) : "/";
  return (
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
      {/* Brand Logo - Role-Aware Brand Destination */}
      <Link
        href={homeHref}
        className="flex items-center gap-2.5 group rounded-xl p-1 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all min-h-[44px] touch-target"
        aria-label="NextHire home"
      >
        <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-xl shadow-xs group-hover:scale-105 transition-transform">
          N
        </div>
        <span className="font-display font-bold text-xl text-on-surface tracking-tight">
          Next<span className="text-primary">Hire</span>
        </span>
      </Link>
    </header>
  );
}
