'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Newspaper, TrendingUp, Loader2 } from 'lucide-react';

interface SubMenuItem {
    name: string;
    slug: string;
    articleCount: number;
    isActive: boolean;
}

interface RegionalSubMenuProps {
    regionCode: string;
    regionName: string;
    isVisible: boolean;
    onClose?: () => void;
}

/**
 * Dynamic sub-menu component for regional news
 * Fetches keyword-based categories from API
 */
export default function RegionalSubMenu({
    regionCode,
    regionName,
    isVisible,
    onClose,
}: RegionalSubMenuProps) {
    const [subMenus, setSubMenus] = useState<SubMenuItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalArticles, setTotalArticles] = useState(0);

    useEffect(() => {
        if (!isVisible || !regionCode) return;

        const fetchSubMenus = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/regions/${regionCode}/submenus?method=auto&days=30`
                );
                if (res.ok) {
                    const data = await res.json();
                    setSubMenus(data.subMenus || []);
                    setTotalArticles(data.totalArticles || 0);
                }
            } catch (err) {
                console.error('Failed to fetch sub-menus:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubMenus();
    }, [regionCode, isVisible]);

    if (!isVisible) return null;

    return (
        <div className="absolute top-[55px] left-1/2 -translate-x-1/2 w-[480px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-secondary to-secondary-light px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-white text-lg">
                            {regionName} 뉴스
                        </h3>
                        <p className="text-white/60 text-xs">
                            {totalArticles > 0 ? `${totalArticles}개 기사` : '키워드별 분류'}
                        </p>
                    </div>
                </div>
                {loading && (
                    <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
                )}
            </div>

            {/* Menu Items */}
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                        <span className="ml-2 text-slate-500 text-sm">불러오는 중...</span>
                    </div>
                ) : subMenus.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {subMenus.map((menu, idx) => (
                            <Link
                                key={menu.slug}
                                href={`/category/jeonnam-region/${regionCode}?filter=${menu.slug}`}
                                onClick={onClose}
                                className="group/item relative flex items-center justify-between px-4 py-3 text-sm text-slate-600 hover:text-primary bg-slate-50/50 hover:bg-primary/5 rounded-xl transition-all duration-200 border border-transparent hover:border-primary/20"
                                style={{ animationDelay: `${idx * 30}ms` }}
                            >
                                <span className="font-medium">{menu.name}</span>
                                <div className="flex items-center gap-2">
                                    {menu.articleCount > 0 && (
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {menu.articleCount}
                                        </span>
                                    )}
                                    <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-400 text-sm">
                        서브메뉴를 불러올 수 없습니다
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                <Link
                    href={`/category/jeonnam-region/${regionCode}`}
                    onClick={onClose}
                    className="text-xs text-slate-500 hover:text-primary flex items-center justify-center gap-1.5 font-semibold transition-colors group/all"
                >
                    <Newspaper className="w-3.5 h-3.5" />
                    {regionName} 전체 뉴스 보기
                    <ChevronRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
