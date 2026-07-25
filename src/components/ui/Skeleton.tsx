import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface-container-high rounded-xl ${className}`}
    ></div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container-high rounded-full"></div>
          <div className="space-y-1">
            <div className="w-28 h-3 bg-surface-container-high rounded"></div>
            <div className="w-20 h-2.5 bg-surface-container-high rounded"></div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="w-24 h-3 bg-surface-container-high rounded"></div>
      </td>
      <td className="py-4 px-4">
        <div className="w-16 h-3 bg-surface-container-high rounded"></div>
      </td>
      <td className="py-4 px-4">
        <div className="w-16 h-5 bg-surface-container-high rounded-full"></div>
      </td>
      <td className="py-4 px-4">
        <div className="w-20 h-6 bg-surface-container-high rounded-full"></div>
      </td>
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-surface-container-high rounded-xl"></div>
        <div className="w-16 h-5 bg-surface-container-high rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="w-3/4 h-4 bg-surface-container-high rounded"></div>
        <div className="w-1/2 h-3 bg-surface-container-high rounded"></div>
      </div>
      <div className="w-full h-10 bg-surface-container-high rounded-full"></div>
    </div>
  );
}
