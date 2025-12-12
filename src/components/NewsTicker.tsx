'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (환경변수 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Post {
    id: string;
    title: string;
    category: string;
}

export default function NewsTicker() {
    const [news, setNews] = useState<Post[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);

    // 실제 뉴스 데이터 가져오기
    useEffect(() => {
        const fetchNews = async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('id, title, category')
                .eq('status', 'approved') // 승인된 기사만
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                setNews(data);
            }
        };

        fetchNews();
    }, []);

    useEffect(() => {
        if (news.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIdx((prev) => (prev + 1) % news.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [news.length]);

    const nextNews = () => {
        if (news.length === 0) return;
        setCurrentIdx((prev) => (prev + 1) % news.length);
    };

    const prevNews = () => {
        if (news.length === 0) return;
        setCurrentIdx((prev) => (prev - 1 + news.length) % news.length);
    };

    if (news.length === 0) return null;

    return (
        <div className="w-full border-t border-b border-gray-200 bg-white h-[45px] flex items-center">
            {/* Inner Content 1250px */}
            <div className="w-full max-w-[1250px] mx-auto px-4 flex items-center">
                {/* Label */}
                <span className="flex-shrink-0 bg-[#007BFF] text-white text-xs font-bold px-3 py-1 rounded-full mr-4 animate-pulse">
                    속보
                </span>

                {/* Ticker Text */}
                <div className="flex-grow overflow-hidden relative h-6">
                    <div key={currentIdx} className="absolute top-0 left-0 w-full animate-slide-up">
                        <Link href={`/news/${news[currentIdx].id}`} className="text-gray-800 text-sm hover:text-[#007BFF] hover:underline transition-colors block truncate">
                            {news[currentIdx].title}
                        </Link>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 border-l border-gray-200 pl-3 ml-3">
                    <button onClick={prevNews} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextNews} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    0% { transform: translateY(100%); opacity: 0; }
                    20% { transform: translateY(0); opacity: 1; }
                    90% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-100%); opacity: 0; }
                }
                .animate-slide-up {
                    animation: slide-up 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
}
