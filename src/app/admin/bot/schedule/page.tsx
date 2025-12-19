"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Calendar, Clock, Loader2, Play, History, AlertCircle,
    RefreshCw, ExternalLink, GitBranch, CheckCircle2, XCircle, Timer
} from "lucide-react";
import { useToast } from '@/components/ui/Toast';

interface WorkflowRun {
    id: number;
    status: string;
    conclusion: string | null;
    createdAt: string;
    updatedAt: string;
    event: string;
    url: string;
}

interface GitHubActionsData {
    schedules: string[];
    runs: WorkflowRun[];
    workflowUrl: string;
}

// Convert UTC cron to KST time display
function cronToKST(cron: string): { time: string; description: string } {
    const parts = cron.split(' ');
    if (parts.length !== 5) return { time: cron, description: '' };

    const [minute, hour] = parts;
    const utcHour = parseInt(hour);
    const utcMinute = parseInt(minute);

    // UTC to KST (+9)
    let kstHour = utcHour + 9;
    if (kstHour >= 24) kstHour -= 24;

    const timeStr = `${String(kstHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')}`;
    return {
        time: timeStr,
        description: `KST (UTC ${String(utcHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')})`
    };
}

// Calculate next run times from multiple cron expressions
function getNextRunTimes(schedules: string[], count: number = 5): Date[] {
    const now = new Date();
    const results: Date[] = [];

    for (const cron of schedules) {
        const parts = cron.split(' ');
        if (parts.length !== 5) continue;

        const [minutePart, hourPart] = parts;
        const minute = parseInt(minutePart);
        const hour = parseInt(hourPart);

        // Generate next 7 days of this schedule
        for (let day = 0; day < 7; day++) {
            const runTime = new Date(now);
            runTime.setDate(now.getDate() + day);
            // UTC time
            runTime.setUTCHours(hour, minute, 0, 0);

            if (runTime > now) {
                results.push(runTime);
            }
        }
    }

    return results.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
}

export default function BotSchedulePage() {
    const { showSuccess, showError } = useToast();
    const [data, setData] = useState<GitHubActionsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTriggering, setIsTriggering] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        try {
            const res = await fetch('/api/admin/github-actions');
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to fetch data');
            }
            const result = await res.json();
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error("Failed to load GitHub Actions data:", err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchData(), 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleTriggerWorkflow = async () => {
        setIsTriggering(true);
        try {
            const res = await fetch('/api/admin/github-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region: 'all', days: '1' })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to trigger workflow');
            }

            showSuccess('GitHub Actions workflow triggered successfully');
            // Refresh after 3 seconds to show new run
            setTimeout(() => fetchData(true), 3000);
        } catch (err: any) {
            showError(err.message || 'Failed to trigger workflow');
        } finally {
            setIsTriggering(false);
        }
    };

    const nextRunTimes = data?.schedules ? getNextRunTimes(data.schedules, 5) : [];

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                            <GitBranch className="w-6 h-6 text-white" />
                        </div>
                        GitHub Actions Scheduler
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">
                        GitHub Actions workflow schedule and execution status
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-gray-200 rounded-lg font-medium hover:bg-gray-600 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleTriggerWorkflow}
                        disabled={isTriggering}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm transition disabled:opacity-50"
                    >
                        {isTriggering ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Run Now
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Schedule Info */}
                <div className="col-span-2 space-y-6">
                    {/* Current Schedule Card */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-750">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-400" />
                                Current Schedule (GitHub Actions)
                            </h3>
                        </div>
                        <div className="p-6">
                            {data?.schedules && data.schedules.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {data.schedules.map((cron, idx) => {
                                            const { time, description } = cronToKST(cron);
                                            return (
                                                <div key={idx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                                                    <div className="text-3xl font-bold text-purple-400">{time}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{description}</div>
                                                    <div className="text-xs text-gray-500 mt-2 font-mono">{cron}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Schedule is managed in <code className="text-purple-400">.github/workflows/daily_scrape.yml</code></span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                    <p>No schedules configured</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Runs Card */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-750 flex justify-between items-center">
                            <h3 className="font-semibold flex items-center gap-2">
                                <History className="w-5 h-5 text-green-400" />
                                Recent Workflow Runs
                            </h3>
                            {data?.workflowUrl && (
                                <a
                                    href={data.workflowUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                    View on GitHub <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        <div className="p-4">
                            {data?.runs && data.runs.length > 0 ? (
                                <div className="space-y-2">
                                    {data.runs.map((run) => (
                                        <a
                                            key={run.id}
                                            href={run.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                {run.status === 'completed' ? (
                                                    run.conclusion === 'success' ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )
                                                ) : (
                                                    <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {new Date(run.createdAt).toLocaleDateString('ko-KR', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {run.event === 'schedule' ? 'Scheduled' : 'Manual'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    run.status === 'completed'
                                                        ? run.conclusion === 'success'
                                                            ? 'bg-green-900/50 text-green-400'
                                                            : 'bg-red-900/50 text-red-400'
                                                        : 'bg-yellow-900/50 text-yellow-400'
                                                }`}>
                                                    {run.status === 'completed' ? run.conclusion : run.status}
                                                </span>
                                                <ExternalLink className="w-4 h-4 text-gray-500" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <History className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                    <p>No recent runs</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Next Runs & Info */}
                <div className="space-y-6">
                    {/* Next Runs Card */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-750">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Timer className="w-5 h-5 text-blue-400" />
                                Upcoming Runs
                            </h3>
                        </div>
                        <div className="p-4">
                            {nextRunTimes.length > 0 ? (
                                <div className="space-y-2">
                                    {nextRunTimes.map((time, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-3 rounded-lg ${
                                                idx === 0 ? 'bg-purple-900/30 border border-purple-700' : 'bg-gray-700/50'
                                            }`}
                                        >
                                            <span className={`text-sm ${idx === 0 ? 'text-purple-300 font-semibold' : 'text-gray-400'}`}>
                                                {time.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className={`text-sm font-mono ${idx === 0 ? 'text-purple-300' : 'text-gray-500'}`}>
                                                {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                                    <p className="text-sm">No upcoming runs</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-blue-300 text-sm">Info</h4>
                                <ul className="mt-2 space-y-1 text-xs text-blue-200">
                                    <li>26 regions scraped in parallel</li>
                                    <li>Max 10 concurrent jobs</li>
                                    <li>Auto-refresh every 30 seconds</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-750">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-orange-400" />
                                Quick Actions
                            </h3>
                        </div>
                        <div className="p-4 space-y-2">
                            <a
                                href={data?.workflowUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition text-sm"
                            >
                                <span>View Workflow on GitHub</span>
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                            </a>
                            <a
                                href="/admin/bot/logs"
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition text-sm"
                            >
                                <span>View Bot Logs</span>
                                <History className="w-4 h-4 text-gray-500" />
                            </a>
                            <a
                                href="/admin/bot/run"
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition text-sm"
                            >
                                <span>Manual Scraper</span>
                                <Play className="w-4 h-4 text-gray-500" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
