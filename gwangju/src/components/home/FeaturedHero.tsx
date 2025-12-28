import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { Clock } from 'lucide-react';

/**
 * FeaturedHero Component (Server Component)
 * ==========================================
 * Shows a single featured article as the main hero
 * Simpler than slider - focuses on ONE important story
 *
 * Selection Criteria:
 *   1. Published status
 *   2. Gwangju region only (category or region field)
 *   3. Has thumbnail image
 *   4. Most recent by published_at
 */

async function getFeaturedArticle() {
    const supabase = await createClient();

    // First try: Gwangju-specific articles with thumbnails
    let { data } = await supabase
        .from('posts')
        .select('id, title, content, ai_summary, thumbnail_url, category, region, published_at, author')
        .eq('status', 'published')
        .or('category.eq.광주,region.eq.gwangju,category.ilike.%광주%')
        .not('thumbnail_url', 'is', null)
        .neq('thumbnail_url', '')
        .like('thumbnail_url', 'http%')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

    // Fallback: Any article with thumbnail (for demo/testing)
    if (!data) {
        const fallback = await supabase
            .from('posts')
            .select('id, title, content, ai_summary, thumbnail_url, category, region, published_at, author')
            .eq('status', 'published')
            .not('thumbnail_url', 'is', null)
            .neq('thumbnail_url', '')
            .like('thumbnail_url', 'http%')
            .order('published_at', { ascending: false })
            .limit(1)
            .single();
        data = fallback.data;
    }

    return data;
}

// Clean content for preview
function cleanPreview(content: string | null, maxLength: number = 150): string {
    if (!content) return '';
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    // Truncate
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

export default async function FeaturedHero() {
    const article = await getFeaturedArticle();

    if (!article) {
        return (
            <section className="mb-8">
                <div className="bg-slate-100 rounded-2xl h-[400px] flex items-center justify-center">
                    <p className="text-slate-400">No featured article</p>
                </div>
            </section>
        );
    }

    const preview = article.ai_summary || cleanPreview(article.content, 200);

    return (
        <section className="mb-10">
            <Link href={`/news/${article.id}`} className="group block">
                <div className="relative w-full aspect-[21/9] md:aspect-[21/8] overflow-hidden rounded-2xl shadow-lg">
                    {/* Background Image */}
                    <Image
                        src={article.thumbnail_url}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                        sizes="(max-width: 768px) 100vw, 1400px"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                        {/* Badge */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                                오늘의 광주
                            </span>
                            <span className="flex items-center gap-1.5 text-white/70 text-sm">
                                <Clock className="w-4 h-4" />
                                {new Date(article.published_at || '').toLocaleDateString('ko-KR', {
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'short',
                                })}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight mb-4 group-hover:text-blue-200 transition-colors line-clamp-2">
                            {article.title}
                        </h1>

                        {/* Summary (Desktop Only) */}
                        <p className="hidden md:block text-white/80 text-lg leading-relaxed max-w-3xl line-clamp-2">
                            {preview}
                        </p>
                    </div>
                </div>
            </Link>
        </section>
    );
}

// Skeleton for Suspense
export function FeaturedHeroSkeleton() {
    return (
        <section className="mb-10">
            <div className="relative w-full aspect-[21/9] md:aspect-[21/8] overflow-hidden rounded-2xl bg-slate-200 animate-pulse">
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="w-24 h-6 bg-slate-300 rounded-full mb-4" />
                    <div className="w-3/4 h-10 bg-slate-300 rounded mb-4" />
                    <div className="w-1/2 h-6 bg-slate-300 rounded hidden md:block" />
                </div>
            </div>
        </section>
    );
}
