// src/components/NewsGrid.tsx
// Server Component 버전 - 클라이언트 사이드 데이터 fetching을 서버로 이동

import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { cleanContentPreview } from '@/lib/contentUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Post {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    thumbnail_url?: string;
    image_url?: string;
    created_at: string;
    published_at?: string; // 추가
    category: string;
    author?: string;
}

interface NewsGridProps {
    categorySlug?: string;
    categoryName: string;
    categoryNameEn?: string;
    regionCode?: string;
    limit?: number;
}

// Safe image helper
function getImageUrl(post: Post): string | null {
    let url = post.thumbnail_url || post.image_url || null;
    if (!url || url.length <= 5) return null;

    // 잘못된 로컬 경로 필터링
    if (url.includes(':\\\\') || url.includes('scrapers\\\\') || url.includes('scrapers/images')) {
        return null;
    }

    return url;
}

export default async function NewsGrid({
    categorySlug,
    categoryName,
    categoryNameEn,
    regionCode,
    limit = 5
}: NewsGridProps) {
    // 서버에서 직접 데이터 조회
    let query = supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .not('thumbnail_url', 'is', null)
        .neq('thumbnail_url', '')
        .like('thumbnail_url', 'http%')
        .order('created_at', { ascending: false })
        .limit(limit);

    // Query both category and region fields (like HeroSlider)
    if (regionCode) {
        query = query.or(`region.eq.${regionCode},category.eq.${categoryName}`);
    } else if (categorySlug) {
        // For gwangju/jeonnam: search both category and region fields
        query = query.or(`category.eq.${categoryName},region.eq.${categorySlug}`);
    }

    const { data: posts } = await query;

    if (!posts || posts.length === 0) return null;

    const mainPost = posts[0];
    const subPosts = posts.slice(1, 5);

    return (
        <section className="mb-16">
            {/* Section Header */}
            <div className="flex items-end gap-4 mb-8 pb-4 border-b border-slate-200">
                <h2 className="text-3xl font-serif font-bold text-secondary leading-none">
                    {categoryName}
                </h2>
                {categoryNameEn && (
                    <span className="text-sm font-serif italic text-slate-500 mb-1">
                        {categoryNameEn}
                    </span>
                )}
                <Link
                    href={categorySlug ? `/category/${categorySlug}` : '/'}
                    className="ml-auto text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
                    aria-label={`View all ${categoryName} news`}
                >
                    View All
                </Link>
            </div>

            {/* Content: 1 Main (Left) + 4 Sub (Right) */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Article (Left - Large) */}
                <div className="lg:w-1/2">
                    <Link href={`/news/${mainPost.id}`} className="group block h-full">
                        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-lg mb-4 shadow-sm group-hover:shadow-lg transition-all duration-300">
                            {getImageUrl(mainPost) ? (
                                <Image
                                    src={getImageUrl(mainPost)!}
                                    alt={mainPost.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-300 border border-slate-200">
                                    <span className="font-serif font-bold text-xl text-slate-300">Korea News</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span className="text-xs font-bold text-secondary uppercase tracking-wide">Headline</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-secondary leading-tight group-hover:text-blue-900 transition-colors">
                                {mainPost.title}
                            </h3>
                            <p className="text-base text-slate-700 line-clamp-2 font-light leading-relaxed">
                                {(!mainPost.content || mainPost.content.includes('본문 내용을 가져올 수 없습니다'))
                                    ? (mainPost.summary || '')
                                    : cleanContentPreview(mainPost.content, 120)}...
                            </p>
                            <span className="text-xs text-slate-400 font-sans block pt-2">
                                {new Date(mainPost.published_at || mainPost.created_at).toLocaleDateString('ko-KR')}
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Sub Articles (Right - List) */}
                <div className="lg:w-1/2 flex flex-col justify-start gap-3">
                    {subPosts.map((post) => (
                        <div key={post.id}>
                            <Link
                                href={`/news/${post.id}`}
                                className="group flex gap-5 items-start p-4 -mx-4 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-32 h-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-100 shadow-sm">
                                    {getImageUrl(post) ? (
                                        <Image
                                            src={getImageUrl(post)!}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <span className="font-serif text-[10px]">No Image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-serif font-bold text-slate-800 leading-snug group-hover:text-secondary transition-colors mb-1 line-clamp-2">
                                        {post.title}
                                    </h4>
                                    <p className="text-sm text-slate-700 line-clamp-1 mb-2 font-light">
                                        {(!post.content || post.content.includes('본문 내용을 가져올 수 없습니다'))
                                            ? (post.summary || '')
                                            : cleanContentPreview(post.content, 50)}...
                                    </p>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                        {new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR')}
                                    </span>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Skeleton 컴포넌트 (Suspense fallback용)
export function NewsGridSkeleton() {
    return (
        <section className="mb-16">
            <div className="h-4 bg-slate-100 animate-pulse w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-80 bg-slate-100 animate-pulse rounded-lg"></div>
                <div className="space-y-4">
                    <div className="h-20 bg-slate-100 animate-pulse rounded-lg"></div>
                    <div className="h-20 bg-slate-100 animate-pulse rounded-lg"></div>
                    <div className="h-20 bg-slate-100 animate-pulse rounded-lg"></div>
                </div>
            </div>
        </section>
    );
}
