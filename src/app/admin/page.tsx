
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Zap, Clock, TrendingUp, Users, Loader2, RefreshCw,
    AlertCircle, CheckCircle2, FileText, ChevronRight,
    Activity, ArrowUpRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DashboardStats {
    todayPosts: number;
    pendingPosts: number;
    todayViews: number;
    totalReporters: number;
    recentLogs: any[];
    pendingList: any[];
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // 1. 승인 대기 기사 수 (정확한 COUNT)
            const { count: pendingCount } = await supabase
                .from('posts')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'draft');

            // 2. 오늘 생성된 기사 수 (정확한 COUNT)
            const { count: todayCount } = await supabase
                .from('posts')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', todayISO);

            // 3. 전체 조회수 합계 (최근 1000개)
            const { data: viewData } = await supabase
                .from('posts')
                .select('view_count')
                .order('created_at', { ascending: false })
                .limit(1000);
            const totalViews = viewData?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

            // 4. 기자/봇 수 - reporters 테이블 조회 (없으면 0)
            const { count: reporterCount } = await supabase
                .from('reporters')
                .select('id', { count: 'exact', head: true });

            // 5. 최근 봇 로그
            const { data: logs } = await supabase
                .from('bot_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // 6. 승인 대기 목록 (상위 5개)
            const { data: pendingList } = await supabase
                .from('posts')
                .select('id, title, category, created_at, author')
                .eq('status', 'draft')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                todayPosts: todayCount || 0,
                pendingPosts: pendingCount || 0,
                todayViews: totalViews,
                totalReporters: reporterCount || 0,
                recentLogs: logs || [],
                pendingList: pendingList || []
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-10 h-10 animate-spin text-[#A6121D]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        뉴스룸 상황실
                    </h1>
                    <p className="text-slate-500 font-medium">
                        오늘도 공정한 보도를 위해 최선을 다해주세요.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-bold text-slate-700">시스템 정상</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-[#C8161D] hover:border-[#C8161D] rounded-full transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard
                    title="승인 대기 기사"
                    value={stats?.pendingPosts || 0}
                    icon={FileText}
                    trend="처리 필요"
                    color="red" // Important!
                    href="/admin/news?status=draft"
                />
                <KPICard
                    title="오늘 송고된 기사"
                    value={stats?.todayPosts || 0}
                    icon={Zap}
                    trend="+12% vs 어제"
                    color="slate"
                />
                <KPICard
                    title="실시간 조회수"
                    value={(stats?.todayViews || 0).toLocaleString()}
                    icon={TrendingUp}
                    trend="상승세"
                    color="blue"
                />
                <KPICard
                    title="활동 봇 / 기자"
                    value={`${stats?.recentLogs.length || 0} / ${stats?.totalReporters || 0}`}
                    icon={Activity}
                    trend="정상 작동"
                    color="green"
                    href="/admin/bot"
                />
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: 승인 대기 목록 (Priority) */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-[#C8161D]" />
                                승인 대기 목록
                            </h2>
                            <Link href="/admin/news?status=draft" className="text-sm font-bold text-slate-500 hover:text-[#C8161D] flex items-center gap-1">
                                전체보기 <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="divide-y divide-slate-50">
                            {stats?.pendingList && stats.pendingList.length > 0 ? (
                                stats.pendingList.map((post) => (
                                    <div key={post.id} className="p-5 hover:bg-red-50/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold">
                                                {post.category}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(post.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <Link href={`/news/${post.id}`} target="_blank">
                                            <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-[#C8161D] transition-colors leading-snug">
                                                {post.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-slate-500 line-clamp-1 mb-3">
                                            {post.summary}
                                        </p>
                                        <div className="flex gap-2">
                                            {/* Quick Actions Placeholder */}
                                            <Link
                                                href={`/admin/news?status=draft&highlight=${post.id}`}
                                                className="px-3 py-1.5 bg-[#C8161D] text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                                            >
                                                검토하기
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold mb-1">모든 기사가 처리되었습니다</h3>
                                    <p className="text-slate-500 text-sm">현재 대기 중인 기사가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Bot Status & Quick Links */}
                <div className="space-y-6">
                    {/* Bot Status */}
                    <section className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-green-400" /> AI 봇 모니터
                            </h2>
                            <Link href="/admin/bot" className="text-xs text-slate-400 hover:text-white">더보기</Link>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {stats?.recentLogs && stats.recentLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-800 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="font-medium text-slate-200">{log.region}</span>
                                    </div>
                                    <span className="text-slate-500 text-xs">
                                        {formatTimeAgo(log.created_at)}
                                    </span>
                                </div>
                            ))}
                            {(!stats?.recentLogs || stats.recentLogs.length === 0) && (
                                <p className="text-slate-500 text-sm text-center py-4">최근 활동 없음</p>
                            )}
                        </div>

                        <Link
                            href="/admin/bot/run"
                            className="mt-6 block w-full py-3 bg-blue-600 hover:bg-blue-500 text-center rounded-xl font-bold text-sm transition-colors"
                        >
                            봇 수동 실행
                        </Link>
                    </section>

                    {/* Quick Access */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="font-bold text-slate-900 mb-4">빠른 실행</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickLink href="/admin/news/write" label="기사 쓰기" icon="✍️" />
                            <QuickLink href="/admin/users" label="기자 관리" icon="👥" />
                            <QuickLink href="/admin/settings" label="사이트 설정" icon="⚙️" />
                            <QuickLink href="/" label="메인 보기" icon="🏠" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

// --- Components ---

function KPICard({ title, value, icon: Icon, trend, color, href }: any) {
    const isRed = color === 'red';
    const Wrapper = href ? Link : 'div';

    return (
        // @ts-ignore
        <Wrapper href={href || '#'} className={`p-6 rounded-2xl border transition-all duration-300 group
            ${isRed
                ? 'bg-red-50 border-red-100 hover:border-red-200 hover:shadow-md cursor-pointer'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }
        `}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${isRed ? 'bg-white text-[#C8161D] shadow-sm' : 'bg-slate-50 text-slate-600'}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isRed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className={`text-sm font-bold mb-1 ${isRed ? 'text-red-600' : 'text-slate-500'}`}>{title}</p>
                <h3 className={`text-3xl font-black ${isRed ? 'text-[#C8161D]' : 'text-slate-900'}`}>{value}</h3>
            </div>
        </Wrapper>
    );
}

function QuickLink({ href, label, icon }: any) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-center group">
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-sm font-bold text-slate-700">{label}</span>
        </Link>
    );
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
    return `${Math.floor(diffMins / 1440)}일 전`;
}
