"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";

interface UsageData {
    today: {
        callCount: number;
        inputTokens: number;
        outputTokens: number;
    };
    month: {
        callCount: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
}

interface UsagePanelProps {
    dailyLimit: number;
    monthlyTokenLimit: number;
}

export function UsagePanel({ dailyLimit, monthlyTokenLimit }: UsagePanelProps) {
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsage();
    }, []);

    const fetchUsage = async () => {
        try {
            const res = await fetch("/api/admin/ai-usage");
            if (res.ok) {
                const data = await res.json();
                setUsage(data);
            }
        } catch (error) {
            console.error("Failed to fetch usage:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border border-gray-200">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!usage) {
        return (
            <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                사용량 데이터를 불러올 수 없습니다.
            </div>
        );
    }

    const dailyPercent = Math.min((usage.today.callCount / dailyLimit) * 100, 100);
    const monthlyPercent = Math.min((usage.month.totalTokens / monthlyTokenLimit) * 100, 100);

    const getBarColor = (percent: number) => {
        if (percent >= 90) return "bg-red-500";
        if (percent >= 70) return "bg-amber-500";
        return "bg-blue-500";
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700">사용량</span>
            </div>

            {/* Usage Stats */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                {/* Daily Usage */}
                <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>오늘 사용량</span>
                        <span>{usage.today.callCount.toLocaleString()}/{dailyLimit.toLocaleString()}회</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${getBarColor(dailyPercent)}`}
                            style={{ width: `${dailyPercent}%` }}
                        />
                    </div>
                </div>

                {/* Monthly Tokens */}
                <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>월별 토큰</span>
                        <span>{usage.month.totalTokens.toLocaleString()}/{monthlyTokenLimit.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${getBarColor(monthlyPercent)}`}
                            style={{ width: `${monthlyPercent}%` }}
                        />
                    </div>
                </div>

                {/* Percentage Labels */}
                <div className="flex justify-between text-xs text-gray-500">
                    <span>일일: {dailyPercent.toFixed(1)}%</span>
                    <span>월별: {monthlyPercent.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}
