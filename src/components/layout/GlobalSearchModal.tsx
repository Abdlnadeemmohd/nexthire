"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SearchResult } from "@/lib/search/types";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || []);
          setProviderStatuses(data.providerStatuses || []);
        }
      } catch {
        // Soft error handling
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-on-surface/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-2xl w-full p-4 space-y-4 shadow-2xl relative overflow-hidden">
        {/* Search Header Input */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-4 text-primary text-xl">search</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across NextHire DB, Google, Bing, Brave & Partner Feeds... (Esc to close)"
            className="w-full pl-12 pr-10 py-3.5 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          />
          {isLoading ? (
            <span className="material-symbols-outlined absolute right-3 animate-spin text-primary text-lg">progress_activity</span>
          ) : (
            <button
              onClick={onClose}
              className="absolute right-3 p-1 text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Search Provider Diagnostics Header */}
        {providerStatuses.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto text-[10px] font-bold text-outline py-1 px-1 border-b border-outline-variant/15">
            <span className="uppercase text-[9px] text-primary">Providers:</span>
            {providerStatuses.map((ps, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  ps.status === "SUCCESS"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                ● {ps.providerName} ({ps.resultCount})
              </span>
            ))}
          </div>
        )}

        {/* Results Category List */}
        <div className="max-h-96 overflow-y-auto space-y-1 divide-y divide-outline-variant/15">
          {results.length === 0 && !isLoading ? (
            <div className="py-8 text-center space-y-2">
              <span className="material-symbols-outlined text-outline text-3xl">search_off</span>
              <p className="text-xs text-on-surface-variant">No aggregated search results found for "{query}"</p>
            </div>
          ) : (
            results.map((res) => (
              <div
                key={res.id}
                className="flex items-center gap-3.5 p-3 hover:bg-surface-container-low/80 rounded-2xl transition-colors group"
              >
                <img
                  src={res.logo}
                  alt={res.company}
                  className="w-10 h-10 rounded-xl object-contain bg-surface-container p-1 border border-outline-variant/30 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute("src", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60");
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                      {res.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 font-bold rounded-md text-[9px] uppercase flex-shrink-0 ${
                        res.sourceType === "DIRECT"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-container-high text-outline"
                      }`}
                    >
                      {res.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant truncate mt-0.5">
                    <span className="font-medium">{res.company}</span>
                    <span>•</span>
                    <span>{res.location}</span>
                    {res.remote && (
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 font-semibold rounded text-[9px]">
                        Remote
                      </span>
                    )}
                    {res.duplicateCount && res.duplicateCount > 1 && (
                      <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-600 font-semibold rounded text-[9px]">
                        Found on {res.duplicateCount} sources
                      </span>
                    )}
                  </div>
                </div>

                {res.sourceUrl.startsWith("/") ? (
                  <Link
                    href={res.sourceUrl}
                    onClick={onClose}
                    className="p-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-90 flex-shrink-0"
                  >
                    View Job
                  </Link>
                ) : (
                  <a
                    href={res.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="p-2 rounded-xl bg-surface-container-high text-primary font-bold text-xs hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    Original
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-outline px-2">
          <span>Search across Google, Bing, Brave, Partner feeds & NextHire DB</span>
          <span>Press <strong>Esc</strong> to exit</span>
        </div>
      </div>
    </div>
  );
}
