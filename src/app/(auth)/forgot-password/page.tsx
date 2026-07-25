"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/layout/TopAppBar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh flex items-center justify-center p-6 pt-24">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full border border-white/60 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center font-bold font-display text-2xl mx-auto shadow-md">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-on-surface">
              Reset Your Password
            </h1>
            <p className="text-on-surface-variant text-xs font-body-md">
              Enter your registered email address and we will send you a password reset token.
            </p>
          </div>

          {sent ? (
            <div className="p-6 bg-tertiary-container/10 border border-tertiary/30 rounded-xl text-center space-y-3">
              <span className="material-symbols-outlined text-tertiary text-4xl">mark_email_read</span>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Reset Link Sent!
              </h3>
              <p className="text-xs text-on-surface-variant">
                Check your inbox at <span className="font-bold text-on-surface">{email}</span> for instructions.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full mt-2"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body-sm">
              <div className="space-y-1.5">
                <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-on-primary font-label-md font-bold rounded-full text-sm hover:bg-primary-container transition-all shadow-md mt-2"
              >
                Send Password Reset Token
              </button>
            </form>
          )}

          <div className="text-center pt-2 text-xs text-on-surface-variant">
            Remember your password?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
