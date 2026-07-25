"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface SidebarNavProps {
  portal: "seeker" | "recruiter" | "admin";
}

export function SidebarNav({ portal }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
            { label: "Resume Studio", href: "/profile", icon: "description" },
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
          title: "Business & Subscription",
          items: [
            { label: "Subscription & Billing", href: "/admin/subscriptions", icon: "credit_card" },
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
        title: "Platform & Revenue",
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
    <aside className="w-72 bg-surface-container-lowest border-r border-outline-variant/20 hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30">
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
              <h4 className="text-[11px] font-label-sm font-bold text-outline uppercase tracking-wider px-3">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-label-md font-bold transition-all ${
                        isActive
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
            alt={user?.name || "User Avatar"}
            className="w-9 h-9 rounded-full object-cover border border-outline-variant/40 flex-shrink-0"
          />
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-on-surface truncate">{user?.name || "Guest User"}</h4>
            <p className="text-[10px] text-on-surface-variant truncate">{user?.role?.replace("_", " ")}</p>
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
