"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface DailyStat {
    date: string;
    total: number;
    success: number;
    articles: number;
    successRate: number;
}

export interface CollectionChartProps {
    dailyStats: DailyStat[];
    isLoading?: boolean;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function CollectionChart({ dailyStats, isLoading }: CollectionChartProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-32 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (!dailyStats || dailyStats.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">일별 수집 추이</h3>
                <div className="h-32 flex items-center justify-center text-gray-400">
                    데이터가 없습니다
                </div>
            </div>
        );
    }

    const maxArticles = Math.max(...dailyStats.map(d => d.articles), 1);
    const totalArticles = dailyStats.reduce((sum, d) => sum + d.articles, 0);
    const avgArticles = Math.round(totalArticles / dailyStats.length);

    // Calculate trend (compare last 3 days vs previous 3 days)
    const recentDays = dailyStats.slice(-3);
    const previousDays = dailyStats.slice(-6, -3);
    const recentAvg = recentDays.reduce((sum, d) => sum + d.articles, 0) / Math.max(recentDays.length, 1);
    const previousAvg = previousDays.reduce((sum, d) => sum + d.articles, 0) / Math.max(previousDays.length, 1);
    const trendPercent = previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">일별 수집 추이</h3>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                        총 <span className="font-bold text-gray-900">{totalArticles.toLocaleString()}</span>건
                    </span>
                    <span className="text-gray-500">
                        평균 <span className="font-bold text-gray-900">{avgArticles}</span>건/일
                    </span>
                    {trendPercent !== 0 && (
                        <span className={`flex items-center gap-1 ${trendPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trendPercent > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {trendPercent > 0 ? '+' : ''}{trendPercent}%
                        </span>
                    )}
                    {trendPercent === 0 && (
                        <span className="flex items-center gap-1 text-gray-500">
                            <Minus className="w-4 h-4" />
                            0%
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4">
                {/* Bar Chart */}
                <div className="flex items-end gap-1 h-32">
                    {dailyStats.map((stat, idx) => {
                        const height = (stat.articles / maxArticles) * 100;
                        const isToday = idx === dailyStats.length - 1;

                        return (
                            <div
                                key={stat.date}
                                className="flex-1 flex flex-col items-center group"
                            >
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-xs text-gray-600 whitespace-nowrap">
                                    {stat.articles}건
                                </div>

                                {/* Bar */}
                                <div
                                    className={`w-full rounded-t transition-all duration-300 ${
                                        isToday
                                            ? 'bg-blue-500 hover:bg-blue-600'
                                            : stat.successRate >= 80
                                                ? 'bg-green-400 hover:bg-green-500'
                                                : stat.successRate >= 50
                                                    ? 'bg-amber-400 hover:bg-amber-500'
                                                    : 'bg-red-400 hover:bg-red-500'
                                    }`}
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                    title={`${stat.date}: ${stat.articles}건 (성공률 ${stat.successRate}%)`}
                                />

                                {/* Date Label */}
                                <span className={`text-[10px] mt-1 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                    {formatDate(stat.date)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-green-400"></span>
                        성공률 80%+
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-amber-400"></span>
                        성공률 50-79%
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-red-400"></span>
                        성공률 50% 미만
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-blue-500"></span>
                        오늘
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CollectionChart;
