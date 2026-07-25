"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface NotificationCenterPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: "recruitment" | "system" | "application";
  read: boolean;
  targetRole?: "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Application Status Update",
    message: "Stripe moved your application for Senior Full-Stack Engineer to Technical Interview phase.",
    timestamp: "10m ago",
    category: "application",
    read: false,
    targetRole: "JOB_SEEKER",
  },
  {
    id: "n-2",
    title: "New Candidate Application",
    message: "Sarah Jenkins applied for Lead DevOps Engineer at Vercel.",
    timestamp: "1h ago",
    category: "recruitment",
    read: false,
    targetRole: "RECRUITER",
  },
  {
    id: "n-3",
    title: "Platform Moderation Flagged",
    message: "A new company profile 'Apex Labs' requires verification approval.",
    timestamp: "3h ago",
    category: "system",
    read: false,
    targetRole: "PLATFORM_ADMIN",
  },
  {
    id: "n-4",
    title: "AI Skill Match High Confidence",
    message: "Your resume matches 94% with Staff Frontend Engineer at Linear.",
    timestamp: "1d ago",
    category: "application",
    read: true,
    targetRole: "JOB_SEEKER",
  },
];

export function NotificationCenterPanel({ isOpen: externalIsOpen, onClose }: NotificationCenterPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "recruitment" | "system">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexthire_notifications");
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
  }, []);

  const persistNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    try {
      localStorage.setItem("nexthire_notifications", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const isControlled = typeof externalIsOpen !== "undefined";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    persistNotifications(updated);
    showToast("All notifications marked as read", "success");
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    persistNotifications(updated);
  };

  const clearAll = () => {
    persistNotifications([]);
    showToast("Cleared notification history", "info");
  };

  // Filter based on active tab and user role context
  const filteredNotifications = notifications.filter((n) => {
    if (user?.role && n.targetRole && n.targetRole !== user.role) return false;

    if (activeTab === "unread") return !n.read;
    if (activeTab === "recruitment") return n.category === "recruitment" || n.category === "application";
    if (activeTab === "system") return n.category === "system";
    return true;
  });

  const unreadCount = notifications.filter((n) => (!n.targetRole || n.targetRole === user?.role) && !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
      />

      {/* Panel Container */}
      <div className="fixed sm:absolute right-0 sm:right-4 top-16 sm:top-14 w-full sm:w-[420px] max-h-[85vh] bg-surface-container-lowest dark:bg-slate-900 border-0 sm:border border-outline-variant/30 dark:border-slate-800 rounded-none sm:rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20 dark:border-slate-800 flex items-center justify-between bg-surface-container-low/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">notifications</span>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface dark:text-slate-100">
              Notification Centre
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-label-md font-bold text-primary hover:underline px-2 py-1"
              title="Mark all as read"
            >
              Mark Read
            </button>
            <button
              onClick={handleClose}
              className="p-1 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 rounded-lg"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-2 bg-surface-container-lowest dark:bg-slate-900 border-b border-outline-variant/15 dark:border-slate-800 text-xs font-label-md">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "all"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "unread"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab("recruitment")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "recruitment"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800"
            }`}
          >
            Recruitment
          </button>
          <button
            onClick={() => setActiveTab("system")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "system"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800"
            }`}
          >
            System
          </button>
        </div>

        {/* Notification Cards List */}
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/15 dark:divide-slate-800 p-2 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <span className="material-symbols-outlined text-outline dark:text-slate-500 text-3xl">notifications_off</span>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 font-label-md">No notifications found in this view.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? "bg-transparent opacity-75 hover:opacity-100 hover:bg-surface-container-low dark:hover:bg-slate-800/60"
                    : "bg-primary-container/10 dark:bg-slate-800/80 border border-primary/20 dark:border-slate-700"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    notif.category === "recruitment"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : notif.category === "system"
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                      : "bg-primary-container text-primary dark:text-slate-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {notif.category === "recruitment" ? "work" : notif.category === "system" ? "shield" : "assignment_ind"}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-headline-sm text-xs font-bold text-on-surface dark:text-slate-100 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-outline dark:text-slate-400 flex-shrink-0 font-label-md">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant/20 dark:border-slate-800 flex items-center justify-between text-xs bg-surface-container-low/50 dark:bg-slate-800/50">
          <span className="text-[10px] text-outline dark:text-slate-400 font-label-md">
            Showing {filteredNotifications.length} items
          </span>
          <button
            onClick={clearAll}
            className="text-[11px] font-label-md text-error hover:underline font-bold"
          >
            Clear All History
          </button>
        </div>
      </div>
    </>
  );
}
