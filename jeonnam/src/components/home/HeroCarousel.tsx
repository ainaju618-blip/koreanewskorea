'use client';

// src/components/home/HeroCarousel.tsx
// Auto-rotating Hero Carousel for Regional News
// Implements variable timing based on region weight

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type RegionType } from '@/config/site-regions';

export interface HeroArticle {
    id: string;
    title: string;
    ai_summary?: string;
    thumbnail_url?: string;
    category?: string;
    region?: string;
    regionType: RegionType;
    regionWeight: number;
    published_at?: string;
}

interface HeroCarouselProps {
    articles: HeroArticle[];
    intervals?: Record<RegionType, number>;
}

// Default intervals in ms
const DEFAULT_INTERVALS: Record<RegionType, number> = {
    primary: 7000,
    adjacent1: 5000,
    adjacent2: 4000,
    province: 3000,
};

export default function HeroCarousel({ articles, intervals = DEFAULT_INTERVALS }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const currentArticle = articles[currentIndex];
    const currentInterval = currentArticle ? intervals[currentArticle.regionType] : DEFAULT_INTERVALS.primary;

    // Go to next slide
    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, [articles.length]);

    // Go to previous slide
    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
    }, [articles.length]);

    // Go to specific slide
    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    // Auto-rotation with variable timing
    useEffect(() => {
        if (isPaused || articles.length <= 1) return;

        const timer = setTimeout(() => {
            nextSlide();
        }, currentInterval);

        return () => clearTimeout(timer);
    }, [currentIndex, isPaused, currentInterval, articles.length, nextSlide]);

    if (articles.length === 0) {
        return (
            <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center text-gray-400">
                No articles available
            </div>
        );
    }

    return (
        <div
            className="relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Main Carousel */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                {articles.map((article, index) => (
                    <Link
                        key={article.id}
                        href={`/news/${article.id}`}
                        className={`absolute inset-0 transition-opacity duration-500 ${
                            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    >
                        {/* Image */}
                        {article.thumbnail_url && (
                            <Image
                                src={article.thumbnail_url}
                                alt={article.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 60vw"
                                priority={index === 0}
                            />
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            {/* Region Badge */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`kn-category-badge ${
                                    article.regionType === 'primary' ? 'red' : 'blue'
                                }`}>
                                    {article.category || article.region || '전남'}
                                </span>
                                {article.regionType !== 'primary' && (
                                    <span className="text-xs text-white/70">
                                        {article.regionType === 'adjacent1' ? '인접지역' :
                                         article.regionType === 'adjacent2' ? '연결지역' : '전남'}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h2 className="text-xl md:text-2xl font-bold leading-tight line-clamp-2 mb-2">
                                {article.title}
                            </h2>

                            {/* Summary */}
                            {article.ai_summary && (
                                <p className="text-sm text-white/80 line-clamp-2 hidden md:block">
                                    {article.ai_summary}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Navigation Arrows */}
            {articles.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); prevSlide(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); nextSlide(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {articles.length > 1 && (
                <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
                    {articles.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                index === currentIndex
                                    ? 'bg-white w-6'
                                    : 'bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Progress Bar */}
            {articles.length > 1 && !isPaused && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                    <div
                        className="h-full bg-primary transition-all ease-linear"
                        style={{
                            animation: `progress ${currentInterval}ms linear`,
                        }}
                    />
                    <style jsx>{`
                        @keyframes progress {
                            from { width: 0%; }
                            to { width: 100%; }
                        }
                    `}</style>
                </div>
            )}

            {/* Current/Total Counter */}
            <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-sm px-3 py-1 text-white text-sm">
                {currentIndex + 1} / {articles.length}
            </div>
        </div>
    );
}

// Skeleton for loading state
export function HeroCarouselSkeleton() {
    return (
        <div className="relative aspect-[16/9] bg-gray-200 animate-pulse">
            <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="w-20 h-6 bg-gray-300 mb-3" />
                <div className="w-3/4 h-8 bg-gray-300 mb-2" />
                <div className="w-1/2 h-5 bg-gray-300" />
            </div>
        </div>
    );
}
