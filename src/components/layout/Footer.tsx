"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Footer() {
  const { user, isAuthenticated } = useAuth();

  return (
    <footer className="bg-surface-container border-t border-outline-variant/20 pt-16 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-xl shadow-xs">
                N
              </div>
              <span className="font-display font-bold text-xl text-on-surface tracking-tight">
                Next<span className="text-primary">Hire</span>
              </span>
            </Link>
            <p className="text-on-surface-variant text-xs leading-relaxed max-w-sm">
              Connecting exceptional talent with world-class tech companies through intelligent AI skill-first matching and verified recruitment workflows.
            </p>
          </div>

          {/* Dynamic Role-Based Columns */}
          {!isAuthenticated || !user ? (
            /* Guest Visitor Footer */
            <>
              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Discover
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/jobs" className="hover:text-primary transition-colors">Browse Jobs</Link></li>
                  <li><Link href="/companies/c-1" className="hover:text-primary transition-colors">Browse Companies</Link></li>
                  <li><Link href="/about" className="hover:text-primary transition-colors">About NextHire</Link></li>
                  <li><Link href="/admin/subscriptions" className="hover:text-primary transition-colors">Pricing & Plans</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Resources & Support
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/help" className="hover:text-primary transition-colors">Help Centre</Link></li>
                  <li><Link href="/help" className="hover:text-primary transition-colors">Contact Support</Link></li>
                  <li><Link href="/help" className="hover:text-primary transition-colors">FAQs</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Legal & Account
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                  <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                  <li><Link href="/login" className="hover:text-primary transition-colors">Sign In</Link></li>
                  <li><Link href="/register" className="hover:text-primary transition-colors">Sign Up</Link></li>
                </ul>
              </div>
            </>
          ) : user.role === "JOB_SEEKER" ? (
            /* Job Seeker Footer */
            <>
              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Career
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/jobs" className="hover:text-primary transition-colors">Browse Jobs</Link></li>
                  <li><Link href="/applications" className="hover:text-primary transition-colors">My Applications</Link></li>
                  <li><Link href="/profile" className="hover:text-primary transition-colors">Resume Studio</Link></li>
                  <li><Link href="/profile" className="hover:text-primary transition-colors">My Profile</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Support
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/help" className="hover:text-primary transition-colors">Help Centre</Link></li>
                  <li><Link href="/help" className="hover:text-primary transition-colors">Contact Support</Link></li>
                  <li><Link href="/help" className="hover:text-primary transition-colors">FAQs</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Account & Legal
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/about" className="hover:text-primary transition-colors">About NextHire</Link></li>
                  <li><Link href="/settings" className="hover:text-primary transition-colors">Account Settings</Link></li>
                  <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </>
          ) : user.role === "RECRUITER" ? (
            /* Recruiter Footer */
            <>
              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Recruitment
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/recruiter" className="hover:text-primary transition-colors">Recruiter Suite</Link></li>
                  <li><Link href="/recruiter/jobs/new" className="hover:text-primary transition-colors">Post a Job</Link></li>
                  <li><Link href="/recruiter/company" className="hover:text-primary transition-colors">Company Profile</Link></li>
                  <li><Link href="/recruiter/applicants" className="hover:text-primary transition-colors">Candidate Pipeline</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Business & Support
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/admin/subscriptions" className="hover:text-primary transition-colors">Subscription & Billing</Link></li>
                  <li><Link href="/help" className="hover:text-primary transition-colors">Help Centre</Link></li>
                  <li><Link href="/help" className="hover:text-primary transition-colors">Recruiter Guides</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Legal & Settings
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/settings" className="hover:text-primary transition-colors">Account Settings</Link></li>
                  <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </>
          ) : (
            /* Admin Footer */
            <>
              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Administration
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/admin" className="hover:text-primary transition-colors">Admin Dashboard</Link></li>
                  <li><Link href="/admin/users" className="hover:text-primary transition-colors">User Directory</Link></li>
                  <li><Link href="/admin/companies" className="hover:text-primary transition-colors">Company Verification</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Platform & Revenue
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/admin/subscriptions" className="hover:text-primary transition-colors">SaaS Subscriptions</Link></li>
                  <li><Link href="/settings" className="hover:text-primary transition-colors">System Settings</Link></li>
                  <li><Link href="/help" className="hover:text-primary transition-colors">Help Centre</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                  Legal Policies
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                  <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-outline-variant/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-outline font-label-md">
          <p>© {new Date().getFullYear()} NextHire Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>https://www.nexthire.cloud</span>
            <span>•</span>
            <span className="font-bold text-primary">
              Role: {isAuthenticated && user ? user.role.replace("_", " ") : "Guest Visitor"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
