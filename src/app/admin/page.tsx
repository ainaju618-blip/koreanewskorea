"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FileText, TrendingUp, Activity, Loader2, RefreshCw,
    CheckCircle2, ChevronRight, Zap, Settings,
    PenTool, Users, LayoutDashboard, Bot, Calendar,
    Newspaper, MapPin, Lightbulb, HardDrive
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// shadcn components
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Separator } from '@/components/ui/shadcn/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Region data
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
                supabase.from('bot_logs').select('*').order('started_at', { ascending: false }).limit(5),
                fetch('/api/bot/test-schedule').then(r => r.json()).catch(() => null),
                supabase.from('posts').select('source'),
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

    const currentDate = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen">
                <div className="max-w-[1440px] mx-auto px-6 py-8">

                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                                    <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                                        <span className="relative flex h-2 w-2 mr-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                        </span>
                                        Online
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {currentDate}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchAll}
                                disabled={refreshing}
                                className="gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            label="Pending Approval"
                            value={stats?.pending || 0}
                            icon={FileText}
                            accent={stats?.pending > 0}
                            href="/admin/news?status=draft"
                        />
                        <StatCard
                            label="Today Collected"
                            value={stats?.today || 0}
                            icon={Zap}
                        />
                        <StatCard
                            label="Total Articles"
                            value={(stats?.totalArticles || 0).toLocaleString()}
                            icon={Newspaper}
                        />
                        <StatCard
                            label="Bot Status"
                            value="Active"
                            icon={Activity}
                            status="online"
                        />
                    </div>

                    {/* Main Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">

                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Region Stats */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <MapPin className="w-5 h-5 text-primary" />
                                            Regional Article Status
                                        </CardTitle>
                                        <Badge variant="secondary">
                                            Total: {stats?.totalArticles?.toLocaleString()}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Education */}
                                    <div>
                                        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                                            Education Offices
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {regionStats.filter(r => r.type === 'education').map((region) => (
                                                <RegionCard key={region.source} region={region} />
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Local */}
                                    <div>
                                        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                                            Local Governments
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {regionStats.filter(r => r.type === 'local').map((region) => (
                                                <RegionCard key={region.source} region={region} />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <ActionButton href="/admin/bot/run" icon={Bot} label="Run Bot" />
                                        <ActionButton href="/admin/news/write" icon={PenTool} label="Write Article" />
                                        <ActionButton href="/admin/news?status=draft" icon={FileText} label="Pending" badge={stats?.pending} />
                                        <ActionButton href="/idea" icon={Lightbulb} label="AI Ideas" />
                                        <ActionButton href="/admin/settings" icon={Settings} label="Settings" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Bot Activity */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Recent Bot Activity</CardTitle>
                                        <Link href="/admin/bot/logs">
                                            <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                                View All <ChevronRight className="w-3 h-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {stats?.logs?.length > 0 ? stats.logs.map((log: any) => (
                                            <div
                                                key={log.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                    log.status === 'success'
                                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                                        : log.status === 'running'
                                                            ? 'bg-blue-500/5 border-blue-500/20'
                                                            : 'bg-destructive/5 border-destructive/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        log.status === 'success' ? 'bg-emerald-500' :
                                                        log.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-destructive'
                                                    }`} />
                                                    <span className="font-medium text-sm">
                                                        {REGION_NAMES[log.region] || log.region}
                                                    </span>
                                                    {log.articles_count > 0 && (
                                                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs">
                                                            +{log.articles_count}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{formatTime(log.started_at)}</span>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                                <p className="text-sm">No recent activity</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">

                            {/* System Status */}
                            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg text-white flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                                        </span>
                                        System Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <StatusRow label="Server" value="Normal" status="ok" />
                                    <StatusRow label="Database" value="Connected" status="ok" />
                                    <StatusRow label="Scheduler" value={testConfig?.enabled ? "Active" : "Inactive"} status={testConfig?.enabled ? "ok" : "off"} />
                                </CardContent>
                            </Card>

                            {/* Service Usage */}
                            <Link href="/admin/monitor">
                                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <HardDrive className="w-5 h-5 text-blue-500" />
                                                Service Usage
                                            </CardTitle>
                                            <span className="text-xs text-blue-500">Details →</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
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
                                    </CardContent>
                                </Card>
                            </Link>

                            {/* Test Scheduler */}
                            <Card className={testConfig?.lastResult?.failedRegions?.length > 0 ? 'ring-2 ring-destructive/50' : ''}>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <span className="text-lg">🧪</span>
                                            Auto Test
                                            {testConfig?.lastResult?.failedRegions?.length > 0 && (
                                                <Badge variant="destructive" className="animate-pulse">
                                                    {testConfig.lastResult.failedRegions.length} Failed
                                                </Badge>
                                            )}
                                        </CardTitle>
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
                                        <CardDescription className="flex items-center gap-1 mt-2">
                                            <span>⏰</span>
                                            Daily at 4:00, 12:00, 20:00
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {testRunning && (
                                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-blue-400 flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Running...
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setTestRunning(false);
                                                        setTestProgress({ current: 0, total: 0, currentRegion: '' });
                                                    }}
                                                    className="h-6 text-xs text-destructive hover:text-destructive"
                                                >
                                                    Stop
                                                </Button>
                                            </div>
                                            <div className="w-full bg-blue-500/20 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${testProgress.total > 0 ? (testProgress.current / testProgress.total) * 100 : 0}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-blue-400">
                                                {testProgress.currentRegion && `Current: ${testProgress.currentRegion} `}
                                                ({testProgress.current}/{testProgress.total})
                                            </p>
                                        </div>
                                    )}

                                    {!testRunning && testConfig?.lastResult && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Last Run</span>
                                                <span className="font-medium">{formatTime(testConfig.lastResult.timestamp)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Success Rate</span>
                                                <span className={`font-bold ${testConfig.lastResult.failedRegions?.length === 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                                                    {testConfig.lastResult.successRegions}/{testConfig.lastResult.totalRegions}
                                                </span>
                                            </div>
                                            {testConfig.lastResult.failedRegions?.length > 0 && (
                                                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                                                    <p className="text-xs font-semibold text-destructive mb-1">Failed Regions:</p>
                                                    <p className="text-xs text-destructive/80">
                                                        {testConfig.lastResult.failedRegions.join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Button
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
                                        className="w-full"
                                    >
                                        {testRunning ? 'Testing...' : 'Run Manual Test'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Navigation */}
                            <Card>
                                <CardContent className="p-2">
                                    <nav className="space-y-1">
                                        <NavLink href="/admin/news" icon={FileText} label="Article Management" />
                                        <NavLink href="/admin/bot/run" icon={Bot} label="Scraper Management" />
                                        <NavLink href="/idea" icon={Lightbulb} label="AI Ideas" />
                                        <NavLink href="/admin/users" icon={Users} label="User Management" />
                                        <NavLink href="/" icon={LayoutDashboard} label="View Site" external />
                                    </nav>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

// Components

function StatCard({ label, value, icon: Icon, accent, href, status }: any) {
    const content = (
        <Card className={`group transition-all hover:shadow-md ${accent ? 'ring-1 ring-primary/50' : ''} ${href ? 'cursor-pointer hover:border-primary/50' : ''}`}>
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
                    {status === 'online' && (
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                    )}
                </div>
                <p className={`text-3xl font-bold tabular-nums ${accent ? 'text-primary' : ''}`}>{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </CardContent>
        </Card>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function ActionButton({ href, icon: Icon, label, badge }: any) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link href={href}>
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 relative group">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs font-medium">{label}</span>
                        {badge > 0 && (
                            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-5 text-xs">
                                {badge}
                            </Badge>
                        )}
                    </Button>
                </Link>
            </TooltipTrigger>
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
}

function RegionCard({ region }: { region: any }) {
    const hasArticles = region.count > 0;
    return (
        <div className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${
            hasArticles
                ? 'bg-card border-border hover:border-primary/50'
                : 'bg-muted/50 border-transparent'
        }`}>
            <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasArticles ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                <span className={`truncate ${hasArticles ? 'font-medium' : 'text-muted-foreground'}`}>
                    {region.name}
                </span>
            </div>
            <span className={`font-bold tabular-nums ml-2 ${hasArticles ? '' : 'text-muted-foreground/50'}`}>
                {region.count > 0 ? region.count.toLocaleString() : '-'}
            </span>
        </div>
    );
}

function StatusRow({ label, value, status }: any) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-0">
            <span className="text-slate-400 text-sm">{label}</span>
            <span className={`flex items-center gap-2 text-sm font-medium ${status === 'ok' ? 'text-emerald-400' : 'text-slate-500'}`}>
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
        >
            <Icon className="w-4 h-4 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium flex-1">{label}</span>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </Link>
    );
}

function ToggleSwitch({ enabled, onToggle }: any) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-primary' : 'bg-muted'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
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

function UsageBarSimple({ label, percent }: { label: string; percent: number }) {
    const barColor = percent > 80 ? 'bg-destructive' : percent > 60 ? 'bg-amber-500' : 'bg-blue-500';
    const textColor = percent > 80 ? 'text-destructive' : percent > 60 ? 'text-amber-500' : 'text-muted-foreground';

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-20">{label}</span>
            <div className="flex-1 bg-muted rounded-full h-2">
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
