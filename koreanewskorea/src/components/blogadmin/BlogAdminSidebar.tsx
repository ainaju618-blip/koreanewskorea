"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    PenTool,
    Sparkles,
    Globe,
    Settings,
    ChevronRight,
    LogOut,
    Rss,
    TrendingUp,
    BarChart3,
    Rocket,
    LucideIcon,
    ExternalLink,
    Bot
} from 'lucide-react';

// Menu Item Types
interface SubMenuItem {
    label: string;
    href: string;
    icon?: LucideIcon;
}

interface MenuItem {
    label: string;
    icon: LucideIcon;
    href: string;
    highlight?: boolean;
    subItems?: SubMenuItem[];
}

interface MenuGroup {
    category: string;
    items: MenuItem[];
}

// Sidebar Menu Structure
const MENU_ITEMS: MenuGroup[] = [
    {
        category: "Main",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/blogadmin" },
            { label: "Trending Topics", icon: TrendingUp, href: "/blogadmin/trending" }
        ]
    },
    {
        category: "Content",
        items: [
            {
                label: "Posts",
                icon: FileText,
                href: "/blogadmin/posts",
                subItems: [
                    { label: "All Posts", href: "/blogadmin/posts", icon: FileText },
                    { label: "Published", href: "/blogadmin/posts?status=published", icon: Globe },
                    { label: "Drafts", href: "/blogadmin/posts?status=draft", icon: PenTool },
                    { label: "New Post", href: "/blogadmin/posts/new", icon: PenTool }
                ]
            },
            {
                label: "AI Generator",
                icon: Sparkles,
                href: "/blogadmin/ai-generator",
                highlight: true,
                subItems: [
                    { label: "Generate Post", href: "/blogadmin/ai-generator", icon: Sparkles },
                    { label: "Generation Logs", href: "/blogadmin/ai-generator/logs", icon: BarChart3 },
                    { label: "Auto Schedule", href: "/blogadmin/ai-generator/schedule", icon: Bot }
                ]
            }
        ]
    },
    {
        category: "Settings",
        items: [
            {
                label: "Sources",
                icon: Rss,
                href: "/blogadmin/sources",
                subItems: [
                    { label: "All Sources", href: "/blogadmin/sources", icon: Rss },
                    { label: "Add Source", href: "/blogadmin/sources/new", icon: PenTool }
                ]
            },
            {
                label: "Configuration",
                icon: Settings,
                href: "/blogadmin/settings",
                subItems: [
                    { label: "General", href: "/blogadmin/settings", icon: Settings },
                    { label: "WordPress", href: "/blogadmin/settings/wordpress", icon: Globe },
                    { label: "AI Settings", href: "/blogadmin/settings/ai", icon: Sparkles }
                ]
            }
        ]
    },
    {
        category: "Links",
        items: [
            { label: "View Blog", icon: ExternalLink, href: "/blog" },
            { label: "News Admin", icon: ExternalLink, href: "/admin" }
        ]
    }
];

// Stats interface
interface BlogStats {
    drafts: number;
    pendingTopics: number;
}

export default function BlogAdminSidebarLayout({ children }: { children: React.ReactNode }) {
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['Posts', 'AI Generator']);
    const pathname = usePathname();
    const [stats, setStats] = useState<BlogStats>({ drafts: 0, pendingTopics: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/blog/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        drafts: data.draft_posts || 0,
                        pendingTopics: data.pending_topics || 0
                    });
                }
            } catch (error) {
                console.error('Failed to fetch blog stats:', error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const toggleMenu = (label: string) => {
        if (expandedMenus.includes(label)) {
            setExpandedMenus(expandedMenus.filter(item => item !== label));
        } else {
            setExpandedMenus([...expandedMenus, label]);
        }
    };

    const getBadgeCount = (href: string, label: string): number => {
        if (href === '/blogadmin/posts?status=draft' || label === 'Drafts') {
            return stats.drafts;
        }
        if (href === '/blogadmin/trending') {
            return stats.pendingTopics;
        }
        return 0;
    };

    const getParentBadgeCount = (label: string): number => {
        if (label === 'Posts') return stats.drafts;
        return 0;
    };

    return (
        <div className="blog-admin-layout flex min-h-screen bg-[#0a0a0f] text-gray-100 font-sans">

            {/* Sidebar */}
            <aside className="w-64 bg-[#06060a] border-r border-purple-900/30 flex flex-col fixed h-full z-10">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 border-b border-purple-900/30 bg-gradient-to-r from-purple-900/20 to-transparent">
                    <Link href="/blogadmin" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                CosmicPulse
                            </span>
                            <p className="text-[10px] text-purple-400/60 -mt-0.5">Blog Admin</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-5" style={{ maxHeight: 'calc(100vh - 64px - 80px)' }}>
                    {MENU_ITEMS.map((group, idx) => (
                        <div key={idx}>
                            {group.category && (
                                <div className="px-3 mb-2 text-[10px] font-semibold text-purple-400/50 uppercase tracking-widest">
                                    {group.category}
                                </div>
                            )}
                            <ul className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href || item.subItems?.some(sub => pathname === sub.href);
                                    const isExpanded = expandedMenus.includes(item.label);
                                    const Icon = item.icon;

                                    return (
                                        <li key={item.label}>
                                            {item.subItems ? (
                                                <div>
                                                    <button
                                                        onClick={() => toggleMenu(item.label)}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
                                                            ${isActive
                                                                ? 'bg-purple-500/15 text-purple-300'
                                                                : 'text-gray-400 hover:bg-purple-500/10 hover:text-purple-300'}
                                                            ${item.highlight ? 'ring-1 ring-purple-500/30' : ''}
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                                                            <span>{item.label}</span>
                                                            {getParentBadgeCount(item.label) > 0 && (
                                                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded-full min-w-[18px] text-center">
                                                                    {getParentBadgeCount(item.label)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <ChevronRight className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </button>

                                                    <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                        <ul className="mt-1 ml-3 space-y-0.5 border-l border-purple-500/20 pl-3">
                                                            {item.subItems.map((sub) => {
                                                                const isSubActive = sub.href.includes('?')
                                                                    ? pathname + (typeof window !== 'undefined' ? window.location.search : '') === sub.href
                                                                    : pathname === sub.href;
                                                                return (
                                                                    <li key={sub.label}>
                                                                        <Link
                                                                            href={sub.href}
                                                                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all duration-150 w-full
                                                                                ${isSubActive
                                                                                    ? 'text-purple-300 font-semibold bg-purple-500/10'
                                                                                    : 'text-gray-500 hover:text-purple-300 hover:bg-purple-500/5'}
                                                                            `}
                                                                        >
                                                                            {sub.icon && <sub.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-purple-400' : 'text-gray-600'}`} />}
                                                                            <span className="flex-1">{sub.label}</span>
                                                                            {getBadgeCount(sub.href, sub.label) > 0 && (
                                                                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded-full min-w-[18px] text-center">
                                                                                    {getBadgeCount(sub.href, sub.label)}
                                                                                </span>
                                                                            )}
                                                                        </Link>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
                                                        ${pathname === item.href
                                                            ? 'bg-purple-500/15 text-purple-300'
                                                            : 'text-gray-400 hover:bg-purple-500/10 hover:text-purple-300'}
                                                    `}
                                                >
                                                    <Icon className={`w-4 h-4 ${pathname === item.href ? 'text-purple-400' : 'text-gray-500'}`} />
                                                    <span className="flex-1">{item.label}</span>
                                                    {getBadgeCount(item.href, item.label) > 0 && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-300 rounded-full min-w-[18px] text-center">
                                                            {getBadgeCount(item.href, item.label)}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-purple-900/30 bg-[#06060a]">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-500/10 transition-colors cursor-pointer group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">
                            CP
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-200 truncate">CosmicPulse</p>
                            <p className="text-[11px] text-purple-400/60">Blog Manager</p>
                        </div>
                        <Link href="/admin" className="p-1.5 rounded-md text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 transition-all">
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen bg-[#0a0a0f]">
                <div className="p-6 pb-12 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
