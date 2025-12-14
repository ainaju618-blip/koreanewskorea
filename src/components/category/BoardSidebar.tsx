'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface PopularNews {
    id: string;
    title: string;
}

interface SidebarProps {
    regionName?: string; // 현재 지역명 (예: 전남, 광주 등)
}

/**
 * 게시판 공통 사이드바 컴포넌트 (강원일보 스타일)
 * - 가장 많이 본 뉴스 (5개)
 * - 이미지 배너
 * - 전남의 역사
 * - 이코노미 플러스
 */
export default function BoardSidebar({ regionName = '전남' }: SidebarProps) {
    const [popularNews, setPopularNews] = useState<PopularNews[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

            {/* Widget 2: 이미지 배너 */}
            <div className="w-full aspect-[4/3] bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 rounded-lg">
                <span className="text-sm">이미지 배너</span>
            </div>

            {/* Widget 3: 전남의 역사 */}
            <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">
                    {regionName}의 역사
                </h4>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 cursor-pointer group">
                            <div className="w-20 h-14 bg-slate-200 shrink-0 rounded"></div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                    [역사 기획 {i}] {regionName}의 역사 기사 제목이 들어갑니다
                                </p>
                            </div>
                        </div>
                    ))}
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
