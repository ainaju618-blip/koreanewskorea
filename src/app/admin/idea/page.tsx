"use client";

import { useState, useEffect } from 'react';
import {
    Lightbulb,
    Globe,
    Rss,
    FileSearch,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/shared/PageHeader';

// 통계 카드 컴포넌트
function StatCard({
    title,
    value,
    icon: Icon,
    color,
    trend,
    href
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend?: string;
    href?: string;
}) {
    const content = (
        <div className={`bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return content;
}

// 최근 활동 아이템
function ActivityItem({
    source,
    title,
    time,
    status
}: {
    source: string;
    title: string;
    time: string;
    status: 'success' | 'pending' | 'error';
}) {
    const statusConfig = {
        success: { color: 'text-emerald-600', icon: CheckCircle, label: '완료' },
        pending: { color: 'text-yellow-600', icon: Clock, label: '처리중' },
        error: { color: 'text-red-600', icon: AlertCircle, label: '오류' }
    };
    const { color, icon: StatusIcon, label } = statusConfig[status];

    return (
        <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className={`mt-0.5 ${color}`}>
                <StatusIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                <p className="text-xs text-gray-500">{source} · {time}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${color} bg-opacity-10`}>
                {label}
            </span>
        </div>
    );
}

// 수집처 상태 표시
function SourceStatusCard({
    name,
    code,
    type,
    lastCollected,
    articleCount,
    status
}: {
    name: string;
    code: string;
    type: 'rss' | 'scraping';
    lastCollected: string;
    articleCount: number;
    status: 'active' | 'idle' | 'error';
}) {
    const statusColors = {
        active: 'bg-emerald-500',
        idle: 'bg-gray-400',
        error: 'bg-red-500'
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
            <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${type === 'rss' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {type.toUpperCase()}
                    </span>
                </div>
                <p className="text-xs text-gray-500">마지막 수집: {lastCollected}</p>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{articleCount}</p>
                <p className="text-xs text-gray-500">기사</p>
            </div>
        </div>
    );
}

export default function IdeaDashboardPage() {
    // 임시 통계 데이터
    const [stats] = useState({
        totalSources: 0,
        totalRaw: 0,
        totalProcessed: 0,
        todayCollected: 0
    });

    // 임시 활동 데이터
    const [recentActivities] = useState<Array<{
        source: string;
        title: string;
        time: string;
        status: 'success' | 'pending' | 'error';
    }>>([]);

    // 임시 수집처 데이터
    const [sources] = useState<Array<{
        name: string;
        code: string;
        type: 'rss' | 'scraping';
        lastCollected: string;
        articleCount: number;
        status: 'active' | 'idle' | 'error';
    }>>([]);

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <PageHeader
                title="AI 아이디어"
                description="해외 AI 뉴스 수집 및 재구성 시스템"
                icon={Lightbulb}
                iconBgColor="bg-amber-500"
                actions={
                    <Link
                        href="/admin/idea/sources"
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                    >
                        <Globe className="w-4 h-4" />
                        수집처 관리
                    </Link>
                }
            />

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="등록된 수집처"
                    value={stats.totalSources}
                    icon={Globe}
                    color="bg-blue-500"
                    href="/admin/idea/sources"
                />
                <StatCard
                    title="수집된 원문"
                    value={stats.totalRaw}
                    icon={Rss}
                    color="bg-purple-500"
                    href="/admin/idea/raw"
                />
                <StatCard
                    title="가공된 기사"
                    value={stats.totalProcessed}
                    icon={FileSearch}
                    color="bg-emerald-500"
                    href="/admin/idea/processed"
                />
                <StatCard
                    title="오늘 수집"
                    value={stats.todayCollected}
                    icon={Sparkles}
                    color="bg-amber-500"
                    trend="실시간 업데이트"
                />
            </div>

            {/* 메인 컨텐츠 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 빠른 시작 가이드 */}
                <div className="lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        시작 가이드
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg">
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">수집처 등록</h4>
                                <p className="text-sm text-gray-600 mt-1">TechCrunch, OpenAI Blog 등 AI 뉴스 소스를 등록하세요.</p>
                                <Link href="/admin/idea/sources" className="text-amber-600 text-sm font-medium inline-flex items-center gap-1 mt-2 hover:underline">
                                    수집처 관리로 이동 <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg">
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">RSS/스크래핑 설정</h4>
                                <p className="text-sm text-gray-600 mt-1">각 수집처의 RSS URL 또는 스크래핑 셀렉터를 설정하세요.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg">
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">수집 실행</h4>
                                <p className="text-sm text-gray-600 mt-1">자동 또는 수동으로 뉴스를 수집하고 AI로 재구성하세요.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-white/60 rounded-lg border border-amber-200">
                        <p className="text-sm text-gray-700">
                            <strong>💡 전략:</strong> &quot;참조용&quot;은 원문 링크 제공, &quot;재구성&quot;은 사실 추출 후 AI 재작성으로 저작권 안전하게 운영
                        </p>
                    </div>
                </div>

                {/* 수집처 상태 */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">수집처 상태</h3>
                        <Link href="/admin/idea/sources" className="text-sm text-amber-600 hover:underline">
                            전체 보기
                        </Link>
                    </div>

                    {sources.length > 0 ? (
                        <div className="space-y-3">
                            {sources.slice(0, 5).map((source) => (
                                <SourceStatusCard key={source.code} {...source} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">등록된 수집처가 없습니다</p>
                            <Link
                                href="/admin/idea/sources"
                                className="text-amber-600 text-sm font-medium hover:underline mt-2 inline-block"
                            >
                                수집처 등록하기
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">최근 활동</h3>
                    <Link href="/admin/idea/raw" className="text-sm text-amber-600 hover:underline">
                        전체 보기
                    </Link>
                </div>

                {recentActivities.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {recentActivities.map((activity, index) => (
                            <ActivityItem key={index} {...activity} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">아직 수집된 기사가 없습니다</p>
                        <p className="text-xs text-gray-400 mt-1">수집처를 등록하고 수집을 시작하세요</p>
                    </div>
                )}
            </div>
        </div>
    );
}
