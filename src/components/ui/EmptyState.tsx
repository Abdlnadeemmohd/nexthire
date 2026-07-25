import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "search_off",
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center space-y-4 border border-outline-variant/20 max-w-lg mx-auto my-8">
      <div className="w-16 h-16 bg-primary-container/10 text-primary rounded-full flex items-center justify-center mx-auto text-3xl">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-xl font-bold text-on-surface">
        {title}
      </h3>
      <p className="text-on-surface-variant text-xs font-body-sm leading-relaxed max-w-sm mx-auto">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-primary text-on-primary font-label-md font-bold text-xs rounded-full hover:bg-primary-container transition-all shadow-md mt-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
