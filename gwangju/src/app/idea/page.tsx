"use client";

import { useState, useEffect, useCallback } from 'react';
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
    Sparkles,
    RefreshCw,
    type LucideIcon
} from 'lucide-react';
import Link from 'next/link';

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
    icon: LucideIcon;
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
    enabled,
    articleCount
}: {
    name: string;
    code: string;
    type: 'rss' | 'scraping';
    enabled: boolean;
    articleCount: number;
}) {
    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
            <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${type === 'rss' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {type.toUpperCase()}
                    </span>
                </div>
                <p className="text-xs text-gray-500">{enabled ? '활성화됨' : '비활성화됨'}</p>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{articleCount}</p>
                <p className="text-xs text-gray-500">기사</p>
            </div>
        </div>
    );
}

export default function IdeaDashboardPage() {
    const [stats, setStats] = useState({
        totalSources: 0,
        totalRaw: 0,
        totalProcessed: 0,
        todayCollected: 0
    });
    const [sources, setSources] = useState<any[]>([]);
    const [recentArticles, setRecentArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const res = await fetch('/api/idea/collect');
            const data = await res.json();
            if (data.success) {
                setSources(data.sources || []);
                setRecentArticles(data.articles?.slice(0, 5) || []);
                setStats({
                    totalSources: data.sources?.filter((s: any) => s.enabled).length || 0,
                    totalRaw: data.articles?.length || 0,
                    totalProcessed: 0,
                    todayCollected: data.articles?.filter((a: any) => {
                        const today = new Date().toDateString();
                        return new Date(a.collected_at).toDateString() === today;
                    }).length || 0
                });
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">AI 아이디어</h1>
                        <p className="text-gray-500">해외 AI 뉴스 수집 및 재구성 시스템</p>
                    </div>
                </div>
                <Link
                    href="/idea/sources"
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                    <Globe className="w-4 h-4" />
                    수집처 관리
                </Link>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="등록된 수집처"
                    value={stats.totalSources}
                    icon={Globe}
                    color="bg-blue-500"
                    href="/idea/sources"
                />
                <StatCard
                    title="수집된 원문"
                    value={stats.totalRaw}
                    icon={Rss}
                    color="bg-purple-500"
                    href="/idea/raw"
                />
                <StatCard
                    title="가공된 기사"
                    value={stats.totalProcessed}
                    icon={FileSearch}
                    color="bg-emerald-500"
                    href="/idea/processed"
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
                                <Link href="/idea/sources" className="text-amber-600 text-sm font-medium inline-flex items-center gap-1 mt-2 hover:underline">
                                    수집처 관리로 이동 <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg">
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">원문 수집</h4>
                                <p className="text-sm text-gray-600 mt-1">수집된 원문 페이지에서 RSS를 통해 뉴스를 수집하세요.</p>
                                <Link href="/idea/raw" className="text-amber-600 text-sm font-medium inline-flex items-center gap-1 mt-2 hover:underline">
                                    원문 수집하기 <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg">
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">AI 재구성</h4>
                                <p className="text-sm text-gray-600 mt-1">수집된 원문을 AI로 분석하고 국내용 기사로 재구성하세요.</p>
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
                        <Link href="/idea/sources" className="text-sm text-amber-600 hover:underline">
                            전체 보기
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : sources.length > 0 ? (
                        <div className="space-y-3">
                            {sources.slice(0, 5).map((source) => (
                                <SourceStatusCard
                                    key={source.code}
                                    name={source.name}
                                    code={source.code}
                                    type={source.type}
                                    enabled={source.enabled}
                                    articleCount={recentArticles.filter(a => a.source_code === source.code).length}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">등록된 수집처가 없습니다</p>
                            <Link
                                href="/idea/sources"
                                className="text-amber-600 text-sm font-medium hover:underline mt-2 inline-block"
                            >
                                수집처 등록하기
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* 최근 수집 기사 */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">최근 수집 기사</h3>
                    <Link href="/idea/raw" className="text-sm text-amber-600 hover:underline">
                        전체 보기
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : recentArticles.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {recentArticles.map((article, index) => (
                            <ActivityItem
                                key={index}
                                source={article.source_name}
                                title={article.title}
                                time={new Date(article.collected_at).toLocaleString('ko-KR')}
                                status="success"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">아직 수집된 기사가 없습니다</p>
                        <Link href="/idea/raw" className="text-amber-600 text-sm font-medium hover:underline mt-2 inline-block">
                            원문 수집하러 가기
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
