"use client";

import React, { useState } from "react";

export interface CompanyLogoProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "custom";
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

// Generate a deterministic gradient color for fallback monogram based on company name
function getMonogramGradient(name: string): string {
  const gradients = [
    "from-blue-600 to-indigo-700 text-white",
    "from-emerald-600 to-teal-700 text-white",
    "from-violet-600 to-purple-700 text-white",
    "from-sky-600 to-cyan-700 text-white",
    "from-amber-600 to-orange-700 text-white",
    "from-rose-600 to-pink-700 text-white",
    "from-slate-700 to-slate-900 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % gradients.length;
  }
  return gradients[hash] || gradients[0];
}

// Extract clean 1-2 letter monogram initials
function getInitials(name: string): string {
  if (!name) return "C";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function CompanyLogo({
  src,
  name,
  size = "md",
  className = "",
  rounded = "xl",
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-16 h-16 text-lg",
    custom: "",
  }[size];

  const roundedClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  // If no src or known expired token, or image loading failed, render fallback monogram
  const isInvalidSrc = !src || src.includes("lh3.googleusercontent.com/aida-public");

  if (isInvalidSrc || hasError) {
    const gradient = getMonogramGradient(name);
    const initials = getInitials(name);

    return (
      <div
        className={`bg-gradient-to-br ${gradient} ${sizeClasses} ${roundedClasses} flex items-center justify-center font-display font-bold shadow-xs flex-shrink-0 select-none border border-black/10 ${className}`}
        title={name}
        aria-label={`${name} Logo`}
        role="img"
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-white border border-outline-variant/30 ${sizeClasses} ${roundedClasses} p-1 shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
    >
      <img
        src={src}
        alt={`${name} Logo`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain ${roundedClasses} transition-opacity duration-200 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-surface-container animate-pulse flex items-center justify-center">
          <span className="text-[10px] font-bold text-outline uppercase">{getInitials(name)}</span>
        </div>
      )}
    </div>
  );
}
