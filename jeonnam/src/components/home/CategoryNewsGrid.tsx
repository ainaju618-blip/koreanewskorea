import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { ArrowRight, Newspaper } from 'lucide-react';

/**
 * Korea NEWS Gwangju - Unique Category News Grid
 * ==============================================
 * Design Philosophy:
 *   - Korea Red accent headers
 *   - Clean numbered list style
 *   - Newspaper-inspired typography
 *   - Regional news focus
 *
 * Layout: 3-column grid (정치, 경제, 사회)
 */

interface Article {
    id: string;
    title: string;
    thumbnail_url: string | null;
    published_at: string | null;
}

interface CategoryData {
    name: string;
    slug: string;
    articles: Article[];
}

async function getCategoryArticles(): Promise<CategoryData[]> {
    const supabase = await createClient();

    const categories = [
        { name: '정치', slug: 'politics', dbCategory: '정치' },
        { name: '경제', slug: 'economy', dbCategory: '경제' },
        { name: '사회', slug: 'society', dbCategory: '사회' },
    ];

    const results: CategoryData[] = [];

    for (const cat of categories) {
        // Try specific category first
        let { data } = await supabase
            .from('posts')
            .select('id, title, thumbnail_url, published_at')
            .eq('status', 'published')
            .or(`category.eq.${cat.dbCategory},category.ilike.%${cat.dbCategory}%`)
            .order('published_at', { ascending: false })
            .limit(5);

        // If no articles, get any recent articles (for demo)
        if (!data || data.length === 0) {
            const fallback = await supabase
                .from('posts')
                .select('id, title, thumbnail_url, published_at')
                .eq('status', 'published')
                .order('published_at', { ascending: false })
                .limit(5);
            data = fallback.data;
        }

        results.push({
            name: cat.name,
            slug: cat.slug,
            articles: data || [],
        });
    }

    return results;
}

export default async function CategoryNewsGrid() {
    const categories = await getCategoryArticles();

    return (
        <section className="mb-12">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-slate-900">분야별 뉴스</h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((category, catIdx) => (
                    <div
                        key={category.slug}
                        className="bg-white border border-slate-200 overflow-hidden hover:border-primary/30 transition-colors"
                    >
                        {/* Category Header - Korea Red accent */}
                        <div className="relative bg-slate-900 px-5 py-3 flex items-center justify-between">
                            {/* Red accent bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                            <h3 className="font-bold text-white text-lg">{category.name}</h3>
                            <Link
                                href={`/category/${category.slug}`}
                                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                            >
                                더보기 <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {/* Article List */}
                        <ul className="divide-y divide-slate-100">
                            {category.articles.map((article, idx) => (
                                <li key={article.id}>
                                    <Link
                                        href={`/news/${article.id}`}
                                        className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                                    >
                                        {/* Number Badge - Korea Red for top 3 */}
                                        <span
                                            className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold ${
                                                idx < 3
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {idx + 1}
                                        </span>

                                        {/* Title */}
                                        <span className="flex-1 text-sm text-slate-700 leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                                            {article.title}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}

// Skeleton for loading state
export function CategoryNewsGridSkeleton() {
    return (
        <section className="mb-12">
            {/* Header skeleton */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-32 h-6 bg-slate-200 rounded animate-pulse" />
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-slate-200 overflow-hidden">
                        <div className="h-12 bg-slate-900" />
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4, 5].map((j) => (
                                <div key={j} className="flex gap-3">
                                    <div className="w-6 h-6 bg-slate-100 animate-pulse" />
                                    <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
