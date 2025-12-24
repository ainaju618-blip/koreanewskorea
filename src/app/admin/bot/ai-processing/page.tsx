"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Cpu, Play, Loader2, CheckCircle, XCircle,
    AlertCircle, Clock, ArrowLeft, RefreshCw,
    FileText, Zap, Power, Settings
} from "lucide-react";
import Link from "next/link";
import { useToast } from '@/components/ui/Toast';

interface Article {
    id: string;
    title: string;
    region?: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
    grade?: string;
    error?: string;
    processedAt?: string;
}

interface ProcessingStats {
    total: number;
    processed: number;
    published: number;
    held: number;
    failed: number;
    currentArticle?: string;
}

interface AutomationSettings {
    enabled: boolean;
    intervalMinutes: number;
    lastRun?: string;
    nextRun?: string;
}

export default function AIProcessingPage() {
    const { showSuccess, showError } = useToast();

    // State
    const [articles, setArticles] = useState<Article[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<ProcessingStats>({
        total: 0,
        processed: 0,
        published: 0,
        held: 0,
        failed: 0
    });
    const [loading, setLoading] = useState(true);
    const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Automation State
    const [automation, setAutomation] = useState<AutomationSettings>({
        enabled: false,
        intervalMinutes: 30
    });
    const [autoProcessing, setAutoProcessing] = useState(false);
    const automationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isProcessingRef = useRef(false);

    // Check Ollama status
    const checkOllama = useCallback(async () => {
        setOllamaStatus('checking');
        try {
            const res = await fetch('/api/bot/ollama-status');
            const data = await res.json();
            setOllamaStatus(data.online ? 'online' : 'offline');
        } catch {
            setOllamaStatus('offline');
        }
    }, []);

    // Load pending articles
    const loadPendingArticles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bot/pending-articles');
            const data = await res.json();

            if (data.articles) {
                setArticles(data.articles.map((a: { id: string; title: string; region?: string }) => ({
                    ...a,
                    status: 'pending' as const
                })));
                setStats(prev => ({ ...prev, total: data.articles.length }));
            }
        } catch (err) {
            console.error('Failed to load pending articles:', err);
            showError('대기중인 기사를 불러오지 못했습니다');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    // Initialize
    useEffect(() => {
        checkOllama();
        loadPendingArticles();
    }, [checkOllama, loadPendingArticles]);

    // Process single article
    const processArticle = async (article: Article): Promise<{ success: boolean; published: boolean; grade: string; error?: string }> => {
        try {
            const res = await fetch('/api/bot/process-single-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId: article.id })
            });
            return await res.json();
        } catch (err) {
            return {
                success: false,
                published: false,
                grade: 'D',
                error: err instanceof Error ? err.message : 'Unknown error'
            };
        }
    };

    // Start Ollama if not running
    const ensureOllamaRunning = async (): Promise<boolean> => {
        if (ollamaStatus === 'online') return true;

        setOllamaStatus('checking');
        showSuccess('Ollama를 시작하는 중... 잠시만 기다려주세요.');

        try {
            const res = await fetch('/api/bot/ollama-start', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                setOllamaStatus('online');
                showSuccess(data.alreadyRunning ? 'Ollama가 이미 실행 중입니다.' : 'Ollama가 시작되었습니다!');
                return true;
            } else {
                setOllamaStatus('offline');
                showError('Ollama 시작 실패: ' + data.error);
                return false;
            }
        } catch (err) {
            setOllamaStatus('offline');
            showError('Ollama 시작 중 오류 발생');
            return false;
        }
    };

    // Start processing all articles
    const startProcessing = async () => {
        if (isProcessing || articles.length === 0) return;

        // Auto-start Ollama if not running
        const ollamaReady = await ensureOllamaRunning();
        if (!ollamaReady) {
            showError('Ollama가 실행되지 않아 처리를 시작할 수 없습니다.');
            return;
        }

        setIsProcessing(true);
        setStats({
            total: articles.length,
            processed: 0,
            published: 0,
            held: 0,
            failed: 0
        });

        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];

            // Update status to processing
            setArticles(prev => prev.map((a, idx) =>
                idx === i ? { ...a, status: 'processing' as const } : a
            ));
            setStats(prev => ({ ...prev, currentArticle: article.title }));

            // Process article
            const result = await processArticle(article);

            // Update article status
            setArticles(prev => prev.map((a, idx) =>
                idx === i ? {
                    ...a,
                    status: result.success ? 'success' as const : 'failed' as const,
                    grade: result.grade,
                    error: result.error,
                    processedAt: new Date().toISOString()
                } : a
            ));

            // Update stats
            setStats(prev => ({
                ...prev,
                processed: prev.processed + 1,
                published: prev.published + (result.published ? 1 : 0),
                held: prev.held + (result.success && !result.published ? 1 : 0),
                failed: prev.failed + (result.success ? 0 : 1)
            }));

            // Small delay between articles
            if (i < articles.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        setIsProcessing(false);
        setStats(prev => ({ ...prev, currentArticle: undefined }));
        showSuccess(`처리 완료! 발행: ${stats.published}, 보류: ${stats.held}`);
    };

    // Reset and reload
    const resetAndReload = () => {
        setArticles([]);
        setStats({
            total: 0,
            processed: 0,
            published: 0,
            held: 0,
            failed: 0
        });
        loadPendingArticles();
    };

    // Auto-process when automation is enabled
    const runAutoProcess = useCallback(async () => {
        if (isProcessingRef.current) return;

        // Check if there are pending articles
        try {
            const res = await fetch('/api/bot/pending-count');
            const data = await res.json();

            if (data.count > 0) {
                console.log(`[Auto] Found ${data.count} pending articles, starting processing...`);
                setAutoProcessing(true);
                isProcessingRef.current = true;

                // Call the batch processing API
                const processRes = await fetch('/api/bot/run-ai-processing', { method: 'POST' });
                const processData = await processRes.json();

                if (processData.success) {
                    showSuccess(`자동 처리 완료: 발행 ${processData.published}, 보류 ${processData.held}`);
                }

                setAutomation(prev => ({
                    ...prev,
                    lastRun: new Date().toISOString()
                }));

                // Reload articles list
                loadPendingArticles();
            } else {
                console.log('[Auto] No pending articles');
            }
        } catch (err) {
            console.error('[Auto] Error:', err);
        } finally {
            setAutoProcessing(false);
            isProcessingRef.current = false;
        }
    }, [showSuccess, loadPendingArticles]);

    // Toggle automation
    const toggleAutomation = async () => {
        const newEnabled = !automation.enabled;

        if (newEnabled) {
            // Start automation
            const ollamaReady = await ensureOllamaRunning();
            if (!ollamaReady) {
                showError('Ollama가 실행되지 않아 자동화를 시작할 수 없습니다.');
                return;
            }

            // Run immediately first
            runAutoProcess();

            // Set up interval
            automationTimerRef.current = setInterval(() => {
                runAutoProcess();
            }, automation.intervalMinutes * 60 * 1000);

            showSuccess(`자동화 시작! ${automation.intervalMinutes}분마다 실행됩니다.`);
        } else {
            // Stop automation
            if (automationTimerRef.current) {
                clearInterval(automationTimerRef.current);
                automationTimerRef.current = null;
            }
            showSuccess('자동화가 중지되었습니다.');
        }

        setAutomation(prev => ({
            ...prev,
            enabled: newEnabled,
            nextRun: newEnabled
                ? new Date(Date.now() + automation.intervalMinutes * 60 * 1000).toISOString()
                : undefined
        }));
    };

    // Update interval
    const updateInterval = (minutes: number) => {
        setAutomation(prev => ({ ...prev, intervalMinutes: minutes }));

        // If automation is running, restart with new interval
        if (automation.enabled && automationTimerRef.current) {
            clearInterval(automationTimerRef.current);
            automationTimerRef.current = setInterval(() => {
                runAutoProcess();
            }, minutes * 60 * 1000);
            showSuccess(`간격이 ${minutes}분으로 변경되었습니다.`);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (automationTimerRef.current) {
                clearInterval(automationTimerRef.current);
            }
        };
    }, []);

    const progressPercent = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/bot/run"
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </Link>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Cpu className="w-7 h-7 text-blue-400" />
                            AI 처리 센터
                        </h1>
                        <span className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded">
                            무료 - 로컬 Ollama
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 ml-12">
                        모델: qwen3:14b | 2단계: 변환 + 검증
                    </p>
                </div>

                {/* Ollama Status */}
                <div className="flex items-center gap-2">
                    {ollamaStatus === 'checking' && (
                        <span className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Ollama 확인중...
                        </span>
                    )}
                    {ollamaStatus === 'online' && (
                        <span className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Ollama 온라인
                        </span>
                    )}
                    {ollamaStatus === 'offline' && (
                        <span className="flex items-center gap-2 text-red-400">
                            <XCircle className="w-4 h-4" />
                            Ollama 오프라인
                        </span>
                    )}
                    <button
                        onClick={checkOllama}
                        className="p-1.5 hover:bg-gray-700 rounded-lg"
                        title="Ollama 상태 새로고침"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </header>

            {/* Automation Panel */}
            <div className={`rounded-xl border p-4 ${
                automation.enabled
                    ? 'bg-green-900/30 border-green-500'
                    : 'bg-gray-800/50 border-gray-600'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Power className={`w-6 h-6 ${automation.enabled ? 'text-green-400' : 'text-gray-500'}`} />
                        <div>
                            <h3 className="font-bold text-white">자동 실행</h3>
                            <p className="text-sm text-gray-400">
                                {automation.enabled
                                    ? `${automation.intervalMinutes}분마다 자동 처리 (페이지 열려있어야 함)`
                                    : '대기중인 기사가 있으면 자동으로 AI 처리'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Interval Selector */}
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-400" />
                            <select
                                value={automation.intervalMinutes}
                                onChange={(e) => updateInterval(Number(e.target.value))}
                                disabled={autoProcessing}
                                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                            >
                                <option value={5}>5분</option>
                                <option value={10}>10분</option>
                                <option value={15}>15분</option>
                                <option value={30}>30분</option>
                                <option value={60}>1시간</option>
                            </select>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={toggleAutomation}
                            disabled={autoProcessing || ollamaStatus === 'checking'}
                            className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                                automation.enabled
                                    ? 'bg-red-600 hover:bg-red-500 text-white'
                                    : 'bg-green-600 hover:bg-green-500 text-white'
                            } ${autoProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {autoProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    처리중...
                                </>
                            ) : automation.enabled ? (
                                <>
                                    <Power className="w-4 h-4" />
                                    자동 실행 OFF
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    자동 실행 ON
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Last/Next Run Info */}
                {automation.enabled && (
                    <div className="mt-3 pt-3 border-t border-green-700/50 flex items-center gap-6 text-sm">
                        {automation.lastRun && (
                            <span className="text-gray-400">
                                마지막 실행: {new Date(automation.lastRun).toLocaleTimeString('ko-KR')}
                            </span>
                        )}
                        {automation.nextRun && (
                            <span className="text-green-400">
                                다음 실행: {new Date(automation.nextRun).toLocaleTimeString('ko-KR')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-gray-800/50 rounded-xl border border-gray-600 p-4">
                    <div className="text-sm text-gray-400">전체</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl border border-gray-600 p-4">
                    <div className="text-sm text-gray-400">처리됨</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.processed}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl border border-gray-600 p-4">
                    <div className="text-sm text-gray-400">발행됨</div>
                    <div className="text-2xl font-bold text-green-400">{stats.published}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl border border-gray-600 p-4">
                    <div className="text-sm text-gray-400">보류</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.held}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl border border-gray-600 p-4">
                    <div className="text-sm text-gray-400">실패</div>
                    <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                </div>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
                <div className="bg-blue-900/30 rounded-xl border border-blue-500 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                            처리중: {stats.currentArticle?.substring(0, 50)}...
                        </span>
                        <span className="text-sm text-gray-300">
                            {stats.processed} / {stats.total} ({progressPercent}%)
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
                <button
                    onClick={startProcessing}
                    disabled={isProcessing || articles.length === 0 || ollamaStatus === 'checking'}
                    className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                        isProcessing || articles.length === 0 || ollamaStatus === 'checking'
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg hover:shadow-xl'
                    }`}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            처리중 ({stats.processed}/{stats.total})
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5" />
                            AI 처리 시작
                        </>
                    )}
                </button>
                <button
                    onClick={resetAndReload}
                    disabled={isProcessing}
                    className="px-4 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    기사 새로고침
                </button>
            </div>

            {/* Articles List */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-600 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-600 bg-gray-700/50">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        대기중인 기사 ({articles.length})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        기사 불러오는 중...
                    </div>
                ) : articles.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        처리할 대기중인 기사가 없습니다
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700 max-h-[500px] overflow-y-auto">
                        {articles.map((article, idx) => (
                            <div
                                key={article.id}
                                className={`px-4 py-3 flex items-center gap-4 ${
                                    article.status === 'processing' ? 'bg-blue-900/30' : ''
                                }`}
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                    {article.status === 'pending' && (
                                        <Clock className="w-5 h-5 text-gray-500" />
                                    )}
                                    {article.status === 'processing' && (
                                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                    )}
                                    {article.status === 'success' && (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    )}
                                    {article.status === 'failed' && (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>

                                {/* Index */}
                                <span className="text-sm text-gray-500 w-8">
                                    #{idx + 1}
                                </span>

                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {article.title}
                                    </p>
                                    {article.error && (
                                        <p className="text-xs text-red-400 truncate">
                                            {article.error}
                                        </p>
                                    )}
                                </div>

                                {/* Region */}
                                <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded">
                                    {article.region || '미분류'}
                                </span>

                                {/* Grade */}
                                {article.grade && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                        article.grade === 'A' ? 'bg-green-600 text-white' :
                                        article.grade === 'B' ? 'bg-blue-600 text-white' :
                                        article.grade === 'C' ? 'bg-yellow-600 text-white' :
                                        'bg-red-600 text-white'
                                    }`}>
                                        {article.grade}등급
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Panel - Detailed */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-600 p-5">
                <h4 className="font-bold text-white flex items-center gap-2 text-lg mb-4">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    상세 안내
                </h4>

                <div className="grid grid-cols-2 gap-6 text-sm">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div>
                            <h5 className="font-semibold text-blue-400 mb-2">AI 처리 등급</h5>
                            <ul className="text-gray-300 space-y-1">
                                <li><span className="text-green-400 font-bold">A등급</span>: 팩트체크 통과 → 자동 발행</li>
                                <li><span className="text-blue-400 font-bold">B등급</span>: 경미한 이슈 → 자동 발행</li>
                                <li><span className="text-yellow-400 font-bold">C등급</span>: 숫자/날짜 불일치 → 보류 (재시도)</li>
                                <li><span className="text-red-400 font-bold">D등급</span>: 심각한 문제 → 보류 (수동 검토 필요)</li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-semibold text-blue-400 mb-2">재시도 로직</h5>
                            <ul className="text-gray-300 space-y-1">
                                <li>- C/D 등급 기사는 최대 <span className="text-white font-bold">3회 재시도</span></li>
                                <li>- 재시도마다 더 엄격한 프롬프트 적용</li>
                                <li>- 3회 실패 시에만 최종 보류 처리</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div>
                            <h5 className="font-semibold text-green-400 mb-2">자동 실행 모드</h5>
                            <ul className="text-gray-300 space-y-1">
                                <li>- <span className="text-white font-bold">자동 실행 ON</span> 클릭 → 자동화 시작</li>
                                <li>- 설정된 간격(5~60분)마다 대기 기사 확인</li>
                                <li>- 대기 기사 있으면 자동으로 AI 처리</li>
                                <li>- <span className="text-yellow-400">주의: 이 페이지가 열려있어야 동작</span></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-semibold text-blue-400 mb-2">처리 속도</h5>
                            <ul className="text-gray-300 space-y-1">
                                <li>- 기사당 약 <span className="text-white font-bold">40~100초</span> 소요</li>
                                <li>- 변환(20~50초) + 팩트체크(20~50초)</li>
                                <li>- Ollama 모델: qwen3:14b (로컬)</li>
                                <li>- <span className="text-green-400">무료!</span> API 비용 없음</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
