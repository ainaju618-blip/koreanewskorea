"use client";

import React from "react";
import { AlertTriangle, XCircle, Clock, Bell, X } from "lucide-react";

export interface Alert {
    id: string;
    type: "error" | "warning" | "info";
    title: string;
    message: string;
    region?: string;
    timestamp: string;
}

export interface AlertBannerProps {
    alerts: Alert[];
    onDismiss?: (alertId: string) => void;
    onDismissAll?: () => void;
}

function getAlertStyles(type: Alert["type"]) {
    switch (type) {
        case "error":
            return {
                bg: "bg-red-50",
                border: "border-red-200",
                icon: XCircle,
                iconColor: "text-red-600",
                titleColor: "text-red-800",
                textColor: "text-red-700"
            };
        case "warning":
            return {
                bg: "bg-amber-50",
                border: "border-amber-200",
                icon: AlertTriangle,
                iconColor: "text-amber-600",
                titleColor: "text-amber-800",
                textColor: "text-amber-700"
            };
        default:
            return {
                bg: "bg-blue-50",
                border: "border-blue-200",
                icon: Bell,
                iconColor: "text-blue-600",
                titleColor: "text-blue-800",
                textColor: "text-blue-700"
            };
    }
}

function formatTimeAgo(timestamp: string): string {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.floor(diffHours / 24)}일 전`;
}

export function AlertBanner({ alerts, onDismiss, onDismissAll }: AlertBannerProps) {
    if (!alerts || alerts.length === 0) {
        return null;
    }

    const errorCount = alerts.filter(a => a.type === "error").length;
    const warningCount = alerts.filter(a => a.type === "warning").length;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">알림</h3>
                    <div className="flex items-center gap-2 text-xs">
                        {errorCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                오류 {errorCount}
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                경고 {warningCount}
                            </span>
                        )}
                    </div>
                </div>
                {onDismissAll && alerts.length > 1 && (
                    <button
                        onClick={onDismissAll}
                        className="text-xs text-gray-500 hover:text-gray-700 transition"
                    >
                        모두 지우기
                    </button>
                )}
            </div>

            {/* Alert List */}
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {alerts.map(alert => {
                    const styles = getAlertStyles(alert.type);
                    const Icon = styles.icon;

                    return (
                        <div
                            key={alert.id}
                            className={`p-3 flex items-start gap-3 ${styles.bg}`}
                        >
                            <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium text-sm ${styles.titleColor}`}>
                                        {alert.title}
                                    </span>
                                    {alert.region && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/50 text-gray-600">
                                            {alert.region}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs ${styles.textColor} mt-0.5`}>
                                    {alert.message}
                                </p>
                                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeAgo(alert.timestamp)}
                                </span>
                            </div>
                            {onDismiss && (
                                <button
                                    onClick={() => onDismiss(alert.id)}
                                    className="text-gray-400 hover:text-gray-600 transition p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AlertBanner;
