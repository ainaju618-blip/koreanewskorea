"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  X,
  MessageSquare,
  FileText,
  AlertCircle,
  Megaphone,
  Loader2,
  CheckCheck,
  Trash2,
  Filter,
} from "lucide-react";

interface Notification {
  id: string;
  type: "approval" | "rejection" | "comment" | "press_release" | "system";
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// Mock notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "approval",
    title: "기사 승인됨",
    message: '"나주시 2025년 예산안 발표" 기사가 게시되었습니다. 독자들에게 전달됩니다.',
    link: "/reporter/articles",
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "2",
    type: "comment",
    title: "에디터 코멘트",
    message: '"제목을 더 간결하게 수정해주세요. 현재 제목이 너무 길어 독자들의 주목을 끌기 어렵습니다."',
    link: "/reporter/articles",
    is_read: false,
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: "3",
    type: "press_release",
    title: "새 보도자료 3건",
    message: "광주시, 전남도에서 새 보도자료가 도착했습니다. 확인하시고 기사로 작성해주세요.",
    link: "/reporter/press-releases",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
  },
  {
    id: "4",
    type: "rejection",
    title: "기사 반려",
    message: '"교통 정책 기사"가 반려되었습니다. 사유: 출처 명시 필요. 수정 후 다시 제출해주세요.',
    link: "/reporter/articles",
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
  },
  {
    id: "5",
    type: "system",
    title: "시스템 공지",
    message: "Reporter Portal v2.0이 배포되었습니다. 새로운 기능들을 확인해보세요!",
    is_read: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: "6",
    type: "approval",
    title: "기사 승인됨",
    message: '"전남도 AI 산업단지 계획" 기사가 게시되었습니다.',
    link: "/reporter/articles",
    is_read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
  },
];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setNotifications(MOCK_NOTIFICATIONS);
      setIsLoading(false);
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "approval":
        return <Check className="w-5 h-5 text-emerald-600" />;
      case "rejection":
        return <X className="w-5 h-5 text-red-600" />;
      case "comment":
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case "press_release":
        return <FileText className="w-5 h-5 text-purple-600" />;
      case "system":
        return <Megaphone className="w-5 h-5 text-slate-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-600" />;
    }
  };

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

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => !n.is_read);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-500 text-sm">알림을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">알림</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            기사 승인, 코멘트, 보도자료 등 중요한 알림을 확인하세요.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <CheckCheck className="w-4 h-4" />
            모두 읽음 처리
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          전체 ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === "unread"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          읽지 않음 ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">
              {filter === "unread" ? "읽지 않은 알림이 없습니다" : "알림이 없습니다"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex gap-4 p-5 hover:bg-slate-50 transition-colors ${
                  !notif.is_read ? "bg-blue-50/40" : ""
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(
                    notif.type
                  )}`}
                >
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{notif.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatRelativeTime(notif.created_at)}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notif.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3">
                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        자세히 보기 →
                      </Link>
                    )}
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-sm text-slate-500 hover:text-slate-700"
                      >
                        읽음 처리
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="text-sm text-slate-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
