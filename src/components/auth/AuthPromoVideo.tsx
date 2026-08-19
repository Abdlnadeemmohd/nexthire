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
  title = "NextHire Platform Overview",
  badgeLabel = "NEXT HIRE",
}: AuthPromoVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // If a video URL is provided in the future, render the HTML5 video player
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
      aria-label="NextHire promotional video player area"
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

      {/* Top Bar: Brand Badge & Status Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white tracking-wider">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          <span>{badgeLabel}</span>
        </div>

        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400/80 px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-xs border border-white/5">
          Video Feature
        </span>
      </div>

      {/* Center: Interactive Play Icon Placeholder */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
        <button
          type="button"
          onClick={() => {
            if (videoSrc) setIsPlaying(true);
          }}
          className="relative group/btn p-4 sm:p-5 rounded-full bg-white/10 hover:bg-primary text-white backdrop-blur-lg border border-white/25 shadow-xl hover:shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-950 touch-target"
          aria-label="Play NextHire platform promotional video"
        >
          {/* Subtle pulse ring */}
          <span
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75 group-hover/btn:opacity-100"
            aria-hidden="true"
          />
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-0.5 relative z-10"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <p className="mt-3 text-xs sm:text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
          {title}
        </p>
      </div>

      {/* Bottom Bar: Aspect Ratio / Future Replacement Hint */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2.5">
        <span className="flex items-center gap-1.5 font-medium">
          <svg className="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Interactive Platform Tour
        </span>
        <span className="font-mono text-[10px] text-slate-500">16:9 HD</span>
      </div>
    </div>
  );
}
