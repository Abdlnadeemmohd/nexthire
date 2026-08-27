"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { hasRouteAccess, getHomeRouteForRole } from "@/lib/auth";


function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithFirebase } = useAuth();
  const { showToast } = useToast();

  const redirectUrl = searchParams.get("redirect") || "";
  const infoMessage = searchParams.get("message") || "";

  const initialRole = searchParams.get("role") === "recruiter" ? "recruiter" : "seeker";
  const [activeRole, setActiveRole] = useState<"seeker" | "recruiter">(initialRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      const result = await loginWithFirebase(idToken);
      setIsSubmitting(false);

      if (result.success && result.user) {
        showToast(`Welcome back, ${result.user.name}!`, "success");
        let targetUrl = getHomeRouteForRole(result.user.role);
        if (redirectUrl && hasRouteAccess(result.user.role, redirectUrl)) {
          targetUrl = redirectUrl;
        }
        window.location.href = targetUrl;
      } else {

        setErrorMsg(result.error || "Firebase authentication token verification failed.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in window was closed before completion. Please try again.");
      } else if (err?.code === "auth/cancelled-popup-request") {
        setErrorMsg("Sign-in request was cancelled.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setErrorMsg("This domain is not authorized in Firebase configuration. Please check Firebase settings.");
      } else {
        setErrorMsg(err?.message || "Google Sign-In failed. Please try again.");
      }
    }
  };

  const handleUnconfiguredOAuth = (providerName: string) => {
    showToast(`${providerName} Sign-In is not currently enabled. Please use Google or Email.`, "info");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const targetRole = activeRole === "seeker" ? "JOB_SEEKER" : "RECRUITER";
    const result = await login(email, password, targetRole, rememberMe);

    setIsSubmitting(false);

    if (result.success && result.user) {
      showToast(`Welcome back, ${result.user.name}!`, "success");

      const isRedirectAllowed = redirectUrl && hasRouteAccess(result.user.role, redirectUrl);

      let targetUrl = isRedirectAllowed ? redirectUrl : getHomeRouteForRole(result.user.role);

      window.location.href = targetUrl;
    } else {

      setErrorMsg(result.error || "Invalid authentication credentials.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Friendly Info Banner if redirected from job apply */}
      {infoMessage && (
        <div className="p-4 bg-primary-container/20 border border-primary/30 rounded-2xl text-xs font-body-md text-on-surface flex items-start gap-3 shadow-xs">
          <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">info</span>
          <div>
            <span className="font-bold text-primary">Authentication Required</span>
            <p className="text-on-surface-variant pt-0.5">{infoMessage}</p>
          </div>
        </div>
      )}

      {/* Top Auth Mode Navigation Toggle */}
      <div className="flex items-center justify-between p-1.5 bg-surface-container border border-outline-variant/30 rounded-2xl text-xs font-bold shadow-2xs">
        <span className="px-4 py-2 bg-primary text-on-primary rounded-xl flex-1 text-center shadow-xs">
          Sign In
        </span>
        <Link
          href="/register"
          className="px-4 py-2 text-on-surface-variant hover:text-primary rounded-xl flex-1 text-center transition-colors"
        >
          Create Account / Sign Up
        </Link>
      </div>

      {/* Role Switcher Tabs */}
      <div className="flex bg-surface-container-high p-1 rounded-2xl text-xs font-bold shadow-xs">
        <button
          type="button"
          onClick={() => {
            setActiveRole("seeker");
            setEmail("jobseeker@nexthire.com");
          }}
          className={`flex-1 py-2.5 text-center rounded-xl transition-all ${
            activeRole === "seeker"
              ? "bg-surface text-primary shadow-xs font-bold"
              : "text-outline hover:text-on-surface"
          }`}
        >
          Candidate Login
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveRole("recruiter");
            setEmail("recruiter@nexthire.com");
          }}
          className={`flex-1 py-2.5 text-center rounded-xl transition-all ${
            activeRole === "recruiter"
              ? "bg-surface text-tertiary shadow-xs font-bold"
              : "text-outline hover:text-on-surface"
          }`}
        >
          Recruiter Login
        </button>
      </div>

      {/* Production Glass Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-bold text-on-surface">
            {activeRole === "seeker" ? "Welcome Back, Candidate" : "Welcome Back, Recruiter"}
          </h1>
          <p className="text-on-surface-variant text-xs font-body-md leading-relaxed">
            {activeRole === "seeker"
              ? "Sign in to manage your profile, applications, interviews, and career opportunities."
              : "Sign in to manage job postings, candidates, interviews, and hiring workflows."}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-error-container/40 border border-error/40 text-error text-xs font-bold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-base" aria-hidden="true">error</span>
            {errorMsg}
          </div>
        )}

        {/* Production Email & Password Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-body-sm">
          <div className="space-y-1">
            <label className="block text-outline font-label-md font-bold uppercase">
              Email Address
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

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-outline font-label-md font-bold uppercase">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-primary hover:underline text-[11px] font-bold"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 bg-surface border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-outline hover:text-on-surface focus:outline-none focus:ring-1 focus:ring-primary rounded p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label htmlFor="rememberMe" className="flex items-center gap-2 cursor-pointer">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
              />
              <span className="text-on-surface-variant text-xs">Remember Me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 mt-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In to NextHire"
            )}
          </button>
        </form>

        {/* Social OAuth SSO Section */}
        <div className="space-y-4 pt-2">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-outline-variant/20 w-full" />
            <span className="bg-surface px-3 text-[10px] text-outline font-bold uppercase tracking-wider absolute">
              Or Sign In With
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="py-2.5 bg-surface border border-outline-variant/30 hover:bg-surface-container rounded-xl flex items-center justify-center text-on-surface transition-colors shadow-xs"
              title="Sign in with Google"
              aria-label="Sign in with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleUnconfiguredOAuth("LinkedIn")}
              className="py-2.5 bg-surface border border-outline-variant/30 hover:bg-surface-container rounded-xl flex items-center justify-center text-on-surface transition-colors shadow-xs"
              title="Sign in with LinkedIn"
              aria-label="Sign in with LinkedIn"
            >
              <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleUnconfiguredOAuth("Microsoft")}
              className="py-2.5 bg-surface border border-outline-variant/30 hover:bg-surface-container rounded-xl flex items-center justify-center text-on-surface transition-colors shadow-xs"
              title="Sign in with Microsoft"
              aria-label="Sign in with Microsoft"
            >
              <svg className="w-4 h-4" viewBox="0 0 23 23" aria-hidden="true">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleUnconfiguredOAuth("GitHub")}
              className="py-2.5 bg-surface border border-outline-variant/30 hover:bg-surface-container rounded-xl flex items-center justify-center text-on-surface transition-colors shadow-xs"
              title="Sign in with GitHub"
              aria-label="Sign in with GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-outline-variant/10 text-xs">
          <span className="text-on-surface-variant">Don&apos;t have an account? </span>
          <Link href="/register" className="text-primary font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Account Recovery & Support Card ("Having trouble signing in?") */}
      <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 space-y-3 text-xs">
        <h4 className="font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">help</span>
          Having trouble signing in?
        </h4>
        <ul className="space-y-2 text-[11px] text-on-surface-variant list-disc list-inside">
          <li className="leading-relaxed">
            <Link href="/forgot-password" className="text-primary hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded">
              Forgot your password?
            </Link>{" "}
            Reset it securely.
          </li>
          <li className="leading-relaxed">
            <Link href="/recover-email" className="text-primary hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded">
              Can&apos;t remember your registered email?
            </Link>{" "}
            Recover account.
          </li>
          <li className="leading-relaxed">
            <span className="text-on-surface-variant">Need assistance? </span>
            <Link href="/help?section=contact" className="text-primary hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded">
              Contact Support
            </Link>
          </li>
        </ul>
      </div>

      {/* Footer Support Navigation Links */}
      <nav aria-label="Support Links" className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-outline font-label-md py-2">
        <Link href="/help" className="hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary rounded px-1">
          Help Centre
        </Link>
        <span className="text-outline-variant/60 select-none" aria-hidden="true">&bull;</span>
        <Link href="/help?section=contact" className="hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary rounded px-1">
          Contact Support
        </Link>
        <span className="text-outline-variant/60 select-none" aria-hidden="true">&bull;</span>
        <Link href="/help?section=faq" className="hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary rounded px-1">
          FAQs
        </Link>
      </nav>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthSplitLayout currentAction="login">
      <Suspense fallback={<div className="text-center text-xs font-bold text-outline py-12">Loading Sign In Portal...</div>}>
        <LoginFormContent />
      </Suspense>
    </AuthSplitLayout>
  );
}
