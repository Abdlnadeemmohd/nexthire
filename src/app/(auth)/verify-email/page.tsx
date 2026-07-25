"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState(["7", "4", "2", "9", "0", "1"]);
  const [verified, setVerified] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setVerified(true);
    setTimeout(() => {
      if (user?.role === "RECRUITER") {
        router.push("/recruiter");
      } else {
        router.push("/dashboard");
      }
    }, 1200);
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
              We sent a 6-digit security code to{" "}
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
                    className="w-11 h-12 text-center text-lg font-bold bg-surface border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-on-primary font-label-md font-bold rounded-full text-sm hover:bg-primary-container transition-all shadow-md"
              >
                Confirm Verification Code
              </button>
            </form>
          )}

          <div className="text-xs text-outline pt-2">
            Didn't receive code?{" "}
            <button
              onClick={() => alert("Verification code resent!")}
              className="text-primary font-bold hover:underline"
            >
              Resend Security Code
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
