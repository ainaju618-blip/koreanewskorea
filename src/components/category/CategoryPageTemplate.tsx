import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { getCategoryByCode } from '@/constants/categories';
import CategoryHeader from '@/components/category/CategoryHeader';
import Pagination from '@/components/ui/Pagination';
import { formatDate } from '@/lib/dateUtils';
import type { NewsItem } from '@/types/news';

export const dynamic = 'force-dynamic';

// 카테고리별 기사 응답 타입
interface CategoryNewsResponse {
    data: NewsItem[];
    totalCount: number;
}

// 인기 기사 타입 (간소화)
interface PopularNewsItem {
    id: string;
    title: string;
}

// 카테고리별 기사 가져오기
async function getCategoryNews(categoryCode: string, page: number = 1): Promise<CategoryNewsResponse> {
    try {
        const supabase = await createClient();
        const limit = 20;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const category = getCategoryByCode(categoryCode);
        const categoryName = category?.name || categoryCode;

        const { data, count, error } = await supabase
            .from('posts')
            .select('*', { count: 'exact' })
            .eq('status', 'published')
            .or(`category.eq.${categoryName},category.eq.${categoryCode}`)
            .order('published_at', { ascending: false })
            .range(start, end);

        if (error) {
            console.error('[getCategoryNews] Supabase error:', error.message);
            return { data: [], totalCount: 0 };
        }

        return { data: (data as NewsItem[]) || [], totalCount: count || 0 };
    } catch (error) {
        console.error('[getCategoryNews] Error:', error);
        return { data: [], totalCount: 0 };
    }
}

// 인기 기사 가져오기
async function getPopularNews(): Promise<PopularNewsItem[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('posts')
            .select('id, title')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('[getPopularNews] Supabase error:', error.message);
            return [];
        }

        return (data as PopularNewsItem[]) || [];
    } catch (error) {
        console.error('[getPopularNews] Error:', error);
        return [];
    }
}

interface CategoryPageTemplateProps {
    categoryCode: string;
    searchParams?: { page?: string };
}

export default async function CategoryPageTemplate({
    categoryCode,
    searchParams
}: CategoryPageTemplateProps) {
    const currentPage = parseInt(searchParams?.page || '1');
    const category = getCategoryByCode(categoryCode);

    // DB에서 데이터 가져오기
    const { data: news, totalCount } = await getCategoryNews(categoryCode, currentPage);
    const popularNews = await getPopularNews();
    const totalPages = Math.ceil(totalCount / 20);

    // 카테고리가 없는 경우
    if (!category) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">카테고리를 찾을 수 없습니다</h1>
                    <p className="text-slate-500 mb-6">요청하신 카테고리 &apos;{categoryCode}&apos;가 존재하지 않습니다.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <CategoryHeader slug={categoryCode} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: 기사 목록 (9칸) */}
                    <div className="lg:col-span-9">
                        {news.length > 0 ? (
                            <div className="flex flex-col divide-y divide-slate-100">
                                {/* 첫 번째 기사 - 큰 썸네일 (1페이지일 때만) */}
                                {currentPage === 1 && news[0] && (
                                    <Link key={news[0].id} href={`/news/${news[0].id}`} className="flex gap-6 py-5 cursor-pointer group">
                                        {news[0].thumbnail_url ? (
                                            <div className="relative w-96 h-40 shrink-0 bg-slate-200">
                                                <Image
                                                    src={news[0].thumbnail_url}
                                                    alt={news[0].title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 384px"
                                                    className="object-cover"
                                                    priority
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-96 h-40 bg-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                                                No Image
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col justify-start">
                                            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:underline line-clamp-2 leading-snug">
                                                {news[0].title}
                                            </h2>
                                            <p className="text-sm text-slate-500 line-clamp-3 mb-2 leading-relaxed">
                                                {news[0].ai_summary || news[0].content?.substring(0, 200)}
                                            </p>
                                            <span className="text-xs text-slate-400">
                                                {news[0].published_at ? formatDate(news[0].published_at) : ''}
                                            </span>
                                        </div>
                                    </Link>
                                )}
                                {/* 나머지 기사 목록 */}
                                {(currentPage === 1 ? news.slice(1) : news).map((item: NewsItem) => (
                                    <Link
                                        key={item.id}
                                        href={`/news/${item.id}`}
                                        className="flex gap-4 py-4 cursor-pointer group"
                                    >
                                        {item.thumbnail_url ? (
                                            <div className="relative w-40 h-24 shrink-0 bg-slate-200">
                                                <Image
                                                    src={item.thumbnail_url}
                                                    alt={item.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 160px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-40 h-24 bg-slate-200 shrink-0 flex items-center justify-center text-slate-400 text-xs">
                                                No Image
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col justify-start">
                                            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:underline line-clamp-2 leading-snug">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-1.5 leading-relaxed">
                                                {item.ai_summary || item.content?.substring(0, 100)}
                                            </p>
                                            <span className="text-xs text-slate-400">
                                                {item.published_at ? formatDate(item.published_at) : ''}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center text-slate-400">
                                등록된 기사가 없습니다.
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="mt-8">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                basePath={`/category/${categoryCode}`}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: 사이드바 (3칸) */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* 많이 본 뉴스 */}
                        <div className="bg-slate-50 p-4">
                            <h3 className="font-bold text-base mb-3 pb-2 border-b border-slate-300">
                                가장 많이 본 뉴스
                            </h3>
                            <div className="space-y-2.5">
                                {popularNews.length > 0 ? (
                                    popularNews.map((item: PopularNewsItem, idx: number) => (
                                        <Link
                                            key={item.id}
                                            href={`/news/${item.id}`}
                                            className="flex gap-2.5 cursor-pointer group"
                                        >
                                            <span className="font-black text-red-600 text-base w-4">
                                                {idx + 1}
                                            </span>
                                            <p className="text-sm text-slate-700 line-clamp-2 group-hover:underline leading-snug">
                                                {item.title}
                                            </p>
                                        </Link>
                                    ))
                                ) : (
                                    [1, 2, 3, 4, 5].map((n) => (
                                        <div key={n} className="flex gap-2.5">
                                            <span className="font-black text-red-600 text-base w-4">{n}</span>
                                            <p className="text-sm text-slate-400">인기 뉴스 제목 {n}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 배너 광고 */}
                        <div className="w-full aspect-[4/3] bg-slate-200 flex items-center justify-center text-slate-400 border border-slate-200 rounded">
                            <span className="text-sm">광고 배너</span>
                        </div>

                        {/* 최신 뉴스 위젯 */}
                        <div>
                            <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">
                                최신 뉴스
                            </h4>
                            <div className="space-y-3">
                                {news.slice(0, 3).map((item: NewsItem) => (
                                    <Link
                                        key={item.id}
                                        href={`/news/${item.id}`}
                                        className="flex gap-3 cursor-pointer group"
                                    >
                                        <div className="relative w-20 h-14 bg-slate-200 shrink-0 rounded overflow-hidden">
                                            {item.thumbnail_url && (
                                                <Image
                                                    src={item.thumbnail_url}
                                                    alt={item.title}
                                                    fill
                                                    sizes="80px"
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:underline leading-snug">
                                            {item.title}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
