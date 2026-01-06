"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FileText, TrendingUp, Activity, Loader2, RefreshCw,
    CheckCircle2, ChevronRight, Zap, Settings,
    PenTool, Users, LayoutDashboard, Bot, Calendar,
    Newspaper, MapPin, Lightbulb, HardDrive, ArrowUpRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Region data - 전국 17개 시·도 + 정부 보도자료
const ALL_REGIONS = {
    government: [
        { source: 'korea', name: '정부(korea.kr)' }
    ],
    metro: [
        { source: 'seoul', name: '서울특별시' },
        { source: 'busan', name: '부산광역시' },
        { source: 'daegu', name: '대구광역시' },
        { source: 'incheon', name: '인천광역시' },
        { source: 'gwangju', name: '광주광역시' },
        { source: 'daejeon', name: '대전광역시' },
        { source: 'ulsan', name: '울산광역시' },
        { source: 'sejong', name: '세종특별자치시' }
    ],
    province: [
        { source: 'gyeonggi', name: '경기도' },
        { source: 'gangwon', name: '강원특별자치도' },
        { source: 'chungbuk', name: '충청북도' },
        { source: 'chungnam', name: '충청남도' },
        { source: 'jeonbuk', name: '전북특별자치도' },
        { source: 'jeonnam', name: '전라남도' },
        { source: 'gyeongbuk', name: '경상북도' },
        { source: 'gyeongnam', name: '경상남도' },
        { source: 'jeju', name: '제주특별자치도' }
    ]
};

const REGION_NAMES: Record<string, string> = {};
[...ALL_REGIONS.government, ...ALL_REGIONS.metro, ...ALL_REGIONS.province].forEach(r => {
    REGION_NAMES[r.source] = r.name;
});

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [testConfig, setTestConfig] = useState<any>(null);
    const [regionStats, setRegionStats] = useState<any[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

            const [pending, todayPosts, views, logs, testRes, totalPostsCount, allPosts, usageRes] = await Promise.all([
                supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
                supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
                supabase.from('posts').select('view_count').order('created_at', { ascending: false }).limit(500),
                supabase.from('bot_logs').select('*').order('started_at', { ascending: false }).limit(5),
                fetch('/api/bot/test-schedule').then(r => r.json()).catch(() => null),
                supabase.from('posts').select('*', { count: 'exact', head: true }),
                supabase.from('posts').select('source').limit(10000),
                fetch('/api/admin/usage').then(r => r.json()).catch(() => null)
            ]);

            const totalViews = views.data?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

            const sourceCounts: Record<string, number> = {};
            allPosts.data?.forEach((post: any) => {
                if (post.source) {
                    sourceCounts[post.source] = (sourceCounts[post.source] || 0) + 1;
                }
            });

            const allRegionStats = [
                ...ALL_REGIONS.government.map(r => ({
                    ...r,
                    count: sourceCounts[r.name] || 0,
                    type: 'government'
                })),
                ...ALL_REGIONS.metro.map(r => ({
                    ...r,
                    count: sourceCounts[r.name] || 0,
                    type: 'metro'
                })),
                ...ALL_REGIONS.province.map(r => ({
                    ...r,
                    count: sourceCounts[r.name] || 0,
                    type: 'province'
                }))
            ];

            setRegionStats(allRegionStats);
            setStats({
                pending: pending.count || 0,
                today: todayPosts.count || 0,
                views: totalViews,
                logs: logs.data || [],
                totalArticles: totalPostsCount.count || 0
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

    const currentDate = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                        <div className="absolute inset-0 w-16 h-16 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
                    </div>
                    <p className="text-cyan-400/80 text-sm font-medium tracking-wide">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f] relative overflow-hidden">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

            {/* Glow Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-[1440px] mx-auto px-6 py-8">

                {/* Header - Glassmorphism */}
                <header className="mb-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                                    Admin Dashboard
                                </h1>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                            <p className="text-[#8b949e] text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-cyan-500/60" />
                                {currentDate}
                            </p>
                        </div>
                        <button
                            onClick={fetchAll}
                            disabled={refreshing}
                            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1c27]/80 border border-[#2d2d3d] hover:border-cyan-500/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                        >
                            <RefreshCw className={`w-4 h-4 text-cyan-400 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                            <span className="text-sm font-medium text-[#c9d1d9] group-hover:text-white transition-colors">Refresh</span>
                        </button>
                    </div>
                </header>

                {/* Stats Grid - Neon Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    <StatCard
                        label="Pending Approval"
                        value={stats?.pending || 0}
                        icon={FileText}
                        color="amber"
                        glow={stats?.pending > 0}
                        href="/admin/news?status=draft"
                    />
                    <StatCard
                        label="Today Collected"
                        value={stats?.today || 0}
                        icon={Zap}
                        color="cyan"
                    />
                    <StatCard
                        label="Total Articles"
                        value={(stats?.totalArticles || 0).toLocaleString()}
                        icon={Newspaper}
                        color="purple"
                    />
                    <StatCard
                        label="Bot Status"
                        value="Active"
                        icon={Activity}
                        color="emerald"
                        status="online"
                    />
                </div>

                {/* Main Grid */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Region Stats - Glass Card */}
                        <div className="rounded-2xl bg-[#12121a]/80 border border-[#2d2d3d] backdrop-blur-xl overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#2d2d3d] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                        <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Regional Article Status</h2>
                                </div>
                                <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <span className="text-sm font-bold text-cyan-400">
                                        Total: {stats?.totalArticles?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Education */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></div>
                                        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Education Offices</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {regionStats.filter(r => r.type === 'education').map((region) => (
                                            <RegionCard key={region.source} region={region} />
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-[#2d2d3d] to-transparent" />

                                {/* Local */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400"></div>
                                        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Local Governments</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {regionStats.filter(r => r.type === 'local').map((region) => (
                                            <RegionCard key={region.source} region={region} compact />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions - Neon Buttons */}
                        <div className="rounded-2xl bg-[#12121a]/80 border border-[#2d2d3d] backdrop-blur-xl overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#2d2d3d]">
                                <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <ActionButton href="/admin/bot/run" icon={Bot} label="Run Bot" color="cyan" />
                                    <ActionButton href="/admin/news/write" icon={PenTool} label="Write Article" color="purple" />
                                    <ActionButton href="/admin/news?status=draft" icon={FileText} label="Pending" color="amber" badge={stats?.pending} />
                                    <ActionButton href="/idea" icon={Lightbulb} label="AI Ideas" color="yellow" />
                                    <ActionButton href="/admin/settings" icon={Settings} label="Settings" color="slate" />
                                </div>
                            </div>
                        </div>

                        {/* Recent Bot Activity */}
                        <div className="rounded-2xl bg-[#12121a]/80 border border-[#2d2d3d] backdrop-blur-xl overflow-hidden">
                            <div className="px-6 py-5 border-b border-[#2d2d3d] flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Recent Bot Activity</h2>
                                <Link href="/admin/bot/logs" className="group flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                                    View All
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                            <div className="p-6 space-y-3">
                                {stats?.logs?.length > 0 ? stats.logs.map((log: any) => (
                                    <div
                                        key={log.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                                            log.status === 'success'
                                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                                                : log.status === 'running'
                                                    ? 'bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10'
                                                    : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`relative flex h-2.5 w-2.5 ${
                                                log.status === 'running' ? 'animate-pulse' : ''
                                            }`}>
                                                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                                    log.status === 'success' ? 'bg-emerald-400' :
                                                    log.status === 'running' ? 'bg-cyan-400 animate-ping' : 'bg-red-400'
                                                }`}></span>
                                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                                    log.status === 'success' ? 'bg-emerald-400' :
                                                    log.status === 'running' ? 'bg-cyan-400' : 'bg-red-400'
                                                }`}></span>
                                            </span>
                                            <span className="font-semibold text-white">
                                                {REGION_NAMES[log.region] || log.region}
                                            </span>
                                            {log.articles_count > 0 && (
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                                                    +{log.articles_count}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-[#8b949e]">{formatTime(log.started_at)}</span>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1c1c27] flex items-center justify-center">
                                            <Bot className="w-8 h-8 text-[#4a4a5a]" />
                                        </div>
                                        <p className="text-[#6e7681] text-sm">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">

                        {/* System Status - Dark Glass */}
                        <div className="rounded-2xl bg-gradient-to-br from-[#0f1419] to-[#161b22] border border-[#2d2d3d] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />
                            <div className="relative px-6 py-5 border-b border-[#2d2d3d]">
                                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-lg shadow-emerald-400/50"></span>
                                    </span>
                                    System Status
                                </h2>
                            </div>
                            <div className="relative p-6 space-y-1">
                                <StatusRow label="Server" value="Normal" status="ok" />
                                <StatusRow label="Database" value="Connected" status="ok" />
                                <StatusRow label="Scheduler" value={testConfig?.enabled ? "Active" : "Inactive"} status={testConfig?.enabled ? "ok" : "off"} />
                            </div>
                        </div>

                        {/* Service Usage */}
                        <Link href="/admin/monitor">
                            <div className="group rounded-2xl bg-[#12121a]/80 border border-[#2d2d3d] hover:border-cyan-500/50 backdrop-blur-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10">
                                <div className="px-6 py-5 border-b border-[#2d2d3d] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <HardDrive className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-lg font-bold text-white">Service Usage</h2>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="p-6 space-y-5">
                                    <UsageBar
                                        label="Cloudinary"
                                        percent={usage?.cloudinary?.storage?.used && usage?.cloudinary?.storage?.limit
                                            ? (usage.cloudinary.storage.used / usage.cloudinary.storage.limit) * 100
                                            : 0}
                                    />
                                    <UsageBar
                                        label="Supabase"
                                        percent={usage?.supabase?.database?.used && usage?.supabase?.database?.limit
                                            ? (usage.supabase.database.used / usage.supabase.database.limit) * 100
                                            : 0}
                                    />
                                </div>
                            </div>
                        </Link>

                        {/* Auto Test Card */}
                        <div className={`rounded-2xl bg-[#12121a]/80 border backdrop-blur-xl overflow-hidden transition-all ${
                            testConfig?.lastResult?.failedRegions?.length > 0
                                ? 'border-red-500/50 shadow-lg shadow-red-500/10'
                                : 'border-[#2d2d3d]'
                        }`}>
                            <div className="px-6 py-5 border-b border-[#2d2d3d] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🧪</span>
                                    <h2 className="text-lg font-bold text-white">Auto Test</h2>
                                    {testConfig?.lastResult?.failedRegions?.length > 0 && (
                                        <span className="px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-bold animate-pulse">
                                            {testConfig.lastResult.failedRegions.length} Failed
                                        </span>
                                    )}
                                </div>
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
                            {testConfig?.enabled && (
                                <div className="px-6 py-2 bg-[#1c1c27]/50 border-b border-[#2d2d3d]">
                                    <p className="text-xs text-[#8b949e] flex items-center gap-2">
                                        <span>⏰</span> Daily at 4:00, 12:00, 20:00
                                    </p>
                                </div>
                            )}
                            <div className="p-6 space-y-4">
                                {testRunning && (
                                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Running...
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setTestRunning(false);
                                                    setTestProgress({ current: 0, total: 0, currentRegion: '' });
                                                }}
                                                className="text-xs text-red-400 hover:text-red-300 font-medium"
                                            >
                                                Stop
                                            </button>
                                        </div>
                                        <div className="relative w-full h-2 bg-[#1c1c27] rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-300"
                                                style={{ width: `${testProgress.total > 0 ? (testProgress.current / testProgress.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-cyan-400/80 mt-2">
                                            {testProgress.currentRegion && `Current: ${testProgress.currentRegion} `}
                                            ({testProgress.current}/{testProgress.total})
                                        </p>
                                    </div>
                                )}

                                {!testRunning && testConfig?.lastResult && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#8b949e]">Last Run</span>
                                            <span className="font-medium text-white">{formatTime(testConfig.lastResult.timestamp)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#8b949e]">Success Rate</span>
                                            <span className={`font-bold ${testConfig.lastResult.failedRegions?.length === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {testConfig.lastResult.successRegions}/{testConfig.lastResult.totalRegions}
                                            </span>
                                        </div>
                                        {testConfig.lastResult.failedRegions?.length > 0 && (
                                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                <p className="text-xs font-bold text-red-400 mb-1">Failed Regions:</p>
                                                <p className="text-xs text-red-400/80">
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
                                        setTestProgress({ current: 0, total: totalRegions, currentRegion: 'Starting...' });
                                        try {
                                            await fetch('/api/bot/test-schedule', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ runNow: true })
                                            });
                                            let completed = 0;
                                            let lastRegion = '';
                                            const startTime = Date.now();
                                            const maxWaitTime = 5 * 60 * 1000;
                                            while (completed < totalRegions && (Date.now() - startTime) < maxWaitTime) {
                                                await new Promise(r => setTimeout(r, 2000));
                                                try {
                                                    const res = await fetch('/api/bot/bot-logs?limit=30');
                                                    const data = await res.json();
                                                    if (data.logs) {
                                                        const recentLogs = data.logs.filter((log: any) => {
                                                            const logTime = new Date(log.started_at).getTime();
                                                            return (Date.now() - logTime) < maxWaitTime;
                                                        });
                                                        const runningLog = recentLogs.find((log: any) => log.status === 'running');
                                                        if (runningLog) {
                                                            lastRegion = REGION_NAMES[runningLog.region] || runningLog.region;
                                                        }
                                                        completed = recentLogs.filter((log: any) =>
                                                            ['success', 'failed', 'error'].includes(log.status)
                                                        ).length;
                                                        setTestProgress({
                                                            current: completed,
                                                            total: totalRegions,
                                                            currentRegion: runningLog ? lastRegion : (completed >= totalRegions ? 'Complete!' : 'Processing...')
                                                        });
                                                        if (completed >= totalRegions || !recentLogs.some((log: any) => log.status === 'running')) {
                                                            break;
                                                        }
                                                    }
                                                } catch (e) {
                                                    console.error('Polling error:', e);
                                                }
                                            }
                                            await fetchAll();
                                        } finally {
                                            setTestRunning(false);
                                            setTestProgress({ current: 0, total: 0, currentRegion: '' });
                                        }
                                    }}
                                    disabled={testRunning}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold hover:from-cyan-500 hover:to-cyan-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                                >
                                    {testRunning ? 'Testing...' : 'Run Manual Test'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Navigation */}
                        <div className="rounded-2xl bg-[#12121a]/80 border border-[#2d2d3d] backdrop-blur-xl overflow-hidden">
                            <div className="p-3 space-y-1">
                                <NavLink href="/admin/news" icon={FileText} label="Article Management" />
                                <NavLink href="/admin/bot/run" icon={Bot} label="Scraper Management" />
                                <NavLink href="/idea" icon={Lightbulb} label="AI Ideas" />
                                <NavLink href="/admin/users" icon={Users} label="User Management" />
                                <NavLink href="/" icon={LayoutDashboard} label="View Site" external />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Components

const COLORS: Record<string, { bg: string; shadow: string; text: string; border: string }> = {
    cyan: { bg: 'from-cyan-600 to-cyan-500', shadow: 'shadow-cyan-500/30', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    purple: { bg: 'from-purple-600 to-purple-500', shadow: 'shadow-purple-500/30', text: 'text-purple-400', border: 'border-purple-500/30' },
    amber: { bg: 'from-amber-600 to-amber-500', shadow: 'shadow-amber-500/30', text: 'text-amber-400', border: 'border-amber-500/30' },
    emerald: { bg: 'from-emerald-600 to-emerald-500', shadow: 'shadow-emerald-500/30', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    yellow: { bg: 'from-yellow-600 to-yellow-500', shadow: 'shadow-yellow-500/30', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    slate: { bg: 'from-slate-600 to-slate-500', shadow: 'shadow-slate-500/30', text: 'text-slate-400', border: 'border-slate-500/30' },
};

function StatCard({ label, value, icon: Icon, color = 'cyan', glow, href, status }: any) {
    const c = COLORS[color] || COLORS.cyan;

    const content = (
        <div className={`group relative rounded-2xl bg-[#12121a]/80 border border-[#2d2d3d] backdrop-blur-xl overflow-hidden transition-all duration-300 ${
            glow ? `ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/20` : ''
        } ${href ? 'cursor-pointer hover:shadow-xl hover:border-[#3d3d4d]' : ''}`}>
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg ${c.shadow} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {status === 'online' && (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-lg shadow-emerald-400/50"></span>
                        </span>
                    )}
                </div>
                <p className={`text-4xl font-black tabular-nums text-white ${glow ? 'text-amber-400' : ''}`}>{value}</p>
                <p className="text-sm text-[#8b949e] mt-1 font-medium">{label}</p>
            </div>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function ActionButton({ href, icon: Icon, label, color = 'cyan', badge }: any) {
    return (
        <Link href={href}>
            <div className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[#1c1c27]/80 border border-[#2d2d3d] hover:border-[#3d3d4d] transition-all duration-300 cursor-pointer hover:shadow-lg`}>
                {badge > 0 && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold min-w-[20px] text-center shadow-lg shadow-red-500/30">
                        {badge}
                    </span>
                )}
                <div className={`w-10 h-10 rounded-xl bg-[#2d2d3d] group-hover:bg-gradient-to-br group-hover:${COLORS[color]?.bg || COLORS.cyan.bg} flex items-center justify-center transition-all duration-300`}>
                    <Icon className={`w-5 h-5 text-[#8b949e] group-hover:text-white transition-colors`} />
                </div>
                <span className="text-xs font-semibold text-[#8b949e] group-hover:text-white transition-colors">{label}</span>
            </div>
        </Link>
    );
}

function RegionCard({ region, compact }: { region: any; compact?: boolean }) {
    const hasArticles = region.count > 0;
    return (
        <div className={`flex items-center justify-between px-3 ${compact ? 'py-2' : 'py-3'} rounded-xl border transition-all duration-200 ${
            hasArticles
                ? 'bg-[#1c1c27]/80 border-[#2d2d3d] hover:border-cyan-500/30 hover:bg-[#1c1c27]'
                : 'bg-[#12121a]/50 border-transparent'
        }`}>
            <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full ${hasArticles ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-[#3d3d4d]'}`} />
                <span className={`${compact ? 'text-xs' : 'text-sm'} truncate ${hasArticles ? 'font-medium text-white' : 'text-[#6e7681]'}`}>
                    {region.name}
                </span>
            </div>
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold tabular-nums ml-2 ${hasArticles ? 'text-cyan-400' : 'text-[#3d3d4d]'}`}>
                {region.count > 0 ? region.count.toLocaleString() : '-'}
            </span>
        </div>
    );
}

function StatusRow({ label, value, status }: any) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-[#21262d] last:border-0">
            <span className="text-sm text-[#8b949e]">{label}</span>
            <span className={`flex items-center gap-2 text-sm font-semibold ${status === 'ok' ? 'text-emerald-400' : 'text-[#6e7681]'}`}>
                {value}
                {status === 'ok' && <CheckCircle2 className="w-4 h-4" />}
            </span>
        </div>
    );
}

function NavLink({ href, icon: Icon, label, external }: any) {
    return (
        <Link
            href={href}
            target={external ? '_blank' : undefined}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-[#8b949e] hover:bg-[#1c1c27] hover:text-white transition-all duration-200"
        >
            <Icon className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
            <span className="text-sm font-medium flex-1">{label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </Link>
    );
}

function ToggleSwitch({ enabled, onToggle }: any) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                enabled
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 shadow-lg shadow-cyan-500/30'
                    : 'bg-[#2d2d3d]'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

function formatTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function UsageBar({ label, percent }: { label: string; percent: number }) {
    const barColor = percent > 80 ? 'from-red-500 to-red-400' : percent > 60 ? 'from-amber-500 to-amber-400' : 'from-cyan-500 to-cyan-400';
    const textColor = percent > 80 ? 'text-red-400' : percent > 60 ? 'text-amber-400' : 'text-[#8b949e]';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-[#8b949e] font-medium">{label}</span>
                <span className={`font-bold ${textColor}`}>{percent.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-[#1c1c27] rounded-full overflow-hidden">
                <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
        </div>
    );
}
