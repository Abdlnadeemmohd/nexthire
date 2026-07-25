"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

interface SidebarNavProps {
  portal: "seeker" | "recruiter" | "admin";
}

export function SidebarNav({ portal }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Precise Route Active Matching: EXACT 1 active item per page
  const isItemActive = (currentPath: string, targetHref: string): boolean => {
    if (currentPath === targetHref) return true;

    if (
      targetHref === "/recruiter" ||
      targetHref === "/admin" ||
      targetHref === "/dashboard" ||
      targetHref === "/profile" ||
      targetHref === "/recruiter/billing"
    ) {
      return currentPath === targetHref;
    }

    if (targetHref !== "/" && currentPath.startsWith(targetHref)) {
      return true;
    }

    return false;
  };

  const getMenuGroups = () => {
    if (portal === "seeker") {
      return [
        {
          title: "Dashboard",
          items: [
            { label: "Dashboard", href: "/dashboard", icon: "grid_view" },
            { label: "Search Jobs", href: "/jobs", icon: "search" },
            { label: "Application Tracker", href: "/applications", icon: "assignment" },
          ],
        },
        {
          title: "Profile & Resume",
          items: [
            { label: "My Profile", href: "/profile", icon: "person" },
            { label: "Resume Studio", href: "/profile#resume", icon: "description" },
          ],
        },
        {
          title: "Communication",
          items: [
            { label: "Messages", href: "/messages", icon: "mail" },
          ],
        },
        {
          title: "Account",
          items: [
            { label: "Settings", href: "/settings", icon: "settings" },
            { label: "Help Centre", href: "/help", icon: "help" },
          ],
        },
      ];
    }

    if (portal === "recruiter") {
      return [
        {
          title: "Dashboard & Jobs",
          items: [
            { label: "Recruiter Suite", href: "/recruiter", icon: "dashboard" },
            { label: "Company Profile", href: "/recruiter/company", icon: "business" },
            { label: "Post a Job", href: "/recruiter/jobs/new", icon: "add_circle" },
            { label: "Candidate Pipeline", href: "/recruiter/applicants", icon: "view_kanban" },
          ],
        },
        {
          title: "Recruitment",
          items: [
            { label: "Messages", href: "/messages", icon: "chat" },
            { label: "Search Candidates", href: "/jobs", icon: "badge" },
          ],
        },
        {
          title: "Billing & Subscription",
          items: [
            { label: "Billing & Subscription", href: "/recruiter/billing", icon: "credit_card" },
          ],
        },
        {
          title: "Account",
          items: [
            { label: "Settings", href: "/settings", icon: "settings" },
            { label: "Help Centre", href: "/help", icon: "help" },
          ],
        },
      ];
    }

    // Admin Portal
    return [
      {
        title: "Administration",
        items: [
          { label: "Admin Operations", href: "/admin", icon: "admin_panel_settings" },
          { label: "User Directory", href: "/admin/users", icon: "group" },
          { label: "Company Moderation", href: "/admin/companies", icon: "verified_user" },
        ],
      },
      {
        title: "SaaS Business",
        items: [
          { label: "Subscriptions & Revenue", href: "/admin/subscriptions", icon: "payments" },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Settings", href: "/settings", icon: "settings" },
          { label: "Help Centre", href: "/help", icon: "help" },
        ],
      },
    ];
  };

  const menuGroups = getMenuGroups();

  return (
    <aside className="w-72 bg-surface-container-lowest border-r border-outline-variant/20 hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30 transition-colors duration-200">
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="space-y-1">
          <span className="text-[10px] font-label-sm font-bold text-outline uppercase tracking-wider">
            Active Portal
          </span>
          <h3 className="font-headline-sm text-sm font-bold text-on-surface capitalize flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
            {portal === "seeker" ? "Job Seeker Portal" : portal === "recruiter" ? "Recruiter Workspace" : "Admin Operations"}
          </h3>
        </div>

        <nav className="space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-[10px] font-label-sm font-bold text-outline uppercase tracking-wider px-3 select-none">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = isItemActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-label-md font-bold transition-all ${
                        isActive
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface bg-transparent"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
            alt={user?.name || "User Avatar"}
            className="w-9 h-9 rounded-full object-cover border border-outline-variant/40 flex-shrink-0"
          />
          <div className="min-w-0">
            <VerifiedBadge role={user?.role} size="sm" />
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-outline hover:text-error hover:bg-error-container/20 rounded-xl transition-colors"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
        </button>
      </div>
    </aside>
  );
}
