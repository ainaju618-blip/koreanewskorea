'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { cleanContentPreview } from '@/lib/contentUtils';

interface SliderArticle {
    id: string;
    title: string;
    content?: string;
    ai_summary?: string;
    thumbnail_url?: string;
    category?: string;
    regionCode: string;
    regionName: string;
    regionNameEn: string;
    published_at?: string;
}

interface HeroSliderProps {
    className?: string;
    initialArticles?: SliderArticle[];
    initialInterval?: number;
}

export default function HeroSlider({
    className = '',
    initialArticles = [],
    initialInterval = 4000
}: HeroSliderProps) {
    const [articles] = useState<SliderArticle[]>(initialArticles);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
    const containerRef = useRef<HTMLDivElement>(null);

    // Touch handling for mobile swipe
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    // Auto-slide with progress bar (paused on hover)
    useEffect(() => {
        if (!isPlaying || isHovered || articles.length === 0) return;

        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    setCurrentIndex((idx) => (idx + 1) % articles.length);
                    return 0;
                }
                return prev + (100 / (initialInterval / 50));
            });
        }, 50);

        return () => clearInterval(progressInterval);
    }, [articles.length, isPlaying, isHovered, initialInterval]);

    // Navigation handlers
    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
        setProgress(0);
    }, []);

    const nextSlide = useCallback(() => {
        if (articles.length === 0) return;
        goToSlide((currentIndex + 1) % articles.length);
    }, [currentIndex, articles.length, goToSlide]);

    const prevSlide = useCallback(() => {
        if (articles.length === 0) return;
        goToSlide((currentIndex - 1 + articles.length) % articles.length);
    }, [currentIndex, articles.length, goToSlide]);

    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => !prev);
    }, []);

    // Touch handlers for mobile swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;

        const diff = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    // No articles fallback
    if (articles.length === 0) {
        return (
            <div className={`relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center ${className}`}>
                <p className="text-slate-400 text-lg">No articles available</p>
            </div>
        );
    }

    const currentArticle = articles[currentIndex];

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden shadow-2xl shadow-slate-900/10 group ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Images - Only load current and adjacent slides */}
            {articles.map((article, idx) => {
                // Only render current, previous, and next slides for performance
                const shouldRender =
                    idx === currentIndex ||
                    idx === (currentIndex + 1) % articles.length ||
                    idx === (currentIndex - 1 + articles.length) % articles.length;

                if (!shouldRender) return null;

                return (
                    <div
                        key={article.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    >
                        {article.thumbnail_url ? (
                            <Image
                                src={article.thumbnail_url}
                                alt={article.title}
                                fill
                                priority={idx === 0}
                                sizes="(max-width: 1024px) 100vw, 66vw"
                                className={`object-cover transition-transform duration-[8000ms] ease-out ${
                                    idx === currentIndex ? 'scale-110' : 'scale-100'
                                }`}
                                onLoad={() => setImageLoaded(prev => ({ ...prev, [idx]: true }))}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                        )}
                    </div>
                );
            })}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent z-20" />

            {/* Content */}
            <Link
                href={`/news/${currentArticle.id}`}
                className="absolute bottom-0 left-0 p-6 md:p-10 w-full max-w-3xl z-30"
            >
                {/* Region Badge (Dynamic) */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center px-3 py-1.5 bg-primary text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-red-900/30">
                        {currentArticle.regionName}
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold rounded-full border border-white/20">
                        {currentArticle.regionNameEn}
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif font-black text-white leading-tight mb-4 tracking-tight drop-shadow-lg line-clamp-3">
                    {currentArticle.title}
                </h1>

                {/* Summary */}
                <p className="text-slate-200/90 text-sm md:text-base lg:text-lg line-clamp-2 max-w-2xl font-light leading-relaxed">
                    {currentArticle.content && !currentArticle.content.includes('Error')
                        ? cleanContentPreview(currentArticle.content, 120)
                        : currentArticle.ai_summary || 'Click to read the full story'}
                </p>
            </Link>

            {/* Navigation Arrows */}
            <button
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-30 border border-white/10 hover:border-white/30 hover:scale-105 active:scale-95"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-30 border border-white/10 hover:border-white/30 hover:scale-105 active:scale-95"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Controls */}
            <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex items-center gap-4 z-30">
                {/* Play/Pause Button */}
                <button
                    onClick={(e) => { e.preventDefault(); togglePlay(); }}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all border border-white/10 hover:border-white/30"
                    aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Progress Indicators (Dots) */}
                <div className="flex items-center gap-2">
                    {articles.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.preventDefault(); goToSlide(idx); }}
                            className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300 hover:opacity-80"
                            style={{ width: idx === currentIndex ? '40px' : '20px' }}
                            aria-label={`Go to slide ${idx + 1}`}
                        >
                            {/* Background */}
                            <div className="absolute inset-0 bg-white/30 rounded-full" />
                            {/* Progress Fill */}
                            {idx === currentIndex && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-white rounded-full transition-none"
                                    style={{ width: `${progress}%` }}
                                />
                            )}
                            {idx < currentIndex && (
                                <div className="absolute inset-0 bg-white rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Slide Counter */}
                <div className="text-white/70 text-sm font-medium tabular-nums hidden md:block">
                    <span className="text-white font-bold">{String(currentIndex + 1).padStart(2, '0')}</span>
                    <span className="mx-1 opacity-50">/</span>
                    <span>{String(articles.length).padStart(2, '0')}</span>
                </div>
            </div>

            {/* Hover indicator */}
            {isHovered && isPlaying && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white/80 text-xs z-30 flex items-center gap-1.5">
                    <Pause className="w-3 h-3" />
                    <span>Paused</span>
                </div>
            )}
        </div>
    );
}
