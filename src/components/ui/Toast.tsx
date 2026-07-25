"use client";

import React, { createContext, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  title: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-label-md font-bold text-white transition-all animate-bounce ${
              toast.type === "success"
                ? "bg-tertiary"
                : toast.type === "error"
                ? "bg-error"
                : "bg-primary"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {toast.type === "success"
                ? "check_circle"
                : toast.type === "error"
                ? "error"
                : "info"}
            </span>
            <span>{toast.title}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (title: string) => console.log("Toast:", title),
    };
  }
  return context;
}
