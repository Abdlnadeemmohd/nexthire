"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationDropdown } from "./NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { useAuth } from "@/context/AuthContext";

export function TopAppBar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Find Jobs", href: "/jobs" },
    { label: "Seeker Dashboard", href: "/dashboard" },
    { label: "Applications", href: "/applications" },
    { label: "Recruiter Suite", href: "/recruiter" },
    { label: "Admin Console", href: "/admin" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 h-16 transition-all">
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

          {/* Center: Desktop Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-label-md font-bold transition-all relative py-2 ${
                    isActive
                      ? "text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
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

          {/* Right: User Controls / Notification / Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated && user ? (
              <>
                <NotificationDropdown />
                <ProfileDropdown />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 font-label-md font-bold text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed top-16 left-0 bottom-0 w-72 bg-surface border-r border-outline-variant/20 p-6 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            <div className="space-y-6">
              {/* User info header if logged in */}
              {isAuthenticated && user && (
                <div className="p-3 bg-surface-container rounded-xl flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
                  />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-on-surface truncate">{user.name}</h4>
                    <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-primary-container text-on-primary-container font-label-sm text-[10px] font-bold rounded-full">
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                <span className="text-[10px] font-label-sm font-bold text-outline uppercase tracking-wider px-3">
                  Navigation Menu
                </span>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-label-md text-xs font-bold transition-all ${
                        isActive
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-outline-variant/20 text-xs">
              {!isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 bg-surface border border-outline-variant/30 text-center font-bold text-on-surface rounded-xl block"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 bg-primary text-on-primary text-center font-bold rounded-xl block shadow-sm"
                  >
                    Create Account
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-error font-bold px-3 py-2 hover:bg-error-container/20 rounded-xl"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign Out
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
