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
                bg: "bg-red-900/30",
                border: "border-red-800/50",
                icon: XCircle,
                iconColor: "text-red-400",
                titleColor: "text-red-300",
                textColor: "text-red-400/80"
            };
        case "warning":
            return {
                bg: "bg-amber-900/30",
                border: "border-amber-800/50",
                icon: AlertTriangle,
                iconColor: "text-amber-400",
                titleColor: "text-amber-300",
                textColor: "text-amber-400/80"
            };
        default:
            return {
                bg: "bg-blue-900/30",
                border: "border-blue-800/50",
                icon: Bell,
                iconColor: "text-blue-400",
                titleColor: "text-blue-300",
                textColor: "text-blue-400/80"
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
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-[#21262d] bg-[#0d1117]/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-[#8b949e]" />
                    <h3 className="font-semibold text-[#e6edf3]">알림</h3>
                    <div className="flex items-center gap-2 text-xs">
                        {errorCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 font-medium">
                                오류 {errorCount}
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 font-medium">
                                경고 {warningCount}
                            </span>
                        )}
                    </div>
                </div>
                {onDismissAll && alerts.length > 1 && (
                    <button
                        onClick={onDismissAll}
                        className="text-xs text-[#8b949e] hover:text-[#c9d1d9] transition"
                    >
                        모두 지우기
                    </button>
                )}
            </div>

            {/* Alert List */}
            <div className="divide-y divide-[#21262d] max-h-48 overflow-y-auto">
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
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">
                                            {alert.region}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs ${styles.textColor} mt-0.5`}>
                                    {alert.message}
                                </p>
                                <span className="text-[10px] text-[#6e7681] mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeAgo(alert.timestamp)}
                                </span>
                            </div>
                            {onDismiss && (
                                <button
                                    onClick={() => onDismiss(alert.id)}
                                    className="text-[#6e7681] hover:text-[#c9d1d9] transition p-1"
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
