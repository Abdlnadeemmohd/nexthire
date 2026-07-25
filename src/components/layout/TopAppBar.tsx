"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationCenterPanel } from "./NotificationCenterPanel";
import { ProfileDropdown } from "./ProfileDropdown";
import { useAuth } from "@/context/AuthContext";

export function TopAppBar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Unread notification state for dynamic badge rendering
  const [unreadCount, setUnreadCount] = useState(0);

  // Floating Panels State (Mutually Exclusive)
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  // Sync notification unread count from localStorage
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
        setUnreadCount(1); // Default initial unread item
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
      // Immediately close any open floating panel on scroll
      setIsNotifOpen(false);
      setIsProfileOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  // Close panels on route change
  useEffect(() => {
    setIsNotifOpen(false);
    setIsProfileOpen(false);
    setMobileMenuOpen(false);
    syncUnreadCount();
  }, [pathname]);

  // Click-Outside, ESC Key & Window Resize Handlers
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
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      setIsNotifOpen(false);
      setIsProfileOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleNotif = () => {
    setIsNotifOpen((prev) => !prev);
    if (!isNotifOpen) setIsProfileOpen(false); // Mutual exclusivity
  };

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
    if (!isProfileOpen) setIsNotifOpen(false); // Mutual exclusivity
  };

  // Strict Exact Active Matching logic: GUARANTEES EXACTLY 1 active item per page
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
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 h-16 transition-all duration-300 ${
          isScrolled ? "shadow-md shadow-black/5 bg-surface/95" : ""
        }`}
      >
        <div className="max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
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
              const isActive = isItemActive(pathname, item.href);
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

          {/* Right: Actions, Notifications & Profile with Vertical Divider */}
          <div className="flex items-center gap-2 relative">
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
              <div className="flex items-center gap-2">
                {/* Notification Trigger Button with soft background hover */}
                <button
                  onClick={toggleNotif}
                  className={`relative p-2.5 rounded-full transition-all ${
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

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-outline-variant/30 hidden sm:block mx-1" />

                {/* Profile Trigger Avatar with subtle border & active ring */}
                <button
                  onClick={toggleProfile}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all block ${
                    isProfileOpen
                      ? "border-primary ring-2 ring-primary/30 scale-105"
                      : "border-outline-variant/40 hover:border-primary hover:ring-2 hover:ring-primary/20"
                  }`}
                  aria-label="Open profile menu"
                >
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
                    alt={user?.name || "User Avatar"}
                    className="w-full h-full object-cover"
                  />
                </button>

                {/* Floating Panels */}
                <NotificationCenterPanel
                  isOpen={isNotifOpen}
                  onClose={() => {
                    setIsNotifOpen(false);
                    syncUnreadCount();
                  }}
                />
                <ProfileDropdown
                  isOpen={isProfileOpen}
                  onClose={() => setIsProfileOpen(false)}
                />
              </div>
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
                const isActive = isItemActive(pathname, item.href);
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
