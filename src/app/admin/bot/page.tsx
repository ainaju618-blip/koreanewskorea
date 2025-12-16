"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Bot,
    Play,
    Calendar,
    Activity,
    Database,
    CheckCircle,
    AlertTriangle,
    Clock,
    RefreshCw,
    TrendingUp,
    Zap,
    type LucideIcon
} from "lucide-react";
import { RegionHeatmap, CollectionChart, AlertBanner } from "@/components/admin/bot";
import type { RegionHealthData, DailyStat, Alert } from "@/components/admin/bot";

interface HealthSummary {
    totalRegions: number;
    healthyRegions: number;
    failedRegions: number;
    runningRegions: number;
}

interface StatsData {
    summary: {
        totalRuns: number;
        totalSuccess: number;
        successRate: number;
        totalArticles: number;
        avgArticlesPerRun: number;
    };
    dailyStats: DailyStat[];
}

export default function BotDashboardPage() {
    const [healthData, setHealthData] = useState<Record<string, RegionHealthData>>({});
    const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
    const [statsData, setStatsData] = useState<StatsData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [healthRes, statsRes] = await Promise.all([
                fetch('/api/bot/health'),
                fetch('/api/bot/stats?days=7')
            ]);

            const healthJson = await healthRes.json();
            const statsJson = await statsRes.json();

            if (healthJson.regions) {
                setHealthData(healthJson.regions);
                setHealthSummary(healthJson.summary);

                // Generate alerts from health data
                const newAlerts: Alert[] = [];
                Object.entries(healthJson.regions as Record<string, RegionHealthData>).forEach(([region, data]) => {
                    if (data.lastStatus === 'failed' || data.lastStatus === 'error') {
                        newAlerts.push({
                            id: `error-${region}`,
                            type: 'error',
                            title: '수집 실패',
                            message: `마지막 수집이 실패했습니다.`,
                            region: region,
                            timestamp: data.lastFailure || new Date().toISOString()
                        });
                    } else if (data.lastSuccess) {
                        const hoursSince = (Date.now() - new Date(data.lastSuccess).getTime()) / (1000 * 60 * 60);
                        if (hoursSince > 48) {
                            newAlerts.push({
                                id: `stale-${region}`,
                                type: 'warning',
                                title: '수집 지연',
                                message: `48시간 이상 수집이 없습니다.`,
                                region: region,
                                timestamp: data.lastSuccess
                            });
                        }
                    }
                });
                setAlerts(newAlerts.slice(0, 5)); // Limit to 5 alerts
            }

            if (statsJson.dailyStats) {
                setStatsData(statsJson);
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(fetchData, 30000); // 30s refresh
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const handleDismissAlert = (alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    };

    const handleDismissAllAlerts = () => {
        setAlerts([]);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        봇 관리 센터
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        뉴스 수집 봇의 실시간 상태를 모니터링하고 제어합니다.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-2 ${
                            autoRefresh
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-white text-gray-500 border-gray-300'
                        }`}
                    >
                        {autoRefresh ? (
                            <Activity className="w-4 h-4 animate-pulse" />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-300" />
                        )}
                        {autoRefresh ? "자동 갱신 ON" : "자동 갱신 OFF"}
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        title="새로고침"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link href="/admin/bot/run">
                        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            수동 수집 실행
                        </button>
                    </Link>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4">
                <StatCard
                    icon={CheckCircle}
                    label="정상 스크래퍼"
                    value={healthSummary?.healthyRegions ?? '-'}
                    subValue={`/ ${healthSummary?.totalRegions ?? 27}`}
                    trend={healthSummary ? `${Math.round((healthSummary.healthyRegions / healthSummary.totalRegions) * 100)}%` : '-'}
                    trendColor="text-green-600"
                    bgColor="bg-green-50"
                    iconColor="text-green-600"
                    isLoading={isLoading}
                />
                <StatCard
                    icon={AlertTriangle}
                    label="오류 발생"
                    value={healthSummary?.failedRegions ?? '-'}
                    subValue="개 지역"
                    trend={healthSummary?.failedRegions === 0 ? "모두 정상" : "주의 필요"}
                    trendColor={healthSummary?.failedRegions === 0 ? "text-gray-500" : "text-red-600"}
                    bgColor="bg-red-50"
                    iconColor="text-red-600"
                    isLoading={isLoading}
                />
                <StatCard
                    icon={TrendingUp}
                    label="7일 수집량"
                    value={statsData?.summary.totalArticles.toLocaleString() ?? '-'}
                    subValue="건"
                    trend={`일평균 ${statsData?.summary.avgArticlesPerRun ?? '-'}건`}
                    trendColor="text-blue-600"
                    bgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    isLoading={isLoading}
                />
                <StatCard
                    icon={Zap}
                    label="성공률"
                    value={`${statsData?.summary.successRate ?? '-'}`}
                    subValue="%"
                    trend={`${statsData?.summary.totalSuccess ?? 0}/${statsData?.summary.totalRuns ?? 0} 성공`}
                    trendColor="text-purple-600"
                    bgColor="bg-purple-50"
                    iconColor="text-purple-600"
                    isLoading={isLoading}
                />
                <StatCard
                    icon={Clock}
                    label="마지막 업데이트"
                    value={lastUpdated ? lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    subValue=""
                    trend={autoRefresh ? "30초마다 갱신" : "수동 갱신"}
                    trendColor="text-gray-500"
                    bgColor="bg-gray-50"
                    iconColor="text-gray-600"
                    isLoading={isLoading}
                />
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <AlertBanner
                    alerts={alerts}
                    onDismiss={handleDismissAlert}
                    onDismissAll={handleDismissAllAlerts}
                />
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-2 gap-6">
                {/* Region Heatmap */}
                <RegionHeatmap
                    healthData={healthData}
                    isLoading={isLoading}
                />

                {/* Collection Chart */}
                <CollectionChart
                    dailyStats={statsData?.dailyStats ?? []}
                    isLoading={isLoading}
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    빠른 작업
                </h3>
                <div className="grid grid-cols-4 gap-4">
                    <ActionButton
                        icon={Play}
                        label="수동 수집 실행"
                        description="지역/기간 선택"
                        href="/admin/bot/run"
                        color="blue"
                    />
                    <ActionButton
                        icon={Calendar}
                        label="스케줄 설정"
                        description="자동 수집 시간"
                        href="/admin/bot/schedule"
                        color="purple"
                    />
                    <ActionButton
                        icon={Activity}
                        label="수집 로그"
                        description="실행 내역 확인"
                        href="/admin/bot/logs"
                        color="green"
                    />
                    <ActionButton
                        icon={Database}
                        label="소스 관리"
                        description="RSS 피드 등록"
                        href="/admin/bot/sources"
                        color="orange"
                    />
                </div>
            </div>
        </div>
    );
}

// --- Components ---

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    subValue?: string;
    trend: string;
    trendColor: string;
    bgColor: string;
    iconColor: string;
    isLoading?: boolean;
}

function StatCard({ icon: Icon, label, value, subValue, trend, trendColor, bgColor, iconColor, isLoading }: StatCardProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">
                {value}
                {subValue && <span className="text-sm font-normal text-gray-500 ml-1">{subValue}</span>}
            </p>
            <p className={`text-xs ${trendColor} mt-1 font-medium`}>{trend}</p>
        </div>
    );
}

interface ActionButtonProps {
    icon: LucideIcon;
    label: string;
    description: string;
    href: string;
    color: "blue" | "purple" | "green" | "orange";
}

function ActionButton({ icon: Icon, label, description, href, color }: ActionButtonProps) {
    const colorStyles = {
        blue: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
        purple: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
        green: "border-green-200 hover:border-green-400 hover:bg-green-50",
        orange: "border-orange-200 hover:border-orange-400 hover:bg-orange-50",
    };

    return (
        <Link href={href}>
            <div className={`border-2 ${colorStyles[color]} rounded-lg p-4 cursor-pointer transition-all duration-200 flex flex-col items-center text-center h-full`}>
                <Icon className="w-8 h-8 text-gray-700 mb-2" />
                <p className="font-medium text-gray-900 text-sm mb-1">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </Link>
    );
}
