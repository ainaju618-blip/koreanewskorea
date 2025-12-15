"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, Save, CheckCircle2, Loader2, Power } from "lucide-react";
import { useToast } from '@/components/ui/Toast';

interface ScheduleConfig {
    enabled: boolean;
    cronExpression: string;
    lastRun?: string;
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

    // Fetch Config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/bot/schedule');
                if (res.ok) {
                    const data = await res.json();
                    // 백엔드가 { enabled, cronExpression } 형태를 반환함
                    setConfig(data);
                }
            } catch (err) {
                console.error("설정 로딩 실패:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
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

            if (!res.ok) throw new Error('저장 실패');

            const data = await res.json();
            if (data.success && data.config) {
                setConfig(data.config);
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            showError('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
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
                        <Calendar className="w-7 h-7 text-purple-600" />
                        자동 수집 스케줄러
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        봇이 자동으로 뉴스를 수집할 시간을 설정합니다.
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
                            저장 중...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            설정 저장
                        </>
                    )}
                </button>
            </header>

            {/* Success Message */}
            {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in-down">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                        스케줄 설정이 저장되었습니다.
                    </p>
                </div>
            )}

            {/* Main Control Panel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Power className={`w-5 h-5 ${config.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                        스케줄러 상태
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${config.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                            {config.enabled ? 'ON (작동 중)' : 'OFF (중지됨)'}
                        </span>
                        <button
                            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${config.enabled ? 'bg-green-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                <div className={`p-6 space-y-6 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Cron Expression Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            실행 시간 (Cron Expression)
                        </label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={config.cronExpression}
                                onChange={(e) => setConfig({ ...config, cronExpression: e.target.value })}
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm bg-gray-50"
                                placeholder="0 9,13,17 * * *"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            예시: <code>0 9,13,17 * * *</code> (매일 9시, 13시, 17시 정각 실행)
                        </p>
                    </div>

                    {/* Presets */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            빠른 설정 (Presets)
                        </label>
                        <div className="flex gap-2">
                            {[
                                { label: '매일 3회 (9,13,17시)', value: '0 9,13,17 * * *' },
                                { label: '매일 아침 (9시)', value: '0 9 * * *' },
                                { label: '매시간 정각', value: '0 * * * *' }
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => setConfig({ ...config, cronExpression: preset.value })}
                                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 bg-white shadow-sm"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm">스케줄러 안내</h4>
                        <ul className="mt-1 space-y-1 text-xs text-blue-800 list-disc list-inside">
                            <li>이 설정은 서버의 백그라운드 작업(Cron) 주기를 결정합니다.</li>
                            <li>Vercel 환경에서는 Cron Jobs 설정을 통해 실행됩니다. (`vercel.json` 참조)</li>
                            <li>Dry Run 모드가 아닌 <b>실제 수집(Production Mode)</b>으로 실행됩니다.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
