"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    History,
    Check,
    X,
    Edit,
    UserPlus,
    RefreshCw,
    Loader2,
    ChevronDown,
    ChevronUp,
    Clock,
} from "lucide-react";

interface HistoryEntry {
    id: string;
    article_id: string;
    editor_id: string;
    editor_name: string;
    action: "created" | "edited" | "approved" | "rejected" | "assigned" | "status_changed";
    previous_title?: string;
    previous_content?: string;
    previous_status?: string;
    new_title?: string;
    new_content?: string;
    new_status?: string;
    change_summary?: string;
    created_at: string;
}

interface ArticleHistoryProps {
    articleId: string;
    className?: string;
}

export default function ArticleHistory({ articleId, className = "" }: ArticleHistoryProps) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/reporter/articles/${articleId}/history`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setIsLoading(false);
        }
    }, [articleId]);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, fetchHistory]);

    const getActionIcon = (action: HistoryEntry["action"]) => {
        switch (action) {
            case "created":
                return <Edit className="w-4 h-4 text-blue-600" />;
            case "edited":
                return <Edit className="w-4 h-4 text-amber-600" />;
            case "approved":
                return <Check className="w-4 h-4 text-emerald-600" />;
            case "rejected":
                return <X className="w-4 h-4 text-red-600" />;
            case "assigned":
                return <UserPlus className="w-4 h-4 text-purple-600" />;
            case "status_changed":
                return <RefreshCw className="w-4 h-4 text-slate-600" />;
            default:
                return <History className="w-4 h-4 text-slate-600" />;
        }
    };

    const getActionBgColor = (action: HistoryEntry["action"]) => {
        switch (action) {
            case "created":
                return "bg-blue-100";
            case "edited":
                return "bg-amber-100";
            case "approved":
                return "bg-emerald-100";
            case "rejected":
                return "bg-red-100";
            case "assigned":
                return "bg-purple-100";
            case "status_changed":
                return "bg-slate-100";
            default:
                return "bg-slate-100";
        }
    };

    const getActionLabel = (action: HistoryEntry["action"]) => {
        switch (action) {
            case "created":
                return "Created";
            case "edited":
                return "Edited";
            case "approved":
                return "Approved";
            case "rejected":
                return "Rejected";
            case "assigned":
                return "Assigned";
            case "status_changed":
                return "Status Changed";
            default:
                return action;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className={`${className}`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-medium text-sm w-full justify-between"
            >
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>Edit History</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            {/* History Panel */}
            {isOpen && (
                <div className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No edit history</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {history.map((entry) => (
                                <div key={entry.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionBgColor(
                                                entry.action
                                            )}`}
                                        >
                                            {getActionIcon(entry.action)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-slate-900">
                                                    {entry.editor_name}
                                                </span>
                                                <span className="text-sm text-slate-500">
                                                    {getActionLabel(entry.action)}
                                                </span>
                                            </div>
                                            {entry.change_summary && (
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {entry.change_summary}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <p className="text-xs text-slate-400">
                                                    {formatDate(entry.created_at)}
                                                </p>
                                            </div>

                                            {/* Expandable details for edits */}
                                            {entry.action === "edited" && (entry.previous_title || entry.new_title) && (
                                                <button
                                                    onClick={() =>
                                                        setExpandedEntry(
                                                            expandedEntry === entry.id ? null : entry.id
                                                        )
                                                    }
                                                    className="text-xs text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-1"
                                                >
                                                    {expandedEntry === entry.id ? "Hide" : "Show"} details
                                                    {expandedEntry === entry.id ? (
                                                        <ChevronUp className="w-3 h-3" />
                                                    ) : (
                                                        <ChevronDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            )}

                                            {expandedEntry === entry.id && (
                                                <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs space-y-2">
                                                    {entry.previous_title !== entry.new_title && (
                                                        <div>
                                                            <span className="font-medium text-slate-500">Title:</span>
                                                            <p className="line-through text-red-500">{entry.previous_title}</p>
                                                            <p className="text-emerald-600">{entry.new_title}</p>
                                                        </div>
                                                    )}
                                                    {entry.previous_status !== entry.new_status && (
                                                        <div>
                                                            <span className="font-medium text-slate-500">Status:</span>
                                                            <span className="ml-1 line-through text-red-500">{entry.previous_status}</span>
                                                            <span className="mx-1">→</span>
                                                            <span className="text-emerald-600">{entry.new_status}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
