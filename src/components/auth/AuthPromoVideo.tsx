"use client";

import React, { useState } from "react";

interface AuthPromoVideoProps {
  videoSrc?: string;
  posterSrc?: string;
  title?: string;
  badgeLabel?: string;
}

export function AuthPromoVideo({
  videoSrc,
  posterSrc,
  title = "NextHire Platform Tour",
  badgeLabel = "NEXT HIRE",
}: AuthPromoVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // If a real video URL is provided in the future, render the HTML5 video player
  if (videoSrc && isPlaying) {
    return (
      <div className="w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-950 relative group">
        <video
          src={videoSrc}
          poster={posterSrc}
          controls
          autoPlay
          className="w-full h-full object-cover"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div
      className="w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/30 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/90 relative group select-none flex flex-col justify-between p-4 sm:p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-primary/10"
      role="region"
      aria-label="NextHire promotional media and preview area"
    >
      {/* Subtle Ambient Background Lighting Elements */}
      <div
        className="absolute -top-24 -left-24 w-60 h-60 bg-primary/20 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-75"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-60 h-60 bg-tertiary/15 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-60"
        aria-hidden="true"
      />

      {/* Subtle Pattern Grid Backdrop */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Bar: Brand Badge & Coming Soon Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white tracking-wider">
          <div className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
          <span>{badgeLabel}</span>
        </div>

        <span className="text-[10px] uppercase font-mono tracking-widest text-primary-container bg-primary/20 px-2.5 py-1 rounded-lg backdrop-blur-xs border border-primary/30 font-semibold">
          Coming Soon
        </span>
      </div>

      {/* Center: Branded Platform Tour Preview Placeholder */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-4">
        {videoSrc ? (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="p-4 sm:p-5 rounded-full bg-white/10 hover:bg-primary text-white backdrop-blur-lg border border-white/25 shadow-xl hover:shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 touch-target"
            aria-label="Play NextHire promotional video"
          >
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-0.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center mb-2 text-primary">
            <span className="material-symbols-outlined text-2xl sm:text-3xl" aria-hidden="true">
              smart_display
            </span>
          </div>
        )}

        <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
          {title}
        </h3>
        <p className="mt-1 text-[11px] text-slate-300/90 max-w-xs leading-snug font-body-sm">
          An interactive walkthrough of NextHire&apos;s skill-first matching and verified recruitment workflow.
        </p>
      </div>

      {/* Bottom Bar: Aspect Ratio & Experience Indicator */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2.5">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">
            videocam
          </span>
          High-Definition Video Tour
        </span>
        <span className="font-mono text-[10px] text-slate-400">16:9 HD</span>
      </div>
    </div>
  );
}
