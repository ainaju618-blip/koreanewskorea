'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Post {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    image_url?: string;
    created_at: string;
    category: string;
}

export default function MainSlider() {
    const [slides, setSlides] = useState<Post[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHeadlineNews = async () => {
            try {
                // Get most recent posts with images for the slider
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('status', 'approved')
                    .not('image_url', 'is', null)   // ★ null 제외
                    .neq('image_url', '')           // ★ 빈 문자열 제외
                    .like('image_url', 'http%')     // ★ http로 시작하는 URL만
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (data) {
                    setSlides(data);
                }
            } catch (err) {
                console.error('Failed to fetch slider news:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHeadlineNews();
    }, []);

    useEffect(() => {
        if (slides.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIdx((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 seconds auto slide
        return () => clearInterval(interval);
    }, [slides.length]);

    const prevSlide = () => {
        setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const nextSlide = () => {
        setCurrentIdx((prev) => (prev + 1) % slides.length);
    };

    if (loading) return <div className="w-full h-[400px] bg-slate-100 animate-pulse rounded-xl"></div>;
    if (slides.length === 0) return null;

    return (
        <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden rounded-xl group">
            {/* Slider Content */}
            <div
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIdx * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <Image
                                src={slide.image_url || '/placeholder.png'}
                                alt={slide.title}
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        </div>

                        {/* Text Content */}
                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white">
                            <span className="inline-block px-2 py-1 mb-3 text-xs font-bold bg-[#007BFF] rounded text-white uppercase tracking-wider">
                                {slide.category || '주요뉴스'}
                            </span>
                            <Link href={`/news/${slide.id}`}>
                                <h2 className="text-2xl md:text-4xl font-bold mb-2 leading-tight hover:underline cursor-pointer line-clamp-2">
                                    {slide.title}
                                </h2>
                            </Link>
                            <p className="text-sm md:text-lg text-gray-200 line-clamp-2 md:w-3/4">
                                {slide.summary || slide.content?.substring(0, 100).replace(/<[^>]*>?/gm, "")}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <button
                onClick={prevSlide}
                className="absolute top-1/2 left-4 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-[#007BFF] transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-[#007BFF] transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${currentIdx === idx ? 'bg-[#007BFF] w-6' : 'bg-white/50 hover:bg-white'}`}
                    />
                ))}
            </div>
        </div>
    );
}
