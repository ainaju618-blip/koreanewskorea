"use client";

import React, { useState } from "react";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    ChevronDown,
    ChevronUp,
    FileText,
    Clock,
    SkipForward,
    Info
} from "lucide-react";
import { getRegionLabel } from "./regionData";

// Types for detailed stats
interface ArticleInfo {
    status: 'created' | 'skipped' | 'failed';
    title: string;
    reason?: string;
}

interface DateBreakdown {
    date: string;
    created: number;
    skipped: number;
    failed: number;
    note?: string;
    articles?: ArticleInfo[];
}

interface DetailedStatsSummary {
    total_processed: number;
    total_created: number;
    total_skipped: number;
    total_failed: number;
    message: string;
}

interface DetailedStats {
    summary: DetailedStatsSummary;
    date_breakdown: DateBreakdown[];
    duration_seconds?: number;
    errors?: string[];
}

interface JobResultWithDetails {
    id: number;
    region: string;
    status: string;
    log_message?: string;
    articles_count?: number;
    metadata?: {
        detailed_stats?: DetailedStats;
        skipped_count?: number;
        full_log?: string;
    };
}

interface DetailedResultPanelProps {
    jobResults: JobResultWithDetails[];
    onClose?: () => void;
}

export function DetailedResultPanel({ jobResults, onClose }: DetailedResultPanelProps) {
    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

    const toggleRegion = (region: string) => {
        setExpandedRegions(prev => {
            const next = new Set(prev);
            if (next.has(region)) {
                next.delete(region);
            } else {
                next.add(region);
            }
            return next;
        });
    };

    const toggleDate = (key: string) => {
        setExpandedDates(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // Calculate overall summary
    const overallSummary = React.useMemo(() => {
        let totalCreated = 0;
        let totalSkipped = 0;
        let totalFailed = 0;
        let regionsSuccess = 0;
        let regionsFailed = 0;

        jobResults.forEach(job => {
            if (job.status === 'success') {
                regionsSuccess++;
            } else if (['failed', 'error'].includes(job.status)) {
                regionsFailed++;
            }

            const stats = job.metadata?.detailed_stats;
            if (stats?.summary) {
                totalCreated += stats.summary.total_created || 0;
                totalSkipped += stats.summary.total_skipped || 0;
                totalFailed += stats.summary.total_failed || 0;
            } else {
                // Fallback to articles_count
                totalCreated += job.articles_count || 0;
                totalSkipped += job.metadata?.skipped_count || 0;
            }
        });

        return {
            totalCreated,
            totalSkipped,
            totalFailed,
            regionsSuccess,
            regionsFailed,
            totalRegions: jobResults.length
        };
    }, [jobResults]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        return `${month}/${day} (${dayOfWeek})`;
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '-';
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Detailed Collection Results
                    </h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Overall Summary */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-green-600">
                            {overallSummary.totalCreated}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">New Articles</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-yellow-600">
                            {overallSummary.totalSkipped}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Duplicates</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-red-600">
                            {overallSummary.totalFailed}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Failed</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">
                            {overallSummary.regionsSuccess}/{overallSummary.totalRegions}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Regions OK</div>
                    </div>
                </div>
            </div>

            {/* Region List */}
            <div className="max-h-[500px] overflow-y-auto">
                {jobResults.map((job) => {
                    const regionLabel = getRegionLabel(job.region);
                    const isExpanded = expandedRegions.has(job.region);
                    const stats = job.metadata?.detailed_stats;
                    const hasDetails = stats?.date_breakdown && stats.date_breakdown.length > 0;

                    return (
                        <div key={job.id} className="border-b border-gray-100 last:border-b-0">
                            {/* Region Header */}
                            <button
                                onClick={() => toggleRegion(job.region)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center gap-3">
                                    {job.status === 'success' ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : job.status === 'failed' ? (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                                    )}
                                    <span className="font-medium text-gray-900">{regionLabel}</span>
                                    <span className="text-sm text-gray-500">
                                        {job.log_message}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {stats?.duration_seconds && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(stats.duration_seconds)}
                                        </span>
                                    )}
                                    {hasDetails && (
                                        isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )
                                    )}
                                </div>
                            </button>

                            {/* Date Breakdown */}
                            {isExpanded && hasDetails && (
                                <div className="bg-gray-50 px-4 pb-4">
                                    <div className="space-y-2">
                                        {stats?.date_breakdown.map((dateInfo, idx) => {
                                            const dateKey = `${job.region}-${dateInfo.date}`;
                                            const isDateExpanded = expandedDates.has(dateKey);
                                            const hasArticles = dateInfo.articles && dateInfo.articles.length > 0;
                                            const totalForDate = dateInfo.created + dateInfo.skipped + dateInfo.failed;

                                            return (
                                                <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    {/* Date Header */}
                                                    <button
                                                        onClick={() => hasArticles && toggleDate(dateKey)}
                                                        className={`w-full p-3 flex items-center justify-between ${hasArticles ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <span className="font-medium text-sm">
                                                                {formatDate(dateInfo.date)}
                                                            </span>
                                                            {dateInfo.note && (
                                                                <span className="text-xs text-gray-500 italic flex items-center gap-1">
                                                                    <Info className="w-3 h-3" />
                                                                    {dateInfo.note}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {dateInfo.created > 0 && (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                                    +{dateInfo.created}
                                                                </span>
                                                            )}
                                                            {dateInfo.skipped > 0 && (
                                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                                                                    <SkipForward className="w-3 h-3" />
                                                                    {dateInfo.skipped}
                                                                </span>
                                                            )}
                                                            {dateInfo.failed > 0 && (
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                                                    x{dateInfo.failed}
                                                                </span>
                                                            )}
                                                            {totalForDate === 0 && !dateInfo.note && (
                                                                <span className="text-xs text-gray-400">No articles</span>
                                                            )}
                                                            {hasArticles && (
                                                                isDateExpanded ? (
                                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                                )
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Article List */}
                                                    {isDateExpanded && hasArticles && (
                                                        <div className="border-t border-gray-100 px-3 py-2 space-y-1 bg-gray-50">
                                                            {dateInfo.articles?.map((article, aIdx) => (
                                                                <div
                                                                    key={aIdx}
                                                                    className="flex items-start gap-2 text-xs py-1"
                                                                >
                                                                    {article.status === 'created' && (
                                                                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                                    )}
                                                                    {article.status === 'skipped' && (
                                                                        <SkipForward className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                                    )}
                                                                    {article.status === 'failed' && (
                                                                        <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                                                    )}
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="text-gray-700 truncate block">
                                                                            {article.title}
                                                                        </span>
                                                                        {article.reason && (
                                                                            <span className="text-gray-400 text-[10px]">
                                                                                ({article.reason})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Errors */}
                                    {stats?.errors && stats.errors.length > 0 && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                            <h5 className="text-xs font-medium text-red-700 mb-1">Errors:</h5>
                                            <ul className="text-xs text-red-600 space-y-1">
                                                {stats.errors.map((err, idx) => (
                                                    <li key={idx}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                    Click on a region to see date-by-date breakdown
                </p>
            </div>
        </div>
    );
}

export default DetailedResultPanel;
