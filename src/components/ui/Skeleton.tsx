import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface-container-high rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

export function JobCardSkeleton() {
  return (
    <div className="surface-card bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-surface-container-high rounded-xl" />
          <div className="space-y-1.5">
            <div className="w-24 h-3 bg-surface-container-high rounded" />
            <div className="w-40 h-4 bg-surface-container-high rounded" />
          </div>
        </div>
        <div className="w-16 h-6 bg-surface-container-high rounded-full" />
      </div>

      <div className="flex gap-2">
        <div className="w-20 h-6 bg-surface-container-high rounded-lg" />
        <div className="w-20 h-6 bg-surface-container-high rounded-lg" />
      </div>

      <div className="space-y-1.5">
        <div className="w-full h-3 bg-surface-container-high rounded" />
        <div className="w-3/4 h-3 bg-surface-container-high rounded" />
      </div>

      <div className="flex gap-1.5 pt-1">
        <div className="w-16 h-5 bg-surface-container-high rounded-md" />
        <div className="w-16 h-5 bg-surface-container-high rounded-md" />
        <div className="w-16 h-5 bg-surface-container-high rounded-md" />
      </div>

      <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center">
        <div className="w-24 h-4 bg-surface-container-high rounded" />
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-surface-container-high rounded-xl" />
          <div className="w-16 h-8 bg-surface-container-high rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-outline-variant/20">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-surface-container-high rounded-full flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="w-32 h-3.5 bg-surface-container-high rounded" />
            <div className="w-24 h-2.5 bg-surface-container-high rounded" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="w-28 h-3.5 bg-surface-container-high rounded" />
      </td>
      <td className="py-4 px-4">
        <div className="w-20 h-3 bg-surface-container-high rounded" />
      </td>
      <td className="py-4 px-4">
        <div className="w-16 h-5 bg-surface-container-high rounded-full" />
      </td>
      <td className="py-4 px-4">
        <div className="w-20 h-6 bg-surface-container-high rounded-full" />
      </td>
      <td className="py-4 px-4">
        <div className="w-16 h-7 bg-surface-container-high rounded-lg" />
      </td>
    </tr>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="surface-card bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="w-24 h-3 bg-surface-container-high rounded" />
        <div className="w-8 h-8 bg-surface-container-high rounded-xl" />
      </div>
      <div className="w-16 h-7 bg-surface-container-high rounded" />
      <div className="w-32 h-2.5 bg-surface-container-high rounded" />
    </div>
  );
}

export function CardSkeleton() {
  return <JobCardSkeleton />;
}
