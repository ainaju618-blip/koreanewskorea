"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Radio,
    Power,
    PowerOff,
    Activity,
    Clock,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Zap,
    TrendingUp,
    Eye,
    Settings,
    Trash2,
    ChevronDown,
    ChevronUp,
    Cpu
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmModal";

interface MonitorStatus {
    is_running: boolean;
    started_at: string | null;
    stopped_at: string | null;
    started_by: string | null;
    total_checks: number;
    total_articles_found: number;
    total_articles_collected: number;
    last_check_at: string | null;
    last_article_at: string | null;
    config: {
        // Schedule-based config (used by --scheduler mode)
        schedule?: string[];           // e.g., ['09:00', '12:00', '15:00', '18:00']
        cycles_per_run?: number;       // cycles per scheduled time (default: 3)
        force_check?: boolean;         // flag for immediate check request
        force_check_at?: string | null; // timestamp of force_check request
        // Legacy interval-based config (still supported)
        peak_interval?: number;
        default_interval?: number;
        working_hours_start?: number;
        working_hours_end?: number;
    };
}

interface RegionStat {
    region_code: string;
    last_check_at: string | null;
    last_article_at: string | null;
    total_articles: number;
}

interface ActivityLog {
    id: string;
    event_type: string;
    region_code: string | null;
    message: string;
    details: Record<string, unknown>;
    created_at: string;
}

interface TodaySummary {
    checks: number;
    newArticles: number;
    scrapes: number;
    blocks: number;
    errors: number;
}

const REGION_NAMES: Record<string, string> = {
    gwangju: "광주광역시",
    jeonnam: "전라남도",
    mokpo: "목포시",
    yeosu: "여수시",
    suncheon: "순천시",
    naju: "나주시",
    gwangyang: "광양시",
    damyang: "담양군",
    gokseong: "곡성군",
    gurye: "구례군",
    goheung: "고흥군",
    boseong: "보성군",
    hwasun: "화순군",
    jangheung: "장흥군",
    gangjin: "강진군",
    haenam: "해남군",
    yeongam: "영암군",
    muan: "무안군",
    hampyeong: "함평군",
    yeonggwang: "영광군",
    jangseong: "장성군",
    wando: "완도군",
    jindo: "진도군",
    shinan: "신안군",
    gwangju_edu: "광주교육청",
    jeonnam_edu: "전남교육청",
};

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    check: { label: "점검", color: "text-blue-600", bgColor: "bg-blue-100", icon: <Eye className="w-3 h-3" /> },
    new_article: { label: "새글 감지", color: "text-green-600", bgColor: "bg-green-100", icon: <Zap className="w-3 h-3" /> },
    scrape: { label: "추출", color: "text-purple-600", bgColor: "bg-purple-100", icon: <Activity className="w-3 h-3" /> },
    ai: { label: "AI 가공", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <TrendingUp className="w-3 h-3" /> },
    publish: { label: "발행", color: "text-emerald-600", bgColor: "bg-emerald-100", icon: <CheckCircle className="w-3 h-3" /> },
    block: { label: "차단", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-3 h-3" /> },
    error: { label: "오류", color: "text-orange-600", bgColor: "bg-orange-100", icon: <AlertTriangle className="w-3 h-3" /> },
    start: { label: "시작", color: "text-green-600", bgColor: "bg-green-100", icon: <Power className="w-3 h-3" /> },
    stop: { label: "중지", color: "text-gray-600", bgColor: "bg-gray-100", icon: <PowerOff className="w-3 h-3" /> },
};

export default function RealtimeMonitorPage() {
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirm();
    const [status, setStatus] = useState<MonitorStatus | null>(null);
    const [regions, setRegions] = useState<RegionStat[]>([]);
    const [blockedRegions, setBlockedRegions] = useState<string[]>([]);
    const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showFullLog, setShowFullLog] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const liveFeedRef = useRef<HTMLDivElement>(null);
    const prevActivityLength = useRef(0);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/bot/realtime-monitor?activity=true&limit=100");
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setStatus(data.status);
            setRegions(data.regions || []);
            setBlockedRegions(data.blockedRegions || []);
            setTodaySummary(data.todaySummary);
            setActivity(data.activity || []);
            setImmediateCheckRunning(data.immediateCheckRunning || false);

            // Auto-scroll to bottom on new activity
            if (data.activity && data.activity.length > prevActivityLength.current) {
                prevActivityLength.current = data.activity.length;
                setTimeout(() => {
                    if (liveFeedRef.current) {
                        liveFeedRef.current.scrollTop = 0;
                    }
                }, 100);
            }
        } catch (err) {
            console.error("Failed to fetch monitor data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        if (autoRefresh) {
            // 3 seconds when running, 10 seconds when stopped
            const intervalMs = status?.is_running ? 3000 : 10000;
            const interval = setInterval(fetchData, intervalMs);
            return () => clearInterval(interval);
        }
    }, [fetchData, autoRefresh, status?.is_running]);

    const handleToggle = async () => {
        if (!status) return;

        setToggling(true);
        try {
            const action = status.is_running ? "stop" : "start";
            const res = await fetch("/api/bot/realtime-monitor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, startedBy: "admin" }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setStatus(data.status);
            showSuccess(status.is_running ? "모니터링이 중지되었습니다" : "모니터링이 시작되었습니다");
            fetchData();
        } catch (err) {
            showError("상태 변경 실패: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setToggling(false);
        }
    };

    const handleClearLogs = async () => {
        const confirmed = await confirm({
            title: "로그 삭제",
            message: "7일 이상 된 로그를 삭제하시겠습니까?",
            type: "warning",
            confirmText: "삭제",
            cancelText: "취소",
        });
        if (!confirmed) return;

        try {
            const res = await fetch("/api/bot/realtime-monitor?days=7", { method: "DELETE" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            showSuccess("로그가 정리되었습니다");
            fetchData();
        } catch (err) {
            showError("로그 정리 실패");
        }
    };

    const [immediateCheckRunning, setImmediateCheckRunning] = useState(false);
    const [checkingNow, setCheckingNow] = useState(false);
    const handleCheckNow = async () => {
        setCheckingNow(true);
        try {
            const res = await fetch("/api/bot/realtime-monitor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "check_now", startedBy: "admin" }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Update immediate check state from response
            if (typeof data.immediateCheckRunning === 'boolean') {
                setImmediateCheckRunning(data.immediateCheckRunning);
            }

            if (data.immediateCheckRunning) {
                showSuccess("즉시 점검이 시작되었습니다! (3회 반복)");
            } else if (data.message?.includes('stopped')) {
                showSuccess("즉시 점검이 중지되었습니다.");
            } else {
                showSuccess("즉시 점검이 요청되었습니다!");
            }
            fetchData();
        } catch (err) {
            showError("즉시 점검 요청 실패: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setCheckingNow(false);
        }
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (minutes < 1) return "방금";
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        return `${Math.floor(hours / 24)}일 전`;
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Radio className="w-6 h-6 text-blue-400" />
                    <h1 className="text-xl font-bold text-white">24시간 상시 모니터링</h1>
                    {status?.is_running && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-900/50 text-green-400 rounded-full text-xs font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            실행중
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {/* Large Current Time Display */}
                    <div className="text-right">
                        <div className="text-3xl font-mono font-bold text-white tabular-nums">
                            {currentTime.toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                            })}
                        </div>
                        <div className="text-xs text-gray-400">
                            {currentTime.toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                weekday: "short",
                            })}
                        </div>
                    </div>
                    <div className="h-10 w-px bg-gray-600" />
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-white">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded"
                            />
                            자동 새로고침
                        </label>
                        <button
                            onClick={fetchData}
                            className="p-2 hover:bg-gray-700 rounded text-white"
                            title="새로고침"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Control Panel */}
            <div className="bg-[#161b22] border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-shrink-0">
                        <h2 className="text-lg font-semibold mb-1 text-white">모니터링 제어</h2>
                        <p className="text-sm text-gray-300">
                            {status?.is_running
                                ? `${formatTime(status.started_at)} 시작됨`
                                : status?.stopped_at
                                ? `${formatTime(status.stopped_at)} 중지됨`
                                : "아직 시작되지 않음"}
                        </p>
                    </div>
                    {/* Center Large Time Display */}
                    <div className="flex-1 flex justify-center">
                        <div className="text-center">
                            <div className="text-5xl font-mono font-bold text-white tabular-nums tracking-wider">
                                {currentTime.toLocaleTimeString("ko-KR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                })}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                                {currentTime.toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    weekday: "long",
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                        {/* Immediate Check Toggle Button */}
                        <button
                            onClick={handleCheckNow}
                            disabled={checkingNow}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                immediateCheckRunning
                                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                                    : "bg-yellow-500 hover:bg-yellow-600 text-black"
                            }`}
                            title={
                                immediateCheckRunning
                                    ? "점검 중지"
                                    : status?.is_running
                                    ? "데몬에 즉시 점검 요청"
                                    : "일회성 점검 실행 (3회 반복)"
                            }
                        >
                            {checkingNow ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : immediateCheckRunning ? (
                                <XCircle className="w-5 h-5" />
                            ) : (
                                <Zap className="w-5 h-5" />
                            )}
                            {immediateCheckRunning ? "점검 중지" : "즉시 점검"}
                        </button>
                        {/* Start/Stop Button */}
                        <button
                            onClick={handleToggle}
                            disabled={toggling}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                                status?.is_running
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                            } disabled:opacity-50`}
                        >
                            {toggling ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : status?.is_running ? (
                                <PowerOff className="w-5 h-5" />
                            ) : (
                                <Power className="w-5 h-5" />
                            )}
                            {status?.is_running ? "모니터링 중지" : "모니터링 시작"}
                        </button>
                    </div>
                </div>

                {/* Config */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                    >
                        <Settings className="w-4 h-4" />
                        시간대별 점검 스케줄
                        {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showSettings && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-orange-900/30 border border-orange-700/50 p-3 rounded">
                                <div className="text-orange-400 text-xs font-medium">아침 러시</div>
                                <div className="font-bold text-orange-300 text-lg">06:00 ~ 09:00</div>
                                <div className="text-orange-400/70 text-xs mt-1">30분마다 점검</div>
                            </div>
                            <div className="bg-blue-900/30 border border-blue-700/50 p-3 rounded">
                                <div className="text-blue-400 text-xs font-medium">업무시간</div>
                                <div className="font-bold text-blue-300 text-lg">09:00 ~ 18:00</div>
                                <div className="text-blue-400/70 text-xs mt-1">1시간마다 점검</div>
                            </div>
                            <div className="bg-green-900/30 border border-green-700/50 p-3 rounded">
                                <div className="text-green-400 text-xs font-medium">저녁 러시</div>
                                <div className="font-bold text-green-300 text-lg">18:00 ~ 22:00</div>
                                <div className="text-green-400/70 text-xs mt-1">30분마다 점검</div>
                            </div>
                            <div className="bg-gray-800 border border-gray-700 p-3 rounded">
                                <div className="text-gray-400 text-xs font-medium">야간</div>
                                <div className="font-bold text-gray-300 text-lg">22:00 ~ 06:00</div>
                                <div className="text-gray-500 text-xs mt-1">2시간마다 점검</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Real-time Status Display */}
            {status?.is_running ? (
                (() => {
                    // Determine if actively checking or waiting
                    const lastActivity = activity[0];
                    const isActivelyChecking = lastActivity &&
                        ["check", "new_article", "scrape", "ai", "publish"].includes(lastActivity.event_type) &&
                        (Date.now() - new Date(lastActivity.created_at).getTime()) < 60000; // Within last 1 minute

                    // Calculate next check time based on schedule (matches Python get_check_interval())
                    const currentHour = currentTime.getHours();
                    let intervalMinutes = 60; // default
                    let scheduleLabel = "업무시간";
                    if (currentHour >= 6 && currentHour < 9) {
                        // Morning news rush: 30 min interval
                        intervalMinutes = 30;
                        scheduleLabel = "아침 러시 (30분 간격)";
                    } else if (currentHour >= 9 && currentHour < 18) {
                        // Business hours: 1 hour interval
                        intervalMinutes = 60;
                        scheduleLabel = "업무시간 (1시간 간격)";
                    } else if (currentHour >= 18 && currentHour < 22) {
                        // Evening news rush: 30 min interval
                        intervalMinutes = 30;
                        scheduleLabel = "저녁 러시 (30분 간격)";
                    } else {
                        // Night time (22:00~06:00): 2 hour interval
                        intervalMinutes = 120;
                        scheduleLabel = "야간 (2시간 간격)";
                    }

                    return isActivelyChecking ? (
                        // Actively checking - green gradient
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-full">
                                    <Cpu className="w-7 h-7 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-medium">
                                        <span className="text-white">현재시간 {currentTime.toLocaleTimeString("ko-KR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                            hour12: false,
                                        })}</span>
                                        <span className="mx-3 text-green-300">|</span>
                                        <span className="text-yellow-300 font-bold">🔍 점검 중</span>
                                    </div>
                                    <div className="text-xl font-bold mt-1">
                                        {lastActivity?.region_code ?
                                            `${REGION_NAMES[lastActivity.region_code] || lastActivity.region_code} ${lastActivity.message}` :
                                            lastActivity?.message || "점검 진행 중..."}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs opacity-70">진행 중</div>
                                    <div className="text-lg font-mono font-medium">
                                        {lastActivity ? new Date(lastActivity.created_at).toLocaleTimeString("ko-KR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        }) : "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Waiting for next check - blue gradient
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-full">
                                    <Clock className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-medium">
                                        <span className="text-white">현재시간 {currentTime.toLocaleTimeString("ko-KR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                            hour12: false,
                                        })}</span>
                                        <span className="mx-3 text-blue-300">|</span>
                                        <span className="text-cyan-300">⏳ 대기 중</span>
                                        <span className="mx-2 text-blue-300">|</span>
                                        <span className="text-blue-200 text-sm">{scheduleLabel}</span>
                                    </div>
                                    <div className="text-xl font-bold mt-1">
                                        {intervalMinutes === 0 ?
                                            "야간 시간대 - 07:00까지 모니터링 중지" :
                                            `다음 점검까지 대기 중 (${intervalMinutes}분 간격)`}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs opacity-70">마지막 활동</div>
                                    <div className="text-lg font-mono font-medium">
                                        {lastActivity ? new Date(lastActivity.created_at).toLocaleTimeString("ko-KR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        }) : "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()
            ) : (
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full">
                            <Clock className="w-5 h-5 opacity-60" />
                        </div>
                        <div className="flex-1">
                            <div className="text-lg font-medium">
                                {(() => {
                                    const startHour = status?.config?.working_hours_start || 8;
                                    const currentHour = currentTime.getHours();

                                    const timeStr = currentTime.toLocaleTimeString("ko-KR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: false,
                                    });

                                    if (currentHour < startHour) {
                                        // Calculate total seconds until start
                                        const targetTime = new Date(currentTime);
                                        targetTime.setHours(startHour, 0, 0, 0);
                                        const diffMs = targetTime.getTime() - currentTime.getTime();
                                        const totalSeconds = Math.floor(diffMs / 1000);
                                        const hours = Math.floor(totalSeconds / 3600);
                                        const mins = Math.floor((totalSeconds % 3600) / 60);
                                        const secs = totalSeconds % 60;

                                        if (hours > 0) {
                                            return (
                                                <>
                                                    <span className="text-white">현재시간 {timeStr}</span>
                                                    <span className="mx-2 text-gray-400">|</span>
                                                    <span className="text-yellow-300">모니터링 시간이 {hours}시간 {mins}분 {secs}초 남았습니다</span>
                                                </>
                                            );
                                        }
                                        return (
                                            <>
                                                <span className="text-white">현재시간 {timeStr}</span>
                                                <span className="mx-2 text-gray-400">|</span>
                                                <span className="text-yellow-300">모니터링 시간이 {mins}분 {secs}초 남았습니다</span>
                                            </>
                                        );
                                    }
                                    return (
                                        <>
                                            <span className="text-white">현재시간 {timeStr}</span>
                                            <span className="mx-2 text-gray-400">|</span>
                                            <span className="text-gray-300">대기 중 - {startHour}시에 모니터링 시작합니다</span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Today Summary */}
            {todaySummary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">점검</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{todaySummary.checks}</div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-400 mb-1">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm">새 기사</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{todaySummary.newArticles}</div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-purple-400 mb-1">
                            <Activity className="w-4 h-4" />
                            <span className="text-sm">수집</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{todaySummary.scrapes}</div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-400 mb-1">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">차단</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{todaySummary.blocks}</div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-orange-400 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">오류</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{todaySummary.errors}</div>
                    </div>
                </div>
            )}

            {/* Region Status */}
            <div className="bg-[#161b22] border border-gray-700 rounded-lg">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="font-semibold text-white">지역별 상태</h2>
                    <span className="text-sm text-gray-400">{regions.length}개 지역</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-300">지역</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-300">마지막 점검</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-300">마지막 기사</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-300">수집 기사</th>
                                <th className="px-4 py-2 text-center font-medium text-gray-300">상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regions.map((region) => (
                                <tr key={region.region_code} className="border-t border-gray-700 hover:bg-gray-800">
                                    <td className="px-4 py-2 font-medium text-white">
                                        {REGION_NAMES[region.region_code] || region.region_code}
                                    </td>
                                    <td className="px-4 py-2 text-gray-300">
                                        {formatTimeAgo(region.last_check_at)}
                                    </td>
                                    <td className="px-4 py-2 text-gray-300">
                                        {formatTimeAgo(region.last_article_at)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-white">{region.total_articles}</td>
                                    <td className="px-4 py-2 text-center">
                                        {blockedRegions.includes(region.region_code) ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs">
                                                <XCircle className="w-3 h-3" />
                                                차단
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">
                                                <CheckCircle className="w-3 h-3" />
                                                정상
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {regions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                        아직 데이터가 없습니다
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Live Feed */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
                    <div className="flex items-center gap-2">
                        {status?.is_running && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-red-400 font-medium text-sm">LIVE</span>
                            </span>
                        )}
                        <h2 className="font-semibold text-gray-200">실시간 피드</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFullLog(!showFullLog)}
                            className="text-xs text-gray-400 hover:text-white"
                        >
                            {showFullLog ? "간략히" : "전체 보기"}
                        </button>
                        <button
                            onClick={handleClearLogs}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div
                    ref={liveFeedRef}
                    className={`overflow-y-auto font-mono text-sm ${showFullLog ? "max-h-[600px]" : "max-h-[300px]"}`}
                >
                    {activity.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>모니터링을 시작하면 실시간 로그가 표시됩니다</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {activity.map((log) => {
                                const eventConfig = EVENT_TYPE_LABELS[log.event_type] || {
                                    label: log.event_type,
                                    color: "text-gray-400",
                                    bgColor: "bg-gray-700",
                                    icon: null,
                                };
                                const time = new Date(log.created_at);
                                const timeStr = time.toLocaleTimeString("ko-KR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                });

                                return (
                                    <div
                                        key={log.id}
                                        className="px-4 py-2 hover:bg-gray-800/50 flex items-start gap-3"
                                    >
                                        <span className="text-gray-500 text-xs whitespace-nowrap pt-0.5">
                                            {timeStr}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${eventConfig.bgColor} ${eventConfig.color}`}
                                        >
                                            {eventConfig.icon}
                                            {eventConfig.label}
                                        </span>
                                        {log.region_code && (
                                            <span className="text-cyan-400 text-xs whitespace-nowrap">
                                                [{REGION_NAMES[log.region_code] || log.region_code}]
                                            </span>
                                        )}
                                        <span className="text-gray-300 flex-1">{log.message}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* System Status and Current Settings */}
            <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-400" />
                    현재 시스템 상태
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Settings */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">현재 점검 간격 설정</div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">피크 시간대:</span>
                                <span className="text-green-400 font-bold">{status?.config?.peak_interval || 15}분</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">기본 시간대:</span>
                                <span className="text-blue-400 font-bold">{status?.config?.default_interval || 60}분</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">운영 시간:</span>
                                <span className="text-white">{status?.config?.working_hours_start || 8}시 ~ {status?.config?.working_hours_end || 19}시</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Status */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">현재 상태</div>
                        {status?.is_running ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-400 font-bold text-lg">점검 진행 중</span>
                                </div>
                                {/* Show current region being checked */}
                                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded p-2">
                                    {activity[0]?.region_code ? (
                                        <div className="text-center">
                                            <div className="text-yellow-400 font-bold text-lg">
                                                {REGION_NAMES[activity[0].region_code] || activity[0].region_code}
                                            </div>
                                            <div className="text-yellow-300/70 text-xs mt-1">
                                                {activity[0].event_type === "check" && "점검 중"}
                                                {activity[0].event_type === "new_article" && "새 기사 감지!"}
                                                {activity[0].event_type === "scrape" && "기사 추출 중"}
                                                {activity[0].event_type === "ai" && "AI 가공 중"}
                                                {activity[0].event_type === "publish" && "기사 발행 완료"}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            27개 지자체 순차 점검 대기
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-gray-500 rounded-full" />
                                    <span className="text-gray-400 font-bold text-lg">대기 중</span>
                                </div>
                                <div className="text-gray-300 text-sm">
                                    시작 버튼을 클릭하면 모니터링이 시작됩니다
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Check Schedule */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">점검 스케줄</div>
                        {status?.is_running ? (
                            <div className="space-y-3">
                                {(() => {
                                    const lastCheckTime = status?.last_check_at ? new Date(status.last_check_at) : null;
                                    const interval = status?.config?.default_interval || 60;

                                    if (lastCheckTime) {
                                        const nextCheckTime = new Date(lastCheckTime.getTime() + interval * 60 * 1000);
                                        const diffMs = nextCheckTime.getTime() - currentTime.getTime();
                                        const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                                        const diffSecs = Math.max(0, Math.floor((diffMs % 60000) / 1000));

                                        return (
                                            <>
                                                {/* Previous Check */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-400 text-sm">이전 점검:</span>
                                                    <span className="text-gray-300 font-mono">
                                                        {lastCheckTime.toLocaleTimeString("ko-KR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                            hour12: false,
                                                        })}
                                                    </span>
                                                </div>
                                                {/* Next Check */}
                                                <div className="flex items-center justify-between border-t border-gray-700 pt-2">
                                                    <span className="text-gray-400 text-sm">다음 점검:</span>
                                                    <span className="text-yellow-400 font-mono font-bold">
                                                        {nextCheckTime.toLocaleTimeString("ko-KR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                            hour12: false,
                                                        })}
                                                    </span>
                                                </div>
                                                {/* Countdown */}
                                                <div className="bg-yellow-900/30 rounded p-2 text-center">
                                                    <span className="text-yellow-300 font-bold">
                                                        {diffMins}분 {diffSecs}초 후 점검
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    }
                                    return (
                                        <div className="text-gray-300 text-center">첫 점검 준비 중...</div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-center">
                                모니터링 중지됨<br />
                                <span className="text-sm">시작 버튼을 클릭하세요</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Usage Guide */}
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-5 text-sm">
                <h3 className="font-semibold mb-4 text-blue-300 text-lg">시스템 동작 방식 안내</h3>

                {/* Mode Explanation */}
                <div className="mb-5 p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="text-white font-bold mb-3">1. 대기 vs 점검 차이점</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 p-3 rounded">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-3 h-3 bg-gray-500 rounded-full" />
                                <span className="text-gray-300 font-bold">대기 상태</span>
                            </div>
                            <ul className="text-gray-300 space-y-1 ml-5">
                                <li>• 다음 점검 시간까지 기다리는 중</li>
                                <li>• 서버 자원을 거의 사용하지 않음</li>
                                <li>• 카운트다운 표시됨</li>
                            </ul>
                        </div>
                        <div className="bg-green-900/30 p-3 rounded">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-green-400 font-bold">점검(모니터링) 상태</span>
                            </div>
                            <ul className="text-gray-300 space-y-1 ml-5">
                                <li>• 27개 지자체 사이트 순차 방문</li>
                                <li>• 새 기사 있는지 확인</li>
                                <li>• 새 기사 발견 시 자동 수집</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Process Flow */}
                <div className="mb-5 p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="text-white font-bold mb-3">2. 점검 진행 과정</h4>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded">① 사이트 접속</span>
                        <span className="text-gray-500">→</span>
                        <span className="bg-green-600 text-white px-3 py-1 rounded">② 새 기사 확인</span>
                        <span className="text-gray-500">→</span>
                        <span className="bg-purple-600 text-white px-3 py-1 rounded">③ 기사 추출</span>
                        <span className="text-gray-500">→</span>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded">④ AI 가공</span>
                        <span className="text-gray-500">→</span>
                        <span className="bg-emerald-600 text-white px-3 py-1 rounded">⑤ 기사 발행</span>
                    </div>
                    <p className="text-gray-400 mt-3">
                        27개 지자체를 순서대로 점검합니다. 한 지역당 약 2~5초 소요되며,
                        전체 점검에 약 1~3분 소요됩니다.
                    </p>
                </div>

                {/* Interval Explanation */}
                <div className="mb-5 p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="text-white font-bold mb-3">3. 점검 간격 설정</h4>
                    <div className="space-y-2 text-gray-300">
                        <div className="flex items-center gap-3">
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold w-24 text-center">피크 시간</span>
                            <span><strong className="text-white">{status?.config?.peak_interval || 15}분</strong> 간격으로 점검 (기사가 자주 올라오는 시간대)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold w-24 text-center">기본 시간</span>
                            <span><strong className="text-white">{status?.config?.default_interval || 60}분</strong> 간격으로 점검 (그 외 시간대)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs font-bold w-24 text-center">운영 시간</span>
                            <span><strong className="text-white">{status?.config?.working_hours_start || 8}:00 ~ {status?.config?.working_hours_end || 19}:00</strong> (이 시간 외에는 점검 빈도 감소)</span>
                        </div>
                    </div>
                </div>

                {/* Quick Reference */}
                <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="text-white font-bold mb-3">4. 상태 표시 의미</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">점검</span>
                            <span className="text-gray-300">사이트 확인 중</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-600 px-2 py-1 rounded">새글 감지</span>
                            <span className="text-gray-300">새 기사 발견</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded">추출</span>
                            <span className="text-gray-300">기사 내용 수집</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded">AI 가공</span>
                            <span className="text-gray-300">AI가 기사 편집</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded">발행</span>
                            <span className="text-gray-300">기사 게시 완료</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded">차단</span>
                            <span className="text-gray-300">사이트 접근 불가</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded">오류</span>
                            <span className="text-gray-300">처리 중 문제 발생</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">중지</span>
                            <span className="text-gray-300">모니터링 정지됨</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
