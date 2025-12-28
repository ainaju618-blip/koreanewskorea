// src/components/Sidebar.tsx
// Server Component - Korea NEWS Regional - Weighted Sidebar

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getMostViewedArticles, getLatestArticles, getRegionDisplayName } from '@/lib/weighted-articles';
import { CURRENT_SITE } from '@/config/site-regions';

/**
 * Korea NEWS Regional - Weighted Sidebar
 * =======================================
 * - Most Viewed (ranked list with region indicators)
 * - Latest News (with region tags)
 * - Quick Links to regional government sites
 */
export default async function Sidebar() {
    const [hotPosts, recentPosts] = await Promise.all([
        getMostViewedArticles({ limit: 10 }),
        getLatestArticles({ limit: 5 }),
    ]);

    return (
        <aside className="space-y-5">
            {/* ===== Most Viewed - With Region Weighting ===== */}
            <div className="kn-sidebar-section">
                <div className="kn-sidebar-header">
                    많이 본 뉴스
                </div>
                <div className="kn-sidebar-content p-0">
                    <ol className="kn-rank-list">
                        {hotPosts.map((post, idx) => (
                            <li key={post.id} className="kn-rank-item">
                                <Link
                                    href={`/news/${post.id}`}
                                    className="flex items-start gap-3 w-full"
                                >
                                    <span className={`kn-rank-number ${idx < 3 ? 'top3' : ''}`}>
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <span className="kn-rank-title block">
                                            {post.title}
                                        </span>
                                        <span className={`text-[10px] px-1 py-0.5 mt-1 inline-block ${
                                            post.regionType === 'primary'
                                                ? 'bg-primary/10 text-primary'
                                                : post.regionType === 'adjacent1'
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {getRegionDisplayName(post.category || null, post.region || null)}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {hotPosts.length === 0 && (
                            <li className="px-4 py-3 text-sm text-gray-400">
                                데이터가 없습니다
                            </li>
                        )}
                    </ol>
                </div>
            </div>

            {/* ===== Latest News ===== */}
            <div className="kn-sidebar-section">
                <div className="kn-sidebar-header">
                    최신 뉴스
                </div>
                <div className="kn-sidebar-content p-0">
                    <ul className="divide-y divide-gray-100">
                        {recentPosts.map((post) => (
                            <li key={post.id}>
                                <Link
                                    href={`/news/${post.id}`}
                                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-[13px] text-gray-700 leading-snug hover:text-primary line-clamp-2 block">
                                        {post.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-1 py-0.5 ${
                                            post.regionType === 'primary'
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {getRegionDisplayName(post.category || null, post.region || null)}
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            {new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {recentPosts.length === 0 && (
                            <li className="px-4 py-3 text-sm text-gray-400">
                                데이터가 없습니다
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* ===== Quick Links - Regional Government Sites ===== */}
            <div className="kn-sidebar-section">
                <div className="kn-sidebar-header">
                    바로가기
                </div>
                <div className="kn-sidebar-content">
                    <ul className="space-y-2">
                        <li>
                            <a
                                href="https://www.jeonnam.go.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <span>전라남도청</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.mokpo.go.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <span>목포시청</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.muan.go.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <span>무안군청</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.shinan.go.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <span>신안군청</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                        </li>
                        <li className="pt-2 border-t border-gray-200">
                            <a
                                href="https://council.jeonnam.go.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <span>전라남도의회</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.jne.go.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <span>전남교육청</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                        </li>
                        <li className="pt-2 border-t border-gray-200">
                            <a
                                href="https://www.koreanewsone.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between py-2 text-sm text-primary font-medium hover:text-primary-dark transition-colors"
                            >
                                <span>코리아NEWS 본사</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* ===== Contact Info ===== */}
            <div className="bg-gray-800 text-white p-4 text-center">
                <p className="text-base font-bold mb-1">
                    코리아NEWS {CURRENT_SITE.name}
                </p>
                <p className="text-[11px] text-gray-400 mb-2">
                    {CURRENT_SITE.subtitle}
                </p>
                <a
                    href="tel:010-2631-3865"
                    className="inline-block text-sm text-primary hover:underline"
                >
                    010-2631-3865
                </a>
            </div>
        </aside>
    );
}

// Skeleton component for Suspense fallback
export function SidebarSkeleton() {
    return (
        <aside className="space-y-5">
            {/* Most Viewed Skeleton */}
            <div className="kn-sidebar-section">
                <div className="kn-sidebar-header animate-pulse bg-gray-200 h-10" />
                <div className="p-3 space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-2 py-2">
                            <div className="w-5 h-5 bg-gray-200 animate-pulse" />
                            <div className="flex-1 h-4 bg-gray-200 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Latest News Skeleton */}
            <div className="kn-sidebar-section">
                <div className="kn-sidebar-header animate-pulse bg-gray-200 h-10" />
                <div className="p-3 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-1">
                            <div className="h-4 bg-gray-200 animate-pulse" />
                            <div className="h-3 w-20 bg-gray-200 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Links Skeleton */}
            <div className="h-40 bg-gray-200 animate-pulse" />
        </aside>
    );
}
