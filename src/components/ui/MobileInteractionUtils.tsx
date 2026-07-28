"use client";

import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * 1. PullToRefresh Component
 * Enables smooth mobile touch pull-down gesture to trigger data refresh.
 */
interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pullThreshold = 70;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || window.scrollY > 0) return;
    const y = e.touches[0].clientY;
    const delta = y - startY;
    if (delta > 0) {
      setCurrentY(Math.min(delta * 0.5, pullThreshold + 20));
    }
  };

  const handleTouchEnd = async () => {
    if (currentY >= pullThreshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setRefreshing(false);
          setCurrentY(0);
          setStartY(0);
        }, 500);
      }
    } else {
      setCurrentY(0);
      setStartY(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {/* Pull Indicator */}
      {(currentY > 0 || refreshing) && (
        <div
          style={{ height: `${currentY}px` }}
          className="overflow-hidden flex items-center justify-center transition-all duration-150 bg-primary/5 text-primary text-xs font-bold gap-2"
        >
          <span className={`material-symbols-outlined text-lg ${refreshing ? "animate-spin" : ""}`}>
            {refreshing ? "sync" : "arrow_downward"}
          </span>
          <span>{refreshing ? "Refreshing updates..." : "Pull down to refresh"}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * 2. OfflineStatusBanner Component
 * Detects client connectivity status and displays an enterprise offline notification banner.
 */
export function OfflineStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast("Connection restored! You are back online.", "success");
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showToast]);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md sticky top-16 z-40 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base">wifi_off</span>
        <span>Offline Mode: You are viewing cached data. Some features may be restricted.</span>
      </div>
      <button
        onClick={() => {
          if (navigator.onLine) {
            setIsOffline(false);
            showToast("Connection verified!", "success");
          } else {
            showToast("Still offline. Check your mobile data or Wi-Fi.", "info");
          }
        }}
        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-bold transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

/**
 * 3. MobileScrollableChips Component
 * Horizontally scrollable chip container replacing overflowing tab bars with full WCAG accessibility.
 */
interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: string;
}

interface MobileScrollableChipsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export function MobileScrollableChips({
  items,
  activeId,
  onChange,
  ariaLabel = "Filter Options",
}: MobileScrollableChipsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1 scroll-smooth touch-pan-x select-none"
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 touch-target ${
              isActive
                ? "bg-primary text-on-primary shadow-xs ring-2 ring-primary/20"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border border-outline-variant/30"
            }`}
          >
            {tab.icon && (
              <span className={`material-symbols-outlined text-base ${isActive ? "text-on-primary" : "text-primary"}`}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 4. NativeShareButton Component
 * Uses Native Web Share API with instant fallback copy link.
 */
interface NativeShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
}

export function NativeShareButton({ title, text, url, className }: NativeShareButtonProps) {
  const { showToast } = useToast();

  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!", "success");
      } catch {
        showToast("Unable to copy link.", "error");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={
        className ||
        "p-2.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-xl transition-all touch-target flex items-center justify-center"
      }
      aria-label={`Share ${title}`}
      title={`Share ${title}`}
    >
      <span className="material-symbols-outlined text-xl">share</span>
    </button>
  );
}

/**
 * 5. SkeletonListCard Component
 * Renders loading skeleton cards for mobile list views.
 */
export function SkeletonListCard({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-high" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-surface-container-high rounded" />
                <div className="w-24 h-3 bg-surface-container-high rounded" />
              </div>
            </div>
            <div className="w-16 h-6 rounded-full bg-surface-container-high" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="w-full h-3 bg-surface-container-high rounded" />
            <div className="w-3/4 h-3 bg-surface-container-high rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
