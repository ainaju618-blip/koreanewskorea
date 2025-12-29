"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  X,
  MessageSquare,
  FileText,
  AlertCircle,
  Megaphone,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Notification, formatRelativeTime } from "./types";

interface NotificationDropdownProps {
  className?: string;
}

export default function NotificationDropdown({ className = "" }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/reporter/notifications?limit=5");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notification type icon mapping
  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "article_approved":
        return <Check className="w-4 h-4 text-emerald-600" />;
      case "article_rejected":
        return <X className="w-4 h-4 text-red-600" />;
      case "article_assigned":
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      case "article_edited":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "mention":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "system":
        return <Megaphone className="w-4 h-4 text-slate-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  // Notification type background color
  const getBgColor = (type: Notification["type"]) => {
    switch (type) {
      case "article_approved":
        return "bg-emerald-100";
      case "article_rejected":
        return "bg-red-100";
      case "article_assigned":
        return "bg-purple-100";
      case "article_edited":
        return "bg-blue-100";
      case "mention":
        return "bg-blue-100";
      case "system":
        return "bg-slate-100";
      default:
        return "bg-slate-100";
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reporter/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        await fetch("/api/reporter/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notif.id] }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    }
    setIsOpen(false);
  };

  const getNotificationLink = (notif: Notification) => {
    if (notif.article_id) {
      return `/reporter/edit/${notif.article_id}`;
    }
    return "/reporter/notifications";
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline disabled:opacity-50"
              >
                {isLoading ? "..." : "Mark all read"}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={getNotificationLink(notif)}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                    !notif.is_read ? "bg-blue-50/50" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(
                      notif.type
                    )}`}
                  >
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-400">
                        {formatRelativeTime(notif.created_at)}
                      </p>
                      {notif.actor_name && (
                        <span className="text-xs text-slate-400">
                          by {notif.actor_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <Link
              href="/reporter/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
