"use client";

import React, { useState } from 'react';
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
    Globe
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
    subItems?: SubMenuItem[];
}

interface MenuGroup {
    category: string;
    items: MenuItem[];
}

// --- Sidebar Navigation Structure ---
const MENU_ITEMS: MenuGroup[] = [
    {
        category: "메인",
        items: [
            { label: "통합 대시보드", icon: LayoutDashboard, href: "/admin" },
            { label: "기사 초안", icon: StickyNote, href: "/admin/drafts" },
            { label: "수집처 관리", icon: Building2, href: "/admin/sources" }
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
                    { label: "기사 통합관리", href: "/admin/news", icon: Newspaper },
                    { label: "승인 대기", href: "/admin/news?status=draft", icon: FileText },
                    { label: "발행된 기사", href: "/admin/news?status=published", icon: CheckCircle },
                    { label: "휴지통", href: "/admin/news?status=trash", icon: Trash2 },
                    { label: "기사 작성", href: "/admin/news/write", icon: PenTool },
                ]
            },
            {
                label: "봇 관리 센터",
                icon: Bot,
                href: "/admin/bot",
                highlight: true,
                subItems: [
                    { label: "스케줄 설정", href: "/admin/bot/schedule", icon: Calendar },
                    { label: "수동 수집 실행", href: "/admin/bot/run", icon: PlayCircle },
                    { label: "수집 로그 / 에러", href: "/admin/bot/logs", icon: Activity },
                    { label: "소스 관리", href: "/admin/bot/sources", icon: Database },
                ]
            },
            {
                label: "AI 뉴스 관리",
                icon: Sparkles,
                href: "/admin/ai-news",
                subItems: [
                    { label: "AI 뉴스 편집", href: "/admin/ai-news", icon: Globe },
                    { label: "승인 대기", href: "/admin/ai-news?status=draft", icon: FileText },
                    { label: "발행됨", href: "/admin/ai-news?status=published", icon: CheckCircle },
                ]
            },
        ]
    },
    {
        category: "관리",
        items: [
            {
                label: "사용자 관리",
                icon: Users,
                href: "/admin/users",
                subItems: [
                    { label: "기자 등록/관리", href: "/admin/users/reporters", icon: UserPlus },
                    { label: "회원 관리", href: "/admin/users/members", icon: Users },
                    { label: "권한 설정", href: "/admin/users/roles", icon: Settings },
                ]
            },
            {
                label: "시스템 설정",
                icon: Settings,
                href: "/admin/settings",
                subItems: [
                    { label: "사이트 정보", href: "/admin/settings/general" },
                    { label: "카테고리 관리", href: "/admin/settings/categories" },
                    { label: "레이아웃 관리", href: "/admin/settings/layouts" },
                    { label: "API 키 설정", href: "/admin/settings/api" },
                ]
            }
        ]
    },
    {
        category: "바로가기",
        items: [
            { label: "기자 페이지", icon: UserCircle, href: "/reporter" }
        ]
    }
];


export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['기사 관리', '봇 관리 센터']);
    const pathname = usePathname();

    const toggleMenu = (label: string) => {
        if (expandedMenus.includes(label)) {
            setExpandedMenus(expandedMenus.filter(item => item !== label));
        } else {
            setExpandedMenus([...expandedMenus, label]);
        }
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
                                                                            <span>{sub.label}</span>
                                                                        </Link>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Single Menu Item */
                                                <Link href={item.href} className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200
                            ${pathname === item.href ? 'bg-[#1f6feb]/15 text-[#58a6ff]' : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#e6edf3]'}
                        `}>
                                                    <Icon className={`w-4 h-4 ${pathname === item.href ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
                                                    <span>{item.label}</span>
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
                <div className="p-6 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>

        </div>
    );
}
