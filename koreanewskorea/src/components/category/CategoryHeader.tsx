'use client';

import Link from 'next/link';
import { CATEGORY_MAP, JEONNAM_REGION_MAP, JEONNAM_ZONES } from '@/lib/category-constants';

interface CategoryHeaderProps {
    slug: string;
    currentSubSlug?: string;
}

export default function CategoryHeader({ slug, currentSubSlug }: CategoryHeaderProps) {
    const decodedSlug = decodeURIComponent(slug);
    // categoryInfo를 찾되, 없으면 decodedSlug를 이름으로 사용
    const categoryInfo = CATEGORY_MAP[decodedSlug] || CATEGORY_MAP[slug] || { name: decodedSlug, subMenus: ['전체'] };

    return (
        <div className="border-b border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Title + Sub-menus in one line */}
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                    {/* Category Title */}
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight shrink-0">
                        <Link href={`/category/${slug}`}>{categoryInfo.name}</Link>
                    </h1>

                    {/* Sub-Categories Menu */}
                    <div className="w-full mt-1">
                        {slug === 'region' ? (
                            // 전남: 권역별 그룹핑 - 1줄 통합 렌더링 (스크롤 처리)
                            <div className="flex flex-nowrap items-center gap-x-6 gap-y-2 mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm overflow-x-auto scrollbar-hide whitespace-nowrap">
                                {/* 전남일반 */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-slate-400">전체</span>
                                    <Link
                                        href={`/category/region`}
                                        className={`font-medium transition-colors ${!currentSubSlug ? 'text-red-600 font-bold' : 'text-slate-700 hover:text-red-600'}`}
                                    >
                                        전체
                                    </Link>
                                </div>

                                <span className="text-slate-300 shrink-0">|</span>

                                {JEONNAM_ZONES.map((zone, idx) => (
                                    <div key={zone.name} className="flex items-center gap-3 shrink-0">
                                        <span className="font-bold text-slate-500">{zone.name}</span>
                                        <div className="flex gap-3">
                                            {zone.regions.map((region) => {
                                                const regionCode = JEONNAM_REGION_MAP[region];
                                                const isActive = currentSubSlug === regionCode;
                                                return (
                                                    <Link
                                                        key={region}
                                                        href={`/category/region/${regionCode}`}
                                                        className={`transition-colors ${isActive ? 'text-red-600 font-bold' : 'text-slate-600 hover:text-red-600'}`}
                                                    >
                                                        {region}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                        {/* 마지막 권역이 아니면 구분선 추가 */}
                                        {idx < JEONNAM_ZONES.length - 1 && (
                                            <span className="text-slate-300 ml-3 shrink-0">|</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // 기본: 단순 리스트 렌더링 (광주 등)
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                {categoryInfo.subMenus.map((sub, idx) => {
                                    const regionCode = JEONNAM_REGION_MAP[sub];
                                    const href = regionCode
                                        ? `/category/${slug}/${regionCode}`
                                        : `/category/${slug}`;

                                    const isActive = currentSubSlug
                                        ? (regionCode === currentSubSlug)
                                        : (sub.includes('일반') || (slug === 'news' && sub === '전체'));

                                    return (
                                        <Link
                                            key={sub}
                                            href={href}
                                            className={`text-sm cursor-pointer transition-colors whitespace-nowrap ${isActive
                                                ? 'text-red-600 font-bold'
                                                : 'text-slate-600 hover:text-red-600'
                                                }`}
                                        >
                                            {sub}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
