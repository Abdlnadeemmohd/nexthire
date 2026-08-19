"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { RecruitmentEngine } from "@/services/recruitmentEngine";

export default function RegisterPage() {
  const router = useRouter();
  const { registerSeeker, registerRecruiter, isLoading } = useAuth();

  const [accountType, setAccountType] = useState<"JOB_SEEKER" | "RECRUITER">("JOB_SEEKER");

  // Common Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(true);

  // Seeker Specific
  const [country, setCountry] = useState("United States");

  // Recruiter Specific
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [designation, setDesignation] = useState("");

  const [error, setError] = useState("");

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!terms) {
      setError("You must accept the Terms of Service.");
      return;
    }

    if (accountType === "RECRUITER") {
      const domainCheck = RecruitmentEngine.validateRecruiterEmail(email);
      if (!domainCheck.isValid) {
        setError(domainCheck.error || "Official corporate company email required.");
        return;
      }
    }

    if (accountType === "JOB_SEEKER") {
      const res = await registerSeeker(name, email, phone, country, password);
      if (res.success) {
        router.push("/verify-email");
      }
    } else {
      const res = await registerRecruiter(
        name,
        companyName,
        email,
        companyWebsite,
        phone,
        companyLocation,
        designation,
        password
      );
      if (res.success) {
        router.push("/verify-email");
      }
    }
  };

  return (
    <AuthSplitLayout currentAction="register">
      <div className="w-full space-y-6">
        {/* Top Auth Mode Navigation Toggle */}
        <div className="flex items-center justify-between p-1.5 bg-surface-container border border-outline-variant/30 rounded-2xl text-xs font-bold shadow-2xs">
          <Link
            href="/login"
            className="px-4 py-2 text-on-surface-variant hover:text-primary rounded-xl flex-1 text-center transition-colors"
          >
            Sign In
          </Link>
          <span className="px-4 py-2 bg-primary text-on-primary rounded-xl flex-1 text-center shadow-xs">
            Create Account / Sign Up
          </span>
        </div>

        {/* Account Type Toggle */}
        <div className="p-1 bg-surface-container-high rounded-2xl flex text-xs font-label-md font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setAccountType("JOB_SEEKER")}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              accountType === "JOB_SEEKER"
                ? "bg-surface text-primary shadow-xs font-bold"
                : "text-outline hover:text-on-surface"
            }`}
          >
            Register as Job Seeker
          </button>
          <button
            type="button"
            onClick={() => setAccountType("RECRUITER")}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              accountType === "RECRUITER"
                ? "bg-surface text-tertiary shadow-xs font-bold"
                : "text-outline hover:text-on-surface"
            }`}
          >
            Register as Employer
          </button>
        </div>

        {/* Production Glass Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/60 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl font-bold text-on-surface">
              {accountType === "JOB_SEEKER" ? "Candidate Registration" : "Employer Registration"}
            </h1>
            <p className="text-on-surface-variant text-xs font-body-md leading-relaxed">
              {accountType === "JOB_SEEKER"
                ? "Create your candidate profile to discover matching tech opportunities and apply seamlessly."
                : "Register your organization to post positions, review applications, and hire top talent."}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-error-container/40 border border-error/40 text-on-error-container rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-error" aria-hidden="true">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-body-sm">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                {accountType === "RECRUITER" ? "Official Company Email" : "Email Address"}
              </label>
              <input
                type="email"
                required
                placeholder={accountType === "RECRUITER" ? "you@company.com" : "you@email.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Recruiter-Specific Fields */}
            {accountType === "RECRUITER" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stellar Systems"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                      Company Website
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://company.com"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lead Recruiter"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                      Company Location
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="San Francisco, CA"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Mobile & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {accountType === "JOB_SEEKER" && (
                <div className="space-y-1">
                  <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                </div>
              )}
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-10 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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

              <div className="space-y-1">
                <label className="block font-label-md font-bold uppercase tracking-wider text-outline">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-surface border border-outline-variant/40 rounded-xl text-xs font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="termsCheck"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer"
              />
              <label htmlFor="termsCheck" className="text-xs font-label-md text-on-surface-variant cursor-pointer">
                I agree to the{" "}
                <Link href="/terms" className="text-primary font-bold hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary font-bold hover:underline">
                  Privacy Policy
                </Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-on-primary font-label-md font-bold rounded-full text-xs hover:bg-primary-container transition-all shadow-md mt-2 flex items-center justify-center gap-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Creating Account...
                </>
              ) : (
                `Register as ${accountType === "RECRUITER" ? "Employer (Verification Pending)" : "Job Seeker"}`
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-outline-variant/10 text-xs text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </div>
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
    </AuthSplitLayout>
  );
}
