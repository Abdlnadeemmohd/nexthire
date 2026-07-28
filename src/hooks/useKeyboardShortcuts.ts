"use client";

import { useEffect } from "react";

interface KeyboardShortcutOptions {
  onSearchFocus?: () => void;
  onCopilotOpen?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  onSearchFocus,
  onCopilotOpen,
  onEscape,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus Search with '/' key if not typing in an input
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        onSearchFocus?.();
      }

      // Open AI Copilot with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onCopilotOpen?.();
      }

      // Escape key trigger
      if (e.key === "Escape") {
        onEscape?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchFocus, onCopilotOpen, onEscape]);
}
