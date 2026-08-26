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
  const [hrefPath, hrefHash] = targetHref.split('#');
  if (hrefHash) {
    return (
      currentPath === hrefPath &&
      typeof window !== 'undefined' &&
      window.location.hash === `#${hrefHash}`
    );
  }
  return currentPath === targetHref;
};

  const getMenuGroups = () => {
    if (portal === "seeker") {
      return [
        {
          title: "Navigation",
          items: [
            { label: "Home", href: "/dashboard", icon: "home" },
            { label: "Search Jobs", href: "/jobs", icon: "search" },
            { label: "Application Tracker", href: "/applications", icon: "assignment" },
            { label: "Skills Assessments", href: "/candidate/assessments", icon: "psychology" },
          ],
        },
        {
          title: "Profile & Resume",
          items: [
            { label: "My Profile", href: "/profile", icon: "person" },
            { label: "Resume Studio", href: "/resume-studio", icon: "description" },
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
          title: "Navigation",
          items: [
            { label: "Home", href: "/recruiter", icon: "home" },
            { label: "Recruiter Copilot", href: "/recruiter/copilot", icon: "smart_toy" },
            { label: "Funnel Intelligence", href: "/recruiter/intelligence", icon: "insights" },
            { label: "Market Intelligence", href: "/recruiter/market-intelligence", icon: "travel_explore" },
            { label: "Recruiting Team", href: "/recruiter/team", icon: "groups" },
            { label: "Talent Radar", href: "/recruiter/talent-radar", icon: "radar" },
            { label: "AI Outreach", href: "/recruiter/outreach", icon: "campaign" },
            { label: "Skills Assessments", href: "/recruiter/assessments", icon: "verified" },
            { label: "Interview Intelligence", href: "/recruiter/interviews", icon: "video_camera_front" },
            { label: "Company Profile", href: "/recruiter/company", icon: "business" },
            { label: "My Recruiter Profile", href: "/recruiter/profile", icon: "badge" },
            { label: "Post a Job", href: "/recruiter/jobs/new", icon: "add_circle" },
            { label: "Candidate Pipeline", href: "/recruiter/applicants", icon: "view_kanban" },
          ],
        },
        {
          title: "Recruitment",
          items: [
            { label: "Messages", href: "/messages", icon: "chat" },
            { label: "Search Candidates", href: "/recruiter/candidates", icon: "search" },
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
        title: "Navigation",
        items: [
          { label: "Home", href: "/admin", icon: "home" },
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
          { label: "Support Operations", href: "/help", icon: "headset_mic" },
        ],
      },
    ];
  };

  const menuGroups = getMenuGroups();

  return (
    <aside className="w-[270px] bg-surface-container-lowest border-r border-outline-variant/20 hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30 transition-all duration-200">
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        <div className="space-y-1">
          <span className="text-[10px] font-label-sm font-bold text-outline uppercase tracking-wider">
            Active Portal
          </span>
          <h3 className="font-headline-sm text-xs font-bold text-on-surface capitalize flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            {portal === "seeker" ? "Job Seeker Portal" : portal === "recruiter" ? "Recruiter Workspace" : "Admin Operations"}
          </h3>
        </div>

        <nav className="space-y-5">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <h4 className="text-[10px] font-label-sm font-bold text-outline uppercase tracking-wider px-3 select-none">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = isItemActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-label-md transition-all ${
                        isActive
                          ? "border-l-4 border-primary pl-3 bg-primary/10 text-primary font-bold shadow-2xs"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface bg-transparent font-medium"
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

      {/* Spacious Bottom User Profile Card */}
      <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low flex-shrink-0">
        <div className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"}
              alt={user?.name || "User Avatar"}
              className="w-10 h-10 rounded-xl object-cover border border-outline-variant/40 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs text-on-surface truncate">{user?.name || "User"}</h4>
              <p className="text-[10px] text-on-surface-variant truncate">{user?.email || "user@nexthire.cloud"}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            {user?.isVerified ? (
              <VerifiedBadge role={user?.role} tier={(user as any)?.subscriptionTier} size="sm" />
            ) : (
              <span className="text-[10px] text-outline font-medium">Standard Account</span>
            )}

            <button
              onClick={logout}
              className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
