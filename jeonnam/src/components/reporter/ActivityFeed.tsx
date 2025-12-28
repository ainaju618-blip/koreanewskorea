"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Edit3,
  Save,
  Send,
  CheckCircle,
  Globe,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { ActivityLog, formatRelativeTime } from "./types";

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
}

export default function ActivityFeed({
  className = "",
  maxItems = 5,
  showHeader = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reporter/activity?limit=${maxItems + 5}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Activity fetch error:', err);
      setError('Failed to load activities');
      setActivities([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchActivities(false);
  };

  // Action to icon mapping
  const getActionIcon = (action: ActivityLog["action"]) => {
    switch (action) {
      case "article_created":
        return <Edit3 className="w-3.5 h-3.5 text-slate-600" />;
      case "article_saved":
        return <Save className="w-3.5 h-3.5 text-blue-600" />;
      case "article_submitted":
        return <Send className="w-3.5 h-3.5 text-purple-600" />;
      case "article_approved":
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case "article_published":
        return <Globe className="w-3.5 h-3.5 text-indigo-600" />;
      case "article_rejected":
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Edit3 className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  // Action to background color mapping
  const getActionColor = (action: ActivityLog["action"]) => {
    switch (action) {
      case "article_created":
        return "bg-slate-100";
      case "article_saved":
        return "bg-blue-100";
      case "article_submitted":
        return "bg-purple-100";
      case "article_approved":
        return "bg-emerald-100";
      case "article_published":
        return "bg-indigo-100";
      case "article_rejected":
        return "bg-red-100";
      default:
        return "bg-slate-100";
    }
  };

  // Action to text mapping
  const getActionText = (action: ActivityLog["action"]) => {
    switch (action) {
      case "article_created":
        return "기사 작성 시작";
      case "article_saved":
        return "임시저장 완료";
      case "article_submitted":
        return "승인 요청 제출";
      case "article_approved":
        return "기사 승인됨";
      case "article_published":
        return "사이트 게시됨";
      case "article_rejected":
        return "기사 반려됨";
      default:
        return "활동";
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        {showHeader && (
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">최근 활동</h3>
          </div>
        )}
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">최근 활동</h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      {/* Activity List */}
      <div className="p-5 flex-1 overflow-y-auto">
        {error ? (
          <div className="py-8 text-center text-red-400">
            <XCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Edit3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>아직 활동이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-5">
            {activities.slice(0, maxItems).map((activity, index) => (
              <div key={activity.id} className="relative flex gap-4">
                {/* Connector Line */}
                {index !== Math.min(maxItems, activities.length) - 1 && (
                  <div className="absolute left-[14px] top-8 bottom-[-20px] w-0.5 bg-slate-100" />
                )}

                {/* Icon */}
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(
                    activity.action
                  )}`}
                >
                  {getActionIcon(activity.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {getActionText(activity.action)}
                    </p>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                  {activity.entity_name && (
                    <p className="text-sm text-slate-600 mt-1 truncate">
                      &quot;{activity.entity_name}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <Link
          href="/reporter/articles"
          className="block w-full py-2.5 text-center text-sm font-medium text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          전체 활동 보기
        </Link>
      </div>
    </div>
  );
}
