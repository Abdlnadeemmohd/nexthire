import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-high border-t border-outline-variant/30 py-16 text-on-surface-variant font-body-sm">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold font-display text-xl">
              N
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-on-surface">
              Next<span className="text-primary">Hire</span>
            </span>
          </Link>
          <p className="text-on-surface-variant max-w-sm text-sm">
            AI-powered premium global recruitment portal matching exceptional talent with world-class tech organizations.
          </p>
          <p className="text-xs text-outline pt-2">
            © {new Date().getFullYear()} NextHire Technologies Inc. All rights reserved.
          </p>
        </div>

        {/* Column 1: For Job Seekers */}
        <div className="space-y-3">
          <h4 className="font-label-md text-on-surface font-semibold uppercase tracking-wider text-xs">
            For Job Seekers
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/jobs" className="hover:text-primary transition-colors">
                Browse All Jobs
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                AI Match Dashboard
              </Link>
            </li>
            <li>
              <Link href="/applications" className="hover:text-primary transition-colors">
                Application Tracker
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-primary transition-colors">
                Resume Analyzer
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: For Employers */}
        <div className="space-y-3">
          <h4 className="font-label-md text-on-surface font-semibold uppercase tracking-wider text-xs">
            For Recruiters
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/recruiter/jobs/new" className="hover:text-primary transition-colors">
                Post a Job
              </Link>
            </li>
            <li>
              <Link href="/recruiter/applicants" className="hover:text-primary transition-colors">
                Candidate Pipeline
              </Link>
            </li>
            <li>
              <Link href="/recruiter" className="hover:text-primary transition-colors">
                Employer Dashboard
              </Link>
            </li>
            <li>
              <Link href="/recruiter/company" className="hover:text-primary transition-colors">
                Company Profile
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Platform */}
        <div className="space-y-3">
          <h4 className="font-label-md text-on-surface font-semibold uppercase tracking-wider text-xs">
            Platform & Legal
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin" className="hover:text-primary transition-colors">
                Admin Console
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Security & Trust
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
