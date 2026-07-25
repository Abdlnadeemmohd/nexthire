"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ProfileDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed shadow-sm cursor-pointer hover:ring-2 ring-primary transition-all block"
        title="Account Menu"
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8"
          alt="Alex Rivers Avatar"
          className="w-full h-full object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl z-50 overflow-hidden space-y-1 animate-fade-in p-2">
          {/* User Header */}
          <div className="p-3 border-b border-outline-variant/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8"
                alt="Alex Rivers Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-headline-sm text-sm font-bold text-on-surface truncate">
                Alex Rivers
              </h4>
              <p className="text-[11px] text-on-surface-variant truncate">
                alex.rivers@gmail.com
              </p>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-primary-container/20 text-primary text-[9px] font-bold rounded-full">
                PREMIUM
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1 text-xs font-label-md space-y-0.5 text-on-surface">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">account_circle</span>
              <span>My Profile</span>
            </Link>

            <Link
              href="/admin/subscriptions"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">credit_card</span>
              <span>Billing & Subscriptions</span>
            </Link>

            <Link
              href="/recruiter"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container text-primary font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-base">swap_horiz</span>
              <span>Switch to Recruiter Suite</span>
            </Link>

            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base">
                  {isDarkMode ? "light_mode" : "dark_mode"}
                </span>
                <span>Dark Appearance</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container-high rounded-full">
                {isDarkMode ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Logout Footer */}
          <div className="pt-1 border-t border-outline-variant/20">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/login");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-error-container/20 text-error font-bold text-xs transition-colors text-left"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
