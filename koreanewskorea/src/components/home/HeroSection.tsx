import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { Clock, TrendingUp, Flame } from 'lucide-react';
import { CURRENT_SITE } from '@/config/site-regions';

/**
 * Korea NEWS Regional Hero Section
 * ================================
 * Design Philosophy:
 *   - Bold Korea Red accent stripe
 *   - Newspaper-style headline typography
 *   - Regional news portal identity
 *   - Clean, authoritative layout
 *
 * Layout Structure:
 *   - Left: Featured Article (65%) - Large image with overlay
 *   - Right: Top Stories Stack (35%) - 3 trending articles
 */

interface Article {
    id: string;
    title: string;
    content: string | null;
    ai_summary: string | null;
    thumbnail_url: string | null;
    published_at: string | null;
    category: string | null;
}

async function getHeroArticles(): Promise<Article[]> {
    const supabase = await createClient();

    // Build dynamic filter for primary regions
    const primaryNames = CURRENT_SITE.regions.primary.names;
    const primarySlugs = CURRENT_SITE.regions.primary.slugs;
    const filters = [
        ...primaryNames.map(name => `category.eq.${name}`),
        ...primarySlugs.map(slug => `region.eq.${slug}`),
        ...primaryNames.map(name => `category.ilike.%${name}%`)
    ].join(',');

    // Try primary region-specific articles first
    let { data } = await supabase
        .from('posts')
        .select('id, title, content, ai_summary, thumbnail_url, published_at, category')
        .eq('status', 'published')
        .or(filters)
        .not('thumbnail_url', 'is', null)
        .neq('thumbnail_url', '')
        .like('thumbnail_url', 'http%')
        .order('published_at', { ascending: false })
        .limit(4);

    // Fallback to any articles with thumbnails
    if (!data || data.length < 4) {
        const fallback = await supabase
            .from('posts')
            .select('id, title, content, ai_summary, thumbnail_url, published_at, category')
            .eq('status', 'published')
            .not('thumbnail_url', 'is', null)
            .neq('thumbnail_url', '')
            .like('thumbnail_url', 'http%')
            .order('published_at', { ascending: false })
            .limit(4);
        data = fallback.data;
    }

    return data || [];
}

function cleanPreview(content: string | null, maxLength: number = 120): string {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function formatTimeAgo(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

export default async function HeroSection() {
    const articles = await getHeroArticles();

    if (articles.length === 0) {
        return (
            <section className="mb-10">
                <div className="bg-slate-100 rounded-lg h-[450px] flex items-center justify-center">
                    <p className="text-slate-400">표시할 기사가 없습니다</p>
                </div>
            </section>
        );
    }

    const mainArticle = articles[0];
    const sideArticles = articles.slice(1, 4);

    return (
        <section className="mb-12">
            {/* Section Header - Korea NEWS unique style */}
            <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-slate-900">오늘의 주요뉴스</h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* ===== FEATURED ARTICLE (Left 65%) ===== */}
                <div className="lg:w-[65%]">
                    <Link href={`/news/${mainArticle.id}`} className="group block relative">
                        {/* Image Container */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                            {mainArticle.thumbnail_url ? (
                                <Image
                                    src={mainArticle.thumbnail_url}
                                    alt={mainArticle.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                    sizes="(max-width: 768px) 100vw, 65vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    No Image
                                </div>
                            )}

                            {/* Gradient overlay - Korea NEWS signature */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                            {/* Korea Red accent line at top */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

                            {/* Content overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                {/* Category badge */}
                                {mainArticle.category && (
                                    <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider mb-3">
                                        {mainArticle.category}
                                    </span>
                                )}

                                {/* Title - Newspaper style */}
                                <h3
                                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 group-hover:text-primary-light transition-colors line-clamp-3"
                                    style={{ fontFamily: 'ChosunilboMyungjo, serif' }}
                                >
                                    {mainArticle.title}
                                </h3>

                                {/* Summary */}
                                <p className="text-white/80 text-sm md:text-base line-clamp-2 hidden md:block max-w-2xl">
                                    {mainArticle.ai_summary || cleanPreview(mainArticle.content, 150)}
                                </p>

                                {/* Timestamp */}
                                <div className="flex items-center gap-2 mt-4 text-white/60 text-xs">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatTimeAgo(mainArticle.published_at)}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* ===== TOP STORIES (Right 35%) ===== */}
                <div className="lg:w-[35%] flex flex-col">
                    {/* Section mini-header */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-primary">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-slate-800">TOP STORIES</span>
                    </div>

                    {/* Article stack */}
                    <div className="flex-1 flex flex-col divide-y divide-slate-100">
                        {sideArticles.map((article, idx) => (
                            <Link
                                key={article.id}
                                href={`/news/${article.id}`}
                                className="group flex gap-4 py-4 first:pt-0 last:pb-0"
                            >
                                {/* Rank number - Korea Red */}
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Category */}
                                    {article.category && (
                                        <span className="text-xs text-primary font-medium">
                                            {article.category}
                                        </span>
                                    )}

                                    {/* Title */}
                                    <h4 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors mt-0.5">
                                        {article.title}
                                    </h4>

                                    {/* Time */}
                                    <span className="text-xs text-slate-400 mt-1.5 block">
                                        {formatTimeAgo(article.published_at)}
                                    </span>
                                </div>

                                {/* Thumbnail */}
                                <div className="flex-shrink-0 w-20 h-20 relative overflow-hidden bg-slate-100">
                                    {article.thumbnail_url ? (
                                        <Image
                                            src={article.thumbnail_url}
                                            alt={article.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="80px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                            No Image
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// Skeleton for loading state
export function HeroSectionSkeleton() {
    return (
        <section className="mb-12">
            {/* Header skeleton */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-32 h-6 bg-slate-200 rounded animate-pulse" />
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main article skeleton */}
                <div className="lg:w-[65%]">
                    <div className="aspect-[16/9] bg-slate-200 animate-pulse" />
                </div>

                {/* Side articles skeleton */}
                <div className="lg:w-[35%]">
                    <div className="h-8 bg-slate-200 rounded animate-pulse mb-4" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-8 h-8 bg-slate-200 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                                </div>
                                <div className="w-20 h-20 bg-slate-200 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
