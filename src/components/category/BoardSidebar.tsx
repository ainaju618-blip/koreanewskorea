'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface PopularNews {
    id: string;
    title: string;
}

interface SidebarProps {
    regionName?: string;
    regionCode?: string;
}

// Gwangju history content
const GWANGJU_HISTORY = [
    {
        id: 1,
        title: '5.18 Democratic Uprising - The Spirit of Gwangju',
    },
    {
        id: 2,
        title: 'Gwangju Student Independence Movement (1929)',
    },
    {
        id: 3,
        title: 'Mudeungsan and Historical Heritage of Gwangju',
    },
];

/**
 * 게시판 공통 사이드바 컴포넌트 (강원일보 스타일)
 * - 가장 많이 본 뉴스 (5개)
 * - 이미지 배너
 * - 전남의 역사
 * - 이코노미 플러스
 */
export default function BoardSidebar({ regionName = '전남', regionCode }: SidebarProps) {
    const [popularNews, setPopularNews] = useState<PopularNews[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isGwangju = regionCode === 'gwangju' || regionName === '광주';

    useEffect(() => {
        const fetchPopularNews = async () => {
            try {
                const res = await fetch('/api/posts?limit=5&status=published');
                if (res.ok) {
                    const data = await res.json();
                    setPopularNews(data.posts?.slice(0, 5) || []);
                }
            } catch (err) {
                console.error('인기 뉴스 로드 실패:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPopularNews();
    }, []);

    return (
        <div className="space-y-6">
            {/* Widget 1: 가장 많이 본 뉴스 */}
            <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-base mb-4 pb-2 border-b border-slate-300">
                    가장 많이 본 뉴스
                </h3>
                <div className="space-y-3">
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-2.5 animate-pulse">
                                <span className="font-black text-red-600 text-base w-4">{i + 1}</span>
                                <div className="h-4 bg-slate-200 rounded flex-1"></div>
                            </div>
                        ))
                    ) : popularNews.length > 0 ? (
                        popularNews.map((item, idx) => (
                            <Link
                                key={item.id}
                                href={`/news/${item.id}`}
                                className="flex gap-2.5 cursor-pointer group"
                            >
                                <span className="font-black text-red-600 text-base w-4">
                                    {idx + 1}
                                </span>
                                <p className="text-sm text-slate-700 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                    {item.title}
                                </p>
                            </Link>
                        ))
                    ) : (
                        [...Array(5)].map((_, n) => (
                            <div key={n} className="flex gap-2.5">
                                <span className="font-black text-red-600 text-base w-4">{n + 1}</span>
                                <p className="text-sm text-slate-400">인기 뉴스 제목 {n + 1}</p>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-3 text-right">
                    <Link href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">
                        더보기
                    </Link>
                </div>
            </div>

            {/* Widget 2: Ad Banner - Korea Polytechnic */}
            <Link
                href="https://ipsi.kopo.ac.kr/poly/wonseo/wonseoSearch.do?daehag_cd=3320000&gwajeong_gb=34"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-full aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:scale-[1.02]"
            >
                <Image
                    src="/images/ads/naju01.png"
                    alt="2026 Korea Polytechnic Naju Campus Admission"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 300px"
                />
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
            </Link>

            {/* Widget 3: Region History */}
            <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">
                    {isGwangju ? '광주의 역사' : `${regionName}의 역사`}
                </h4>
                <div className="space-y-3">
                    {isGwangju ? (
                        GWANGJU_HISTORY.map((item) => (
                            <div key={item.id} className="flex gap-3 cursor-pointer group">
                                <div className="w-20 h-14 bg-slate-200 shrink-0 rounded overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{item.id}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                        {item.title}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 cursor-pointer group">
                                <div className="w-20 h-14 bg-slate-200 shrink-0 rounded"></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                        [역사 기획 {i}] {regionName}의 역사 기사 제목이 들어갑니다
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Widget 4: 이코노미 플러스 */}
            <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">
                    이코노미 플러스
                </h4>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 cursor-pointer group">
                            <div className="w-20 h-14 bg-slate-200 shrink-0 rounded"></div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                    [경제 특집 {i}] 이코노미 플러스 제목입니다
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
