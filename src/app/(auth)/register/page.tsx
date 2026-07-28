"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { useAuth } from "@/context/AuthContext";

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
      await registerSeeker(name, email, phone, country, password);
      router.push("/verify-email");
    } else {
      await registerRecruiter(
        name,
        companyName,
        email,
        companyWebsite,
        phone,
        companyLocation,
        designation,
        password
      );
      router.push("/verify-email");
    }
  };

  return (
    <>
      <TopAppBar />

      <main className="min-h-screen bg-mesh flex items-center justify-center p-6 pt-24">
        <div className="glass-card rounded-2xl p-8 max-w-lg w-full border border-white/60 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center font-bold font-display text-2xl mx-auto shadow-md">
              N
            </div>
            <h1 className="font-display text-2xl font-bold text-on-surface">
              Create Your NextHire Account
            </h1>
            <p className="text-on-surface-variant text-xs font-body-md">
              Select account type to register for global career opportunities or employer hiring
            </p>
          </div>

          {/* Account Type Toggle (NO OWNER REGISTER OPTION!) */}
          <div className="p-1 bg-surface-container-high rounded-full flex text-xs font-label-md font-bold">
            <button
              type="button"
              onClick={() => setAccountType("JOB_SEEKER")}
              className={`flex-1 py-2.5 rounded-full transition-all ${
                accountType === "JOB_SEEKER"
                  ? "bg-primary text-on-primary shadow-xs font-bold"
                  : "text-on-surface-variant"
              }`}
            >
              Register as Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setAccountType("RECRUITER")}
              className={`flex-1 py-2.5 rounded-full transition-all ${
                accountType === "RECRUITER"
                  ? "bg-primary text-on-primary shadow-xs font-bold"
                  : "text-on-surface-variant"
              }`}
            >
              Register as Employer
            </button>
          </div>

          {error && (
            <div className="p-3 bg-error-container/40 border border-error/40 text-on-error-container rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-error">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-body-sm">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                {accountType === "RECRUITER" ? "Official Company Email" : "Email Address"}
              </label>
              <input
                type="email"
                required
                placeholder={accountType === "RECRUITER" ? "you@company.com" : "you@email.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Recruiter-Specific Fields */}
            {accountType === "RECRUITER" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stellar Systems"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                      Company Website
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://company.com"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lead Recruiter"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                      Company Location
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="San Francisco, CA"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                      className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Mobile & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              {accountType === "JOB_SEEKER" && (
                <div className="space-y-1">
                  <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              )}
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm font-body-sm text-on-surface focus:ring-2 focus:ring-primary"
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
                I agree to the <a href="#" className="text-primary font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>.
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
                  Creating Account...
                </>
              ) : (
                `Register as ${accountType === "RECRUITER" ? "Employer (Verification Pending)" : "Job Seeker"}`
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
