"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Calendar, Clock, Loader2, Play, History, AlertCircle,
    CheckCircle2, XCircle, Timer, Save, Power, Settings,
    Zap, Monitor, RefreshCw, Square, PlayCircle, RotateCcw
} from "lucide-react";
import Link from "next/link";
import { useToast } from '@/components/ui/Toast';

interface ScheduleSettings {
    enabled: boolean;
    startHour: number;
    endHour: number;
    intervalMinutes: number;
    runOnMinute: number;
}

interface AutomationStats {
    lastRun?: { timestamp: string; status: string };
    todayStats?: { processed: number; published: number; held: number };
}

interface SchedulerStatus {
    running: boolean;
    message: string;
}

// Generate scheduled times based on settings
function generateScheduledTimes(settings: ScheduleSettings): string[] {
    const times: string[] = [];
    if (!settings.enabled) return times;

    let hour = settings.startHour;
    while (hour <= settings.endHour) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(settings.runOnMinute).padStart(2, '0')}`;
        times.push(timeStr);
        hour += Math.floor(settings.intervalMinutes / 60);
        if (settings.intervalMinutes < 60) break; // For intervals less than 1 hour, just show start time
    }
    return times;
}

// Calculate next run times
function getNextRunTimes(settings: ScheduleSettings, count: number = 5): Date[] {
    if (!settings.enabled) return [];

    const now = new Date();
    const results: Date[] = [];

    for (let day = 0; day < 7 && results.length < count; day++) {
        let hour = settings.startHour;
        while (hour <= settings.endHour && results.length < count) {
            const runTime = new Date(now);
            runTime.setDate(now.getDate() + day);
            runTime.setHours(hour, settings.runOnMinute, 0, 0);

            if (runTime > now) {
                results.push(runTime);
            }
            hour += Math.floor(settings.intervalMinutes / 60) || 1;
        }
    }

    return results;
}

export default function BotSchedulePage() {
    const { showSuccess, showError } = useToast();

    // States
    const [settings, setSettings] = useState<ScheduleSettings>({
        enabled: false,
        startHour: 9,
        endHour: 20,
        intervalMinutes: 60,
        runOnMinute: 30
    });
    const [stats, setStats] = useState<AutomationStats>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Scheduler status
    const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>({ running: false, message: '' });
    const [isControlling, setIsControlling] = useState(false);

    // Reset state
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Edited settings (for unsaved changes)
    const [editedSettings, setEditedSettings] = useState<ScheduleSettings>(settings);

    // Load settings
    const fetchSettings = useCallback(async () => {
        try {
            // Load schedule settings
            const scheduleRes = await fetch('/api/bot/automation-schedule');
            const scheduleData = await scheduleRes.json();

            // Load automation stats
            const automationRes = await fetch('/api/bot/full-automation');
            const automationData = await automationRes.json();

            const loadedSettings: ScheduleSettings = {
                enabled: automationData.enabled || false,
                startHour: scheduleData.startHour ?? 9,
                endHour: scheduleData.endHour ?? 20,
                intervalMinutes: scheduleData.intervalMinutes ?? 60,
                runOnMinute: scheduleData.runOnMinute ?? 30
            };

            setSettings(loadedSettings);
            setEditedSettings(loadedSettings);
            setStats({
                lastRun: automationData.lastRun,
                todayStats: automationData.todayStats
            });
            setHasChanges(false);

        } catch (err) {
            console.error('Failed to load settings:', err);
            showError('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchSettings();
        fetchSchedulerStatus();
    }, [fetchSettings]);

    // Fetch scheduler status
    const fetchSchedulerStatus = async () => {
        try {
            const res = await fetch('/api/bot/local-scheduler');
            if (res.ok) {
                const data = await res.json();
                setSchedulerStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch scheduler status:', err);
        }
    };

    // Start/Stop scheduler
    const handleSchedulerControl = async (action: 'start' | 'stop') => {
        setIsControlling(true);
        try {
            const res = await fetch('/api/bot/local-scheduler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            const data = await res.json();

            if (data.success) {
                showSuccess(data.message);
                await fetchSchedulerStatus();
            } else {
                showError(data.message || 'Failed to control scheduler');
            }
        } catch (err) {
            console.error('Scheduler control error:', err);
            showError('Failed to control scheduler');
        } finally {
            setIsControlling(false);
        }
    };

    // Handle setting changes
    const handleChange = (field: keyof ScheduleSettings, value: number | boolean) => {
        setEditedSettings(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    // Save settings
    const handleSave = async (): Promise<boolean> => {
        setIsSaving(true);
        try {
            // Save schedule settings
            const scheduleRes = await fetch('/api/bot/automation-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: editedSettings.enabled,
                    startHour: editedSettings.startHour,
                    endHour: editedSettings.endHour,
                    intervalMinutes: editedSettings.intervalMinutes,
                    runOnMinute: editedSettings.runOnMinute
                })
            });

            if (!scheduleRes.ok) {
                throw new Error('Failed to save schedule');
            }

            // Save enabled status to full-automation
            const automationRes = await fetch('/api/bot/full-automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: editedSettings.enabled })
            });

            if (!automationRes.ok) {
                throw new Error('Failed to save automation status');
            }

            setSettings(editedSettings);
            setHasChanges(false);
            showSuccess('Schedule saved successfully!');
            return true;

        } catch (err) {
            console.error('Failed to save:', err);
            showError('Failed to save settings');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Save settings and start scheduler
    const handleSaveAndStart = async () => {
        const saveSuccess = await handleSave();
        if (!saveSuccess) return;

        // Refresh status first to get current state
        try {
            const res = await fetch('/api/bot/local-scheduler');
            if (res.ok) {
                const data = await res.json();
                if (data.running) {
                    showSuccess('Settings saved! Scheduler is already running.');
                    setSchedulerStatus(data);
                    return;
                }
            }
        } catch {
            // Continue to try starting
        }

        // Start scheduler
        await handleSchedulerControl('start');
    };

    // Save settings and restart scheduler (stop then start)
    const handleSaveAndRestart = async () => {
        const saveSuccess = await handleSave();
        if (!saveSuccess) return;

        setIsControlling(true);
        try {
            // Stop scheduler first
            const stopRes = await fetch('/api/bot/local-scheduler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });
            await stopRes.json();

            // Wait a moment for process to fully stop
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Start scheduler with new settings
            const startRes = await fetch('/api/bot/local-scheduler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' })
            });
            const startData = await startRes.json();

            if (startData.success) {
                showSuccess('Settings saved and scheduler restarted!');
                await fetchSchedulerStatus();
            } else {
                showError(startData.message || 'Failed to restart scheduler');
            }
        } catch (err) {
            console.error('Restart error:', err);
            showError('Failed to restart scheduler');
        } finally {
            setIsControlling(false);
        }
    };

    // Toggle enabled
    const handleToggle = async () => {
        const newEnabled = !editedSettings.enabled;
        setEditedSettings(prev => ({ ...prev, enabled: newEnabled }));
        setHasChanges(true);
    };

    // Full reset
    const handleFullReset = async () => {
        setIsResetting(true);
        setShowResetConfirm(false);

        try {
            const res = await fetch('/api/bot/reset-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (data.success) {
                showSuccess('All settings initialized successfully');

                // Reset local state to defaults
                const defaultSettings: ScheduleSettings = {
                    enabled: false,
                    startHour: 9,
                    endHour: 20,
                    intervalMinutes: 60,
                    runOnMinute: 30
                };
                setSettings(defaultSettings);
                setEditedSettings(defaultSettings);
                setHasChanges(false);

                // Refresh scheduler status
                await fetchSchedulerStatus();

                // Reset stats
                setStats({});
            } else {
                showError(data.message || 'Failed to initialize');
            }
        } catch (err) {
            console.error('Reset error:', err);
            showError('Failed to initialize settings');
        } finally {
            setIsResetting(false);
        }
    };

    const scheduledTimes = generateScheduledTimes(editedSettings);
    const nextRunTimes = getNextRunTimes(editedSettings, 5);

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
                    <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        스케줄 설정
                    </h1>
                    <p className="text-sm text-[#8b949e] mt-2">
                        자동 수집 및 AI 처리를 위한 로컬 스케줄러
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        disabled={isResetting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/50 text-red-300 border border-red-700 rounded-lg font-medium hover:bg-red-900 transition"
                    >
                        {isResetting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RotateCcw className="w-4 h-4" />
                        )}
                        초기화
                    </button>
                    <button
                        onClick={fetchSettings}
                        className="flex items-center gap-2 px-4 py-2 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] rounded-lg font-medium hover:bg-[#30363d] transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium shadow-sm transition ${
                            hasChanges
                                ? 'bg-[#238636] text-white hover:bg-[#2ea043]'
                                : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
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
                    <button
                        onClick={handleSaveAndStart}
                        disabled={isSaving || isControlling}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium shadow-sm transition ${
                            isSaving || isControlling
                                ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                                : 'bg-[#1f6feb] text-white hover:bg-[#388bfd]'
                        }`}
                    >
                        {isSaving || isControlling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                처리 중...
                            </>
                        ) : (
                            <>
                                <PlayCircle className="w-4 h-4" />
                                저장 & 시작
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSaveAndRestart}
                        disabled={isSaving || isControlling}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium shadow-sm transition ${
                            isSaving || isControlling
                                ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                    >
                        {isSaving || isControlling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                재시작 중...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                저장 & 재시작
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Unsaved Changes Warning */}
            {hasChanges && (
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <p className="text-sm text-yellow-300">저장되지 않은 변경사항이 있습니다. 저장 버튼을 클릭하세요.</p>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Settings */}
                <div className="col-span-2 space-y-6">
                    {/* Master Switch */}
                    <div className={`rounded-xl border-2 p-5 ${
                        editedSettings.enabled
                            ? 'bg-green-900/30 border-green-500'
                            : 'bg-[#161b22] border-[#30363d]'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Zap className={`w-8 h-8 ${editedSettings.enabled ? 'text-green-400' : 'text-[#484f58]'}`} />
                                <div>
                                    <h3 className="font-bold text-lg text-[#e6edf3]">자동화 마스터 스위치</h3>
                                    <p className="text-sm text-[#8b949e]">
                                        {editedSettings.enabled
                                            ? '로컬 스케줄러가 자동화를 실행합니다'
                                            : '자동화가 비활성화되어 있습니다'
                                        }
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggle}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    editedSettings.enabled ? 'bg-green-500' : 'bg-[#484f58]'
                                }`}
                            >
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                    editedSettings.enabled ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>
                    </div>

                    {/* Schedule Settings Card */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
                        <div className="p-4 border-b border-[#30363d] bg-[#21262d]">
                            <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2">
                                <Settings className="w-5 h-5 text-purple-400" />
                                스케줄 설정
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                                        시작 시간 (KST)
                                    </label>
                                    <select
                                        value={editedSettings.startHour}
                                        onChange={(e) => handleChange('startHour', parseInt(e.target.value))}
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-[#e6edf3]"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>
                                                {String(i).padStart(2, '0')}:00
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                                        종료 시간 (KST)
                                    </label>
                                    <select
                                        value={editedSettings.endHour}
                                        onChange={(e) => handleChange('endHour', parseInt(e.target.value))}
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-[#e6edf3]"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>
                                                {String(i).padStart(2, '0')}:00
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Interval and Minute */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                                        실행 간격
                                    </label>
                                    <select
                                        value={editedSettings.intervalMinutes}
                                        onChange={(e) => handleChange('intervalMinutes', parseInt(e.target.value))}
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-[#e6edf3]"
                                    >
                                        <option value={30}>30분마다</option>
                                        <option value={60}>1시간마다</option>
                                        <option value={120}>2시간마다</option>
                                        <option value={180}>3시간마다</option>
                                        <option value={240}>4시간마다</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                                        실행 분
                                    </label>
                                    <select
                                        value={editedSettings.runOnMinute}
                                        onChange={(e) => handleChange('runOnMinute', parseInt(e.target.value))}
                                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-[#e6edf3]"
                                    >
                                        {[0, 10, 15, 20, 30, 40, 45, 50].map(m => (
                                            <option key={m} value={m}>
                                                XX:{String(m).padStart(2, '0')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="bg-[#21262d] rounded-lg p-4">
                                <h4 className="text-sm font-medium text-[#c9d1d9] mb-3">일일 스케줄 미리보기</h4>
                                <div className="flex flex-wrap gap-2">
                                    {scheduledTimes.length > 0 ? (
                                        scheduledTimes.map((time) => (
                                            <span
                                                key={time}
                                                className="px-3 py-1.5 bg-purple-900/50 border border-purple-600 text-purple-200 rounded-lg text-sm font-medium"
                                            >
                                                {time}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[#8b949e] text-sm">자동화를 활성화하면 스케줄이 표시됩니다</span>
                                    )}
                                </div>
                                {scheduledTimes.length > 0 && (
                                    <p className="text-xs text-[#8b949e] mt-3">
                                        총 {scheduledTimes.length}회/일 실행
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Local Scheduler Control */}
                    <div className={`rounded-xl border-2 overflow-hidden ${
                        schedulerStatus.running
                            ? 'bg-blue-900/30 border-blue-500'
                            : 'bg-[#161b22] border-[#30363d]'
                    }`}>
                        <div className="p-4 border-b border-[#30363d] bg-[#21262d]">
                            <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-blue-400" />
                                로컬 스케줄러 제어
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                        schedulerStatus.running ? 'bg-green-500 animate-pulse' : 'bg-[#484f58]'
                                    }`} />
                                    <span className={`font-medium ${
                                        schedulerStatus.running ? 'text-green-400' : 'text-[#8b949e]'
                                    }`}>
                                        {schedulerStatus.running ? '실행 중' : '중지됨'}
                                    </span>
                                </div>
                                <button
                                    onClick={fetchSchedulerStatus}
                                    className="text-[#8b949e] hover:text-[#e6edf3] transition"
                                    title="상태 새로고침"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSchedulerControl('start')}
                                    disabled={schedulerStatus.running || isControlling}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                                        schedulerStatus.running || isControlling
                                            ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                                            : 'bg-[#238636] text-white hover:bg-[#2ea043]'
                                    }`}
                                >
                                    {isControlling ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <PlayCircle className="w-5 h-5" />
                                    )}
                                    시작
                                </button>
                                <button
                                    onClick={() => handleSchedulerControl('stop')}
                                    disabled={!schedulerStatus.running || isControlling}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                                        !schedulerStatus.running || isControlling
                                            ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                >
                                    {isControlling ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                    중지
                                </button>
                            </div>

                            {/* Info */}
                            <div className="text-xs text-[#8b949e] space-y-1">
                                <p>로그 파일: logs/local_scheduler.log</p>
                                <p>타임아웃: 1회당 15분</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Status */}
                <div className="space-y-6">
                    {/* Next Runs */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
                        <div className="p-4 border-b border-[#30363d] bg-[#21262d]">
                            <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2">
                                <Timer className="w-5 h-5 text-blue-400" />
                                다음 예정 실행
                            </h3>
                        </div>
                        <div className="p-4">
                            {nextRunTimes.length > 0 ? (
                                <div className="space-y-2">
                                    {nextRunTimes.map((time, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-3 rounded-lg ${
                                                idx === 0 ? 'bg-green-900/30 border border-green-700' : 'bg-[#21262d]'
                                            }`}
                                        >
                                            <span className={`text-sm ${idx === 0 ? 'text-green-300 font-semibold' : 'text-[#8b949e]'}`}>
                                                {time.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className={`text-sm font-mono ${idx === 0 ? 'text-green-300' : 'text-[#8b949e]'}`}>
                                                {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-[#8b949e]">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#484f58]" />
                                    <p className="text-sm">자동화를 활성화하면 스케줄이 표시됩니다</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Today Stats */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
                        <div className="p-4 border-b border-[#30363d] bg-[#21262d]">
                            <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2">
                                <History className="w-5 h-5 text-green-400" />
                                오늘 통계
                            </h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[#8b949e]">처리됨</span>
                                <span className="font-bold text-[#e6edf3]">{stats.todayStats?.processed || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#8b949e]">발행됨</span>
                                <span className="font-bold text-green-400">{stats.todayStats?.published || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#8b949e]">보류됨</span>
                                <span className="font-bold text-yellow-400">{stats.todayStats?.held || 0}</span>
                            </div>
                            {stats.lastRun && (
                                <div className="pt-3 border-t border-[#30363d]">
                                    <div className="flex items-center gap-2 text-sm">
                                        {stats.lastRun.status === 'success' ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="text-[#8b949e]">마지막 실행:</span>
                                        <span className="text-[#c9d1d9]">
                                            {new Date(stats.lastRun.timestamp).toLocaleString('ko-KR')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
                        <div className="p-4 border-b border-[#30363d] bg-[#21262d]">
                            <h3 className="font-semibold text-[#e6edf3] flex items-center gap-2">
                                <Zap className="w-5 h-5 text-orange-400" />
                                빠른 링크
                            </h3>
                        </div>
                        <div className="p-4 space-y-2">
                            <Link
                                href="/admin/bot/run"
                                className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg hover:bg-[#30363d] transition text-sm text-[#c9d1d9]"
                            >
                                <span>수동 실행</span>
                                <Play className="w-4 h-4 text-[#8b949e]" />
                            </Link>
                            <Link
                                href="/admin/bot/ai-processing"
                                className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg hover:bg-[#30363d] transition text-sm text-[#c9d1d9]"
                            >
                                <span>AI 처리</span>
                                <Power className="w-4 h-4 text-[#8b949e]" />
                            </Link>
                            <Link
                                href="/admin/bot/logs"
                                className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg hover:bg-[#30363d] transition text-sm text-[#c9d1d9]"
                            >
                                <span>봇 로그</span>
                                <History className="w-4 h-4 text-[#8b949e]" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#e6edf3]">전체 초기화</h3>
                                <p className="text-sm text-[#8b949e]">모든 스케줄 설정을 초기화합니다</p>
                            </div>
                        </div>

                        <div className="bg-[#0d1117] rounded-lg p-4 mb-6 text-sm text-[#c9d1d9] space-y-2">
                            <p className="font-medium text-red-400">다음 항목이 초기화됩니다:</p>
                            <ul className="list-disc list-inside space-y-1 text-[#8b949e]">
                                <li>스케줄러 중지</li>
                                <li>스케줄 설정 기본값으로 리셋</li>
                                <li>자동화 비활성화</li>
                                <li>실행 중인 작업 로그 초기화</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 px-4 py-3 bg-[#21262d] text-[#c9d1d9] rounded-lg font-medium hover:bg-[#30363d] transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleFullReset}
                                disabled={isResetting}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                            >
                                {isResetting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        초기화 중...
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="w-4 h-4" />
                                        초기화 실행
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
