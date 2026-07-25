"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/auth";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const { login, isLoading } = useAuth();
  const [role, setRole] = useState<UserRole>("JOB_SEEKER");
  const [email, setEmail] = useState("jobseeker@nexthire.com");
  const [password, setPassword] = useState("JobSeeker@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setErrorMessage("");
    if (selectedRole === "PLATFORM_ADMIN") {
      setEmail("owner@nexthire.com");
      setPassword("Owner@123");
    } else if (selectedRole === "RECRUITER") {
      setEmail("recruiter@nexthire.com");
      setPassword("Recruiter@123");
    } else {
      setEmail("jobseeker@nexthire.com");
      setPassword("JobSeeker@123");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const res = await login(role, email, password, rememberMe);
    if (!res.success) {
      setErrorMessage(res.error || "Invalid credentials.");
      return;
    }

    if (redirectPath) {
      router.push(redirectPath);
      return;
    }

    if (role === "PLATFORM_ADMIN" || email === "owner@nexthire.com") {
      router.push("/admin");
    } else if (role === "RECRUITER") {
      router.push("/recruiter");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 max-w-md w-full border border-white/60 space-y-6 shadow-2xl">
      {/* Development Mode Notice Banner */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-xl text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold font-label-md text-amber-700">
          <span className="material-symbols-outlined text-base">bolt</span>
          Development Mode Notice
        </div>
        <p className="text-[11px] leading-relaxed text-amber-800">
          This application is currently using temporary mock authentication for testing purposes. Firebase Authentication will be integrated before production deployment.
        </p>
      </div>

      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center font-bold font-display text-2xl mx-auto shadow-md">
          N
        </div>
        <h1 className="font-display text-2xl font-bold text-on-surface">
          Sign In to NextHire
        </h1>
        <p className="text-on-surface-variant text-xs font-body-md">
          Select your test role or enter test credentials to authenticate
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="p-1 bg-surface-container-high rounded-full flex text-[11px] font-label-md font-bold">
        <button
          type="button"
          onClick={() => handleRoleSelect("JOB_SEEKER")}
          className={`flex-1 py-2 rounded-full transition-all ${
            role === "JOB_SEEKER"
              ? "bg-primary text-on-primary shadow-xs font-bold"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Job Seeker
        </button>
        <button
          type="button"
          onClick={() => handleRoleSelect("RECRUITER")}
          className={`flex-1 py-2 rounded-full transition-all ${
            role === "RECRUITER"
              ? "bg-primary text-on-primary shadow-xs font-bold"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Recruiter
        </button>
        <button
          type="button"
          onClick={() => handleRoleSelect("PLATFORM_ADMIN")}
          className={`flex-1 py-2 rounded-full transition-all ${
            role === "PLATFORM_ADMIN"
              ? "bg-error text-on-error shadow-xs font-bold"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Owner
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-error-container/40 border border-error/40 text-on-error-container rounded-xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-error">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
              Password
            </label>
            <Link href="/forgot-password" className="text-primary font-bold hover:underline">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 pr-10 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-base">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-label-md text-on-surface">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
            />
            Remember Me
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-primary text-on-primary font-label-md font-bold rounded-full text-sm hover:bg-primary-container transition-all shadow-md mt-2 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Authenticating...
            </>
          ) : (
            `Sign In as ${role.replace("_", " ")}`
          )}
        </button>
      </form>

      {/* Social OAuth Options */}
      <div className="space-y-3 pt-2 text-center border-t border-outline-variant/20">
        <span className="text-[11px] text-outline uppercase tracking-wider font-semibold">
          Or Sign In with Single Sign-On
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs font-label-md font-bold">
          <button
            type="button"
            onClick={() => handleLoginSubmit({ preventDefault: () => {} } as any)}
            className="py-2.5 px-3 bg-surface border border-outline-variant/30 rounded-xl hover:bg-surface-container flex items-center justify-center gap-1.5"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => handleLoginSubmit({ preventDefault: () => {} } as any)}
            className="py-2.5 px-3 bg-surface border border-outline-variant/30 rounded-xl hover:bg-surface-container flex items-center justify-center gap-1.5"
          >
            LinkedIn
          </button>
          <button
            type="button"
            onClick={() => handleLoginSubmit({ preventDefault: () => {} } as any)}
            className="py-2.5 px-3 bg-surface border border-outline-variant/30 rounded-xl hover:bg-surface-container flex items-center justify-center gap-1.5"
          >
            Microsoft
          </button>
          <button
            type="button"
            onClick={() => handleLoginSubmit({ preventDefault: () => {} } as any)}
            className="py-2.5 px-3 bg-surface border border-outline-variant/30 rounded-xl hover:bg-surface-container flex items-center justify-center gap-1.5"
          >
            GitHub
          </button>
        </div>
      </div>

      <div className="text-center pt-2 text-xs text-on-surface-variant">
        Don't have an account?{" "}
        <Link href="/register" className="text-primary font-bold hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh flex items-center justify-center p-6 pt-24">
        <Suspense fallback={<div className="text-center font-label-md text-xs">Loading Auth System...</div>}>
          <LoginFormContent />
        </Suspense>
      </main>
    </>
  );
}
