"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Lightbulb,
    Globe,
    Rss,
    FileSearch,
    Sparkles,
    Settings,
    ChevronLeft,
    ChevronDown,
    ChevronRight,
    Newspaper
} from 'lucide-react';

// --- 메뉴 아이템 ---
const IDEA_MENU_ITEMS = [
    { label: "대시보드", icon: Sparkles, href: "/idea" },
    { label: "수집처 관리", icon: Globe, href: "/idea/sources" },
    { label: "수집된 원문", icon: Rss, href: "/idea/raw" },
    { label: "가공된 기사", icon: FileSearch, href: "/idea/processed" },
    { label: "설정", icon: Settings, href: "/idea/settings" },
];

// --- 수집처 목록 ---
const SOURCE_FILTERS = [
    { code: 'all', name: '전체 보기', group: null },
    // 국내 AI 전문
    { code: 'aitimes', name: 'AI타임스', group: 'ai' },
    // 국내 중앙일간지
    { code: 'donga', name: '동아일보', group: 'korea' },
    { code: 'chosun', name: '조선일보', group: 'korea' },
    { code: 'joongang', name: '중앙일보', group: 'korea' },
    { code: 'hani', name: '한겨레', group: 'korea' },
    { code: 'khan', name: '경향신문', group: 'korea' },
    { code: 'hankyung', name: '한국경제', group: 'korea' },
    { code: 'mk', name: '매일경제', group: 'korea' },
    // 해외 매체
    { code: 'techcrunch', name: 'TechCrunch', group: 'foreign' },
    { code: 'theverge', name: 'The Verge', group: 'foreign' },
    { code: 'venturebeat', name: 'VentureBeat', group: 'foreign' },
    { code: 'wired', name: 'Wired', group: 'foreign' },
];

export default function IdeaLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const currentSource = searchParams?.get('source') || 'all';
    const [sourcesExpanded, setSourcesExpanded] = useState(true);

    return (
        <div className="flex min-h-screen bg-slate-50 text-gray-800 font-sans">

            {/* --- Sidebar --- */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 shadow-lg">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-orange-500">
                    <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-white font-black mr-3 text-lg">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-black text-white tracking-tight">AI 아이디어</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {IDEA_MENU_ITEMS.map((item) => {
                        const isRawPage = item.href === "/idea/raw";
                        const isActive = isRawPage
                            ? pathname === item.href || pathname?.startsWith('/idea/raw')
                            : pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <div key={item.label}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                                        ${isActive
                                            ? 'bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-200'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }
                                    `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                                    <span className="flex-1">{item.label}</span>
                                    {isRawPage && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSourcesExpanded(!sourcesExpanded);
                                            }}
                                            className="p-1 hover:bg-amber-100 rounded"
                                        >
                                            {sourcesExpanded ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </Link>

                                {/* 수집처별 서브메뉴 */}
                                {isRawPage && sourcesExpanded && (
                                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-amber-100 pl-3">
                                        {/* 전체 보기 */}
                                        {SOURCE_FILTERS.filter(s => !s.group).map((source) => {
                                            const isSourceActive = pathname === '/idea/raw' &&
                                                (!currentSource || currentSource === 'all');
                                            return (
                                                <Link
                                                    key={source.code}
                                                    href="/idea/raw"
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                                                        ${isSourceActive
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                        }
                                                    `}
                                                >
                                                    <Newspaper className="w-3.5 h-3.5" />
                                                    <span>{source.name}</span>
                                                </Link>
                                            );
                                        })}

                                        {/* AI 전문 매체 */}
                                        <div className="pt-2 mt-2 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase px-1 mb-1">AI 전문</p>
                                            {SOURCE_FILTERS.filter(s => s.group === 'ai').map((source) => {
                                                const isSourceActive = pathname === '/idea/raw' && currentSource === source.code;
                                                return (
                                                    <Link
                                                        key={source.code}
                                                        href={`/idea/raw?source=${source.code}`}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                                            ${isSourceActive
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                            }
                                                        `}
                                                    >
                                                        <Newspaper className="w-3.5 h-3.5" />
                                                        <span>{source.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>

                                        {/* 국내 중앙일간지 */}
                                        <div className="pt-2 mt-2 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase px-1 mb-1">중앙일간지</p>
                                            {SOURCE_FILTERS.filter(s => s.group === 'korea').map((source) => {
                                                const isSourceActive = pathname === '/idea/raw' && currentSource === source.code;
                                                return (
                                                    <Link
                                                        key={source.code}
                                                        href={`/idea/raw?source=${source.code}`}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                                            ${isSourceActive
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                            }
                                                        `}
                                                    >
                                                        <Newspaper className="w-3.5 h-3.5" />
                                                        <span>{source.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>

                                        {/* 해외 매체 */}
                                        <div className="pt-2 mt-2 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase px-1 mb-1">해외 매체</p>
                                            {SOURCE_FILTERS.filter(s => s.group === 'foreign').map((source) => {
                                                const isSourceActive = pathname === '/idea/raw' && currentSource === source.code;
                                                return (
                                                    <Link
                                                        key={source.code}
                                                        href={`/idea/raw?source=${source.code}`}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                                            ${isSourceActive
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                            }
                                                        `}
                                                    >
                                                        <Newspaper className="w-3.5 h-3.5" />
                                                        <span>{source.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-100 space-y-2">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                        <span>관리자 페이지로</span>
                    </Link>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold border-2 border-white shadow-sm">
                            <Lightbulb className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">AI 뉴스 수집</p>
                            <p className="text-xs text-slate-500">해외 AI 뉴스 → 국내 기사</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- Main Content Layout --- */}
            <main className="flex-1 ml-64 min-h-screen bg-slate-50/50">
                <div className="p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>

        </div>
    );
}
