import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import Pagination from '@/components/ui/Pagination';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { Metadata } from 'next';
import { Search } from 'lucide-react';

// ISR: 60초마다 재생성
export const revalidate = 60;

// SEO 메타데이터
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
    const params = await searchParams;
    const query = params.q || '';

    return {
        title: query ? `"${query}" 검색 결과 | 코리아NEWS` : '검색 | 코리아NEWS',
        description: query
            ? `코리아NEWS에서 "${query}" 관련 기사를 검색한 결과입니다. 광주·전남 지역 뉴스를 확인하세요.`
            : '코리아NEWS 기사 검색 - 광주·전남 지역 뉴스를 검색하세요.',
        robots: {
            index: true,
            follow: true,
        },
    };
}

// Extract first image URL from content (fallback when thumbnail_url is null)
function extractFirstImageUrl(content: string | null | undefined): string | null {
    if (!content) return null;
    const imagePattern = /\[이미지[^\]]*\]:\s*(https?:\/\/[^\s\n]+)/;
    const match = content.match(imagePattern);
    return match ? match[1] : null;
}

// Get thumbnail URL with fallback to content image
function getThumbnailUrl(item: { thumbnail_url?: string | null; content?: string | null }): string | null {
    return item.thumbnail_url || extractFirstImageUrl(item.content);
}

// 검색 기사 가져오기
async function searchNews(query: string, page: number = 1) {
    if (!query.trim()) {
        return { data: [], totalCount: 0 };
    }

    try {
        const supabase = await createClient();
        const limit = 20;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        // 태그, 제목, 본문에서 검색
        const searchQuery = `%${query}%`;

        const { data, count } = await supabase
            .from('posts')
            .select('id, title, content, ai_summary, thumbnail_url, published_at, tags, category', { count: 'exact' })
            .eq('status', 'published')
            .or(`title.ilike.${searchQuery},content.ilike.${searchQuery},tags.cs.{"${query}"}`)
            .order('published_at', { ascending: false })
            .range(start, end);

        return { data: data || [], totalCount: count || 0 };
    } catch {
        return { data: [], totalCount: 0 };
    }
}

// 날짜 포맷
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
}

interface SearchPageProps {
    searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || '';
    const currentPage = parseInt(params.page || '1');

    const { data: news, totalCount } = await searchNews(query, currentPage);
    const totalPages = Math.ceil(totalCount / 20);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-slate-900 dark:text-white font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Search className="w-8 h-8" />
                        <h1 className="text-2xl font-bold">검색 결과</h1>
                    </div>
                    {query && (
                        <p className="text-blue-100">
                            <span className="font-bold text-white">&quot;{query}&quot;</span> 검색 결과 {totalCount.toLocaleString()}건
                        </p>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* 검색어 없을 때 */}
                {!query && (
                    <div className="py-20 text-center">
                        <Search className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">검색어를 입력하세요.</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                            기사 하단의 태그를 클릭하면 관련 기사를 검색할 수 있습니다.
                        </p>
                    </div>
                )}

                {/* 검색 결과 있을 때 */}
                {query && news.length > 0 && (
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                        {news.map((item: any) => (
                            <Link key={item.id} href={`/news/${item.id}`} className="flex gap-4 py-4 cursor-pointer group">
                                <OptimizedImage
                                    src={getThumbnailUrl(item)}
                                    alt={item.title}
                                    width={160}
                                    height={96}
                                    className="w-40 h-24 object-cover shrink-0 bg-slate-200 dark:bg-slate-700 rounded"
                                />
                                <div className="flex-1 flex flex-col justify-start">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{item.category}</span>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:underline line-clamp-2 leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-1.5 leading-relaxed">
                                        {item.ai_summary || item.content?.substring(0, 100)}
                                    </p>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                        {item.published_at ? formatDate(item.published_at) : ''}
                                    </span>
                                    {/* 태그 표시 */}
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {item.tags.slice(0, 3).map((tag: string, i: number) => (
                                                <span
                                                    key={i}
                                                    className={`text-xs px-2 py-0.5 rounded-full ${tag === query
                                                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                                        }`}
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* 검색 결과 없을 때 */}
                {query && news.length === 0 && (
                    <div className="py-20 text-center">
                        <Search className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            <span className="font-bold">&quot;{query}&quot;</span>에 대한 검색 결과가 없습니다.
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                            다른 검색어로 다시 시도해 보세요.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
