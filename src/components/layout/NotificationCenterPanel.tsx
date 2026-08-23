"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface NotificationCenterPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCountChange?: (count: number) => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  category: "APPLICATIONS" | "MESSAGES" | "INTERVIEWS" | "JOBS" | "TALENT_INTELLIGENCE" | "BILLING" | "SECURITY" | "SYSTEM" | string;
  priority: "CRITICAL" | "IMPORTANT" | "NORMAL" | "INFORMATIONAL" | string;
  time: string;
  read: boolean;
  createdAt: string;
  link?: string;
  ctaText?: string;
  ctaUrl?: string;
  emailStatus?: string;
  metadata?: any;
}

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "APPLICATIONS", label: "Apps" },
  { id: "TALENT_INTELLIGENCE", label: "Talent Radar" },
  { id: "INTERVIEWS", label: "Interviews" },
  { id: "MESSAGES", label: "Messages" },
  { id: "JOBS", label: "Jobs" },
  { id: "BILLING", label: "Billing" },
  { id: "SYSTEM", label: "System" },
];

export function NotificationCenterPanel({
  isOpen: externalIsOpen,
  onClose,
  onCountChange,
}: NotificationCenterPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
          const unread = data.unreadCount || 0;
          setUnreadCount(unread);
          if (onCountChange) onCountChange(unread);
        }
      }
    } catch {
      // Silent error fallback
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  const isControlled = typeof externalIsOpen !== "undefined";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    if (onCountChange) onCountChange(0);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      showToast("All notifications marked as read", "success");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    if (onCountChange) onCountChange(Math.max(0, unreadCount - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    if (onCountChange) onCountChange(0);
    await markAllAsRead();
    showToast("Cleared notification history", "info");
  };

  // Filter based on selected category and unread toggle
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (unreadOnly && n.read) return false;
      if (activeCategory === "ALL") return true;
      return n.category === activeCategory;
    });
  }, [notifications, activeCategory, unreadOnly]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="px-2 py-0.5 bg-error/15 text-error text-[10px] font-bold uppercase tracking-wider rounded-md border border-error/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
            Critical
          </span>
        );
      case "IMPORTANT":
        return (
          <span className="px-2 py-0.5 bg-amber-500/15 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-500/30">
            Important
          </span>
        );
      case "INFORMATIONAL":
        return (
          <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] font-medium uppercase tracking-wider rounded-md">
            Info
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string, type: string) => {
    switch (category) {
      case "TALENT_INTELLIGENCE":
        return "radar";
      case "APPLICATIONS":
        return "assignment_ind";
      case "INTERVIEWS":
        return "event";
      case "MESSAGES":
        return "chat";
      case "JOBS":
        return "work";
      case "BILLING":
        return "credit_card";
      case "SECURITY":
        return "shield";
      default:
        return "notifications";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
      />

      {/* Panel Container */}
      <div className="fixed sm:absolute right-0 sm:right-4 top-16 sm:top-14 w-full sm:w-[460px] max-h-[85vh] bg-surface-container-lowest border-0 sm:border border-outline-variant/30 rounded-none sm:rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">notifications</span>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface">
              Notification Centre
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-label-md font-bold text-primary hover:underline px-2 py-1"
                title="Mark all notifications as read"
              >
                Mark Read
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1 text-on-surface-variant hover:bg-surface-container rounded-lg"
              aria-label="Close notification panel"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-2 bg-surface-container-lowest border-b border-outline-variant/15 flex flex-col gap-2">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-xs font-label-md">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all text-xs ${
                  activeCategory === cat.id
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Subfilter: Unread Toggle */}
          <div className="flex items-center justify-between px-1 text-[11px] font-label-md text-on-surface-variant">
            <span>
              Showing {filteredNotifications.length} notification{filteredNotifications.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                unreadOnly
                  ? "bg-primary-container/20 text-primary font-bold"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              {unreadOnly ? "✓ Unread Only" : "Filter: All"}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[500px]">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <span className="material-symbols-outlined text-outline text-3xl">notifications_off</span>
              <p className="text-xs text-on-surface-variant font-label-md">
                No notifications in this view.
              </p>
              {activeCategory !== "ALL" && (
                <button
                  onClick={() => setActiveCategory("ALL")}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3.5 rounded-2xl transition-all border flex flex-col gap-2 ${
                  notif.read
                    ? "bg-surface-container-lowest/70 border-outline-variant/10 opacity-80 hover:opacity-100 hover:bg-surface-container-low"
                    : "bg-surface-container-lowest border-primary/25 shadow-xs ring-1 ring-primary/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${
                      notif.priority === "CRITICAL"
                        ? "bg-error/15 text-error"
                        : notif.category === "TALENT_INTELLIGENCE"
                        ? "bg-tertiary-container/30 text-tertiary"
                        : notif.category === "INTERVIEWS"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-primary-container/20 text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {getCategoryIcon(notif.category, notif.type)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-headline-sm text-xs font-bold text-on-surface truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-outline flex-shrink-0 font-label-md">
                        {notif.time}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed mb-2">
                      {notif.body}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline-variant/10">
                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(notif.priority)}
                        <span className="text-[10px] font-mono text-outline uppercase">
                          {notif.category.replace("_", " ")}
                        </span>
                      </div>

                      {/* Smart Contextual CTA */}
                      {(notif.ctaUrl || notif.link) && (
                        <Link
                          href={notif.ctaUrl || notif.link || "#"}
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                            handleClose();
                          }}
                          className="px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                        >
                          <span>{notif.ctaText || "View Details"}</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant/20 flex items-center justify-between text-xs bg-surface-container-low/60">
          <Link
            href="/settings"
            onClick={handleClose}
            className="text-[11px] font-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Preferences
          </Link>
          <button
            onClick={clearAll}
            className="text-[11px] font-label-md text-error hover:underline font-bold"
          >
            Clear History
          </button>
        </div>
      </div>
    </>
  );
}
