"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface MobileSearchScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchScreen({ isOpen, onClose }: MobileSearchScreenProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/jobs?q=${encodeURIComponent(query)}`);
    }
  };

  const handleTagClick = (tag: string) => {
    onClose();
    router.push(`/jobs?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="fixed inset-0 z-50 h-dvh bg-surface text-on-surface flex flex-col pt-safe pb-safe animate-fade-in">
      {/* Top Search Header */}
      <div className="p-4 border-b border-outline-variant/20 flex items-center gap-3 bg-surface-container-lowest">
        <button
          onClick={onClose}
          className="p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors touch-target"
          aria-label="Close search"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>

        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, skills, or companies..."
            className="w-full pl-3 pr-9 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-lg p-1"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </form>

        <button
          onClick={handleSearchSubmit}
          className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-colors touch-target shadow-xs"
        >
          Search
        </button>
      </div>

      {/* Body: Recent Searches & Quick Shortcuts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Trending Skill Tags */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-outline uppercase tracking-wider">
            Popular Job Searches
          </h4>
          <div className="flex flex-wrap gap-2">
            {["Data Analyst", "Software Engineer", "Product Manager", "React", "AWS", "Remote"].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3.5 py-1.5 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary text-on-surface-variant rounded-full text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm text-primary">trending_up</span>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-outline uppercase tracking-wider">
            Quick Navigation
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { onClose(); router.push("/jobs"); }}
              className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl flex items-center gap-3 hover:border-primary transition-all text-left"
            >
              <span className="p-2 bg-primary/10 text-primary rounded-xl material-symbols-outlined text-xl">work</span>
              <div>
                <div className="font-bold text-xs text-on-surface">Browse Jobs</div>
                <div className="text-[10px] text-outline">Explore 2,000+ roles</div>
              </div>
            </button>

            <button
              onClick={() => { onClose(); router.push("/resume-studio"); }}
              className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl flex items-center gap-3 hover:border-primary transition-all text-left"
            >
              <span className="p-2 bg-tertiary/10 text-tertiary rounded-xl material-symbols-outlined text-xl">description</span>
              <div>
                <div className="font-bold text-xs text-on-surface">Resume Studio</div>
                <div className="text-[10px] text-outline">AI Resume Matcher</div>
              </div>
            </button>

            <button
              onClick={() => { onClose(); router.push("/companies"); }}
              className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl flex items-center gap-3 hover:border-primary transition-all text-left"
            >
              <span className="p-2 bg-secondary-container text-on-secondary-container rounded-xl material-symbols-outlined text-xl">domain</span>
              <div>
                <div className="font-bold text-xs text-on-surface">Companies</div>
                <div className="text-[10px] text-outline">Top Tech Employers</div>
              </div>
            </button>

            <button
              onClick={() => { onClose(); router.push("/applications"); }}
              className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl flex items-center gap-3 hover:border-primary transition-all text-left"
            >
              <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl material-symbols-outlined text-xl">assignment_turned_in</span>
              <div>
                <div className="font-bold text-xs text-on-surface">Applications</div>
                <div className="text-[10px] text-outline">Track Submitted Roles</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
