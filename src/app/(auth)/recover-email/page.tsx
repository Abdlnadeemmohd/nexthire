"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { useToast } from "@/components/ui/Toast";

export default function RecoverEmailPage() {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phoneOrCompany, setPhoneOrCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setLoading(false);
    setSubmitted(true);
    showToast("Account recovery request submitted!", "success");
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-between">
      <AuthHeader currentAction="reset" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="glass-card rounded-3xl p-8 border border-white/60 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                Account Email Recovery
              </h1>
              <p className="text-on-surface-variant text-xs font-body-md">
                Can't remember your registered email? Submit a secure verification request below.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-tertiary-container/30 text-tertiary rounded-full flex items-center justify-center mx-auto text-2xl">
                  <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Recovery Request Received
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  If your details match an active profile, our account security team will contact you via phone or SMS within 2 hours.
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
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivers"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-outline font-label-md font-bold uppercase">
                    Phone Number or Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1 (555) 019-2834 or Stellar Systems"
                    value={phoneOrCompany}
                    onChange={(e) => setPhoneOrCompany(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                  />
                </div>

                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  🔒 For privacy protection, account details are verified manually to prevent unauthorized access.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 mt-2 min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    "Submit Recovery Request"
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-outline-variant/10 text-xs">
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
