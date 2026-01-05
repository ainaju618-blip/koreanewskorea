// src/components/Sidebar.tsx
// Server Component - Modern Design with MapWidget

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Calendar, ArrowRight, Flame } from 'lucide-react';
import MapWidget, { MapWidgetSkeleton } from './sidebar/MapWidget';
import NativeAdSlot from './ads/NativeAdSlot';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Post {
    id: string;
    title: string;
    created_at: string;
    published_at?: string;
    view_count?: number;
}

/**
 * Korea NEWS Sidebar (Server Component)
 * =====================================
 * 사이드바 구성:
 * 1. 전국 지도 위젯 (MapWidget)
 * 2. 많이 본 뉴스
 * 3. 최신 뉴스
 * 4. 네이티브 광고
 */
export default async function Sidebar() {
    // Server-side data fetching
    const { data: hotPosts } = await supabase
        .from('posts')
        .select('id, title, created_at, view_count')
        .eq('status', 'published')
        .order('view_count', { ascending: false, nullsFirst: false })
        .limit(5);

    const { data: recentPosts } = await supabase
        .from('posts')
        .select('id, title, created_at, published_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <aside className="space-y-5">
            {/* ===== Map Widget ===== */}
            <MapWidget />

            {/* ===== Hot Issue Widget ===== */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-100/80">
                <div className="bg-gradient-to-r from-primary to-primary-light px-5 py-4 flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Flame className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-[15px] tracking-tight">많이 본 뉴스</h3>
                </div>
                <ul className="divide-y divide-slate-50">
                    {(hotPosts || []).map((post, idx) => (
                        <li key={post.id} className="group">
                            <Link
                                href={`/news/${post.id}`}
                                className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                            >
                                <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[11px] font-black transition-colors
                                    ${idx < 3
                                        ? 'bg-gradient-to-br from-primary to-primary-light text-white shadow-sm shadow-red-200'
                                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                    }`}>
                                    {idx + 1}
                                </span>
                                <span className="text-[14px] text-slate-700 leading-snug group-hover:text-primary line-clamp-2 transition-colors font-medium">
                                    {post.title}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ===== Recent News Widget ===== */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-100/80">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/15 rounded-lg">
                        <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-[15px] tracking-tight">최신 뉴스</h3>
                </div>
                <ul className="divide-y divide-slate-50">
                    {(recentPosts || []).map((post) => (
                        <li key={post.id} className="group">
                            <Link
                                href={`/news/${post.id}`}
                                className="block px-5 py-3.5 hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                            >
                                <span className="text-[14px] text-slate-700 leading-snug group-hover:text-slate-900 line-clamp-2 block font-medium transition-colors">
                                    {post.title}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-1.5 block">
                                    {new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR')}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ===== Native Ad Slot ===== */}
            <NativeAdSlot variant="card" position="sidebar-1" />

            {/* ===== Quick Links ===== */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-100/80 p-5">
                <h3 className="font-bold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    바로가기
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                    <Link
                        href="/news"
                        className="flex items-center justify-center p-3.5 bg-slate-50/80 rounded-xl hover:bg-primary hover:text-white transition-all duration-200 group border border-slate-100/50 hover:border-primary hover:shadow-lg hover:shadow-red-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <span className="text-[13px] font-semibold text-slate-700 group-hover:text-white transition-colors">전체뉴스</span>
                    </Link>
                    <Link
                        href="https://koreanewsone.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-3.5 bg-slate-50/80 rounded-xl hover:bg-primary hover:text-white transition-all duration-200 group border border-slate-100/50 hover:border-primary hover:shadow-lg hover:shadow-red-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <span className="text-[13px] font-semibold text-slate-700 group-hover:text-white transition-colors">지사방문</span>
                    </Link>
                </div>
            </div>
        </aside>
    );
}

// Skeleton component for Suspense fallback
export function SidebarSkeleton() {
    return (
        <aside className="space-y-5">
            {/* Map Widget Skeleton */}
            <MapWidgetSkeleton />

            {/* Hot News Skeleton */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-100/80">
                <div className="bg-gradient-to-r from-slate-200 to-slate-300 h-14 animate-pulse"></div>
                <div className="p-5 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-6 h-6 bg-slate-100 rounded-lg animate-pulse"></div>
                            <div className="flex-1 h-5 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent News Skeleton */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-100/80">
                <div className="bg-gradient-to-r from-slate-200 to-slate-300 h-14 animate-pulse"></div>
                <div className="p-5 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>

            {/* Ad Skeleton */}
            <div className="h-[200px] bg-slate-100 rounded-2xl animate-pulse"></div>
        </aside>
    );
}
