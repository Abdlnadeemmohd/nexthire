import React from "react";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon = "search_off",
  title,
  description,
  actionText,
  onAction,
  actionHref,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`surface-card bg-surface-container-lowest rounded-2xl p-8 sm:p-12 text-center space-y-4 border border-outline-variant/40 max-w-lg mx-auto my-6 shadow-xs ${className}`}
    >
      <div className="w-14 h-14 bg-surface-container-low text-primary rounded-2xl flex items-center justify-center mx-auto text-2xl border border-outline-variant/30">
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="space-y-1.5">
        <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
          {title}
        </h3>
        <p className="text-on-surface-variant text-xs font-body-sm leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>
      {actionText && (
        <div className="pt-2">
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-xl hover:bg-primary-hover transition-all shadow-xs touch-target focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {actionText}
            </a>
          ) : onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-xl hover:bg-primary-hover transition-all shadow-xs touch-target focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {actionText}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
