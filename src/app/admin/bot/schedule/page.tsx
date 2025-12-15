"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, Save, CheckCircle2, Loader2, Power, Play, History, AlertCircle, Zap } from "lucide-react";
import { useToast } from '@/components/ui/Toast';

interface ScheduleConfig {
    enabled: boolean;
    cronExpression: string;
    lastRun?: string;
    nextRun?: string;
}

interface ScheduleHistory {
    date: string;
    time: string;
    status: 'success' | 'failed' | 'running';
    articlesCount?: number;
}

// Parse cron expression to human-readable format
function parseCronToHuman(cron: string): string {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Handle common patterns
    if (minute === '0' && hour.includes(',')) {
        const hours = hour.split(',');
        return `Daily at ${hours.map(h => `${h}:00`).join(', ')}`;
    }
    if (minute === '0' && hour === '*') {
        return 'Every hour at :00';
    }
    if (minute === '0' && hour !== '*') {
        return `Daily at ${hour}:00`;
    }
    if (minute === '*/30') {
        return 'Every 30 minutes';
    }

    return cron;
}

// Calculate next run times from cron expression
function getNextRunTimes(cron: string, count: number = 5): Date[] {
    const now = new Date();
    const parts = cron.split(' ');
    if (parts.length !== 5) return [];

    const [minutePart, hourPart] = parts;
    const results: Date[] = [];

    // Parse hours
    let hours: number[] = [];
    if (hourPart === '*') {
        hours = Array.from({ length: 24 }, (_, i) => i);
    } else if (hourPart.includes(',')) {
        hours = hourPart.split(',').map(Number);
    } else if (hourPart.includes('-')) {
        const [start, end] = hourPart.split('-').map(Number);
        hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
        hours = [parseInt(hourPart)];
    }

    // Parse minutes
    let minutes: number[] = [];
    if (minutePart === '*') {
        minutes = Array.from({ length: 60 }, (_, i) => i);
    } else if (minutePart.startsWith('*/')) {
        const interval = parseInt(minutePart.slice(2));
        minutes = Array.from({ length: Math.floor(60 / interval) }, (_, i) => i * interval);
    } else if (minutePart.includes(',')) {
        minutes = minutePart.split(',').map(Number);
    } else {
        minutes = [parseInt(minutePart)];
    }

    // Generate next run times
    let checkDate = new Date(now);
    checkDate.setSeconds(0);
    checkDate.setMilliseconds(0);

    for (let day = 0; day < 7 && results.length < count; day++) {
        for (const hour of hours) {
            for (const minute of minutes) {
                const runTime = new Date(checkDate);
                runTime.setDate(now.getDate() + day);
                runTime.setHours(hour, minute, 0, 0);

                if (runTime > now && results.length < count) {
                    results.push(runTime);
                }
            }
        }
    }

    return results.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
}

export default function BotSchedulePage() {
    const { showSuccess, showError } = useToast();
    const [config, setConfig] = useState<ScheduleConfig>({
        enabled: false,
        cronExpression: "0 9,13,17 * * *",
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [recentHistory, setRecentHistory] = useState<ScheduleHistory[]>([]);

    // Calculate next run times
    const nextRunTimes = useMemo(() => {
        return getNextRunTimes(config.cronExpression, 5);
    }, [config.cronExpression]);

    // Parse cron to human readable
    const humanReadable = useMemo(() => {
        return parseCronToHuman(config.cronExpression);
    }, [config.cronExpression]);

    // Fetch Config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/bot/schedule');
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                }
            } catch (err) {
                console.error("Failed to load config:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/bot/logs?limit=5');
                if (res.ok) {
                    const data = await res.json();
                    if (data.logs) {
                        setRecentHistory(data.logs.map((log: any) => ({
                            date: new Date(log.started_at).toLocaleDateString('ko-KR'),
                            time: new Date(log.started_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                            status: log.status === 'success' ? 'success' : log.status === 'running' ? 'running' : 'failed',
                            articlesCount: log.articles_count
                        })));
                    }
                }
            } catch (err) {
                console.error("Failed to load history:", err);
            }
        };

        fetchConfig();
        fetchHistory();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const res = await fetch('/api/bot/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!res.ok) throw new Error('Save failed');

            const data = await res.json();
            if (data.success && data.config) {
                setConfig(data.config);
            }

            setSaveSuccess(true);
            showSuccess('Schedule settings saved');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            showError('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    // Time slot selection helper
    const toggleHour = (hour: number) => {
        const parts = config.cronExpression.split(' ');
        const currentHours = parts[1] === '*' ? [] : parts[1].split(',').map(Number);

        let newHours: number[];
        if (currentHours.includes(hour)) {
            newHours = currentHours.filter(h => h !== hour);
        } else {
            newHours = [...currentHours, hour].sort((a, b) => a - b);
        }

        const newCron = `0 ${newHours.length === 0 ? '9' : newHours.join(',')} * * *`;
        setConfig({ ...config, cronExpression: newCron });
    };

    const getSelectedHours = (): number[] => {
        const parts = config.cronExpression.split(' ');
        if (parts[1] === '*') return [];
        return parts[1].split(',').map(Number);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        Scheduler Settings
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Configure automatic news collection schedules
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Settings
                        </>
                    )}
                </button>
            </header>

            {/* Success Message */}
            {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in-down">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                        Schedule settings saved successfully
                    </p>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Main Settings */}
                <div className="col-span-2 space-y-6">
                    {/* Power Toggle Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    <Power className={`w-6 h-6 ${config.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Scheduler Status</h3>
                                    <p className={`text-sm ${config.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                        {config.enabled ? 'Active - Running automatically' : 'Inactive - Manual runs only'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${config.enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${config.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Time Selection Card */}
                    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${!config.enabled ? 'opacity-60' : ''}`}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-600" />
                                Execution Time
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Visual Time Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Hours (click to toggle)
                                </label>
                                <div className="grid grid-cols-12 gap-2">
                                    {Array.from({ length: 24 }, (_, i) => {
                                        const isSelected = getSelectedHours().includes(i);
                                        const isPeakHour = [9, 12, 13, 17, 18].includes(i);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => config.enabled && toggleHour(i)}
                                                disabled={!config.enabled}
                                                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                                    isSelected
                                                        ? 'bg-purple-600 text-white shadow-md'
                                                        : isPeakHour
                                                            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                } ${!config.enabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                {String(i).padStart(2, '0')}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Purple highlighted hours are peak news times
                                </p>
                            </div>

                            {/* Preset Buttons */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quick Presets
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: '3x Daily (9,13,17)', value: '0 9,13,17 * * *', icon: Zap },
                                        { label: 'Morning (9:00)', value: '0 9 * * *', icon: Play },
                                        { label: 'Every Hour', value: '0 * * * *', icon: Clock },
                                        { label: 'Business Hours (9-18)', value: '0 9,12,15,18 * * *', icon: Calendar }
                                    ].map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => config.enabled && setConfig({ ...config, cronExpression: preset.value })}
                                            disabled={!config.enabled}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition ${
                                                config.cronExpression === preset.value
                                                    ? 'bg-purple-600 text-white border-purple-600'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                            } ${!config.enabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                            <preset.icon className="w-4 h-4" />
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cron Expression (Advanced) */}
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cron Expression (Advanced)
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={config.cronExpression}
                                        onChange={(e) => config.enabled && setConfig({ ...config, cronExpression: e.target.value })}
                                        disabled={!config.enabled}
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="0 9,13,17 * * *"
                                    />
                                    <div className="flex items-center px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                                        <span className="text-sm text-purple-700 font-medium">{humanReadable}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Info & History */}
                <div className="space-y-6">
                    {/* Next Runs Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Play className="w-5 h-5 text-blue-600" />
                                Upcoming Runs
                            </h3>
                        </div>
                        <div className="p-4">
                            {config.enabled && nextRunTimes.length > 0 ? (
                                <div className="space-y-2">
                                    {nextRunTimes.map((time, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-2 rounded-lg ${
                                                idx === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                                            }`}
                                        >
                                            <span className={`text-sm ${idx === 0 ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>
                                                {time.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className={`text-sm font-mono ${idx === 0 ? 'text-blue-700' : 'text-gray-500'}`}>
                                                {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">Scheduler is disabled</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent History Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <History className="w-5 h-5 text-green-600" />
                                Recent Runs
                            </h3>
                        </div>
                        <div className="p-4">
                            {recentHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {recentHistory.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    item.status === 'success' ? 'bg-green-500' :
                                                    item.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
                                                }`} />
                                                <span className="text-sm text-gray-600">{item.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{item.time}</span>
                                                {item.articlesCount !== undefined && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">
                                                        {item.articlesCount} articles
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">No recent runs</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm">Note</h4>
                                <ul className="mt-1 space-y-1 text-xs text-blue-800">
                                    <li>Runs all 27 regional scrapers</li>
                                    <li>Vercel Cron Jobs (see vercel.json)</li>
                                    <li>Production mode (not dry run)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
