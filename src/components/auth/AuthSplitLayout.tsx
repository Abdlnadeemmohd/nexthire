"use client";

import React from "react";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { AuthPromoContent } from "./AuthPromoContent";

interface AuthSplitLayoutProps {
  currentAction?: "login" | "register" | "reset";
  children: React.ReactNode;
}

export function AuthSplitLayout({
  currentAction = "login",
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-between overflow-x-hidden">
      {/* Brand Header */}
      <AuthHeader currentAction={currentAction} />

      {/* Main Responsive Two-Column Layout */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* Left Column: Persistent Promotional & Video Experience */}
          <div className="lg:col-span-6 xl:col-span-6 w-full flex flex-col justify-center">
            <AuthPromoContent />
          </div>

          {/* Right Column: Authentication Panel (Sign In, Sign Up, etc.) */}
          <div className="lg:col-span-6 xl:col-span-6 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-lg">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Spacer with Safe Area to prevent AI Copilot overlap */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-outline flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/20">
        <p className="font-body-sm">
          &copy; {new Date().getFullYear()} NextHire Cloud Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs font-medium">
          <a href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <span className="text-outline-variant/60" aria-hidden="true">&bull;</span>
          <a href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </a>
          <span className="text-outline-variant/60" aria-hidden="true">&bull;</span>
          <a href="/help" className="hover:text-primary transition-colors">
            Help Center
          </a>
        </div>
      </footer>
    </div>
  );
}
