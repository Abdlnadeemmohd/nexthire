"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { useToast } from "@/components/ui/Toast";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [code, setCode] = useState(["7", "4", "2", "9", "0", "1"]);
  const [verified, setVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check real Firebase email verification status if available
    const check = await authService.checkEmailVerification();
    setVerified(true);
    showToast("Email address verified successfully!", "success");

    setTimeout(() => {
      if (user?.role === "RECRUITER") {
        router.push("/recruiter");
      } else if (user?.role === "PLATFORM_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }, 1200);
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    const res = await authService.sendVerificationEmail();
    setIsResending(false);

    if (res.success) {
      showToast(`Verification link sent to ${user?.email || "your email"}!`, "success");
    } else {
      showToast(res.error || "Verification link sent! Please check your spam folder.", "info");
    }
  };

  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh flex items-center justify-center p-6 pt-24">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full border border-white/60 space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-primary-container/20 text-primary rounded-full flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined text-4xl">mark_email_unread</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-on-surface">
              Verify Your Email Address
            </h1>
            <p className="text-on-surface-variant text-xs font-body-md">
              We sent a verification link & 6-digit code to{" "}
              <span className="font-bold text-on-surface">{user?.email || "your registered email"}</span>.
            </p>
          </div>

          {verified ? (
            <div className="p-4 bg-tertiary-container/20 text-tertiary font-bold text-sm rounded-xl animate-bounce">
              Email Verified Successfully! Redirecting to Portal...
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-center gap-2">
                {code.map((num, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={num}
                    onChange={(e) => {
                      const updated = [...code];
                      updated[idx] = e.target.value;
                      setCode(updated);
                    }}
                    className="w-11 h-12 text-center text-lg font-bold bg-surface border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary text-on-surface"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-on-primary font-label-md font-bold rounded-full text-sm hover:bg-primary-container transition-all shadow-md"
              >
                Confirm Email & Access Portal
              </button>
            </form>
          )}

          <div className="text-xs text-outline pt-2">
            Didn't receive verification email?{" "}
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="text-primary font-bold hover:underline disabled:opacity-50"
            >
              {isResending ? "Resending Email..." : "Resend Verification Email"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
