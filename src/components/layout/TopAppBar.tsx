"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationDropdown } from "./NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { useAuth } from "@/context/AuthContext";

export function TopAppBar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dynamic Role-Based Navigation Items
  const getNavItems = () => {
    if (!isAuthenticated || !user) {
      return [
        { label: "Find Jobs", href: "/jobs" },
        { label: "Companies", href: "/companies/c-1" },
        { label: "About NextHire", href: "/about" },
        { label: "Help & Support", href: "/help" },
      ];
    }

    if (user.role === "JOB_SEEKER") {
      return [
        { label: "Find Jobs", href: "/jobs" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Applications", href: "/applications" },
        { label: "Resume Studio", href: "/profile" },
        { label: "Help & Support", href: "/help" },
      ];
    }

    if (user.role === "RECRUITER") {
      return [
        { label: "Recruiter Suite", href: "/recruiter" },
        { label: "Applicants", href: "/recruiter/applicants" },
        { label: "Post a Job", href: "/recruiter/jobs/new" },
        { label: "Company Profile", href: "/recruiter/company" },
        { label: "Help & Support", href: "/help" },
      ];
    }

    if (user.role === "PLATFORM_ADMIN") {
      return [
        { label: "Admin Operations", href: "/admin" },
        { label: "User Directory", href: "/admin/users" },
        { label: "Moderation Audit", href: "/admin/companies" },
        { label: "Subscriptions", href: "/admin/subscriptions" },
        { label: "Help & Support", href: "/help" },
      ];
    }

    return [
      { label: "Find Jobs", href: "/jobs" },
      { label: "Help & Support", href: "/help" },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 h-16 transition-all duration-300 ${
          isScrolled ? "shadow-md shadow-black/5 bg-surface/95" : ""
        }`}
      >
        <div className="max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors touch-target flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-xl shadow-xs group-hover:scale-105 transition-transform">
                N
              </div>
              <span className="font-display font-bold text-xl text-on-surface tracking-tight">
                Next<span className="text-primary">Hire</span>
              </span>
            </Link>
          </div>

          {/* Center: Dynamic Role-Aware Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-label-md font-bold transition-all relative py-2 ${
                    isActive
                      ? "text-primary font-bold"
                      : "text-on-surface-variant hover:text-on-surface font-semibold"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions, Notifications & Profile */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-label-md font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-xs font-label-md font-bold bg-primary text-on-primary rounded-full hover:bg-primary-container transition-all shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <>
                <NotificationDropdown />
                <ProfileDropdown />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col bg-surface pt-16 animate-fade-in">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-1 pb-4 border-b border-outline-variant/20">
              <span className="text-[10px] font-label-sm font-bold text-outline uppercase tracking-wider">
                Role Menu ({user?.role?.replace("_", " ") || "Guest Visitor"})
              </span>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-label-md font-bold transition-all ${
                      isActive
                        ? "bg-primary-container text-on-primary-container"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-6 border-t border-outline-variant/20 bg-surface-container-lowest">
            {!isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-xs font-label-md font-bold border border-outline-variant/40 rounded-xl text-on-surface"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-xs font-label-md font-bold bg-primary text-on-primary rounded-xl"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={user?.name || "User Avatar"}
                  className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                />
                <div>
                  <h4 className="font-bold text-xs text-on-surface">{user?.name}</h4>
                  <p className="text-[11px] text-on-surface-variant">{user?.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
