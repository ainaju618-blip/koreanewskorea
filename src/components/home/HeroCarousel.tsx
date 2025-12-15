'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface CarouselItem {
    id: string;
    title: string;
    summary?: string;
    thumbnail_url?: string;
    category?: string;
    published_at?: string;
}

interface HeroCarouselProps {
    items: CarouselItem[];
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);

    const SLIDE_DURATION = 5000; // 5 seconds

    // Auto-slide with progress bar
    useEffect(() => {
        if (!isPlaying) return;

        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    setCurrentIndex((idx) => (idx + 1) % items.length);
                    return 0;
                }
                return prev + (100 / (SLIDE_DURATION / 50));
            });
        }, 50);

        return () => clearInterval(progressInterval);
    }, [items.length, isPlaying, currentIndex]);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
        setProgress(0);
    }, []);

    const nextSlide = useCallback(() => {
        goToSlide((currentIndex + 1) % items.length);
    }, [currentIndex, items.length, goToSlide]);

    const prevSlide = useCallback(() => {
        goToSlide((currentIndex - 1 + items.length) % items.length);
    }, [currentIndex, items.length, goToSlide]);

    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => !prev);
    }, []);

    if (!items || items.length === 0) return null;

    const currentItem = items[currentIndex];

    return (
        <div className="relative w-full h-[400px] md:h-[520px] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 group">
            {/* Background Images with Crossfade */}
            {items.map((item, idx) => (
                <div
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    {item.thumbnail_url ? (
                        <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${idx === currentIndex ? 'scale-105' : 'scale-100'
                                }`}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                    )}
                </div>
            ))}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 z-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent z-20" />

            {/* Content */}
            <Link
                href={`/news/${currentItem.id}`}
                className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-3xl z-30"
            >
                {/* Badge Row */}
                <div className="flex items-center gap-3 mb-5">
                    <span className="inline-flex items-center px-3 py-1.5 bg-[#A6121D] text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-red-900/30">
                        Top News
                    </span>
                    {currentItem.category && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold rounded-full border border-white/20">
                            {currentItem.category}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-5xl font-serif font-black text-white leading-[1.15] mb-4 tracking-tight drop-shadow-lg">
                    <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text">
                        {currentItem.title}
                    </span>
                </h1>

                {/* Summary */}
                <p className="text-slate-200/90 text-base md:text-lg line-clamp-2 max-w-2xl font-light leading-relaxed">
                    {currentItem.summary || 'Click to read the full story'}
                </p>
            </Link>

            {/* Navigation Arrows */}
            <button
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-30 border border-white/10 hover:border-white/20 hover:scale-105"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-30 border border-white/10 hover:border-white/20 hover:scale-105"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 right-8 flex items-center gap-4 z-30">
                {/* Play/Pause Button */}
                <button
                    onClick={(e) => { e.preventDefault(); togglePlay(); }}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/10 hover:border-white/20"
                    aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2">
                    {items.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.preventDefault(); goToSlide(idx); }}
                            className="relative h-1 rounded-full overflow-hidden transition-all duration-300 hover:opacity-80"
                            style={{ width: idx === currentIndex ? '48px' : '24px' }}
                            aria-label={`Go to slide ${idx + 1}`}
                        >
                            {/* Background */}
                            <div className="absolute inset-0 bg-white/30" />
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
                <div className="text-white/70 text-sm font-medium tabular-nums">
                    <span className="text-white">{String(currentIndex + 1).padStart(2, '0')}</span>
                    <span className="mx-1">/</span>
                    <span>{String(items.length).padStart(2, '0')}</span>
                </div>
            </div>

            {/* Slide Number (Large) - Left Bottom */}
            <div className="absolute left-8 bottom-8 md:left-12 md:bottom-36 z-20 opacity-10">
                <span className="text-[120px] md:text-[180px] font-black text-white leading-none">
                    {String(currentIndex + 1).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
}
