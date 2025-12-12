"use client";

import React, { useEffect, useState } from "react";
import { FileText, PenSquare, Eye, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

interface Reporter {
    id: string;
    name: string;
    position: string;
    region: string;
    access_level: number;
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
                        myRegionArticles: 0,
                        myArticles: 0,
                        publishedArticles: 0,
                        pendingArticles: 0,
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
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
        );
    }

    const positionLabel = getPositionLabel(reporter?.position || "reporter");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    안녕하세요, {reporter?.name} {positionLabel}님
                </h1>
                <p className="text-gray-500 mt-1">
                    {reporter?.region} 담당 | Korea NEWS 기자 대시보드
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="내 지역 기사"
                    value={stats?.myRegionArticles || 0}
                    icon={FileText}
                    color="blue"
                />
                <StatCard
                    label="내가 작성한 기사"
                    value={stats?.myArticles || 0}
                    icon={PenSquare}
                    color="green"
                />
                <StatCard
                    label="게시된 기사"
                    value={stats?.publishedArticles || 0}
                    icon={Eye}
                    color="purple"
                />
                <StatCard
                    label="승인 대기"
                    value={stats?.pendingArticles || 0}
                    icon={Clock}
                    color="orange"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickActionCard
                        href="/reporter/write"
                        icon={PenSquare}
                        title="새 기사 작성"
                        description="새로운 기사를 작성합니다"
                    />
                    <QuickActionCard
                        href="/reporter/articles"
                        icon={FileText}
                        title="기사 관리"
                        description="기사 목록을 확인하고 관리합니다"
                    />
                    <QuickActionCard
                        href="/reporter/articles?filter=my"
                        icon={Eye}
                        title="내 기사 보기"
                        description="내가 작성한 기사를 확인합니다"
                    />
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                    <strong>권한 안내:</strong> {reporter?.region} 지역의 보도자료와 직접 작성한 기사를 편집할 수 있습니다.
                    다른 지역의 승인된 기사는 열람만 가능합니다.
                </p>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
}) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 border-blue-200 text-blue-600",
        green: "bg-green-50 border-green-200 text-green-600",
        purple: "bg-purple-50 border-purple-200 text-purple-600",
        orange: "bg-orange-50 border-orange-200 text-orange-600",
    };

    return (
        <div className={`rounded-xl border p-4 ${colors[color]}`}>
            <Icon className="w-6 h-6 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{label}</p>
        </div>
    );
}

function QuickActionCard({
    href,
    icon: Icon,
    title,
    description,
}: {
    href: string;
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition"
        >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </Link>
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
