"use client";

import React from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";

export default function AccessDeniedPage() {
  const { user } = useAuth();

  const getAuthorizedPortal = () => {
    if (!user) return { title: "Sign In Page", link: "/login" };
    if (user.role === "PLATFORM_ADMIN") return { title: "Admin Console", link: "/admin" };
    if (user.role === "RECRUITER") return { title: "Employer Portal", link: "/recruiter" };
    return { title: "Seeker Dashboard", link: "/dashboard" };
  };

  const portal = getAuthorizedPortal();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-mesh">
      <TopAppBar />

      <main className="flex-1 flex items-center justify-center p-6 pt-24 pb-12">
        <div className="glass-card rounded-2xl p-8 sm:p-10 max-w-lg w-full text-center space-y-6 border border-white/60 shadow-2xl">
          <div className="w-20 h-20 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto text-4xl shadow-md">
            <span className="material-symbols-outlined text-5xl">lock</span>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-error-container text-on-error-container font-label-sm text-xs font-bold rounded-full uppercase tracking-wider">
              HTTP 403 FORBIDDEN
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
              Access Denied
            </h1>
            <p className="text-on-surface-variant font-body-md text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              You do not have the required role permissions to view this portal page.
              {user && (
                <> Logged in as <span className="font-bold text-primary">{user.email}</span> ({user.role.replace("_", " ")}).</>
              )}
            </p>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={portal.link}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md touch-target"
            >
              Return to {portal.title}
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-surface-container-high text-on-surface font-label-md font-bold text-xs rounded-full hover:bg-surface-container transition-all touch-target"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
