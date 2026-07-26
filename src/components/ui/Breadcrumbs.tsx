"use client";

import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-xs text-outline font-medium py-1 overflow-x-auto" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span className="material-symbols-outlined text-xs text-outline-variant/60">chevron_right</span>
            )}
            {isLast || !item.href ? (
              <span className="text-on-surface font-bold truncate max-w-xs">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
              >
                {idx === 0 && <span className="material-symbols-outlined text-xs">home</span>}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
