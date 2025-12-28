"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Play, Clock, Loader2, Zap, Calendar, CheckCircle, XCircle, Cpu, AlertCircle, ExternalLink, Power, Settings } from "lucide-react";
import { ScraperPanel, DbManagerPanel } from "./components";
import { useToast } from '@/components/ui/Toast';

interface AutomationStats {
    lastRun?: string;
    lastStatus?: string;
    todayProcessed?: number;
    todayPublished?: number;
    todayHeld?: number;
}

export default function BotRunPage() {
    const { showSuccess, showError } = useToast();
    // Scheduler State
    const [schedulerEnabled, setSchedulerEnabled] = useState(false);
    const [schedulerLoading, setSchedulerLoading] = useState(true);

    // Full Automation State
    const [automationEnabled, setAutomationEnabled] = useState(false);
    const [automationLoading, setAutomationLoading] = useState(true);
    const [automationStats, setAutomationStats] = useState<AutomationStats>({});

    // AI Processing State
    const [aiProcessing, setAiProcessing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Client-side AI Automation State
    const [aiAutoEnabled, setAiAutoEnabled] = useState(false);
    const [aiAutoInterval, setAiAutoInterval] = useState(30); // minutes
    const [aiNextRun, setAiNextRun] = useState<string | null>(null);
    const aiAutoTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isAiProcessingRef = useRef(false);

    // Load Scheduler Config
    useEffect(() => {
        console.log('[BotRunPage] Loading scheduler config...');
        fetch('/api/bot/schedule')
            .then(res => res.json())
            .then(data => {
                console.log('[BotRunPage] Scheduler config loaded:', data);
                setSchedulerEnabled(data.enabled);
                setSchedulerLoading(false);
            })
            .catch(err => {
                console.error('[BotRunPage] Failed to load schedule config:', err);
                setSchedulerLoading(false);
            });
    }, []);

    // Load Full Automation Config
    useEffect(() => {
        console.log('[BotRunPage] Loading full automation config...');
        fetch('/api/bot/full-automation')
            .then(res => {
                console.log('[BotRunPage] Full automation API response status:', res.status);
                return res.json();
            })
            .then(data => {
                console.log('[BotRunPage] Full automation config loaded:', data);
                setAutomationEnabled(data.enabled || false);
                setAutomationStats({
                    lastRun: data.lastRun?.timestamp,
                    lastStatus: data.lastRun?.status,
                    todayProcessed: data.todayStats?.processed || 0,
                    todayPublished: data.todayStats?.published || 0,
                    todayHeld: data.todayStats?.held || 0,
                });
                setAutomationLoading(false);
            })
            .catch(err => {
                console.error('[BotRunPage] Failed to load full automation config:', err);
                setAutomationLoading(false);
            });
    }, []);

    const toggleScheduler = async () => {
        const newState = !schedulerEnabled;
        console.log('[BotRunPage] Toggling scheduler:', { current: schedulerEnabled, new: newState });
        setSchedulerLoading(true);
        try {
            const res = await fetch('/api/bot/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: newState,
                    cronExpression: '0 9,13,17 * * *'
                })
            });
            const data = await res.json();
            console.log('[BotRunPage] Scheduler toggle response:', data);
            if (data.success) {
                setSchedulerEnabled(newState);
                showSuccess(newState ? 'Scheduler enabled' : 'Scheduler disabled');
            } else {
                showError('Failed to save: ' + data.message);
            }
        } catch (e) {
            console.error('[BotRunPage] Scheduler toggle error:', e);
            showError('Error saving settings');
        } finally {
            setSchedulerLoading(false);
        }
    };

    // Load pending articles count
    useEffect(() => {
        fetch('/api/bot/pending-count')
            .then(res => res.json())
            .then(data => {
                setPendingCount(data.count || 0);
            })
            .catch(err => console.error('Failed to load pending count:', err));
    }, []);

    // Run AI Processing on pending articles
    const runAiProcessing = useCallback(async () => {
        if (isAiProcessingRef.current) return;
        isAiProcessingRef.current = true;
        setAiProcessing(true);
        showSuccess('AI Processing started... This may take a while.');

        try {
            const res = await fetch('/api/bot/run-ai-processing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();

            if (data.success) {
                showSuccess(`AI Processing complete! Published: ${data.published}, Held: ${data.held}`);
                // Refresh pending count
                const countRes = await fetch('/api/bot/pending-count');
                const countData = await countRes.json();
                setPendingCount(countData.count || 0);
            } else {
                showError('AI Processing failed: ' + (data.message || data.error));
            }
        } catch (e) {
            console.error('AI Processing error:', e);
            showError('AI Processing error');
        } finally {
            setAiProcessing(false);
            isAiProcessingRef.current = false;
        }
    }, [showSuccess, showError]);

    // Calculate next run time
    const calculateNextRun = useCallback((intervalMinutes: number) => {
        const next = new Date(Date.now() + intervalMinutes * 60 * 1000);
        return next.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }, []);

    // Toggle client-side AI automation
    const toggleAiAutomation = useCallback(() => {
        const newEnabled = !aiAutoEnabled;
        setAiAutoEnabled(newEnabled);

        if (newEnabled) {
            // Start automation
            console.log(`[AI Auto] Starting with ${aiAutoInterval} min interval`);
            showSuccess(`AI Automation ON (${aiAutoInterval}min interval)`);

            // Run immediately
            runAiProcessing();
            setAiNextRun(calculateNextRun(aiAutoInterval));

            // Set interval
            aiAutoTimerRef.current = setInterval(() => {
                console.log('[AI Auto] Interval triggered');
                runAiProcessing();
                setAiNextRun(calculateNextRun(aiAutoInterval));
            }, aiAutoInterval * 60 * 1000);
        } else {
            // Stop automation
            console.log('[AI Auto] Stopping');
            if (aiAutoTimerRef.current) {
                clearInterval(aiAutoTimerRef.current);
                aiAutoTimerRef.current = null;
            }
            setAiNextRun(null);
            showSuccess('AI Automation OFF');
        }
    }, [aiAutoEnabled, aiAutoInterval, runAiProcessing, calculateNextRun, showSuccess]);

    // Update interval (restart timer if running)
    const updateAiInterval = useCallback((newInterval: number) => {
        setAiAutoInterval(newInterval);

        if (aiAutoEnabled && aiAutoTimerRef.current) {
            // Restart with new interval
            clearInterval(aiAutoTimerRef.current);
            setAiNextRun(calculateNextRun(newInterval));

            aiAutoTimerRef.current = setInterval(() => {
                runAiProcessing();
                setAiNextRun(calculateNextRun(newInterval));
            }, newInterval * 60 * 1000);

            showSuccess(`Interval changed to ${newInterval} min`);
        }
    }, [aiAutoEnabled, runAiProcessing, calculateNextRun, showSuccess]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (aiAutoTimerRef.current) {
                clearInterval(aiAutoTimerRef.current);
            }
        };
    }, []);

    const toggleAutomation = async () => {
        const newState = !automationEnabled;
        console.log('[BotRunPage] Toggling full automation:', { current: automationEnabled, new: newState });
        setAutomationLoading(true);
        try {
            console.log('[BotRunPage] Sending POST to /api/bot/full-automation...');
            const res = await fetch('/api/bot/full-automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newState })
            });
            console.log('[BotRunPage] Full automation toggle response status:', res.status);
            const data = await res.json();
            console.log('[BotRunPage] Full automation toggle response data:', data);
            if (data.success) {
                setAutomationEnabled(newState);
                showSuccess(newState ? 'Full Automation ENABLED' : 'Full Automation DISABLED');
            } else {
                showError('Failed to save: ' + (data.message || data.error));
            }
        } catch (e) {
            console.error('[BotRunPage] Full automation toggle error:', e);
            showError('Error saving automation settings');
        } finally {
            setAutomationLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
                    <Play className="w-7 h-7 text-blue-500" />
                    스크래퍼 관리
                </h1>
                <p className="text-sm text-[#8b949e] mt-2">
                    왼쪽: 뉴스 수집 실행 | 오른쪽: DB 정리 (중복 방지용)
                </p>
            </header>

            {/* Full Automation Panel - NEW */}
            <div className={`rounded-xl border-2 shadow-sm p-4 ${automationEnabled ? 'bg-orange-900/30 border-orange-500' : 'bg-gray-800/50 border-gray-600'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Zap className={`w-5 h-5 ${automationEnabled ? 'text-orange-400' : 'text-gray-400'}`} />
                            완전 자동화
                            {automationEnabled && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full animate-pulse">
                                    활성
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-gray-300 mt-1">
                            활성화 시 Windows 작업 스케줄러가 매시간 실행 (09:30~20:30)
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>스케줄: 09:30, 10:30, 11:30, ... 20:30 (하루 12회)</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {automationLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                            <>
                                <span className={`text-sm font-bold ${automationEnabled ? 'text-orange-400' : 'text-gray-500'}`}>
                                    {automationEnabled ? 'ON' : 'OFF'}
                                </span>
                                <button
                                    onClick={toggleAutomation}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${automationEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${automationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                {automationStats.lastRun && (
                    <div className="mt-3 pt-3 border-t border-gray-600 grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">마지막 실행:</span>
                            <span className="ml-1 font-medium text-white">{automationStats.lastRun}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {automationStats.lastStatus === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className={automationStats.lastStatus === 'success' ? 'text-green-400' : 'text-red-400'}>
                                {automationStats.lastStatus === 'success' ? '성공' : '실패'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400">오늘 발행:</span>
                            <span className="ml-1 font-bold text-green-400">{automationStats.todayPublished || 0}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">보류:</span>
                            <span className="ml-1 font-bold text-yellow-400">{automationStats.todayHeld || 0}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Processing Panel - Local Ollama */}
            <div className={`rounded-xl border-2 shadow-sm p-4 ${aiAutoEnabled ? 'border-cyan-400 bg-cyan-900/30' : 'border-blue-400 bg-blue-900/30'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-blue-400" />
                            로컬 AI 처리 (Ollama)
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded">
                                무료
                            </span>
                            {aiAutoEnabled && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-cyan-500 text-white rounded-full animate-pulse">
                                    자동
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-gray-300 mt-1">
                            2단계: 변환 + 검증 | 한국어 뉴스 모델 (linkbricks)
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                                <AlertCircle className="w-4 h-4 text-orange-400" />
                                <span className="text-sm font-medium text-orange-400">
                                    대기중 {pendingCount}건
                                </span>
                            </div>
                            <div className="text-xs text-gray-400">
                                A/B등급 = 자동발행 | C/D등급 = 재시도(최대3회)
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/bot/ai-processing"
                            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-gray-700 text-white hover:bg-gray-600 transition-all border border-gray-500"
                        >
                            <ExternalLink className="w-4 h-4" />
                            상세설정
                        </Link>
                        <button
                            onClick={runAiProcessing}
                            disabled={aiProcessing || pendingCount === 0}
                            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                                aiProcessing
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : pendingCount === 0
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg hover:shadow-xl'
                            }`}
                        >
                            {aiProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    처리중...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    AI 실행
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Client-side AI Automation Controls */}
                <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Power className={`w-4 h-4 ${aiAutoEnabled ? 'text-cyan-400' : 'text-gray-400'}`} />
                                <span className="text-sm text-gray-300">클라이언트 자동화</span>
                            </div>
                            {/* Interval selector */}
                            <select
                                value={aiAutoInterval}
                                onChange={(e) => updateAiInterval(Number(e.target.value))}
                                className="px-2 py-1 text-sm bg-gray-700 border border-gray-500 rounded text-white"
                            >
                                <option value={5}>5분</option>
                                <option value={10}>10분</option>
                                <option value={15}>15분</option>
                                <option value={30}>30분</option>
                                <option value={60}>60분</option>
                            </select>
                            {aiNextRun && (
                                <span className="text-xs text-cyan-400">
                                    다음: {aiNextRun}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${aiAutoEnabled ? 'text-cyan-400' : 'text-gray-500'}`}>
                                {aiAutoEnabled ? 'ON' : 'OFF'}
                            </span>
                            <button
                                onClick={toggleAiAutomation}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${aiAutoEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiAutoEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        * 브라우저가 열려있어야 동작 | Windows 스케줄러와 독립적
                    </p>
                </div>
            </div>

            {/* Scheduler Panel */}
            <div className="rounded-xl border border-gray-600 shadow-sm p-4 flex items-center justify-between bg-gray-800/50">
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        자동 수집 스케줄러 (Windows Task Scheduler)
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Windows 작업 스케줄러로 자동 수집 + AI 처리
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {schedulerLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                        <>
                            <span className={`text-sm font-bold ${schedulerEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                                {schedulerEnabled ? 'ON' : 'OFF'}
                            </span>
                            <button
                                onClick={toggleScheduler}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${schedulerEnabled ? 'bg-purple-600' : 'bg-gray-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedulerEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <a
                                href="/admin/bot/schedule"
                                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
                            >
                                설정
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* 2단 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽: 스크래퍼 실행 */}
                <div>
                    <ScraperPanel />
                </div>

                {/* 오른쪽: DB 관리 */}
                <div>
                    <DbManagerPanel />
                </div>
            </div>
        </div>
    );
}
