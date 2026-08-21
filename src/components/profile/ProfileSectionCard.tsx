"use client";

import React from "react";

interface ProfileSectionCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon: string;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ProfileSectionCard({
  id,
  title,
  subtitle,
  icon,
  actionButton,
  children,
  isEmpty = false,
  emptyMessage = "No records added yet.",
  className = "",
}: ProfileSectionCardProps) {
  return (
    <section
      id={id}
      className={`glass-card rounded-3xl p-6 sm:p-8 border border-outline-variant/20 space-y-6 shadow-xs transition-all hover:border-outline-variant/40 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20">
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-on-surface-variant font-body-md pt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actionButton && (
          <div className="self-start sm:self-auto flex items-center gap-2">
            {actionButton}
          </div>
        )}
      </div>

      {/* Body Content */}
      <div>
        {isEmpty ? (
          <div className="py-8 text-center bg-surface-container-lowest/50 rounded-2xl border border-dashed border-outline-variant/30 space-y-2">
            <span className="material-symbols-outlined text-3xl text-outline/60 block">
              {icon}
            </span>
            <p className="text-xs text-on-surface-variant font-medium">
              {emptyMessage}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
