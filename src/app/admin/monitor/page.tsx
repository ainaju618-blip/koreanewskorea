"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Cloud,
    Database,
    Server,
    HardDrive,
    RefreshCw,
    Loader2,
    ExternalLink,
    Activity,
    Github,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    Zap,
    Play
} from 'lucide-react';

type TabType = 'usage' | 'performance' | 'bot' | 'github';

interface TabConfig {
    id: TabType;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabConfig[] = [
    { id: 'usage', label: 'Service Usage', icon: <Cloud className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance', icon: <Activity className="w-4 h-4" /> },
    { id: 'bot', label: 'Bot Status', icon: <Server className="w-4 h-4" /> },
    { id: 'github', label: 'GitHub Actions', icon: <Github className="w-4 h-4" /> }
];

export default function MonitorPage() {
    const [activeTab, setActiveTab] = useState<TabType>('usage');
    const [loading, setLoading] = useState(true);

    // Data states
    const [usageData, setUsageData] = useState<any>(null);
    const [performanceData, setPerformanceData] = useState<any>(null);
    const [botData, setBotData] = useState<any>(null);
    const [githubData, setGithubData] = useState<any>(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchUsage(),
            fetchPerformance(),
            fetchBotHealth(),
            fetchGithubActions()
        ]);
        setLoading(false);
    };

    const fetchUsage = async () => {
        try {
            const res = await fetch('/api/admin/usage');
            const data = await res.json();
            setUsageData(data);
        } catch (e) {
            console.error('Usage fetch error:', e);
        }
    };

    const fetchPerformance = async () => {
        try {
            const res = await fetch('/api/admin/performance');
            const data = await res.json();
            setPerformanceData(data.data || []);
        } catch (e) {
            console.error('Performance fetch error:', e);
        }
    };

    const fetchBotHealth = async () => {
        try {
            const res = await fetch('/api/bot/health');
            const data = await res.json();
            setBotData(data);
        } catch (e) {
            console.error('Bot health fetch error:', e);
        }
    };

    const fetchGithubActions = async () => {
        try {
            const res = await fetch('/api/admin/github-actions');
            const data = await res.json();
            setGithubData(data);
        } catch (e) {
            console.error('GitHub Actions fetch error:', e);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
        if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
        return `${(bytes / 1024).toFixed(2)} KB`;
    };

    const getPercent = (used: number, limit: number) => {
        return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    };

    const getBarColor = (percent: number) => {
        if (percent > 80) return 'bg-red-500';
        if (percent > 60) return 'bg-amber-500';
        return 'bg-blue-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-6">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-violet-500/20 rounded-xl">
                                <Activity className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Monitoring Center</h1>
                                <p className="text-sm text-slate-400 mt-0.5">System status & resource usage</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchAllData}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-[#21262d] border border-[#30363d] rounded-lg text-slate-300 hover:text-white hover:bg-[#30363d] transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh All
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-[#161b22] rounded-xl border border-[#30363d] mb-6">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-[#21262d] text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-[#21262d]/50'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'usage' && (
                        <UsageTab data={usageData} formatSize={formatSize} getPercent={getPercent} getBarColor={getBarColor} />
                    )}
                    {activeTab === 'performance' && (
                        <PerformanceTab data={performanceData} />
                    )}
                    {activeTab === 'bot' && (
                        <BotStatusTab data={botData} />
                    )}
                    {activeTab === 'github' && (
                        <GithubActionsTab data={githubData} />
                    )}
                </div>

                {/* Summary Footer */}
                <div className="mt-8 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
                    <h3 className="font-semibold text-slate-200 mb-3">Free Plan Limits Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-blue-400 font-bold">25 GB</p>
                            <p className="text-slate-500 text-xs">Cloudinary</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <p className="text-emerald-400 font-bold">500 MB</p>
                            <p className="text-slate-500 text-xs">Supabase DB</p>
                        </div>
                        <div className="text-center p-3 bg-slate-500/10 rounded-lg border border-slate-500/20">
                            <p className="text-slate-300 font-bold">100 GB</p>
                            <p className="text-slate-500 text-xs">Vercel BW</p>
                        </div>
                        <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <p className="text-purple-400 font-bold">2,000 min</p>
                            <p className="text-slate-500 text-xs">Actions/mo</p>
                        </div>
                        <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <p className="text-amber-400 font-bold">25,000</p>
                            <p className="text-slate-500 text-xs">PageSpeed/day</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Usage Tab Component
function UsageTab({ data, formatSize, getPercent, getBarColor }: any) {
    return (
        <div className="space-y-4">
            {/* Cloudinary */}
            <ServiceCard
                icon={Cloud}
                name="Cloudinary"
                description="Image CDN & Storage"
                link="https://console.cloudinary.com"
                color="blue"
            >
                <UsageItem
                    label="Storage"
                    used={data?.cloudinary?.storage?.used || 0}
                    limit={25 * 1024 * 1024 * 1024}
                    formatSize={formatSize}
                    getPercent={getPercent}
                    getBarColor={getBarColor}
                />
                <UsageItem
                    label="Monthly Bandwidth"
                    used={data?.cloudinary?.bandwidth?.used || 0}
                    limit={25 * 1024 * 1024 * 1024}
                    formatSize={formatSize}
                    getPercent={getPercent}
                    getBarColor={getBarColor}
                />
                <div className="pt-3 border-t border-[#30363d]">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Transform Credits</span>
                        <span className="font-medium text-slate-200">{(data?.cloudinary?.credits?.used || 0).toFixed(2)} / 25</span>
                    </div>
                </div>
            </ServiceCard>

            {/* Supabase */}
            <ServiceCard
                icon={Database}
                name="Supabase"
                description="PostgreSQL Database"
                link="https://supabase.com/dashboard"
                color="emerald"
            >
                <UsageItem
                    label="Database Size"
                    used={data?.supabase?.database?.used || 0}
                    limit={500 * 1024 * 1024}
                    formatSize={formatSize}
                    getPercent={getPercent}
                    getBarColor={getBarColor}
                />
                <div className="pt-3 border-t border-[#30363d] space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Posts</span>
                        <span className="font-medium text-slate-200">{data?.supabase?.database?.rows?.posts?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Bot Logs</span>
                        <span className="font-medium text-slate-200">{data?.supabase?.database?.rows?.logs?.toLocaleString() || 0}</span>
                    </div>
                </div>
                <p className="text-xs text-slate-600 pt-2 border-t border-[#30363d]">
                    * Estimated size. Check Supabase dashboard for exact values.
                </p>
            </ServiceCard>

            {/* Vercel */}
            <ServiceCard
                icon={Server}
                name="Vercel"
                description="Hosting & Serverless"
                link="https://vercel.com/koreanews-projects/koreanewsone"
                color="slate"
            >
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Monthly Bandwidth</span>
                        <span className="font-medium text-slate-200">100 GB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Serverless Executions</span>
                        <span className="font-medium text-slate-200">100K / day</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Build Time</span>
                        <span className="font-medium text-slate-200">100 hrs / mo</span>
                    </div>
                </div>
            </ServiceCard>

            {/* GitHub */}
            <ServiceCard
                icon={HardDrive}
                name="GitHub"
                description="Source Repository"
                link="https://github.com/korea-news/koreanewsone"
                color="purple"
            >
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Repository Size</span>
                        <span className="font-medium text-slate-200">Unlimited (rec. 1GB)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">LFS Storage</span>
                        <span className="font-medium text-slate-200">1 GB (free)</span>
                    </div>
                </div>
            </ServiceCard>
        </div>
    );
}

// Performance Tab Component
function PerformanceTab({ data }: { data: any[] }) {
    const latest = data?.[0];
    const previous = data?.[1];

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getTrend = (current: number | undefined, prev: number | undefined) => {
        if (!current || !prev) return null;
        const diff = current - prev;
        if (diff > 0) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
        if (diff < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
        return <Minus className="w-3 h-3 text-slate-500" />;
    };

    const formatMs = (ms: number | null) => {
        if (ms === null) return '-';
        if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
        return `${ms}ms`;
    };

    if (!latest) {
        return (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
                <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No performance data yet.</p>
                <Link
                    href="/admin/settings/performance"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500"
                >
                    <Zap className="w-4 h-4" />
                    Run Analysis
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Score Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Performance', value: latest.performance, prev: previous?.performance },
                    { label: 'Accessibility', value: latest.accessibility, prev: previous?.accessibility },
                    { label: 'Best Practices', value: latest.best_practices, prev: previous?.best_practices },
                    { label: 'SEO', value: latest.seo, prev: previous?.seo }
                ].map((item) => (
                    <div key={item.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                            {getTrend(item.value, item.prev)}
                        </div>
                        <div className={`text-3xl font-bold ${getScoreColor(item.value)}`}>
                            {item.value}
                        </div>
                        <div className="mt-2 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getScoreBg(item.value)} transition-all`}
                                style={{ width: `${item.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Core Web Vitals */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white">Core Web Vitals</h2>
                    <Link
                        href="/admin/settings/performance"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        View Details <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
                <div className="grid grid-cols-5 gap-4">
                    {[
                        { label: 'LCP', value: latest.lcp_ms, target: 2500 },
                        { label: 'FCP', value: latest.fcp_ms, target: 1800 },
                        { label: 'TBT', value: latest.tbt_ms, target: 200 },
                        { label: 'CLS', value: latest.cls, target: 0.1, isCls: true },
                        { label: 'SI', value: latest.si_ms, target: 3400 }
                    ].map((item) => {
                        const isGood = item.value !== null && item.value <= item.target;
                        return (
                            <div key={item.label} className="text-center">
                                <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                                <div className={`text-lg font-bold ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {item.isCls ? item.value?.toFixed(3) || '-' : formatMs(item.value)}
                                </div>
                                <div className="text-[10px] text-slate-600">
                                    target: {item.isCls ? item.target : formatMs(item.target)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Last Measured */}
            <div className="text-xs text-slate-500 text-right">
                Last measured: {new Date(latest.measured_at).toLocaleString('ko-KR')}
            </div>
        </div>
    );
}

// Bot Status Tab Component
function BotStatusTab({ data }: { data: any }) {
    if (!data || data.error) {
        return (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Failed to load bot status.</p>
            </div>
        );
    }

    const { summary, regions } = data;
    const regionList = Object.entries(regions || {}).sort((a: any, b: any) => {
        // Sort by status: failed first, then running, then success
        const statusOrder: Record<string, number> = { failed: 0, error: 0, running: 1, success: 2 };
        return (statusOrder[a[1].lastStatus] || 3) - (statusOrder[b[1].lastStatus] || 3);
    });

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-200">{summary?.totalRegions || 0}</div>
                    <div className="text-xs text-slate-500">Total Regions</div>
                </div>
                <div className="bg-[#161b22] border border-emerald-500/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{summary?.healthyRegions || 0}</div>
                    <div className="text-xs text-slate-500">Healthy</div>
                </div>
                <div className="bg-[#161b22] border border-red-500/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{summary?.failedRegions || 0}</div>
                    <div className="text-xs text-slate-500">Failed</div>
                </div>
                <div className="bg-[#161b22] border border-blue-500/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{summary?.runningRegions || 0}</div>
                    <div className="text-xs text-slate-500">Running</div>
                </div>
            </div>

            {/* Region List */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Region Status</h2>
                    <Link
                        href="/admin/bot/logs"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        View Logs <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#161b22]">
                            <tr className="text-left text-xs text-slate-500 border-b border-[#30363d]">
                                <th className="px-4 py-2 font-medium">Region</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 font-medium text-center">Success Rate</th>
                                <th className="px-4 py-2 font-medium text-center">Articles</th>
                                <th className="px-4 py-2 font-medium">Last Run</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regionList.map(([region, info]: [string, any]) => (
                                <tr key={region} className="border-b border-[#21262d] hover:bg-[#21262d]/50">
                                    <td className="px-4 py-2 text-slate-300">{region}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                            info.lastStatus === 'success'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : info.lastStatus === 'running'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {info.lastStatus === 'success' && <CheckCircle className="w-3 h-3" />}
                                            {info.lastStatus === 'running' && <Clock className="w-3 h-3" />}
                                            {['failed', 'error'].includes(info.lastStatus) && <XCircle className="w-3 h-3" />}
                                            {info.lastStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className={info.successRate >= 80 ? 'text-emerald-400' : info.successRate >= 50 ? 'text-amber-400' : 'text-red-400'}>
                                            {info.successRate}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center text-slate-400">{info.totalArticles}</td>
                                    <td className="px-4 py-2 text-slate-500 text-xs">
                                        {info.lastRun ? new Date(info.lastRun).toLocaleString('ko-KR', {
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// GitHub Actions Tab Component
function GithubActionsTab({ data }: { data: any }) {
    if (!data || data.error) {
        return (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
                <Github className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">{data?.error || 'Failed to load GitHub Actions data.'}</p>
                {!data?.config?.hasToken && (
                    <p className="text-xs text-slate-500 mt-2">GITHUB_TOKEN not configured</p>
                )}
            </div>
        );
    }

    const { runs, usage, stats } = data;
    const usagePercent = usage ? (usage.used_this_month / usage.included_minutes) * 100 : 0;

    return (
        <div className="space-y-4">
            {/* Usage & Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
                {/* Minutes Usage */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Monthly Minutes</h3>
                        <a
                            href="https://github.com/settings/billing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            Billing <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-bold text-slate-200">{usage?.used_this_month || 0}</span>
                        <span className="text-sm text-slate-500">/ {usage?.included_minutes?.toLocaleString() || 2000} min</span>
                    </div>
                    <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${
                                usagePercent > 80 ? 'bg-red-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Remaining: {usage?.remaining?.toLocaleString() || 2000} minutes
                    </p>
                </div>

                {/* Run Stats */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Recent Runs</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                            <div className="text-xl font-bold text-emerald-400">{stats?.success || 0}</div>
                            <div className="text-xs text-slate-500">Success</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-red-400">{stats?.failed || 0}</div>
                            <div className="text-xs text-slate-500">Failed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-blue-400">{stats?.inProgress || 0}</div>
                            <div className="text-xs text-slate-500">Running</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workflow Runs List */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Workflow Runs</h2>
                    <a
                        href={`https://github.com/${data.config?.owner}/${data.config?.repo}/actions`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        View All <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#161b22]">
                            <tr className="text-left text-xs text-slate-500 border-b border-[#30363d]">
                                <th className="px-4 py-2 font-medium">Workflow</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 font-medium">Event</th>
                                <th className="px-4 py-2 font-medium">Started</th>
                                <th className="px-4 py-2 font-medium w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs?.map((run: any) => (
                                <tr key={run.id} className="border-b border-[#21262d] hover:bg-[#21262d]/50">
                                    <td className="px-4 py-2 text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <Play className="w-3 h-3 text-slate-500" />
                                            {run.name}
                                        </div>
                                        <div className="text-xs text-slate-600">#{run.run_number}</div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                            run.conclusion === 'success'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : run.status === 'in_progress'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : run.conclusion === 'failure'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-slate-500/20 text-slate-400'
                                        }`}>
                                            {run.conclusion === 'success' && <CheckCircle className="w-3 h-3" />}
                                            {run.status === 'in_progress' && <Loader2 className="w-3 h-3 animate-spin" />}
                                            {run.conclusion === 'failure' && <XCircle className="w-3 h-3" />}
                                            {run.conclusion || run.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-500 text-xs">{run.event}</td>
                                    <td className="px-4 py-2 text-slate-500 text-xs">
                                        {run.run_started_at ? new Date(run.run_started_at).toLocaleString('ko-KR', {
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </td>
                                    <td className="px-4 py-2">
                                        <a
                                            href={run.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-500 hover:text-blue-400"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {(!runs || runs.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No workflow runs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Shared Components
function ServiceCard({ icon: Icon, name, description, link, color, children }: any) {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-400',
        emerald: 'text-emerald-400',
        slate: 'text-slate-400',
        purple: 'text-purple-400'
    };

    return (
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-5">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#21262d]">
                        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-200">{name}</h2>
                        <p className="text-xs text-slate-500">{description}</p>
                    </div>
                </div>
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                    Dashboard <ExternalLink className="w-3 h-3" />
                </a>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
}

function UsageItem({ label, used, limit, formatSize, getPercent, getBarColor }: any) {
    const percent = getPercent(used, limit);

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">{label}</span>
                <span className="font-medium text-slate-200">
                    {formatSize(used)} / {formatSize(limit)}
                    <span className={`ml-2 text-xs ${percent > 80 ? 'text-red-400' : percent > 60 ? 'text-amber-400' : 'text-slate-500'}`}>
                        ({percent.toFixed(1)}%)
                    </span>
                </span>
            </div>
            <div className="w-full bg-[#21262d] rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all ${getBarColor(percent)}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
