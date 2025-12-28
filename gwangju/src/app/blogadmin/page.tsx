"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FileText,
    Eye,
    TrendingUp,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Zap,
    Globe,
    Bot,
    Rocket,
    Star,
    type LucideIcon
} from 'lucide-react';

// Stat Card Component
function StatCard({
    title,
    value,
    change,
    changeType,
    icon: Icon,
    color,
    href
}: {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    icon: LucideIcon;
    color: string;
    href?: string;
}) {
    const colorClasses: Record<string, string> = {
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
        pink: 'from-pink-500 to-pink-600 shadow-pink-500/30',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
        green: 'from-green-500 to-green-600 shadow-green-500/30',
        amber: 'from-amber-500 to-amber-600 shadow-amber-500/30',
    };

    const card = (
        <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                        ${changeType === 'up' ? 'bg-green-500/20 text-green-400' : ''}
                        ${changeType === 'down' ? 'bg-red-500/20 text-red-400' : ''}
                        ${changeType === 'neutral' ? 'bg-gray-500/20 text-gray-400' : ''}
                    `}>
                        {changeType === 'up' && <ArrowUpRight className="w-3 h-3" />}
                        {changeType === 'down' && <ArrowDownRight className="w-3 h-3" />}
                        {change}
                    </div>
                )}
            </div>
            <div>
                <p className="text-3xl font-bold text-white mb-1">{value}</p>
                <p className="text-sm text-gray-400">{title}</p>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{card}</Link>;
    }
    return card;
}

// Quick Action Button
function QuickAction({
    title,
    description,
    icon: Icon,
    href,
    color
}: {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        purple: 'hover:border-purple-500/50 hover:bg-purple-500/5',
        pink: 'hover:border-pink-500/50 hover:bg-pink-500/5',
        blue: 'hover:border-blue-500/50 hover:bg-blue-500/5',
        green: 'hover:border-green-500/50 hover:bg-green-500/5',
    };

    return (
        <Link
            href={href}
            className={`flex items-center gap-4 p-4 bg-[#12121a] border border-purple-500/20 rounded-xl transition-all ${colorClasses[color]}`}
        >
            <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-white">{title}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500" />
        </Link>
    );
}

// Recent Post Item
function RecentPostItem({ title, category, views, date, status }: {
    title: string;
    category: string;
    views: number;
    date: string;
    status: string;
}) {
    return (
        <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-purple-500/5 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">{category}</span>
                    <span>{date}</span>
                </div>
            </div>
            <div className="text-right">
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Eye className="w-3.5 h-3.5" />
                    {views.toLocaleString()}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                    {status}
                </span>
            </div>
        </div>
    );
}

export default function BlogAdminDashboard() {
    const [stats, setStats] = useState({
        total_posts: 0,
        published_posts: 0,
        draft_posts: 0,
        total_views: 0,
        ai_generated_posts: 0,
        pending_topics: 0,
        active_sources: 0
    });

    const [recentPosts, setRecentPosts] = useState<Array<{
        id: string;
        title: string;
        category: string;
        view_count: number;
        created_at: string;
        status: string;
    }>>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, postsRes] = await Promise.all([
                    fetch('/api/blog/stats'),
                    fetch('/api/blog/posts?limit=5&sort=created_at:desc')
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                if (postsRes.ok) {
                    const postsData = await postsRes.json();
                    setRecentPosts(postsData.posts || []);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Format date helper
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Rocket className="w-7 h-7 text-purple-400" />
                        CosmicPulse Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">SF & Space Blog Management</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/blogadmin/ai-generator"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30"
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate with AI
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Posts"
                    value={stats.total_posts}
                    icon={FileText}
                    color="purple"
                    href="/blogadmin/posts"
                />
                <StatCard
                    title="Published"
                    value={stats.published_posts}
                    change="+12%"
                    changeType="up"
                    icon={Globe}
                    color="green"
                    href="/blogadmin/posts?status=published"
                />
                <StatCard
                    title="Total Views"
                    value={stats.total_views.toLocaleString()}
                    change="+8%"
                    changeType="up"
                    icon={Eye}
                    color="blue"
                />
                <StatCard
                    title="AI Generated"
                    value={stats.ai_generated_posts}
                    icon={Sparkles}
                    color="pink"
                    href="/blogadmin/ai-generator/logs"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Posts */}
                <div className="lg:col-span-2 bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            Recent Posts
                        </h2>
                        <Link href="/blogadmin/posts" className="text-sm text-purple-400 hover:text-purple-300">
                            View All
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-purple-500/5 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : recentPosts.length > 0 ? (
                        <div className="space-y-2">
                            {recentPosts.map(post => (
                                <RecentPostItem
                                    key={post.id}
                                    title={post.title}
                                    category={post.category}
                                    views={post.view_count}
                                    date={formatDate(post.created_at)}
                                    status={post.status}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No posts yet</p>
                            <Link href="/blogadmin/posts/new" className="text-purple-400 hover:underline text-sm">
                                Create your first post
                            </Link>
                        </div>
                    )}
                </div>

                {/* Quick Actions & Stats */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-400" />
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            <QuickAction
                                title="AI Generate Post"
                                description="Create content with AI"
                                icon={Sparkles}
                                href="/blogadmin/ai-generator"
                                color="purple"
                            />
                            <QuickAction
                                title="Write Manual Post"
                                description="Create post manually"
                                icon={FileText}
                                href="/blogadmin/posts/new"
                                color="blue"
                            />
                            <QuickAction
                                title="View Trending"
                                description={`${stats.pending_topics} topics available`}
                                icon={TrendingUp}
                                href="/blogadmin/trending"
                                color="pink"
                            />
                        </div>
                    </div>

                    {/* Source Status */}
                    <div className="bg-[#12121a] border border-purple-500/20 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Bot className="w-5 h-5 text-green-400" />
                            System Status
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-sm text-gray-300">Active Sources</span>
                                </div>
                                <span className="font-semibold text-green-400">{stats.active_sources}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm text-gray-300">Drafts Pending</span>
                                </div>
                                <span className="font-semibold text-purple-400">{stats.draft_posts}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
