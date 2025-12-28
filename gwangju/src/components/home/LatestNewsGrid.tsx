import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { Clock, ArrowRight, Zap } from 'lucide-react';

/**
 * Korea NEWS Gwangju - Unique Latest News Grid
 * ============================================
 * Design Philosophy:
 *   - Clean card layout with subtle Korea Red accents
 *   - Newspaper-inspired typography
 *   - Time-focused display (news freshness)
 *
 * Layout: 2x4 Grid (8 articles)
 */

interface Article {
    id: string;
    title: string;
    thumbnail_url: string | null;
    published_at: string | null;
    category: string;
}

async function getLatestArticles(): Promise<Article[]> {
    const supabase = await createClient();

    // First try: Gwangju-specific articles with thumbnails
    let { data } = await supabase
        .from('posts')
        .select('id, title, thumbnail_url, published_at, category')
        .eq('status', 'published')
        .or('category.eq.광주,region.eq.gwangju,category.ilike.%광주%')
        .not('thumbnail_url', 'is', null)
        .neq('thumbnail_url', '')
        .like('thumbnail_url', 'http%')
        .order('published_at', { ascending: false })
        .range(4, 11); // Skip first 4 (hero), get 8 more

    // Fallback: Any articles with thumbnails (for demo/testing)
    if (!data || data.length === 0) {
        const fallback = await supabase
            .from('posts')
            .select('id, title, thumbnail_url, published_at, category')
            .eq('status', 'published')
            .not('thumbnail_url', 'is', null)
            .neq('thumbnail_url', '')
            .like('thumbnail_url', 'http%')
            .order('published_at', { ascending: false })
            .range(4, 11);
        data = fallback.data;
    }

    return data || [];
}

// Format relative time
function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffHours < 48) return '어제';
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

export default async function LatestNewsGrid() {
    const articles = await getLatestArticles();

    if (articles.length === 0) {
        return null;
    }

    return (
        <section className="mb-12">
            {/* Section Header - Korea NEWS style */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-slate-900">최신 뉴스</h2>
                    </div>
                    <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent w-20" />
                </div>
                <Link
                    href="/category/gwangju"
                    className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                >
                    전체보기 <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {articles.map((article, idx) => (
                    <Link
                        key={article.id}
                        href={`/news/${article.id}`}
                        className="group flex gap-4 bg-white border border-slate-100 p-4 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                        {/* Thumbnail */}
                        <div className="relative w-28 h-20 flex-shrink-0 overflow-hidden bg-slate-100">
                            {article.thumbnail_url ? (
                                <Image
                                    src={article.thumbnail_url}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="112px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                    No Image
                                </div>
                            )}
                            {/* Category pill */}
                            {article.category && (
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-medium">
                                    {article.category}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                {article.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                                <Clock className="w-3 h-3" />
                                <span>{formatRelativeTime(article.published_at)}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Load More Button */}
            <div className="mt-8 text-center">
                <Link
                    href="/category/gwangju"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-medium hover:bg-primary transition-colors"
                >
                    더 많은 뉴스 보기
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}

// Skeleton for Suspense
export function LatestNewsGridSkeleton() {
    return (
        <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-32 h-6 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white border border-slate-100">
                        <div className="w-28 h-20 bg-slate-200 animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-slate-200 rounded animate-pulse" />
                            <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                            <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
