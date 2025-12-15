// src/components/Sidebar.tsx
// Server Component 버전 - 클라이언트 사이드 데이터 fetching을 서버로 이동

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, Calendar, MapPin, Video } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Post {
    id: string;
    title: string;
    created_at: string;
    view_count?: number;
}

/**
 * Korea NEWS Sidebar (Server Component)
 * =====================================
 * - Red accent (#A6121D)
 * - Clean bordered sections
 * - Numbered ranking list
 */
export default async function Sidebar() {
    // 서버에서 직접 데이터 조회
    const { data: hotPosts } = await supabase
        .from('posts')
        .select('id, title, created_at, view_count')
        .in('status', ['approved', 'published'])
        .order('view_count', { ascending: false, nullsFirst: false })
        .limit(5);

    const { data: recentPosts } = await supabase
        .from('posts')
        .select('id, title, created_at')
        .in('status', ['approved', 'published'])
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <aside className="space-y-6">
            {/* ===== Hot Issue Widget ===== */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <div className="bg-[#A6121D] px-4 py-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                    <h3 className="font-bold text-white text-[15px]">많이 본 뉴스</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                    {(hotPosts || []).map((post, idx) => (
                        <li key={post.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                            <Link href={`/news/${post.id}`} className="flex items-start gap-3 group">
                                <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-sm text-xs font-black
                                    ${idx < 3 ? 'bg-[#A6121D] text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {idx + 1}
                                </span>
                                <span className="text-[14px] text-slate-800 leading-snug group-hover:text-[#A6121D] line-clamp-1">
                                    {post.title}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ===== Recent News Widget ===== */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white" />
                    <h3 className="font-bold text-white text-[15px]">최신 뉴스</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                    {(recentPosts || []).map((post) => (
                        <li key={post.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                            <Link href={`/news/${post.id}`} className="group">
                                <span className="text-[14px] text-slate-800 leading-snug group-hover:text-[#A6121D] line-clamp-1 block">
                                    {post.title}
                                </span>
                                <span className="text-xs text-slate-400 mt-1 block">
                                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ===== Quick Links ===== */}
            <div className="bg-white border border-slate-200 rounded-sm p-4">
                <h3 className="font-bold text-slate-900 text-[15px] mb-3 pb-2 border-b border-slate-100">
                    바로가기
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <Link href="/map" className="flex items-center gap-2 p-3 bg-slate-50 rounded hover:bg-[#A6121D] hover:text-white transition-colors group">
                        <MapPin className="w-4 h-4 text-[#A6121D] group-hover:text-white" />
                        <span className="text-sm font-medium">남도 다이소</span>
                    </Link>
                    <Link href="/news/network" className="flex items-center gap-2 p-3 bg-slate-50 rounded hover:bg-[#A6121D] hover:text-white transition-colors group">
                        <Video className="w-4 h-4 text-[#A6121D] group-hover:text-white" />
                        <span className="text-sm font-medium">뉴스TV</span>
                    </Link>
                </div>
            </div>

            {/* ===== Ad Slot ===== */}
            <div className="bg-slate-50 border border-slate-200 rounded-sm h-[250px] flex flex-col items-center justify-center text-slate-400">
                <span className="font-bold text-sm mb-1">광고 문의</span>
                <span className="text-xs">010-2631-3865</span>
            </div>
        </aside>
    );
}

// Skeleton 컴포넌트 (Suspense fallback용)
export function SidebarSkeleton() {
    return (
        <aside className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <div className="bg-slate-200 h-10 animate-pulse"></div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-6 bg-slate-100 animate-pulse rounded"></div>
                    ))}
                </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <div className="bg-slate-200 h-10 animate-pulse"></div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-6 bg-slate-100 animate-pulse rounded"></div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
