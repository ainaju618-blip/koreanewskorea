"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FileText, TrendingUp, Activity, Loader2, RefreshCw,
    CheckCircle2, ChevronRight, Zap, Settings,
    PenTool, Users, LayoutDashboard, Bot, Calendar,
    Newspaper, MapPin, Lightbulb, Cloud, Database, Server, HardDrive
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 전체 스크래퍼 지역 목록 (regionData.ts와 일치)
const ALL_REGIONS = {
    education: [
        { source: 'gwangju_edu', name: '광주광역시교육청' },
        { source: 'jeonnam_edu', name: '전라남도교육청' }
    ],
    local: [
        { source: 'gwangju', name: '광주광역시' },
        { source: 'jeonnam', name: '전라남도' },
        { source: 'naju', name: '나주시' },
        { source: 'mokpo', name: '목포시' },
        { source: 'yeosu', name: '여수시' },
        { source: 'suncheon', name: '순천시' },
        { source: 'gwangyang', name: '광양시' },
        { source: 'damyang', name: '담양군' },
        { source: 'gokseong', name: '곡성군' },
        { source: 'gurye', name: '구례군' },
        { source: 'goheung', name: '고흥군' },
        { source: 'boseong', name: '보성군' },
        { source: 'hwasun', name: '화순군' },
        { source: 'jangheung', name: '장흥군' },
        { source: 'gangjin', name: '강진군' },
        { source: 'haenam', name: '해남군' },
        { source: 'yeongam', name: '영암군' },
        { source: 'muan', name: '무안군' },
        { source: 'hampyeong', name: '함평군' },
        { source: 'yeonggwang', name: '영광군' },
        { source: 'jangseong', name: '장성군' },
        { source: 'wando', name: '완도군' },
        { source: 'jindo', name: '진도군' },
        { source: 'shinan', name: '신안군' }
    ]
};

// 지역 한글 이름 매핑 (봇 로그 표시용)
const REGION_NAMES: Record<string, string> = {};
[...ALL_REGIONS.education, ...ALL_REGIONS.local].forEach(r => {
    REGION_NAMES[r.source] = r.name;
});

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [testConfig, setTestConfig] = useState<any>(null);
    const [regionStats, setRegionStats] = useState<any[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 테스트 실행 상태
    const [testRunning, setTestRunning] = useState(false);
    const [testProgress, setTestProgress] = useState({ current: 0, total: 0, currentRegion: '' });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setRefreshing(true);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            const [pending, todayPosts, views, logs, testRes, allPosts, usageRes] = await Promise.all([
                supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
                supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
                supabase.from('posts').select('view_count').order('created_at', { ascending: false }).limit(500),
                // ✅ FIX: started_at 컬럼으로 정렬 (created_at → started_at)
                supabase.from('bot_logs').select('*').order('started_at', { ascending: false }).limit(5),
                fetch('/api/bot/test-schedule').then(r => r.json()).catch(() => null),
                // 시/군별 기사 수 조회
                supabase.from('posts').select('source'),
                // 서비스 사용량 조회
                fetch('/api/admin/usage').then(r => r.json()).catch(() => null)
            ]);

            const totalViews = views.data?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

            // 시/군별 기사 수 집계
            const sourceCounts: Record<string, number> = {};
            allPosts.data?.forEach((post: any) => {
                if (post.source) {
                    sourceCounts[post.source] = (sourceCounts[post.source] || 0) + 1;
                }
            });

            // 모든 지역에 대해 기사 수 매핑 (0건 포함)
            // ✅ DB의 source 컬럼에는 한글 이름이 저장되어 있으므로 name으로 매칭
            const allRegionStats = [
                ...ALL_REGIONS.education.map(r => ({
                    ...r,
                    count: sourceCounts[r.name] || 0,
                    type: 'education'
                })),
                ...ALL_REGIONS.local.map(r => ({
                    ...r,
                    count: sourceCounts[r.name] || 0,
                    type: 'local'
                }))
            ];

            setRegionStats(allRegionStats);

            setStats({
                pending: pending.count || 0,
                today: todayPosts.count || 0,
                views: totalViews,
                logs: logs.data || [],
                totalArticles: allPosts.data?.length || 0
            });
            setTestConfig(testRes);
            setUsage(usageRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // 현재 날짜 포맷
    const currentDate = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                    <p className="text-slate-500 text-sm">대시보드 로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
            <div className="max-w-[1440px] mx-auto px-8 py-10">

                {/* ===== Header ===== */}
                <header className="mb-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">관리자 대시보드</h1>
                                <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">운영 중</span>
                            </div>
                            <p className="text-slate-500 text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {currentDate}
                            </p>
                        </div>
                        <button
                            onClick={fetchAll}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            새로고침
                        </button>
                    </div>
                </header>

                {/* ===== Stats Grid ===== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    <StatCard
                        label="승인 대기"
                        value={stats?.pending || 0}
                        icon={FileText}
                        accent={stats?.pending > 0}
                        href="/admin/news?status=draft"
                    />
                    <StatCard
                        label="오늘 수집"
                        value={stats?.today || 0}
                        icon={Zap}
                    />
                    <StatCard
                        label="전체 기사"
                        value={(stats?.totalArticles || 0).toLocaleString()}
                        icon={Newspaper}
                    />
                    <StatCard
                        label="봇 상태"
                        value="정상"
                        icon={Activity}
                        status="online"
                    />
                </div>

                {/* ===== Main Grid ===== */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Left Column: 2/3 */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* ★ 시/군별 기사 수 (3열 그리드) */}
                        <section className="admin-card p-6">
                            <div className="admin-section-header">
                                <h2 className="admin-section-title flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-600" />
                                    시/군별 기사 현황
                                </h2>
                                <span className="text-sm text-slate-500">
                                    총 <strong className="text-slate-800">{stats?.totalArticles?.toLocaleString()}</strong>건
                                </span>
                            </div>

                            {/* 교육기관 */}
                            <div className="mb-4">
                                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    교육기관
                                </h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {regionStats.filter(r => r.type === 'education').map((region) => (
                                        <RegionCard key={region.source} region={region} maxCount={Math.max(...regionStats.map(r => r.count))} />
                                    ))}
                                </div>
                            </div>

                            {/* 지자체 */}
                            <div>
                                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    지자체
                                </h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {regionStats.filter(r => r.type === 'local').map((region) => (
                                        <RegionCard key={region.source} region={region} maxCount={Math.max(...regionStats.map(r => r.count))} />
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section className="admin-card p-6">
                            <div className="admin-section-header">
                                <h2 className="admin-section-title">빠른 실행</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <ActionButton href="/admin/bot/run" icon={Bot} label="봇 실행" />
                                <ActionButton href="/admin/news/write" icon={PenTool} label="기사 작성" />
                                <ActionButton href="/admin/news?status=draft" icon={FileText} label="승인 대기" badge={stats?.pending} />
                                <ActionButton href="/idea" icon={Lightbulb} label="AI 아이디어" />
                                <ActionButton href="/admin/settings" icon={Settings} label="설정" />
                            </div>
                        </section>

                        {/* Recent Bot Activity */}
                        <section className="admin-card p-6">
                            <div className="admin-section-header">
                                <h2 className="admin-section-title">최근 봇 활동</h2>
                                <Link href="/admin/bot/logs" className="admin-section-link">
                                    전체 보기 →
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {stats?.logs?.length > 0 ? stats.logs.map((log: any) => (
                                    <div
                                        key={log.id}
                                        className={`admin-activity-item ${log.status === 'success' ? 'success' :
                                            log.status === 'running' ? 'running' : 'error'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 pl-3">
                                            <span className="font-semibold text-slate-700">
                                                {REGION_NAMES[log.region] || log.region}
                                            </span>
                                            {log.articles_count > 0 && (
                                                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                    +{log.articles_count}건
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">{formatTime(log.started_at)}</span>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        <p className="text-sm">최근 활동이 없습니다</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: 1/3 */}
                    <div className="space-y-6">

                        {/* System Status - Dark Panel */}
                        <section className="admin-dark-panel relative">
                            <h2 className="font-bold mb-5 flex items-center gap-2 relative z-10">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                                </span>
                                시스템 상태
                            </h2>
                            <div className="space-y-3 text-sm relative z-10">
                                <StatusRow label="서버" value="정상" status="ok" />
                                <StatusRow label="데이터베이스" value="연결됨" status="ok" />
                                <StatusRow label="스케줄러" value={testConfig?.enabled ? "활성화" : "비활성화"} status={testConfig?.enabled ? "ok" : "off"} />
                            </div>
                        </section>

                        {/* 서비스 사용량 - 간단 현황 */}
                        <Link href="/admin/monitor">
                            <section className="admin-card p-6 hover:border-slate-300 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="admin-section-title flex items-center gap-2">
                                        <HardDrive className="w-5 h-5 text-blue-600" />
                                        서비스 사용량
                                    </h2>
                                    <span className="text-xs text-blue-600">상세 →</span>
                                </div>
                                <div className="space-y-3">
                                    <UsageBarSimple
                                        label="Cloudinary"
                                        percent={usage?.cloudinary?.storage?.used && usage?.cloudinary?.storage?.limit
                                            ? (usage.cloudinary.storage.used / usage.cloudinary.storage.limit) * 100
                                            : 0}
                                    />
                                    <UsageBarSimple
                                        label="Supabase"
                                        percent={usage?.supabase?.database?.used && usage?.supabase?.database?.limit
                                            ? (usage.supabase.database.used / usage.supabase.database.limit) * 100
                                            : 0}
                                    />
                                </div>
                            </section>
                        </Link>

                        {/* Test Scheduler */}
                        <section className={`admin-card p-6 ${testConfig?.lastResult?.failedRegions?.length > 0 ? 'ring-2 ring-red-200 bg-red-50/30' : ''}`}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="admin-section-title flex items-center gap-2">
                                    <span className="text-lg">🧪</span>
                                    자동 테스트
                                    {testConfig?.lastResult?.failedRegions?.length > 0 && (
                                        <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                                            {testConfig.lastResult.failedRegions.length}개 실패
                                        </span>
                                    )}
                                </h2>
                                <ToggleSwitch
                                    enabled={testConfig?.enabled}
                                    onToggle={async () => {
                                        const res = await fetch('/api/bot/test-schedule', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ enabled: !testConfig?.enabled })
                                        });
                                        const data = await res.json();
                                        if (data.success) setTestConfig(data.config);
                                    }}
                                />
                            </div>

                            {/* 스케줄 정보 */}
                            {testConfig?.enabled && (
                                <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                                    <span>⏰</span>
                                    <span>매일 새벽 4시, 낮 12시, 저녁 8시 자동 실행</span>
                                </div>
                            )}

                            {/* 테스트 진행 상황 */}
                            {testRunning && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-blue-700 flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            테스트 실행 중...
                                        </span>
                                        <button
                                            onClick={() => {
                                                setTestRunning(false);
                                                setTestProgress({ current: 0, total: 0, currentRegion: '' });
                                            }}
                                            className="px-2 py-1 text-xs font-bold text-red-600 bg-red-100 hover:bg-red-200 rounded transition-colors"
                                        >
                                            ⏹ 중지
                                        </button>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${testProgress.total > 0 ? (testProgress.current / testProgress.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600">
                                        {testProgress.currentRegion && `현재: ${testProgress.currentRegion} `}
                                        ({testProgress.current}/{testProgress.total})
                                    </p>
                                </div>
                            )}

                            {!testRunning && testConfig?.lastResult && (
                                <div className="text-sm text-slate-600 space-y-3 border-t border-slate-100 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">마지막 실행</span>
                                        <span className="font-medium">{formatTime(testConfig.lastResult.timestamp)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">성공률</span>
                                        <span className={`font-bold ${testConfig.lastResult.failedRegions?.length === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {testConfig.lastResult.successRegions}/{testConfig.lastResult.totalRegions}
                                        </span>
                                    </div>
                                    {/* 실패 지역 목록 */}
                                    {testConfig.lastResult.failedRegions?.length > 0 && (
                                        <div className="mt-2 p-2 bg-red-100 rounded-lg">
                                            <p className="text-xs font-bold text-red-700 mb-1">⚠️ 실패 지역:</p>
                                            <p className="text-xs text-red-600">
                                                {testConfig.lastResult.failedRegions.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={async () => {
                                    setTestRunning(true);
                                    const totalRegions = ALL_REGIONS.education.length + ALL_REGIONS.local.length;
                                    setTestProgress({ current: 0, total: totalRegions, currentRegion: '테스트 시작...' });

                                    try {
                                        // 테스트 시작 API 호출
                                        await fetch('/api/bot/test-schedule', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ runNow: true })
                                        });

                                        // 실제 bot_logs 폴링으로 진행 상황 확인
                                        let completed = 0;
                                        let lastRegion = '';
                                        const startTime = Date.now();
                                        const maxWaitTime = 5 * 60 * 1000; // 최대 5분 대기

                                        while (completed < totalRegions && (Date.now() - startTime) < maxWaitTime) {
                                            await new Promise(r => setTimeout(r, 2000)); // 2초마다 폴링

                                            try {
                                                const res = await fetch('/api/bot/bot-logs?limit=30');
                                                const data = await res.json();

                                                if (data.logs) {
                                                    // 최근 5분 내 로그만 확인
                                                    const recentLogs = data.logs.filter((log: any) => {
                                                        const logTime = new Date(log.started_at).getTime();
                                                        return (Date.now() - logTime) < maxWaitTime;
                                                    });

                                                    // running 상태인 로그 찾기
                                                    const runningLog = recentLogs.find((log: any) => log.status === 'running');
                                                    if (runningLog) {
                                                        lastRegion = REGION_NAMES[runningLog.region] || runningLog.region;
                                                    }

                                                    // 완료된 로그 수 계산
                                                    completed = recentLogs.filter((log: any) =>
                                                        ['success', 'failed', 'error'].includes(log.status)
                                                    ).length;

                                                    setTestProgress({
                                                        current: completed,
                                                        total: totalRegions,
                                                        currentRegion: runningLog ? lastRegion : (completed >= totalRegions ? '완료!' : '처리 중...')
                                                    });

                                                    // 모든 테스트 완료 확인
                                                    if (completed >= totalRegions || !recentLogs.some((log: any) => log.status === 'running')) {
                                                        break;
                                                    }
                                                }
                                            } catch (e) {
                                                console.error('Polling error:', e);
                                            }
                                        }

                                        // 완료 후 결과 새로고침
                                        await fetchAll();
                                    } finally {
                                        setTestRunning(false);
                                        setTestProgress({ current: 0, total: 0, currentRegion: '' });
                                    }
                                }}
                                disabled={testRunning}
                                className="w-full mt-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {testRunning ? '⏳ 테스트 진행 중...' : '🚀 수동 테스트 실행'}
                            </button>
                        </section>

                        {/* Navigation */}
                        <section className="admin-card p-4">
                            <nav className="space-y-1">
                                <NavLink href="/admin/news" icon={FileText} label="기사 관리" />
                                <NavLink href="/admin/bot/run" icon={Bot} label="스크래퍼 관리" />
                                <NavLink href="/idea" icon={Lightbulb} label="AI 아이디어" />
                                <NavLink href="/admin/users" icon={Users} label="사용자 관리" />
                                <NavLink href="/" icon={LayoutDashboard} label="사이트 보기" external />
                            </nav>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Components =====

function StatCard({ label, value, icon: Icon, accent, href, status }: any) {
    const Wrapper = href ? Link : 'div';
    return (
        <Wrapper
            href={href || '#'}
            className={`admin-stat-card group ${accent ? 'accent' : ''}`}
        >
            <div className="flex items-center justify-between mb-4">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${accent ? 'text-red-600' : 'text-slate-400'}`} />
                {status === 'online' && (
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                )}
            </div>
            <p className={`text-3xl font-bold tabular-nums ${accent ? 'text-red-700' : 'text-slate-800'}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1 font-medium">{label}</p>
        </Wrapper>
    );
}

function ActionButton({ href, icon: Icon, label, badge }: any) {
    return (
        <Link href={href} className="admin-action-btn group">
            <Icon className="icon text-slate-500 group-hover:text-red-600" />
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold px-1.5 shadow-md">
                    {badge}
                </span>
            )}
        </Link>
    );
}

function RegionCard({ region, maxCount }: { region: any; maxCount: number }) {
    const hasArticles = region.count > 0;
    return (
        <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${hasArticles
            ? 'bg-white border-slate-200 hover:border-slate-300'
            : 'bg-slate-50 border-slate-100'
            }`}>
            <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasArticles ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                <span className={`text-sm font-medium truncate ${hasArticles ? 'text-slate-800' : 'text-slate-400'}`}>
                    {region.name}
                </span>
            </div>
            <span className={`text-sm font-bold tabular-nums flex-shrink-0 ml-2 ${hasArticles ? 'text-slate-800' : 'text-slate-300'}`}>
                {region.count > 0 ? region.count.toLocaleString() : '-'}
            </span>
        </div>
    );
}

function StatusRow({ label, value, status }: any) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
            <span className="text-slate-400">{label}</span>
            <span className={`flex items-center gap-2 font-medium ${status === 'ok' ? 'text-emerald-400' : 'text-slate-500'}`}>
                {value}
                {status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </span>
        </div>
    );
}

function NavLink({ href, icon: Icon, label, external }: any) {
    return (
        <Link
            href={href}
            target={external ? '_blank' : undefined}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group"
        >
            <Icon className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />
            <span className="text-sm font-medium flex-1">{label}</span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
        </Link>
    );
}

function ToggleSwitch({ enabled, onToggle }: any) {
    return (
        <button
            onClick={onToggle}
            className={`admin-toggle ${enabled ? 'on' : 'off'}`}
        >
            <span className="admin-toggle-thumb" />
        </button>
    );
}

function formatTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function UsageBar({ icon: Icon, label, sublabel, used, limit, color }: any) {
    const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
        if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
        return `${(bytes / 1024).toFixed(1)}KB`;
    };

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500'
    };

    const barColor = percent > 80 ? 'bg-red-500' : percent > 60 ? 'bg-amber-500' : colorClasses[color] || 'bg-blue-500';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <span className="text-xs text-slate-400">{sublabel}</span>
                </div>
                <span className="text-xs font-medium text-slate-600">
                    {formatSize(used)} / {formatSize(limit)}
                </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all ${barColor}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <div className="text-right">
                <span className={`text-xs font-bold ${percent > 80 ? 'text-red-600' : percent > 60 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {percent.toFixed(1)}%
                </span>
            </div>
        </div>
    );
}

function UsageBarSimple({ label, percent }: { label: string; percent: number }) {
    const barColor = percent > 80 ? 'bg-red-500' : percent > 60 ? 'bg-amber-500' : 'bg-blue-500';
    const textColor = percent > 80 ? 'text-red-600' : percent > 60 ? 'text-amber-600' : 'text-slate-600';

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 w-20">{label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
            <span className={`text-xs font-bold w-12 text-right ${textColor}`}>
                {percent.toFixed(1)}%
            </span>
        </div>
    );
}
