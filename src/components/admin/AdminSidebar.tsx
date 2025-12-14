"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
    Home,
    MapPin
} from 'lucide-react';

// GNB 카테고리 타입 (메인과 동일)
interface GnbCategory {
    id: string;
    name: string;
    slug: string;
    children?: GnbCategory[];
}

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
    const [gnbCategories, setGnbCategories] = useState<GnbCategory[]>([]);
    const [activeGnbDropdown, setActiveGnbDropdown] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');

    // GNB 카테고리 로드
    useEffect(() => {
        const fetchGnbCategories = async () => {
            try {
                const res = await fetch('/api/categories?gnb=true');
                if (res.ok) {
                    const data = await res.json();
                    setGnbCategories(data.categories || []);
                }
            } catch (err) {
                console.error('GNB 카테고리 로딩 실패:', err);
            }
        };
        fetchGnbCategories();
    }, []);

    // 카테고리 클릭 핸들러
    const handleCategoryClick = (slug: string | null) => {
        if (slug === null) {
            router.push('/admin/news');
        } else {
            router.push(`/admin/news?category=${encodeURIComponent(slug)}`);
        }
        setActiveGnbDropdown(null);
    };

    const toggleMenu = (label: string) => {
        if (expandedMenus.includes(label)) {
            setExpandedMenus(expandedMenus.filter(item => item !== label));
        } else {
            setExpandedMenus([...expandedMenus, label]);
        }
    };

    return (
        <div className="admin-layout flex min-h-screen bg-gray-50 text-gray-800 font-sans">

            {/* --- Sidebar --- */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 shadow-lg">
                {/* Logo Area - 반분할 */}
                <div className="h-16 flex items-stretch border-b border-slate-100 bg-white">
                    {/* Korea CMS */}
                    <Link href="/admin" className="flex-1 flex items-center px-4 hover:bg-slate-50 transition-colors border-r border-slate-100">
                        <div className="w-7 h-7 bg-[#A6121D] rounded flex items-center justify-center text-white font-black mr-2 text-sm">K</div>
                        <span className="text-sm font-black text-slate-800 tracking-tight">Korea CMS</span>
                    </Link>
                    {/* AI 아이디어 */}
                    <Link href="/idea" className="flex-1 flex items-center px-4 hover:bg-amber-50 transition-colors group">
                        <div className="w-7 h-7 bg-amber-500 rounded flex items-center justify-center text-white mr-2">
                            <Lightbulb className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-amber-700 group-hover:text-amber-800">AI 아이디어</span>
                    </Link>
                </div>

                {/* Navigation - 스크롤 가능 영역 */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6" style={{ maxHeight: 'calc(100vh - 64px - 80px)' }}>
                    {MENU_ITEMS.map((group, idx) => (
                        <div key={idx}>
                            {group.category && (
                                <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {group.category}
                                </div>
                            )}
                            <ul className="space-y-1">
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
                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                                ${isActive ? 'bg-red-50 text-[#A6121D]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={`w-4 h-4 ${isActive ? 'text-[#A6121D]' : 'text-slate-400'}`} />
                                                            <span>{item.label}</span>
                                                        </div>
                                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                    </button>

                                                    {/* Submenu */}
                                                    {isExpanded && (
                                                        <ul className="mt-1 ml-4 space-y-1 border-l-2 border-slate-100 pl-2">
                                                            {item.subItems.map((sub) => {
                                                                // 쿼리 파라미터를 포함한 활성화 상태 확인
                                                                const isSubActive = sub.href.includes('?')
                                                                    ? pathname + '?' + (typeof window !== 'undefined' ? window.location.search.slice(1) : '') === sub.href || sub.href.startsWith(pathname + '?')
                                                                    : pathname === sub.href || pathname.startsWith(sub.href + '/');
                                                                return (
                                                                    <li key={sub.label}>
                                                                        <Link
                                                                            href={sub.href}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors w-full
                                                                                ${isSubActive ? 'text-[#A6121D] font-bold bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                                                                            `}
                                                                        >
                                                                            {sub.icon && <sub.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-[#A6121D]' : 'text-slate-400'}`} />}
                                                                            <span>{sub.label}</span>
                                                                        </Link>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Single Menu Item */
                                                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                            ${pathname === item.href ? 'bg-red-50 text-[#A6121D]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                        `}>
                                                    <Icon className={`w-4 h-4 ${pathname === item.href ? 'text-[#A6121D]' : 'text-slate-400'}`} />
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
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">KO</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">발행인</p>
                            <p className="text-xs text-slate-500">Administrator</p>
                        </div>
                        <Link href="/" className="text-slate-400 hover:text-[#A6121D]">
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* --- Main Content Layout --- */}
            <main className="flex-1 ml-64 min-h-screen bg-slate-50/50">
                {/* GNB 카테고리 바 - 메인과 동일 스타일 */}
                <div className="sticky top-0 z-30 bg-white border-b-2 border-[#0a192f] shadow-sm">
                    <div className="px-8 max-w-[1600px] mx-auto">
                        <nav className="flex items-center h-12 gap-1 overflow-x-auto">
                            {/* 전체 (홈) */}
                            <button
                                onClick={() => handleCategoryClick(null)}
                                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold whitespace-nowrap rounded-t transition-all
                                    ${!currentCategory
                                        ? 'text-[#ff2e63] border-b-2 border-[#ff2e63] -mb-[2px]'
                                        : 'text-slate-600 hover:text-[#0a192f] hover:bg-slate-50'
                                    }`}
                            >
                                <Home className="w-4 h-4" />
                                전체
                            </button>

                            {/* 카테고리 메뉴 */}
                            {gnbCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="relative"
                                    onMouseEnter={() => category.children && category.children.length > 0 && setActiveGnbDropdown(category.id)}
                                    onMouseLeave={() => setActiveGnbDropdown(null)}
                                >
                                    <button
                                        onClick={() => handleCategoryClick(category.slug)}
                                        className={`flex items-center gap-1 px-4 py-2 text-sm font-bold whitespace-nowrap rounded-t transition-all
                                            ${currentCategory === category.slug
                                                ? 'text-[#ff2e63] border-b-2 border-[#ff2e63] -mb-[2px]'
                                                : 'text-slate-600 hover:text-[#0a192f] hover:bg-slate-50'
                                            }`}
                                    >
                                        {category.name}
                                        {category.children && category.children.length > 0 && (
                                            <ChevronDown className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>

                                    {/* 드롭다운 메뉴 */}
                                    {category.children && category.children.length > 0 && activeGnbDropdown === category.id && (
                                        <div className="absolute top-full left-0 mt-0 bg-white border border-slate-200 rounded-b-lg shadow-lg py-2 min-w-[160px] z-50">
                                            <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase border-b border-slate-100 mb-1 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {category.name}
                                            </div>
                                            {category.children.map((child) => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => handleCategoryClick(child.slug)}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors
                                                        ${currentCategory === child.slug
                                                            ? 'text-[#ff2e63] font-bold bg-red-50'
                                                            : 'text-slate-600 hover:text-[#0a192f] hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {child.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* 현재 선택된 카테고리 표시 */}
                            {currentCategory && (
                                <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
                                    <span>필터:</span>
                                    <span className="px-2 py-0.5 bg-[#ff2e63]/10 text-[#ff2e63] rounded font-bold">
                                        {currentCategory}
                                    </span>
                                    <button
                                        onClick={() => handleCategoryClick(null)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>

                <div className="p-8 max-w-[1600px] mx-auto">
                    {/* This is where the specific page content (Opus's work) will be injected */}
                    {children}
                </div>
            </main>

        </div>
    );
}
