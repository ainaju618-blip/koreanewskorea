'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { cleanContentPreview } from '@/lib/contentUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Post {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    thumbnail_url?: string;
    image_url?: string;
    created_at: string;
    category: string;
    author?: string;
}

interface NewsGridProps {
    categorySlug?: string;
    categoryName: string;
    categoryNameEn?: string; // English name for subtitle
    regionCode?: string; // ★ 지역 코드 필터 (naju, mokpo 등)
    limit?: number;
}

export default function NewsGrid({ categorySlug, categoryName, categoryNameEn, regionCode, limit = 5 }: NewsGridProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            let query = supabase
                .from('posts')
                .select('*')
                .in('status', ['approved', 'published'])
                .not('thumbnail_url', 'is', null)  // ★ null 제외
                .neq('thumbnail_url', '')          // ★ 빈 문자열 제외
                .like('thumbnail_url', 'http%')    // ★ http로 시작하는 URL만
                .order('created_at', { ascending: false })
                .limit(limit);

            // ★ 지역 코드로 필터링 (우선)
            if (regionCode) {
                query = query.eq('region', regionCode);
            } else if (categorySlug) {
                query = query.eq('category', categoryName);
            }

            const { data } = await query;
            if (data) setPosts(data);
            setIsLoading(false);
        };

        fetchPosts();
    }, [categorySlug, categoryName, regionCode, limit]);

    if (isLoading) {
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

    if (posts.length === 0) return null;

    const mainPost = posts[0];
    const subPosts = posts.slice(1, 5);

    // Safe image helper
    const getImageUrl = (post: Post) => {
        let url = post.thumbnail_url || post.image_url || null;
        if (!url || url.length <= 5) return null;

        // 잘못된 로컬 경로 필터링 (d:\, C:\, scrapers\ 등)
        if (url.includes(':\\') || url.includes('scrapers\\') || url.includes('scrapers/images')) {
            return null;
        }

        return url;
    };

    return (
        <section className="mb-16">
            {/* Section Header - Modern Serif Style */}
            <div className="flex items-end gap-4 mb-8 pb-4 border-b border-slate-200">
                <h3 className="text-3xl font-serif font-bold text-[#0a192f] leading-none">
                    {categoryName}
                </h3>
                {categoryNameEn && (
                    <span className="text-sm font-serif italic text-slate-400 mb-1">
                        {categoryNameEn}
                    </span>
                )}
                <Link
                    href={categorySlug ? `/category/${categorySlug}` : '/'}
                    className="ml-auto text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#ff2e63] transition-colors"
                >
                    View All
                </Link>
            </div>

            {/* Content: 1 Main (Left) + 4 Sub (Right) */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Article (Left - Large) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="lg:w-1/2"
                >
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
                                <span className="w-2 h-2 rounded-full bg-[#ff2e63]"></span>
                                <span className="text-xs font-bold text-[#0a192f] uppercase tracking-wide">Headline</span>
                            </div>
                            <h4 className="text-2xl font-serif font-bold text-[#0a192f] leading-tight group-hover:text-blue-900 transition-colors">
                                {mainPost.title}
                            </h4>
                            <p className="text-base text-slate-600 line-clamp-2 font-light leading-relaxed">
                                {(!mainPost.content || mainPost.content.includes('본문 내용을 가져올 수 없습니다'))
                                    ? (mainPost.summary || '')
                                    : cleanContentPreview(mainPost.content, 120)}...
                            </p>
                            <span className="text-xs text-slate-400 font-sans block pt-2">
                                {new Date(mainPost.created_at).toLocaleDateString('ko-KR')}
                            </span>
                        </div>
                    </Link>
                </motion.div>

                {/* Sub Articles (Right - List) */}
                <div className="lg:w-1/2 flex flex-col justify-between gap-6">
                    {subPosts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link
                                href={`/news/${post.id}`}
                                className="group flex gap-5 items-start p-4 -mx-4 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                {/* Thumbnail - Fixed Size */}
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
                                    <h5 className="text-lg font-serif font-bold text-slate-800 leading-snug group-hover:text-[#0a192f] transition-colors mb-1 line-clamp-2">
                                        {post.title}
                                    </h5>
                                    <p className="text-sm text-slate-500 line-clamp-1 mb-2 font-light">
                                        {(!post.content || post.content.includes('본문 내용을 가져올 수 없습니다'))
                                            ? (post.summary || '')
                                            : cleanContentPreview(post.content, 50)}...
                                    </p>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                        {new Date(post.created_at).toLocaleDateString('ko-KR')}
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
