'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cleanContentPreview } from '@/lib/contentUtils';
import HeroSlider from './HeroSlider';

/**
 * Korea NEWS Home Hero Section
 * ===========================
 * Dynamic Hero Slider + Side Articles (Kangwon Ilbo Style)
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

export default function HomeHero() {
    const [textArticles, setTextArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/posts?limit=10&status=published&requireImage=true');
                if (res.ok) {
                    const data = await res.json();
                    const allPosts = data.posts || [];

                    const isValidImageUrl = (url?: string) => {
                        if (!url || url.trim() === '' || url.length <= 10) return false;
                        if (!url.startsWith('http')) return false;
                        if (url.includes(':\\') || url.includes('scrapers\\') || url.includes('scrapers/images')) return false;
                        return true;
                    };
                    const postsWithImage = allPosts.filter((p: Article) => isValidImageUrl(p.thumbnail_url));
                    setTextArticles(postsWithImage.slice(0, 2));
                }
            } catch (error) {
                console.error("Failed to fetch hero news", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, []);

    // Helper for Side Articles
    const SideArticle = ({ article }: { article: Article }) => {
        const displayCategory = (cat?: string) => {
            if (!cat) return 'News';
            const lowerCat = cat.toLowerCase().trim();
            if (lowerCat.includes('society')) return 'AI';
            return cat;
        };

        return (
            <Link
                href={`/news/${article.id}`}
                className="group flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
            >
                {/* Image Area */}
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

                {/* Text Area */}
                <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A6121D]"></span>
                            <span className="text-[11px] font-bold text-[#0a192f] uppercase tracking-wider opacity-80">
                                {displayCategory(article.category)}
                            </span>
                        </div>

                        <h3 className="text-lg font-serif font-bold text-slate-900 leading-[1.25] mb-1 group-hover:text-[#A6121D] transition-colors line-clamp-2">
                            {article.title}
                        </h3>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2 leading-snug font-normal">
                        {(!article.content || article.content.includes('Error'))
                            ? (article.summary || '')
                            : cleanContentPreview(article.content, 60)}...
                    </p>
                </div>
            </Link>
        );
    };

    return (
        <section className="container-kn mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[500px]">
                {/* Main Hero Slider (Left) */}
                <div className="lg:col-span-8 h-full min-h-[400px]">
                    <HeroSlider />
                </div>

                {/* Side Stack (Right) */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                    {isLoading ? (
                        <>
                            <div className="flex-1 bg-slate-100 animate-pulse rounded-xl" />
                            <div className="flex-1 bg-slate-100 animate-pulse rounded-xl" />
                        </>
                    ) : (
                        <>
                            {textArticles.map((article) => (
                                <div key={article.id} className="flex-1 min-h-[140px]">
                                    <SideArticle article={article} />
                                </div>
                            ))}
                            {textArticles.length < 2 && Array.from({ length: 2 - textArticles.length }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex-1 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                                    <span className="text-slate-400 text-sm">Preparing...</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Visual Separation */}
            <div className="w-full h-px bg-slate-200 my-6" />
        </section>
    );
}
