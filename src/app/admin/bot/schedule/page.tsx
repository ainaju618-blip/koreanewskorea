"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Calendar, Clock, Loader2, Play, History, AlertCircle,
    ExternalLink, GitBranch, CheckCircle2, XCircle, Timer,
    Plus, X, Save
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

    // Schedule editor states
    const [editedSchedules, setEditedSchedules] = useState<string[]>([]);
    const [newTime, setNewTime] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Ref to track unsaved changes (prevents overwriting during auto-refresh)
    const hasUnsavedChangesRef = useRef(false);

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

    // Keep ref in sync with state
    useEffect(() => {
        hasUnsavedChangesRef.current = hasChanges;
    }, [hasChanges]);

    // Initialize edited schedules when data is loaded
    // IMPORTANT: Don't overwrite user's unsaved changes during auto-refresh
    useEffect(() => {
        if (data?.schedules) {
            // Skip if user has unsaved changes (prevents auto-refresh overwrite)
            if (hasUnsavedChangesRef.current) {
                return;
            }
            const kstTimes = data.schedules.map(cron => cronToKST(cron).time);
            setEditedSchedules(kstTimes);
            setHasChanges(false);
        }
    }, [data?.schedules]);

    // Schedule limits
    const MAX_SCHEDULES = 10;

    // Add new schedule time
    const handleAddTime = () => {
        if (!newTime) return;

        // Check max limit
        if (editedSchedules.length >= MAX_SCHEDULES) {
            showError(`최대 ${MAX_SCHEDULES}개까지만 추가할 수 있습니다.`);
            return;
        }

        // Parse time from input (handles "HH:MM" or "HH:MM:SS" formats)
        const timeParts = newTime.split(':');
        if (timeParts.length < 2) {
            showError('시간 형식이 올바르지 않습니다.');
            return;
        }

        const h = parseInt(timeParts[0], 10);
        const m = parseInt(timeParts[1], 10);

        // Validate hour and minute ranges
        if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
            showError('시간 형식이 올바르지 않습니다. 00:00 ~ 23:59 범위로 입력하세요.');
            return;
        }

        // Format to HH:MM
        const formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        // Check for duplicates
        if (editedSchedules.includes(formattedTime)) {
            showError('이미 추가된 시간입니다.');
            return;
        }

        // Add and sort
        const newSchedules = [...editedSchedules, formattedTime].sort();
        setEditedSchedules(newSchedules);
        setNewTime('');
        setHasChanges(true);
    };

    // Remove schedule time
    const handleRemoveTime = (timeToRemove: string) => {
        const newSchedules = editedSchedules.filter(t => t !== timeToRemove);
        setEditedSchedules(newSchedules);
        setHasChanges(true);
    };

    // Save schedules to GitHub
    const handleSaveSchedules = async () => {
        if (editedSchedules.length === 0) {
            showError('최소 1개 이상의 스케줄 시간이 필요합니다.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/github-actions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedules: editedSchedules })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '스케줄 저장에 실패했습니다.');
            }

            showSuccess('스케줄이 저장되었습니다! 다음 실행부터 적용됩니다.');
            setHasChanges(false);
            // Refresh data after save
            setTimeout(() => fetchData(true), 2000);
        } catch (err: any) {
            showError(err.message || '스케줄 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

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
                    {/* Schedule Editor Card */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-750">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-400" />
                                스케줄 설정
                                {hasChanges && (
                                    <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded-full ml-2">
                                        미저장
                                    </span>
                                )}
                            </h3>
                        </div>
                        <div className="p-6">
                            {/* Schedule Editor UI */}
                            <div className="space-y-4">
                                {/* Time chips row */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {editedSchedules.map((time) => (
                                        <div
                                            key={time}
                                            className="flex items-center gap-1 bg-purple-900/50 border border-purple-600 text-purple-200 px-3 py-2 rounded-lg"
                                        >
                                            <span className="text-lg font-bold">{time}</span>
                                            <button
                                                onClick={() => handleRemoveTime(time)}
                                                className="ml-1 text-purple-400 hover:text-red-400 transition"
                                                title="Remove"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add time input */}
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="time"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTime()}
                                        />
                                        <button
                                            onClick={handleAddTime}
                                            className="flex items-center gap-1 bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-600 hover:text-white transition"
                                            title="Add time"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="text-sm">추가</span>
                                        </button>
                                    </div>

                                    {/* Save button */}
                                    <button
                                        onClick={handleSaveSchedules}
                                        disabled={!hasChanges || isSaving}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ml-auto ${
                                            hasChanges
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                저장 중...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                저장
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Help text */}
                                <div className="flex items-start gap-2 text-sm text-gray-400 bg-gray-700/30 p-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p>
                                            한국 시간(KST) 기준으로 시간을 추가하세요. 스크래퍼가 매일 지정된 시간에 자동 실행됩니다.
                                            <span className="ml-2 text-purple-400">({editedSchedules.length}/{MAX_SCHEDULES})</span>
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            저장 버튼을 누르면 GitHub 워크플로우 파일이 자동으로 업데이트되고, 화면에 즉시 반영됩니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                                                            timeZone: 'Asia/Seoul',
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
                                                {time.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className={`text-sm font-mono ${idx === 0 ? 'text-purple-300' : 'text-gray-500'}`}>
                                                {time.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' })}
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
