"use client";

import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-on-surface/40 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-[95vw] sm:max-w-lg md:max-w-xl w-full max-h-[90vh] flex flex-col p-4 sm:p-6 space-y-4 shadow-2xl relative">
        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20 flex-shrink-0">
          <h3 id="modal-headline" className="font-headline-sm text-base sm:text-lg font-bold text-on-surface truncate pr-2">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full touch-target flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-5rem)] flex-1 pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
