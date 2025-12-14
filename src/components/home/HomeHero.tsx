'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cleanContentPreview } from '@/lib/contentUtils';

/**
 * Korea NEWS Home Hero Section
 * ===========================
 * EXACT Kangwon Ilbo (kwnews.co.kr) Layout Clone
 */

interface Article {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    thumbnail_url?: string;
    author?: string;
    category?: string;
    published_at?: string;
}

// WebFrame Analyzer Exact Dimensions (Kangwon Ilbo) -> Adjusted to 500px total height
// Note: These constants explain the logic but are not used directly in Tailwind classes for flexibility.
const LAYOUT = {
    MAIN_VISUAL_WIDTH: 870,
    MAIN_VISUAL_HEIGHT: 500, // Matched to container
    SUB_ARTICLE_WIDTH: 260,
    SUB_ARTICLE_HEIGHT: 240, // (500 - 20 gap) / 2
    TEXT_LIST_WIDTH: 260,
    GAP: 40,
};

export default function HomeHero() {
    const [mainArticle, setMainArticle] = useState<Article | null>(null);
    const [textArticles, setTextArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setIsLoading(true);
                // ★ 메인 페이지는 이미지 있는 기사만 표시
                const res = await fetch('/api/posts?limit=20&status=published&requireImage=true');
                if (res.ok) {
                    const data = await res.json();
                    const allPosts = data.posts || [];

                    // ★ 이미지가 있는 기사만 메인 히어로에 표시
                    // 잘못된 URL 필터링 (로컬 경로, 빈 문자열, http 아닌 것)
                    const isValidImageUrl = (url?: string) => {
                        if (!url || url.trim() === '' || url.length <= 10) return false;
                        if (!url.startsWith('http')) return false;  // ★ http로 시작해야 함
                        if (url.includes(':\\') || url.includes('scrapers\\') || url.includes('scrapers/images')) return false;
                        return true;
                    };
                    const postsWithImage = allPosts.filter((p: Article) => isValidImageUrl(p.thumbnail_url));

                    if (postsWithImage.length > 0) {
                        setMainArticle(postsWithImage[0]);
                        setTextArticles(postsWithImage.slice(1, 8));
                    } else if (allPosts.length > 0) {
                        // 이미지 있는 기사가 하나도 없으면 첫 기사라도 표시 (fallback)
                        setMainArticle(allPosts[0]);
                        setTextArticles(allPosts.slice(1, 8));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch hero news", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10 container-kn h-[500px]">
                <div className="lg:col-span-8 bg-slate-100 animate-pulse rounded-lg h-full" />
                <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                    <div className="bg-slate-100 animate-pulse rounded-lg flex-1" />
                    <div className="bg-slate-100 animate-pulse rounded-lg flex-1" />
                </div>
            </div>
        );
    }

    if (!mainArticle) return null;

    // Helper for Bento Item
    const BentoItem = ({ article, isMain = false }: { article: Article; isMain?: boolean }) => {
        // Category Name Mapping (Society -> AI)
        const displayCategory = (cat?: string) => {
            if (!cat) return 'News';
            const lowerCat = cat.toLowerCase().trim();
            if (lowerCat.includes('사회') || lowerCat.includes('society')) return 'AI';
            return cat;
        };

        // Main Article: Original Overlay Style
        if (isMain) {
            return (
                <Link
                    href={`/news/${article.id}`}
                    className="group relative block overflow-hidden rounded-xl border border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 h-full"
                >
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105"
                        style={{
                            backgroundImage: article.thumbnail_url
                                ? `url(${article.thumbnail_url})`
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: article.thumbnail_url ? 'transparent' : '#e2e8f0'
                        }}
                    >
                        {!article.thumbnail_url && (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-slate-400 font-serif font-bold">No Image</span>
                            </div>
                        )}
                    </div>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Content Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8 flex flex-col justify-end h-full">
                        <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-white bg-[#ff2e63] rounded-full w-fit shadow-md">
                            Headlines
                        </span>

                        <h3 className="text-2xl lg:text-4xl font-serif font-black text-white leading-tight mb-3 drop-shadow-lg group-hover:text-blue-100 transition-colors line-clamp-3">
                            {article.title}
                        </h3>

                        <p className="text-gray-100 text-sm lg:text-base line-clamp-2 max-w-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 font-light leading-relaxed">
                            {(!article.content || article.content.includes('본문 내용을 가져올 수 없습니다'))
                                ? (article.summary || '')
                                : cleanContentPreview(article.content, 150)}...
                        </p>
                    </div>

                    {/* Hover Glare Effect */}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
                </Link>
            );
        }

        // Sub Articles: Stacked Card Style (Image Top / Text Bottom)
        return (
            <Link
                href={`/news/${article.id}`}
                className="group flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
            >
                {/* 1. Image Area (Top) - Fixed Aspect Ratio */}
                <div className="relative w-full h-24 overflow-hidden bg-slate-100 border-b border-slate-100">
                    {article.thumbnail_url ? (
                        <Image
                            src={article.thumbnail_url}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-slate-300 text-xs font-bold">No Image</span>
                        </div>
                    )}
                </div>

                {/* 2. Text Area (Bottom) - White Background */}
                <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff2e63]"></span>
                            <span className="text-[11px] font-bold text-[#0a192f] uppercase tracking-wider opacity-80">
                                {displayCategory(article.category)}
                            </span>
                        </div>

                        <h3 className="text-lg font-serif font-bold text-slate-900 leading-[1.25] mb-1 group-hover:text-[#ff2e63] transition-colors line-clamp-2">
                            {article.title}
                        </h3>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2 leading-snug font-normal">
                        {(!article.content || article.content.includes('본문 내용을 가져올 수 없습니다'))
                            ? (article.summary || '')
                            : cleanContentPreview(article.content, 60)}...
                    </p>
                </div>
            </Link>
        );
    };

    // Adjusted to 2 items to fit 500px height comfortably
    const subArticles = textArticles.slice(0, 2);

    return (
        <section className="container-kn mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[500px]">
                {/* Main Feature (Left) */}
                <div className="lg:col-span-8 h-full min-h-[400px]">
                    <BentoItem article={mainArticle} isMain />
                </div>

                {/* Side Stack (Right) */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                    {subArticles.map((article) => (
                        <div key={article.id} className="flex-1 min-h-[140px]">
                            <BentoItem article={article} />
                        </div>
                    ))}
                    {/* Fallback if less than 2 articles */}
                    {subArticles.length < 2 && Array.from({ length: 2 - subArticles.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex-1 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                            <span className="text-slate-400 text-sm">기사 준비중</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visual Separation */}
            <div className="w-full h-px bg-slate-200 my-6" />
        </section>
    );
}
