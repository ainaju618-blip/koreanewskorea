'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { BadgeCheck, Clock, FileEdit, AlertCircle, Plus, Search } from 'lucide-react';

export default function MyArticlesPage() {
    const [articles, setArticles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMyArticles();
    }, []);

    const fetchMyArticles = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('author_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setArticles(data);
        }
        setIsLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return <span className="flex items-center gap-1 text-green-400 bg-green-500/20 px-2 py-1 rounded text-xs font-bold"><BadgeCheck className="w-3 h-3" /> 발행완료</span>;
            case 'review': return <span className="flex items-center gap-1 text-amber-400 bg-amber-500/20 px-2 py-1 rounded text-xs font-bold"><Clock className="w-3 h-3" /> 승인대기</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-red-400 bg-red-500/20 px-2 py-1 rounded text-xs font-bold"><AlertCircle className="w-3 h-3" /> 반려됨</span>;
            default: return <span className="flex items-center gap-1 text-[#8b949e] bg-[#21262d] px-2 py-1 rounded text-xs font-bold"><FileEdit className="w-3 h-3" /> 작성중</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-[#e6edf3]">내 기사 관리</h2>
                    <p className="text-[#8b949e]">내가 작성한 기사의 진행 상황을 확인하세요.</p>
                </div>
                <Link href="/admin/news/write" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-900/30 transition-all">
                    <Plus className="w-4 h-4" />
                    기사 쓰기
                </Link>
            </div>

            <div className="bg-[#161b22] rounded-xl border border-[#30363d] shadow-sm overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-[#30363d] flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
                        <input type="text" placeholder="제목 검색..." className="w-full pl-9 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-[#8b949e]">로딩 중...</div>
                ) : articles.length === 0 ? (
                    <div className="p-20 text-center">
                        <p className="text-[#8b949e] mb-4">작성한 기사가 없습니다.</p>
                        <Link href="/admin/news/write" className="text-blue-400 font-bold hover:underline">첫 기사를 작성해보세요!</Link>
                    </div>
                ) : (
                    <div className="divide-y divide-[#30363d]">
                        {articles.map((article) => (
                            <div key={article.id} className="p-5 hover:bg-[#21262d] transition-colors flex items-center justify-between group">
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {getStatusBadge(article.status)}
                                        <span className="text-xs text-[#8b949e]">{new Date(article.created_at).toLocaleString()}</span>
                                        <span className="text-xs text-[#484f58]">|</span>
                                        <span className="text-xs text-[#c9d1d9] font-medium">{article.category || '미지정'}</span>
                                    </div>
                                    {/* Title clickable: published -> homepage, unpublished -> original source */}
                                    {article.status === 'published' ? (
                                        <a
                                            href={`/news/${article.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-base font-bold text-[#e6edf3] truncate hover:text-blue-400 transition-colors block"
                                            title="게시된 기사 보기"
                                        >
                                            {article.title}
                                        </a>
                                    ) : article.original_url ? (
                                        <a
                                            href={article.original_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-base font-bold text-[#e6edf3] truncate hover:text-blue-400 transition-colors block"
                                            title="원본 기사 보기"
                                        >
                                            {article.title}
                                        </a>
                                    ) : (
                                        <h3 className="text-base font-bold text-[#e6edf3] truncate group-hover:text-blue-400 transition-colors">
                                            {article.title}
                                        </h3>
                                    )}
                                </div>
                                <div>
                                    <Link href={`/admin/news/edit/${article.id}`} className="px-3 py-1.5 border border-[#30363d] text-[#c9d1d9] rounded text-xs font-bold hover:bg-[#21262d] hover:border-blue-500 hover:text-blue-400 transition-all">
                                        관리
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
