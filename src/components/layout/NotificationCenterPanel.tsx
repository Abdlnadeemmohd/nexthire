"use client";

import React, { useState, useEffect } from "react";
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
  time: string;
  read: boolean;
  createdAt: string;
  link: string;
}

export function NotificationCenterPanel({ isOpen: externalIsOpen, onClose, onCountChange }: NotificationCenterPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "recruitment" | "system">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
      // Graceful fallback
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
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

  // Filter based on active tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "recruitment") return n.type === "APPLICATION_STATUS" || n.type === "INTERVIEW" || n.type === "OFFER";
    if (activeTab === "system") return n.type === "SYSTEM";
    return true;
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
      />

      {/* Panel Container */}
      <div className="fixed sm:absolute right-0 sm:right-4 top-16 sm:top-14 w-full sm:w-[420px] max-h-[85vh] bg-surface-container-lowest border-0 sm:border border-outline-variant/30 rounded-none sm:rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/50">
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
              className="p-1 text-on-surface-variant hover:bg-surface-container rounded-lg"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-2 bg-surface-container-lowest border-b border-outline-variant/15 text-xs font-label-md">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "all"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "unread"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab("recruitment")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "recruitment"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            Recruitment
          </button>
          <button
            onClick={() => setActiveTab("system")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "system"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            System
          </button>
        </div>

        {/* Notification Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <span className="material-symbols-outlined text-outline text-3xl">notifications_off</span>
              <p className="text-xs text-on-surface-variant font-label-md">No notifications found in this view.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? "bg-transparent opacity-75 hover:opacity-100 hover:bg-surface-container-low"
                    : "bg-primary-container/10 border border-primary/20"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    notif.type === "APPLICATION_STATUS" || notif.type === "INTERVIEW"
                      ? "bg-amber-500/15 text-amber-600"
                      : notif.type === "SYSTEM"
                      ? "bg-purple-500/15 text-purple-600"
                      : "bg-primary-container text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {notif.type === "APPLICATION_STATUS"
                      ? "assignment_ind"
                      : notif.type === "SYSTEM"
                      ? "shield"
                      : notif.type === "MESSAGE"
                      ? "chat"
                      : "event"}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-headline-sm text-xs font-bold text-on-surface truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-outline flex-shrink-0 font-label-md">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {notif.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant/20 flex items-center justify-between text-xs bg-surface-container-low/50">
          <span className="text-[10px] text-outline font-label-md">
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
