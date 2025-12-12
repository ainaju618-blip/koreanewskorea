'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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

    // Auto-slide every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [items.length]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    if (!items || items.length === 0) return null;

    const currentItem = items[currentIndex];

    return (
        <div className="relative w-full h-[350px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 group">
            {/* Background Image with Transition */}
            <div key={currentItem.id} className="absolute inset-0 transition-opacity duration-700 ease-in-out">
                {currentItem.thumbnail_url ? (
                    <img
                        src={currentItem.thumbnail_url}
                        alt={currentItem.title}
                        className="w-full h-full object-cover animate-fade-in"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-800 bg-gradient-to-br from-slate-700 to-slate-900" />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <Link href={`/news/${currentItem.id}`} className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-4xl z-10">
                <div className="flex items-center space-x-3 mb-4">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg shadow-blue-900/20">
                        Top News
                    </span>
                    {currentItem.category && (
                        <span className="inline-flex items-center px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-sm">
                            {currentItem.category}
                        </span>
                    )}
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight drop-shadow-lg group-hover:underline decoration-blue-500/50 underline-offset-8 transition-all">
                    {currentItem.title}
                </h1>

                <p className="text-slate-200 text-base md:text-lg line-clamp-2 max-w-2xl font-light leading-relaxed opacity-90">
                    {currentItem.summary || '주요 뉴스 내용이 여기에 표시됩니다. 클릭하여 자세한 내용을 확인하세요.'}
                </p>
            </Link>

            {/* Navigation Arrows (Visible on Hover / Touch) */}
            <button
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-8 right-8 flex space-x-2 z-20">
                {items.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.preventDefault(); setCurrentIndex(idx); }}
                        className={`w-12 h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-blue-500' : 'bg-white/30 hover:bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
