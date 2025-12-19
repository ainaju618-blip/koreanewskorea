"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Calendar, Clock, Loader2, Play, History, AlertCircle,
    ExternalLink, GitBranch, CheckCircle2, XCircle, Timer,
    Plus, X, Save, RotateCcw
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

interface BotLog {
    id: number;
    region: string;
    status: string;
    articles_count: number;
    started_at: string;
    ended_at: string | null;
    metadata?: { skipped_count?: number };
}

interface GitHubActionsData {
    schedules: string[];
    runs: WorkflowRun[];
    botLogs: BotLog[];
    workflowUrl: string;
}

// Region name mapping
const REGION_NAMES: Record<string, string> = {
    gwangju: '광주시', jeonnam: '전남도', mokpo: '목포시', yeosu: '여수시',
    suncheon: '순천시', naju: '나주시', gwangyang: '광양시', damyang: '담양군',
    gokseong: '곡성군', gurye: '구례군', goheung: '고흥군', boseong: '보성군',
    hwasun: '화순군', jangheung: '장흥군', gangjin: '강진군', haenam: '해남군',
    yeongam: '영암군', muan: '무안군', hampyeong: '함평군', yeonggwang: '영광군',
    jangseong: '장성군', wando: '완도군', jindo: '진도군', shinan: '신안군',
    gwangju_edu: '광주교육청', jeonnam_edu: '전남교육청'
};

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

    // Reset all schedules
    const handleResetSchedules = () => {
        setEditedSchedules([]);
        setHasChanges(true);
    };

    // Save schedules to GitHub with verification
    const handleSaveSchedules = async () => {
        setIsSaving(true);
        try {
            console.log('[Schedule Save] Saving schedules:', editedSchedules);

            const res = await fetch('/api/admin/github-actions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedules: editedSchedules })
            });

            const result = await res.json();
            console.log('[Schedule Save] API Response:', result);

            if (!res.ok) {
                throw new Error(result.error || '스케줄 저장에 실패했습니다.');
            }

            // Check if verification passed
            if (!result.verified) {
                throw new Error('GitHub 저장 검증 실패 - 다시 시도해주세요.');
            }

            showSuccess(`스케줄이 GitHub에 저장되었습니다! (${editedSchedules.join(', ')} KST)`);
            setHasChanges(false);

            // Refresh data after save to show updated schedules
            setTimeout(() => fetchData(true), 1000);
        } catch (err: any) {
            console.error('[Schedule Save] Error:', err);
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

                                    {/* Reset button */}
                                    <button
                                        onClick={handleResetSchedules}
                                        disabled={editedSchedules.length === 0 || isSaving}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ml-auto ${
                                            editedSchedules.length > 0
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                        title="Reset all schedules"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        초기화
                                    </button>

                                    {/* Save button */}
                                    <button
                                        onClick={handleSaveSchedules}
                                        disabled={!hasChanges || isSaving}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
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
                                예정된 실행
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
                                    <p className="text-sm">예정된 실행 없음</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Real-time Bot Logs Card */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-750 flex justify-between items-center">
                            <h3 className="font-semibold flex items-center gap-2">
                                <History className="w-5 h-5 text-green-400" />
                                실시간 수집 로그
                                {isRefreshing && (
                                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                                )}
                            </h3>
                            <a
                                href="/admin/bot/logs"
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                                전체 보기 <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="p-4">
                            {data?.botLogs && data.botLogs.length > 0 ? (
                                <div className="space-y-2">
                                    {data.botLogs.slice(0, 5).map((log) => {
                                        const regionName = REGION_NAMES[log.region] || log.region;
                                        const startTime = new Date(log.started_at);
                                        const now = new Date();
                                        const diffMs = now.getTime() - startTime.getTime();
                                        const diffMins = Math.floor(diffMs / 60000);
                                        const timeAgo = diffMins < 1 ? '방금' : diffMins < 60 ? `${diffMins}분 전` : `${Math.floor(diffMins / 60)}시간 전`;

                                        return (
                                            <div
                                                key={log.id}
                                                className={`flex items-center justify-between p-2.5 rounded-lg ${
                                                    log.status === 'running'
                                                        ? 'bg-yellow-900/20 border border-yellow-700/50'
                                                        : 'bg-gray-700/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {log.status === 'success' ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    ) : log.status === 'failed' ? (
                                                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                    ) : (
                                                        <Loader2 className="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />
                                                    )}
                                                    <span className="text-sm font-medium truncate max-w-[80px]">
                                                        {regionName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    {log.status === 'running' ? (
                                                        <span className="text-yellow-400">수집 중...</span>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            {log.articles_count}건
                                                            {log.metadata?.skipped_count ? ` (+${log.metadata.skipped_count} 중복)` : ''}
                                                        </span>
                                                    )}
                                                    <span className="text-gray-500">{timeAgo}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <History className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                                    <p className="text-sm">최근 로그 없음</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Box - Detailed */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-750">
                            <h3 className="font-semibold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                                스크래핑 안내
                            </h3>
                        </div>
                        <div className="p-4 space-y-4 text-sm">
                            {/* Scraping Method */}
                            <div>
                                <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                                    <GitBranch className="w-4 h-4" />
                                    수집 방식
                                </h4>
                                <ul className="space-y-1 text-xs text-gray-300 ml-6">
                                    <li>• 26개 지역 보도자료 병렬 수집</li>
                                    <li>• 최대 10개 스크래퍼 동시 실행</li>
                                    <li>• 지역별 독립 실행 (실패 시 다른 지역 영향 없음)</li>
                                </ul>
                            </div>

                            {/* Execution Flow */}
                            <div>
                                <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                                    <Play className="w-4 h-4" />
                                    실행 흐름
                                </h4>
                                <ul className="space-y-1 text-xs text-gray-300 ml-6">
                                    <li>1. GitHub Actions 스케줄 트리거</li>
                                    <li>2. 26개 지역 스크래퍼 병렬 시작</li>
                                    <li>3. 각 지역 보도자료 페이지 크롤링</li>
                                    <li>4. 중복 체크 후 신규 기사만 저장</li>
                                    <li>5. 이미지 Cloudinary 업로드</li>
                                </ul>
                            </div>

                            {/* Log Recording */}
                            <div>
                                <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    로그 기록
                                </h4>
                                <ul className="space-y-1 text-xs text-gray-300 ml-6">
                                    <li>• 실시간 진행 상황 DB 기록</li>
                                    <li>• 수집된 기사 수 / 중복 스킵 수 표시</li>
                                    <li>• 성공/실패 상태 자동 업데이트</li>
                                    <li>• <a href="/admin/bot/logs" className="text-blue-400 hover:underline">봇 로그</a>에서 상세 확인 가능</li>
                                </ul>
                            </div>

                            {/* Monitoring */}
                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    모니터링
                                </h4>
                                <ul className="space-y-1 text-xs text-gray-300 ml-6">
                                    <li>• 이 페이지 30초마다 자동 새로고침</li>
                                    <li>• 실행 중 작업 진행률 표시</li>
                                    <li>• GitHub에서 상세 로그 확인 가능</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-750">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-orange-400" />
                                바로가기
                            </h3>
                        </div>
                        <div className="p-4 space-y-2">
                            <a
                                href={data?.workflowUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition text-sm"
                            >
                                <span>GitHub 워크플로우</span>
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                            </a>
                            <a
                                href="/admin/bot/logs"
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition text-sm"
                            >
                                <span>봇 로그</span>
                                <History className="w-4 h-4 text-gray-500" />
                            </a>
                            <a
                                href="/admin/bot/run"
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition text-sm"
                            >
                                <span>수동 스크래퍼</span>
                                <Play className="w-4 h-4 text-gray-500" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
