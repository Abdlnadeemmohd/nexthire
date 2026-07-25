"use client";

import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
