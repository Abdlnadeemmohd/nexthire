"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { authService } from "@/services/authService";
import { useToast } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await authService.sendPasswordReset(email);
    setLoading(false);
    setSubmitted(true);
    showToast("Password reset link sent!", "success");
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-between">
      <AuthHeader currentAction="reset" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="glass-card rounded-3xl p-8 border border-white/60 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                Reset Your Password
              </h1>
              <p className="text-on-surface-variant text-xs font-body-md">
                Enter your registered email address and we'll send a secure password reset link.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-tertiary-container/30 text-tertiary rounded-full flex items-center justify-center mx-auto text-2xl">
                  <span className="material-symbols-outlined text-3xl">send</span>
                </div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Reset Link Sent!
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  We sent a password reset email to <span className="font-bold text-on-surface">{email}</span>. Click the link in the email to set your new password.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-sm"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body-sm">
                <div className="space-y-1">
                  <label className="block text-outline font-label-md font-bold uppercase">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 mt-2 min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending Reset Email...
                    </>
                  ) : (
                    "Send Reset Email"
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-outline-variant/10 text-xs flex justify-between items-center text-outline">
              <Link href="/recover-email" className="hover:text-primary font-bold">
                Forgot your email?
              </Link>
              <Link href="/login" className="text-primary font-bold hover:underline">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      <div className="pb-4" />
    </div>
  );
}
