"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Newspaper,
    Bot,
    Users,
    Settings,
    ChevronDown,
    ChevronRight,
    LogOut,
    FileText,
    CheckCircle,
    Trash2,
    PenTool,
    Calendar,
    PlayCircle,
    Activity,
    Database,
    UserPlus,
    Building2,
    StickyNote,
    UserCircle,
    LucideIcon,
    Lightbulb,
    ExternalLink,
    Sparkles,
    Globe,
    Mail,
    GitBranch
} from 'lucide-react';

// --- 메뉴 아이템 타입 정의 ---
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
    external?: boolean;
    subItems?: SubMenuItem[];
}

interface MenuGroup {
    category: string;
    items: MenuItem[];
}

// --- Sidebar Navigation Structure (Reorganized: 15 -> 8 menus) ---
const MENU_ITEMS: MenuGroup[] = [
    {
        category: "메인",
        items: [
            { label: "대시보드", icon: LayoutDashboard, href: "/admin" }
        ]
    },
    {
        category: "콘텐츠",
        items: [
            {
                label: "기사 관리",
                icon: Newspaper,
                href: "/admin/news",
                subItems: [
                    { label: "전체 기사", href: "/admin/news", icon: Newspaper },
                    { label: "기사 초안", href: "/admin/drafts", icon: StickyNote },
                    { label: "승인 대기", href: "/admin/news?status=draft", icon: FileText },
                    { label: "발행됨", href: "/admin/news?status=published", icon: CheckCircle },
                    { label: "휴지통", href: "/admin/news?status=trash", icon: Trash2 },
                    { label: "기사 작성", href: "/admin/news/write", icon: PenTool },
                ]
            },
            {
                label: "AI 뉴스",
                icon: Sparkles,
                href: "/admin/ai-news",
                subItems: [
                    { label: "AI 뉴스 편집", href: "/admin/ai-news", icon: Globe },
                    { label: "승인 대기", href: "/admin/ai-news?status=draft", icon: FileText },
                    { label: "발행됨", href: "/admin/ai-news?status=published", icon: CheckCircle },
                ]
            }
        ]
    },
    {
        category: "수집 시스템",
        items: [
            {
                label: "스크래퍼",
                icon: Bot,
                href: "/admin/bot",
                highlight: true,
                subItems: [
                    { label: "수집처 관리", href: "/admin/sources", icon: Building2 },
                    { label: "스케줄 설정", href: "/admin/bot/schedule", icon: Calendar },
                    { label: "수동 실행", href: "/admin/bot/run", icon: PlayCircle },
                    { label: "수집 로그", href: "/admin/bot/logs", icon: Activity },
                    { label: "소스 관리", href: "/admin/bot/sources", icon: Database },
                ]
            },
            { label: "이메일 수집", icon: Mail, href: "/admin/email-extract" }
        ]
    },
    {
        category: "AI 도구",
        items: [
            { label: "Claude Hub", icon: Database, href: "/admin/claude-hub", highlight: true },
            { label: "AI Idea", icon: Lightbulb, href: "/idea" }
        ]
    },
    {
        category: "시스템",
        items: [
            {
                label: "사용자 관리",
                icon: Users,
                href: "/admin/users",
                subItems: [
                    { label: "기자 관리", href: "/admin/users/reporters", icon: UserPlus },
                    { label: "회원 관리", href: "/admin/users/members", icon: Users },
                    { label: "권한 설정", href: "/admin/users/roles", icon: Settings },
                ]
            },
            { label: "깃관리", icon: GitBranch, href: "/admin/git-status" },
            {
                label: "설정",
                icon: Settings,
                href: "/admin/settings",
                subItems: [
                    { label: "AI 재가공 설정", href: "/admin/settings/ai", icon: Sparkles },
                    { label: "사이트 정보", href: "/admin/settings/general" },
                    { label: "카테고리", href: "/admin/settings/categories" },
                    { label: "레이아웃", href: "/admin/settings/layouts" },
                    { label: "히어로 슬라이더", href: "/admin/settings/hero-slider" },
                    { label: "API 키", href: "/admin/settings/api" },
                    { label: "PageSpeed", href: "/admin/settings/performance", icon: Activity },
                ]
            }
        ]
    },
    {
        category: "바로가기",
        items: [
            { label: "기자 페이지", icon: UserCircle, href: "/reporter" },
            { label: "클로드 사용량", icon: ExternalLink, href: "https://claude.ai/settings/usage", external: true }
        ]
    }
];


// 승인대기 기사 수 타입
interface PendingCounts {
    news: number;      // 기사 승인대기
    aiNews: number;    // AI 뉴스 승인대기
    drafts: number;    // 기사 초안
}

export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['기사 관리', '스크래퍼']);
    const pathname = usePathname();
    const [pendingCounts, setPendingCounts] = useState<PendingCounts>({ news: 0, aiNews: 0, drafts: 0 });

    // 승인대기 기사 수 조회
    useEffect(() => {
        const fetchPendingCounts = async () => {
            try {
                // Only call existing API - /api/posts with status=draft
                const newsRes = await fetch('/api/posts?status=draft&limit=1');

                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    setPendingCounts({
                        news: newsData.count || 0,
                        aiNews: 0, // API not implemented yet
                        drafts: 0  // API not implemented yet
                    });
                }
            } catch (error) {
                console.error('Failed to fetch pending counts:', error);
            }
        };

        fetchPendingCounts();
        // 30초마다 새로고침
        const interval = setInterval(fetchPendingCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const toggleMenu = (label: string) => {
        if (expandedMenus.includes(label)) {
            setExpandedMenus(expandedMenus.filter(item => item !== label));
        } else {
            setExpandedMenus([...expandedMenus, label]);
        }
    };

    // 메뉴별 배지 카운트 가져오기
    const getBadgeCount = (href: string, label: string): number => {
        if (href === '/admin/news?status=draft' || label === '승인 대기' && href.includes('/admin/news')) {
            return pendingCounts.news;
        }
        if (href === '/admin/ai-news?status=draft' || (label === '승인 대기' && href.includes('/admin/ai-news'))) {
            return pendingCounts.aiNews;
        }
        if (href === '/admin/drafts') {
            return pendingCounts.drafts;
        }
        return 0;
    };

    // 부모 메뉴 배지 카운트 (서브메뉴 합계)
    const getParentBadgeCount = (label: string): number => {
        if (label === '기사 관리') return pendingCounts.news;
        if (label === 'AI 뉴스') return pendingCounts.aiNews;
        return 0;
    };

    return (
        <div className="admin-layout flex min-h-screen bg-[#0d1117] text-gray-100 font-sans">

            {/* --- Sidebar (Modern Dark Mode) --- */}
            <aside className="w-64 bg-[#010409] border-r border-[#21262d] flex flex-col fixed h-full z-10">
                {/* Logo Area */}
                <div className="h-16 flex items-stretch border-b border-[#21262d] bg-[#010409]">
                    {/* Korea CMS */}
                    <Link href="/admin" className="flex-1 flex items-center px-4 hover:bg-[#161b22] transition-all duration-200 border-r border-[#21262d] group">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-black mr-2.5 text-sm shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">K</div>
                        <span className="text-sm font-bold text-[#e6edf3] tracking-tight">Korea CMS</span>
                    </Link>
                    {/* AI 아이디어 */}
                    <Link href="/idea" className="flex-1 flex items-center px-4 hover:bg-[#161b22] transition-all duration-200 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center text-white mr-2.5 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
                            <Lightbulb className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">AI Idea</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-5" style={{ maxHeight: 'calc(100vh - 64px - 80px)' }}>
                    {MENU_ITEMS.map((group, idx) => (
                        <div key={idx}>
                            {group.category && (
                                <div className="px-3 mb-2 text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">
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
                                                /* Parent Menu with Subitems */
                                                <div>
                                                    <button
                                                        onClick={() => toggleMenu(item.label)}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200
                                ${isActive ? 'bg-[#1f6feb]/15 text-[#58a6ff]' : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#e6edf3]'}
                            `}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Icon className={`w-4 h-4 ${isActive ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
                                                            <span>{item.label}</span>
                                                            {/* 부모 메뉴 배지 */}
                                                            {getParentBadgeCount(item.label) > 0 && (
                                                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full min-w-[18px] text-center">
                                                                    {getParentBadgeCount(item.label)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <ChevronRight className={`w-3.5 h-3.5 text-[#6e7681] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </button>

                                                    {/* Submenu with smooth animation */}
                                                    <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                        <ul className="mt-1 ml-3 space-y-0.5 border-l border-[#30363d] pl-3">
                                                            {item.subItems.map((sub) => {
                                                                const isSubActive = sub.href.includes('?')
                                                                    ? pathname + '?' + (typeof window !== 'undefined' ? window.location.search.slice(1) : '') === sub.href || sub.href.startsWith(pathname + '?')
                                                                    : pathname === sub.href || pathname.startsWith(sub.href + '/');
                                                                return (
                                                                    <li key={sub.label}>
                                                                        <Link
                                                                            href={sub.href}
                                                                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all duration-150 w-full
                                                                                ${isSubActive ? 'text-[#58a6ff] font-semibold bg-[#1f6feb]/10' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'}
                                                                            `}
                                                                        >
                                                                            {sub.icon && <sub.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-[#58a6ff]' : 'text-[#6e7681]'}`} />}
                                                                            <span className="flex-1">{sub.label}</span>
                                                                            {/* 서브메뉴 배지 */}
                                                                            {getBadgeCount(sub.href, sub.label) > 0 && (
                                                                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full min-w-[18px] text-center">
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
                                            ) : item.external ? (
                                                /* External Link */
                                                <a
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#e6edf3]"
                                                >
                                                    <Icon className="w-4 h-4 text-[#8b949e]" />
                                                    <span className="flex-1">{item.label}</span>
                                                    <ExternalLink className="w-3 h-3 text-[#6e7681]" />
                                                </a>
                                            ) : (
                                                /* Single Menu Item */
                                                <Link href={item.href} className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200
                            ${pathname === item.href ? 'bg-[#1f6feb]/15 text-[#58a6ff]' : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#e6edf3]'}
                        `}>
                                                    <Icon className={`w-4 h-4 ${pathname === item.href ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
                                                    <span className="flex-1">{item.label}</span>
                                                    {/* 단일 메뉴 배지 */}
                                                    {getBadgeCount(item.href, item.label) > 0 && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full min-w-[18px] text-center">
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

                {/* Footer User Profile */}
                <div className="p-3 border-t border-[#21262d] bg-[#010409]">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#1f6feb] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#1f6feb]/20">KO</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#e6edf3] truncate">Administrator</p>
                            <p className="text-[11px] text-[#8b949e]">Super Admin</p>
                        </div>
                        <Link href="/" className="p-1.5 rounded-md text-[#6e7681] hover:text-[#f85149] hover:bg-[#21262d] transition-all">
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* --- Main Content Layout (Modern Dark Mode) --- */}
            <main className="flex-1 ml-64 min-h-screen bg-[#0d1117]">
                <div className="p-6 pb-12 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>

        </div>
    );
}
