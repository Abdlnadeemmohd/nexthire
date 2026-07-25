"use client";

import React, { useState } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "APPLICATION" | "MESSAGE" | "INTERVIEW" | "SYSTEM";
  time: string;
  read: boolean;
  link: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Application Status Update",
    body: "Stellar Systems updated your Senior Product Designer role to 'Interview Round'.",
    type: "APPLICATION",
    time: "10 mins ago",
    read: false,
    link: "/applications",
  },
  {
    id: "n-2",
    title: "New Recruiter Message",
    body: "Sarah Jenkins sent you a meeting link for tomorrow's technical review.",
    type: "MESSAGE",
    time: "45 mins ago",
    read: false,
    link: "/messages",
  },
  {
    id: "n-3",
    title: "Interview Confirmed",
    body: "Google Meet technical interview scheduled for 2:00 PM PST.",
    type: "INTERVIEW",
    time: "2 hours ago",
    read: true,
    link: "/dashboard",
  },
];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) =>
    filter === "UNREAD" ? !n.read : true
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all relative block"
        title="Notifications"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-on-error rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl z-50 overflow-hidden space-y-2 animate-fade-in">
          <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
            <div className="flex items-center gap-2">
              <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="text-[11px] font-label-md text-primary font-bold hover:underline"
            >
              Mark All Read
            </button>
          </div>

          <div className="px-4 pt-1 flex gap-2 border-b border-outline-variant/10 text-[11px] font-label-md">
            <button
              onClick={() => setFilter("ALL")}
              className={`pb-2 border-b-2 font-bold ${
                filter === "ALL"
                  ? "border-primary text-primary"
                  : "border-transparent text-outline"
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setFilter("UNREAD")}
              className={`pb-2 border-b-2 font-bold ${
                filter === "UNREAD"
                  ? "border-primary text-primary"
                  : "border-transparent text-outline"
              }`}
            >
              Unread Only
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-outline space-y-1">
                <span className="material-symbols-outlined text-3xl">notifications_none</span>
                <p>No notifications to display</p>
              </div>
            ) : (
              filtered.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                    );
                    setIsOpen(false);
                  }}
                  className={`p-4 flex items-start gap-3 hover:bg-surface-container/50 transition-colors block ${
                    !item.read ? "bg-primary-container/5" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                      item.type === "APPLICATION"
                        ? "bg-tertiary-container/20 text-tertiary"
                        : item.type === "MESSAGE"
                        ? "bg-primary-container/20 text-primary"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {item.type === "APPLICATION"
                        ? "fact_check"
                        : item.type === "MESSAGE"
                        ? "chat"
                        : "event"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h5 className="font-headline-sm text-xs font-bold text-on-surface truncate">
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-outline">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                      {item.body}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
