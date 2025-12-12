import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { CATEGORY_MAP, JEONNAM_REGION_CODES } from '@/lib/category-constants';
import CategoryHeader from '@/components/category/CategoryHeader';
import Pagination from '@/components/ui/Pagination';

export const dynamic = 'force-dynamic';

// 카테고리별 기사 가져오기
async function getCategoryNews(slug: string, categoryName: string, page: number = 1) {
    try {
        const supabase = await createClient();
        const limit = 20;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let query = supabase
            .from('posts')
            .select('*', { count: 'exact' })
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .range(start, end);

        // 전남인 경우: 모든 전남 시군의 기사를 가져옴 (전남은 별도 로직 유지)
        if (slug === 'jeonnam') {
            // region이 전남 시군 코드 중 하나이거나, category가 '전남'인 기사
            query = query.or(`region.in.(${JEONNAM_REGION_CODES.join(',')}),category.eq.전남`);
        }
        // 그 외 모든 카테고리 (광주 방식 적용)
        // 카테고리명으로 찾거나, URL slug와 일치하는 region으로 찾음 (예: category='광주' OR region='gwangju')
        else {
            query = query.or(`category.eq.${categoryName},region.eq.${slug}`);
        }

        const { data, count } = await query;
        return { data: data || [], totalCount: count || 0 };
    } catch {
        return { data: [], totalCount: 0 };
    }
}

// 인기 기사 가져오기
async function getPopularNews() {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('posts')
            .select('id, title')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(5);
        return data || [];
    } catch {
        return [];
    }
}

// 날짜 포맷
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
}

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const { page } = await searchParams;
    const currentPage = parseInt(page || '1');
    const categoryInfo = CATEGORY_MAP[slug] || { name: slug.toUpperCase(), subMenus: ['전체'], dbCategory: slug };

    // DB에서 기사 가져오기
    const { data: news, totalCount } = await getCategoryNews(slug, categoryInfo.dbCategory || categoryInfo.name, currentPage);
    const popularNews = await getPopularNews();

    // 페이지 수 계산
    const totalPages = Math.ceil(totalCount / 20);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* ... Header ... */}
            <CategoryHeader slug={slug} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-9">
                        <div className="flex flex-col divide-y divide-slate-100">
                            {news.length > 0 ? (
                                news.map((item: any) => (
                                    <Link key={item.id} href={`/news/${item.id}`} className="flex gap-4 py-4 cursor-pointer group">
                                        {/* ... (Article rendering logic remains same) ... */}
                                        {item.thumbnail_url ? (
                                            <img
                                                src={item.thumbnail_url}
                                                alt={item.title}
                                                className="w-40 h-24 object-cover shrink-0 bg-slate-200"
                                            />
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
                                ))
                            ) : (
                                <div className="py-10 text-center text-slate-400">
                                    등록된 기사가 없습니다.
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="mt-8">
                            <Pagination currentPage={currentPage} totalPages={totalPages} />
                        </div>
                    </div>
                    {/* ... Right Column logic is below but we only replace up to here */}

                    {/* RIGHT COLUMN: Sidebar (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Widget 1: Most Viewed */}
                        <div className="bg-slate-50 p-4">
                            <h3 className="font-bold text-base mb-3 pb-2 border-b border-slate-300">가장 많이 본 뉴스</h3>
                            <div className="space-y-2.5">
                                {popularNews.length > 0 ? (
                                    popularNews.map((item: any, idx: number) => (
                                        <Link key={item.id} href={`/news/${item.id}`} className="flex gap-2.5 cursor-pointer group">
                                            <span className="font-black text-red-600 text-base w-4">{idx + 1}</span>
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
                            <div className="mt-3 text-right">
                                <Link href="#" className="text-xs text-slate-500 hover:underline">더보기</Link>
                            </div>
                        </div>

                        {/* Widget 2: Banner / Ad (Image) */}
                        <div className="w-full aspect-[4/3] bg-slate-200 flex items-center justify-center text-slate-400 border border-slate-200">
                            <span className="text-sm">이미지 배너</span>
                        </div>

                        {/* Widget 3: 전남의 역사 */}
                        <div className="">
                            <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">전남의 역사</h4>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3 cursor-pointer group">
                                        <div className="w-20 h-14 bg-slate-200 shrink-0"></div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:underline leading-snug">
                                                [역사 기획 {i}] 전남의 역사 기사 제목이 들어갑니다
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Widget 4: 이코노미 플러스 */}
                        <div className="">
                            <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">이코노미 플러스</h4>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3 cursor-pointer group">
                                        <div className="w-20 h-14 bg-slate-200 shrink-0"></div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:underline leading-snug">
                                                [경제 특집 {i}] 이코노미 플러스 제목입니다
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}

