"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationCenterPanel } from "./NotificationCenterPanel";
import { ProfileDropdown } from "./ProfileDropdown";
import { HeaderSearchDropdown } from "./HeaderSearchDropdown";
import { useAuth, UserRole } from "@/context/AuthContext";

interface DesktopHeaderProps {
  isAuthenticated: boolean;
  user: { name: string; email: string; avatar?: string; role: UserRole } | null;
  isMounted: boolean;
}

export function DesktopHeader({ isAuthenticated, user, isMounted }: DesktopHeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  const syncUnreadCount = () => {
    try {
      const saved = localStorage.getItem("nexthire_notifications");
      if (saved) {
        const notifs = JSON.parse(saved);
        const count = notifs.filter(
          (n: any) => (!n.targetRole || n.targetRole === user?.role) && !n.read
        ).length;
        setUnreadCount(count);
      } else {
        setUnreadCount(1);
      }
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    syncUnreadCount();
    window.addEventListener("storage", syncUnreadCount);
    return () => window.removeEventListener("storage", syncUnreadCount);
  }, [user?.role]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setIsNotifOpen(false);
      setIsProfileOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  useEffect(() => {
    setIsNotifOpen(false);
    setIsProfileOpen(false);
    syncUnreadCount();
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleNotif = () => {
    setIsNotifOpen((prev) => !prev);
    if (!isNotifOpen) setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
    if (!isProfileOpen) setIsNotifOpen(false);
  };

  const isItemActive = (currentPath: string, targetHref: string): boolean => {
    if (currentPath === targetHref) return true;
    if (
      targetHref === "/recruiter" ||
      targetHref === "/admin" ||
      targetHref === "/dashboard" ||
      targetHref === "/jobs" ||
      targetHref === "/profile" ||
      targetHref === "/recruiter/billing" ||
      targetHref === "/admin/subscriptions"
    ) {
      return currentPath === targetHref;
    }
    if (targetHref !== "/" && currentPath.startsWith(targetHref)) {
      return true;
    }
    return false;
  };

  const getNavItems = () => {
    if (!isMounted || !isAuthenticated || !user) {
      return [
        { label: "Find Jobs", href: "/jobs" },
        { label: "Companies", href: "/companies" },
        { label: "About NextHire", href: "/about" },
        { label: "Help & Support", href: "/help" },
      ];
    }

    if (user.role === "JOB_SEEKER") {
      return [
        { label: "Find Jobs", href: "/jobs" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Applications", href: "/applications" },
        { label: "Resume Studio", href: "/resume-studio" },
        { label: "Help & Support", href: "/help" },
      ];
    }

    if (user.role === "RECRUITER") {
      return [
        { label: "Recruiter Suite", href: "/recruiter" },
        { label: "Applicants", href: "/recruiter/applicants" },
        { label: "Post a Job", href: "/recruiter/jobs/new" },
        { label: "Company Profile", href: "/recruiter/company" },
        { label: "Billing & Plans", href: "/recruiter/billing" },
      ];
    }

    if (user.role === "PLATFORM_ADMIN") {
      return [
        { label: "Admin Operations", href: "/admin" },
        { label: "User Directory", href: "/admin/users" },
        { label: "Company Moderation", href: "/admin/companies" },
        { label: "SaaS Subscriptions", href: "/admin/subscriptions" },
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
    <header
      ref={headerRef}
      className={`hidden md:block fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 h-16 transition-all duration-300 ${
        isScrolled ? "shadow-md shadow-black/5 bg-surface/95" : ""
      }`}
    >
      <div className="max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 group outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl p-1 transition-all"
            aria-label="NextHire home"
          >
            <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-xl shadow-xs group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="font-display font-bold text-xl text-on-surface tracking-tight">
              Next<span className="text-primary">Hire</span>
            </span>
          </Link>
        </div>

        {/* Center: Dynamic Desktop & Tablet Navigation */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-6 xl:gap-8">
          {navItems.map((item) => {
            const isActive = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-label-md font-bold transition-all relative py-2 whitespace-nowrap ${
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

        {/* Right: Search, Notifications & Profile */}
        <div className="flex items-center gap-2 relative flex-shrink-0">
          {!isMounted || !isAuthenticated || !user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login?role=seeker"
                className="px-3 py-1.5 text-xs font-label-md font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all touch-target"
              >
                Candidate Login
              </Link>
              <Link
                href="/login?role=recruiter"
                className="px-3 py-1.5 text-xs font-label-md font-bold text-on-surface-variant hover:text-tertiary hover:bg-surface-container rounded-full transition-all touch-target"
              >
                Recruiter Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-label-md font-bold bg-primary text-on-primary rounded-full hover:bg-primary-container transition-all shadow-xs touch-target whitespace-nowrap flex-shrink-0"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Wide Search Input & Attached Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="w-40 sm:w-52 md:w-56 lg:w-72 xl:w-[420px] px-3 sm:px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-full text-xs font-medium transition-all flex items-center justify-between border border-outline-variant/30 group shadow-2xs touch-target"
                  aria-label="Global search (Ctrl+K)"
                  title="Global Context-Aware Search (Ctrl+K)"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-base text-primary group-hover:scale-110 transition-transform">search</span>
                    <span className="truncate text-outline text-xs">
                      {user?.role === "RECRUITER"
                        ? "Search candidates, jobs, companies..."
                        : user?.role === "PLATFORM_ADMIN"
                        ? "Search users, subscriptions, tickets..."
                        : "Search jobs, companies, skills..."}
                    </span>
                  </div>
                  <kbd className="flex px-2 py-0.5 bg-surface-container-lowest text-[10px] font-mono text-outline rounded-md border border-outline-variant/40 shadow-2xs flex-shrink-0">
                    ⌘K
                  </kbd>
                </button>

                <HeaderSearchDropdown
                  isOpen={isSearchOpen}
                  onClose={() => setIsSearchOpen(false)}
                />
              </div>

              {/* Notification Button */}
              <button
                onClick={toggleNotif}
                className={`relative p-2.5 rounded-full transition-all touch-target ${
                  isNotifOpen
                    ? "bg-primary-container/20 text-primary"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
                aria-label="Open notifications"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface animate-pulse" />
                )}
              </button>

              <div className="h-6 w-px bg-outline-variant/30 mx-0.5" />

              {/* Profile Avatar Button */}
              <button
                onClick={toggleProfile}
                className={`flex items-center gap-2.5 p-1 sm:pr-2.5 rounded-full transition-all border ${
                  isProfileOpen
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-surface-container"
                }`}
              >
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-outline-variant shadow-2xs flex-shrink-0"
                />
                <span className="text-xs font-label-md font-bold text-on-surface max-w-[120px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <span className="material-symbols-outlined text-sm text-outline hidden sm:inline">
                  {isProfileOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              <ProfileDropdown
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
              />
            </div>
          )}

          {/* Notifications Dropdown Panel */}
          {isAuthenticated && (
            <NotificationCenterPanel
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onCountChange={setUnreadCount}
            />
          )}
        </div>
      </div>
    </header>
  );
}
