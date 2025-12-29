"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    UserPlus,
    RefreshCw,
} from "lucide-react";

interface Notification {
    id: string;
    type: "article_approved" | "article_rejected" | "article_assigned" | "article_edited" | "mention" | "system";
    title: string;
    message: string | null;
    article_id: string | null;
    actor_name: string | null;
    is_read: boolean;
    created_at: string;
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
    });
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = filter === "unread"
                ? "/api/reporter/notifications?unread=true"
                : "/api/reporter/notifications";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "article_approved":
                return <Check className="w-5 h-5 text-emerald-600" />;
            case "article_rejected":
                return <X className="w-5 h-5 text-red-600" />;
            case "article_assigned":
                return <UserPlus className="w-5 h-5 text-purple-600" />;
            case "article_edited":
                return <FileText className="w-5 h-5 text-blue-600" />;
            case "mention":
                return <MessageSquare className="w-5 h-5 text-blue-600" />;
            case "system":
                return <Megaphone className="w-5 h-5 text-slate-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-slate-600" />;
        }
    };

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

    const handleMarkAsRead = async (id: string) => {
        try {
            await fetch("/api/reporter/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [id] }),
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch("/api/reporter/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const getArticleLink = (notif: Notification) => {
        if (notif.article_id) {
            return `/reporter/edit/${notif.article_id}`;
        }
        return "/reporter/articles";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-slate-500 text-sm">Loading notifications...</p>
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
                        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1">
                        Article approvals, assignments, and important updates
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchNotifications}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === "all"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter("unread")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === "unread"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {/* Notification List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="py-16 text-center">
                        <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">
                            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`flex gap-4 p-5 hover:bg-slate-50 transition-colors ${!notif.is_read ? "bg-blue-50/40" : ""
                                    }`}
                            >
                                {/* Icon */}
                                <div
                                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(notif.type)}`}
                                >
                                    {getIcon(notif.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-slate-900">{notif.title}</p>
                                            {notif.message && (
                                                <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
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

                                        {/* Unread Indicator */}
                                        {!notif.is_read && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 mt-3">
                                        {notif.article_id && (
                                            <Link
                                                href={getArticleLink(notif)}
                                                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                            >
                                                View article
                                            </Link>
                                        )}
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="text-sm text-slate-500 hover:text-slate-700"
                                            >
                                                Mark as read
                                            </button>
                                        )}
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
