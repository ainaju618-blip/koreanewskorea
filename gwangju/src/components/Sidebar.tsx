// src/components/Sidebar.tsx
// Server Component - Korea NEWS Gwangju Unique Sidebar

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Flame, Clock, ExternalLink, Building2, TrendingUp } from 'lucide-react';

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
 * Korea NEWS Gwangju - Unique Sidebar
 * ===================================
 * Design Philosophy:
 *   - Korea Red accent on headers
 *   - Clean, compact widget style
 *   - Regional quick links
 *   - Newspaper-inspired number badges
 */
export default async function Sidebar() {
    // Fetch hot posts (Gwangju only)
    const { data: hotPosts } = await supabase
        .from('posts')
        .select('id, title, created_at, view_count')
        .eq('status', 'published')
        .or('category.eq.광주,region.eq.gwangju')
        .order('view_count', { ascending: false, nullsFirst: false })
        .limit(5);

    // Fetch recent posts (Gwangju only)
    const { data: recentPosts } = await supabase
        .from('posts')
        .select('id, title, created_at, published_at')
        .eq('status', 'published')
        .or('category.eq.광주,region.eq.gwangju')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <aside className="space-y-6">
            {/* ===== Hot News Widget ===== */}
            <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="relative bg-slate-900 px-4 py-3 flex items-center gap-2">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-white text-sm">인기 뉴스</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                    {(hotPosts || []).map((post, idx) => (
                        <li key={post.id}>
                            <Link
                                href={`/news/${post.id}`}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                            >
                                <span
                                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold ${
                                        idx < 3
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {idx + 1}
                                </span>
                                <span className="text-sm text-slate-700 leading-snug group-hover:text-primary line-clamp-2 transition-colors">
                                    {post.title}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ===== Recent News Widget ===== */}
            <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="relative bg-slate-800 px-4 py-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <h3 className="font-bold text-white text-sm">최신 뉴스</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                    {(recentPosts || []).map((post) => (
                        <li key={post.id}>
                            <Link
                                href={`/news/${post.id}`}
                                className="block px-4 py-3 hover:bg-slate-50 transition-colors group"
                            >
                                <span className="text-sm text-slate-700 leading-snug group-hover:text-primary line-clamp-2 block transition-colors">
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

            {/* ===== Quick Links ===== */}
            <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="relative bg-primary px-4 py-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-white" />
                    <h3 className="font-bold text-white text-sm">바로가기</h3>
                </div>
                <div className="p-4 space-y-2">
                    <a
                        href="https://www.gwangju.go.kr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all group"
                    >
                        <span className="text-sm font-medium">광주광역시청</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    </a>
                    <a
                        href="https://council.gwangju.go.kr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all group"
                    >
                        <span className="text-sm font-medium">광주광역시의회</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    </a>
                    <a
                        href="https://www.koreanewsone.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 bg-primary/5 border border-primary/20 hover:bg-primary hover:text-white hover:border-primary transition-all group"
                    >
                        <span className="text-sm font-medium text-primary group-hover:text-white">코리아NEWS 본사</span>
                        <ExternalLink className="w-3.5 h-3.5 text-primary opacity-50 group-hover:text-white group-hover:opacity-100" />
                    </a>
                </div>
            </div>

            {/* ===== Contact Info ===== */}
            <div className="bg-slate-900 text-white p-5 text-center">
                <p
                    className="text-lg font-bold mb-1"
                    style={{ fontFamily: 'ChosunilboMyungjo, serif' }}
                >
                    코리아NEWS 광주
                </p>
                <p className="text-xs text-slate-400 mb-3">빛고을 광주, 시민과 함께하는 뉴스</p>
                <a
                    href="tel:010-2631-3865"
                    className="inline-block text-sm text-primary hover:underline"
                >
                    010-2631-3865
                </a>
            </div>
        </aside>
    );
}

// Skeleton component for Suspense fallback
export function SidebarSkeleton() {
    return (
        <aside className="space-y-6">
            <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 h-11" />
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-6 h-6 bg-slate-100 animate-pulse" />
                            <div className="flex-1 h-5 bg-slate-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 h-11" />
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
                    ))}
                </div>
            </div>
            <div className="h-32 bg-slate-900 animate-pulse" />
        </aside>
    );
}
