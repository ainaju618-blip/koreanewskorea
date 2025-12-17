"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  X,
  MessageSquare,
  FileText,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import { Notification, formatRelativeTime } from "./types";

interface NotificationDropdownProps {
  className?: string;
}

// Mock notifications - replace with real API call
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    user_id: "u1",
    type: "approval",
    title: "기사 승인됨",
    message: '"나주시 2025년 예산안 발표" 기사가 게시되었습니다.',
    link: "/reporter/articles",
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "2",
    user_id: "u1",
    type: "comment",
    title: "에디터 코멘트",
    message: '"제목을 더 간결하게 수정해주세요"',
    link: "/reporter/articles",
    is_read: false,
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: "3",
    user_id: "u1",
    type: "press_release",
    title: "새 보도자료 3건",
    message: "광주시, 전남도에서 새 보도자료가 도착했습니다.",
    link: "/reporter/press-releases",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
  },
  {
    id: "4",
    user_id: "u1",
    type: "rejection",
    title: "기사 반려",
    message: '"교통 정책" 기사가 반려되었습니다. 사유를 확인하세요.',
    link: "/reporter/articles",
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
  },
];

export default function NotificationDropdown({ className = "" }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
      case "approval":
        return <Check className="w-4 h-4 text-emerald-600" />;
      case "rejection":
        return <X className="w-4 h-4 text-red-600" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "press_release":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "system":
        return <Megaphone className="w-4 h-4 text-slate-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  // Notification type background color
  const getBgColor = (type: Notification["type"]) => {
    switch (type) {
      case "approval":
        return "bg-emerald-100";
      case "rejection":
        return "bg-red-100";
      case "comment":
        return "bg-blue-100";
      case "press_release":
        return "bg-purple-100";
      case "system":
        return "bg-slate-100";
      default:
        return "bg-slate-100";
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
  };

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setIsOpen(false);
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
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">알림</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>새 알림이 없습니다</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link || "/reporter"}
                  onClick={() => handleNotificationClick(notif.id)}
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
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatRelativeTime(notif.created_at)}
                    </p>
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
              전체 알림 보기 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
