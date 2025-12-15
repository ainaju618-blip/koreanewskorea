"use client";

import React, { useEffect, useState } from "react";
import {
    FileText,
    PenSquare,
    Eye,
    Clock,
    Loader2,
    User,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    BarChart3,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Reporter {
    id: string;
    name: string;
    position: string;
    region: string;
    access_level: number;
    profile_image?: string;
}

interface Stats {
    myRegionArticles: number;
    myArticles: number;
    publishedArticles: number;
    pendingArticles: number;
}

export default function ReporterDashboard() {
    const [reporter, setReporter] = useState<Reporter | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 기자 정보 가져오기
                const meRes = await fetch("/api/auth/me");
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setReporter(meData.reporter);

                    // 통계 가져오기 (추후 API 구현)
                    // 지금은 임시 데이터
                    setStats({
                        myRegionArticles: 24,
                        myArticles: 8,
                        publishedArticles: 7,
                        pendingArticles: 1,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-slate-500 text-sm">대시보드 로딩 중...</p>
                </div>
            </div>
        );
    }

    const positionLabel = getPositionLabel(reporter?.position || "reporter");
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? "좋은 아침이에요" : currentHour < 18 ? "좋은 오후에요" : "좋은 저녁이에요";

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-20 -top-20 w-96 h-96 bg-white rounded-full blur-3xl" />
                    <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-white rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-blue-200 text-sm">{greeting}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                        {reporter?.name} {positionLabel}님, 환영합니다!
                    </h1>
                    <p className="text-blue-100 mb-6">
                        {reporter?.region} 담당 · Korea NEWS 기자 대시보드
                    </p>

                    {/* Quick Stats Row */}
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.myArticles || 0}</p>
                                <p className="text-xs text-blue-200">작성 기사</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                                <Eye className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.publishedArticles || 0}</p>
                                <p className="text-xs text-blue-200">게시됨</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.pendingArticles || 0}</p>
                                <p className="text-xs text-blue-200">대기 중</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="내 지역 기사"
                    value={stats?.myRegionArticles || 0}
                    icon={FileText}
                    color="blue"
                    trend={12}
                    trendUp={true}
                />
                <StatCard
                    label="내 기사"
                    value={stats?.myArticles || 0}
                    icon={PenSquare}
                    color="emerald"
                    trend={5}
                    trendUp={true}
                />
                <StatCard
                    label="게시된 기사"
                    value={stats?.publishedArticles || 0}
                    icon={Eye}
                    color="violet"
                    trend={8}
                    trendUp={true}
                />
                <StatCard
                    label="승인 대기"
                    value={stats?.pendingArticles || 0}
                    icon={Clock}
                    color="amber"
                    trend={2}
                    trendUp={false}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-slate-900">빠른 작업</h2>
                        <BarChart3 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <QuickActionCard
                            href="/reporter/write"
                            icon={PenSquare}
                            title="새 기사 작성"
                            description="새로운 기사를 작성합니다"
                            color="blue"
                            featured
                        />
                        <QuickActionCard
                            href="/reporter/articles"
                            icon={FileText}
                            title="기사 관리"
                            description="기사 목록을 확인하고 관리합니다"
                            color="slate"
                        />
                        <QuickActionCard
                            href="/reporter/drafts"
                            icon={Clock}
                            title="임시저장함"
                            description="임시 저장된 초안을 확인합니다"
                            color="slate"
                        />
                        <QuickActionCard
                            href="/reporter/profile"
                            icon={User}
                            title="내 프로필"
                            description="프로필 사진과 약력을 수정합니다"
                            color="slate"
                        />
                    </div>
                </div>

                {/* Activity / Calendar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-slate-900">오늘의 할 일</h2>
                        <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        <TodoItem
                            title="보도자료 확인"
                            description={`${reporter?.region} 지역 새 보도자료`}
                            status="pending"
                        />
                        <TodoItem
                            title="기사 작성 완료"
                            description="임시저장 기사 마무리"
                            status="pending"
                        />
                        <TodoItem
                            title="프로필 업데이트"
                            description="사진 및 약력 수정"
                            status="done"
                        />
                    </div>

                    <Link
                        href="/reporter/articles"
                        className="mt-4 flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                    >
                        모든 기사 보기
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900 mb-1">권한 안내</h3>
                    <p className="text-sm text-slate-600">
                        <strong>{reporter?.region}</strong> 지역의 보도자료와 직접 작성한 기사를 편집할 수 있습니다.
                        다른 지역의 승인된 기사는 열람만 가능합니다.
                    </p>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    trend,
    trendUp,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    trend?: number;
    trendUp?: boolean;
}) {
    const colorStyles: Record<string, { bg: string; icon: string; iconBg: string }> = {
        blue: { bg: "bg-blue-50", icon: "text-blue-600", iconBg: "bg-blue-100" },
        emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", iconBg: "bg-emerald-100" },
        violet: { bg: "bg-violet-50", icon: "text-violet-600", iconBg: "bg-violet-100" },
        amber: { bg: "bg-amber-50", icon: "text-amber-600", iconBg: "bg-amber-100" },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <div className={`${style.bg} rounded-2xl p-5 transition hover:shadow-md hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${style.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${style.icon}`} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trend}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
        </div>
    );
}

function QuickActionCard({
    href,
    icon: Icon,
    title,
    description,
    color,
    featured,
}: {
    href: string;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    featured?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`
                group flex items-start gap-4 p-4 rounded-xl transition-all duration-200
                ${featured
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]"
                    : "bg-slate-50 hover:bg-slate-100 border border-slate-100"
                }
            `}
        >
            <div className={`
                w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition
                ${featured
                    ? "bg-white/20 group-hover:bg-white/30"
                    : "bg-white shadow-sm group-hover:shadow"
                }
            `}>
                <Icon className={`w-5 h-5 ${featured ? "text-white" : "text-blue-600"}`} />
            </div>
            <div>
                <p className={`font-semibold ${featured ? "text-white" : "text-slate-900"}`}>{title}</p>
                <p className={`text-sm mt-0.5 ${featured ? "text-blue-100" : "text-slate-500"}`}>{description}</p>
            </div>
        </Link>
    );
}

function TodoItem({
    title,
    description,
    status,
}: {
    title: string;
    description: string;
    status: "done" | "pending";
}) {
    return (
        <div className={`flex items-start gap-3 p-3 rounded-xl transition ${status === "done" ? "bg-emerald-50" : "bg-slate-50 hover:bg-slate-100"}`}>
            <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                ${status === "done"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-300"
                }
            `}>
                {status === "done" && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            <div>
                <p className={`font-medium text-sm ${status === "done" ? "text-emerald-700 line-through" : "text-slate-900"}`}>{title}</p>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
        </div>
    );
}

function getPositionLabel(position: string): string {
    const positions: Record<string, string> = {
        editor_in_chief: "주필",
        branch_manager: "지사장",
        editor_chief: "편집국장",
        news_chief: "취재부장",
        senior_reporter: "수석기자",
        reporter: "기자",
        intern_reporter: "수습기자",
        citizen_reporter: "시민기자",
        opinion_writer: "오피니언",
        advisor: "고문",
        consultant: "자문위원",
        ambassador: "홍보대사",
        seoul_correspondent: "서울특파원",
        foreign_correspondent: "해외특파원",
    };
    return positions[position] || position;
}
