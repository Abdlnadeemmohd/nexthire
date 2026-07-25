"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarNavProps {
  portal?: "seeker" | "recruiter" | "admin";
}

export function SidebarNav({ portal = "seeker" }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const seekerLinks = [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Job Search", href: "/jobs", icon: "work_outline" },
    { label: "Applications", href: "/applications", icon: "fact_check" },
    { label: "Messages", href: "/messages", icon: "chat_bubble_outline" },
    { label: "My Profile", href: "/profile", icon: "account_circle" },
  ];

  const recruiterLinks = [
    { label: "Dashboard", href: "/recruiter", icon: "dashboard" },
    { label: "Candidate Pipeline", href: "/recruiter/applicants", icon: "group" },
    { label: "Post a Job", href: "/recruiter/jobs/new", icon: "post_add" },
    { label: "Company Profile", href: "/recruiter/company", icon: "domain" },
    { label: "Messages", href: "/messages", icon: "chat_bubble_outline" },
  ];

  const adminLinks = [
    { label: "Overview", href: "/admin", icon: "admin_panel_settings" },
    { label: "User Management", href: "/admin/users", icon: "people" },
    { label: "Company Moderation", href: "/admin/companies", icon: "business" },
    { label: "Subscriptions & Billing", href: "/admin/subscriptions", icon: "credit_card" },
  ];

  const links =
    portal === "recruiter"
      ? recruiterLinks
      : portal === "admin"
      ? adminLinks
      : seekerLinks;

  return (
    <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 border-r border-outline-variant/20 py-8 w-72 bg-surface pt-24 z-40">
      {/* User Header Widget */}
      <div className="px-6 mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8"
            alt="Alex Rivers"
            className="w-12 h-12 rounded-full object-cover border-2 border-primary-fixed shadow-sm"
          />
          <div className="min-w-0">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface truncate">
              Alex Rivers
            </h3>
            <p className="font-label-md text-xs text-on-surface-variant truncate">
              {portal === "recruiter"
                ? "Senior Tech Recruiter"
                : portal === "admin"
                ? "Platform Administrator"
                : "Senior Product Designer"}
            </p>
          </div>
        </div>
        <span className="inline-block mt-1 px-3 py-0.5 bg-primary-container/20 text-primary text-[10px] font-bold rounded-full w-fit">
          {portal === "admin" ? "SUPER ADMIN" : "PREMIUM MEMBER"}
        </span>
      </div>

      {/* Nav Items List */}
      <nav className="flex-1 space-y-1.5 px-3">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 py-3 px-5 rounded-full font-label-md text-xs transition-all ${
                active
                  ? "bg-secondary-container text-on-secondary-container font-bold shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              <span className="font-label-md">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Switch Portal Footer Link */}
      <div className="px-6 pt-4 border-t border-outline-variant/20 space-y-2">
        <Link
          href={
            portal === "recruiter"
              ? "/dashboard"
              : portal === "admin"
              ? "/dashboard"
              : "/recruiter"
          }
          className="flex items-center gap-2 text-xs font-label-md font-bold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-base">swap_horiz</span>
          Switch to {portal === "recruiter" ? "Seeker Portal" : "Employer Suite"}
        </Link>
      </div>
    </aside>
  );
}
