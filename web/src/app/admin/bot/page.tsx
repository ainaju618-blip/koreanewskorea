"use client";

import React from "react";
import Link from "next/link";
import {
    Bot,
    Play,
    Calendar,
    Activity,
    Database,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    Clock
} from "lucide-react";

export default function BotDashboardPage() {
    // Mock Data - 실제로는 DB에서 가져와야 함
    const botStats = {
        lastRun: "2025-12-07 09:00",
        articlesCollected: 127,
        activeSources: 24,
        errorCount: 2,
        nextScheduledRun: "2025-12-07 13:00"
    };

    const recentLogs = [
        { id: 1, time: "09:35", region: "나주시", status: "success", count: 8 },
        { id: 2, time: "09:32", region: "광주광역시", status: "success", count: 15 },
        { id: 3, time: "09:30", region: "전라남도", status: "warning", count: 3 },
        { id: 4, time: "09:28", region: "여수시", status: "success", count: 12 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        봇 관리 센터 (Bot Control Center)
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        뉴스 수집 봇의 스케줄과 수집 대상을 제어합니다.
                    </p>
                </div>
                <Link href="/admin/bot/run">
                    <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        수동 수집 실행
                    </button>
                </Link>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard
                    icon={CheckCircle}
                    label="금일 수집 기사"
                    value={`${botStats.articlesCollected}건`}
                    trend="+12% vs 어제"
                    trendColor="text-green-600"
                    bgColor="bg-green-50"
                    iconColor="text-green-600"
                />
                <StatCard
                    icon={Database}
                    label="활성 소스"
                    value={`${botStats.activeSources}개`}
                    trend="모두 정상"
                    trendColor="text-gray-500"
                    bgColor="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="오류 발생"
                    value={`${botStats.errorCount}건`}
                    trend="주의 필요"
                    trendColor="text-orange-600"
                    bgColor="bg-orange-50"
                    iconColor="text-orange-600"
                />
                <StatCard
                    icon={Clock}
                    label="다음 자동 수집"
                    value={botStats.nextScheduledRun}
                    trend="2시간 30분 후"
                    trendColor="text-gray-500"
                    bgColor="bg-purple-50"
                    iconColor="text-purple-600"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    빠른 작업 (Quick Actions)
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

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        최근 수집 활동 (Recent Activity)
                    </h3>
                    <Link href="/admin/bot/logs" className="text-sm text-blue-600 hover:underline">
                        전체 보기
                    </Link>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentLogs.map((log) => (
                        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                            <div className="flex items-center gap-4">
                                <span className="font-mono text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded border border-gray-200">
                                    {log.time}
                                </span>
                                <span className="text-sm text-gray-700">{log.region}</span>
                                <span className="text-sm text-gray-500">· {log.count}건 수집</span>
                            </div>
                            <LogStatusBadge status={log.status} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- Components ---

function StatCard({ icon: Icon, label, value, trend, trendColor, bgColor, iconColor }: any) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className={`text-xs ${trendColor} mt-2 font-medium`}>{trend}</p>
        </div>
    );
}

function ActionButton({ icon: Icon, label, description, href, color }: any) {
    const colorStyles = {
        blue: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
        purple: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
        green: "border-green-200 hover:border-green-400 hover:bg-green-50",
        orange: "border-orange-200 hover:border-orange-400 hover:bg-orange-50",
    };

    return (
        <Link href={href}>
            <div className={`border-2 ${colorStyles[color as keyof typeof colorStyles]} rounded-lg p-4 cursor-pointer transition-all duration-200 flex flex-col items-center text-center h-full`}>
                <Icon className="w-8 h-8 text-gray-700 mb-2" />
                <p className="font-medium text-gray-900 text-sm mb-1">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </Link>
    );
}

function LogStatusBadge({ status }: { status: string }) {
    const styles = {
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-orange-50 text-orange-700 border-orange-200",
        error: "bg-red-50 text-red-700 border-red-200",
    };

    const labels = {
        success: "✓ 성공",
        warning: "⚠ 경고",
        error: "✗ 실패",
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
            {labels[status as keyof typeof labels]}
        </span>
    );
}
