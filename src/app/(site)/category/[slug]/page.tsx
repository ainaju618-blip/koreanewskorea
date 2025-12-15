import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { CATEGORY_MAP, JEONNAM_REGION_CODES } from '@/lib/category-constants';
import CategoryHeader from '@/components/category/CategoryHeader';
import Pagination from '@/components/ui/Pagination';
import OptimizedImage from '@/components/ui/OptimizedImage';

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

        // 전남지역(시군 전체)인 경우: 모든 전남 시군의 기사를 가져옴
        if (slug === 'jeonnam-region') {
            // region이 전남 시군 코드 중 하나인 기사 (전라남도청 제외)
            query = query.in('region', JEONNAM_REGION_CODES);
        }
        // 전라남도인 경우: 전라남도청 보도자료만
        else if (slug === 'jeonnam') {
            // region이 'jeonnam'이거나, source가 '전라남도'인 기사
            query = query.or(`region.eq.jeonnam,source.eq.전라남도`);
        }
        // 광주교육청: source 필드로 필터링
        else if (slug === 'kedu') {
            query = query.or(`source.eq.광주시교육청,source.eq.광주광역시교육청,source.eq.광주교육청`);
        }
        // 전남교육청: source 필드로 필터링
        else if (slug === 'jedu') {
            query = query.or(`source.eq.전남교육청,source.eq.전라남도교육청`);
        }
        // 광주광역시: 교육청 관련 기사 모두 제외 (source + region)
        else if (slug === 'gwangju') {
            query = query
                .or(`category.eq.${categoryName},region.eq.${slug}`)
                .not('source', 'in', '(광주시교육청,광주광역시교육청,광주교육청)')
                .not('region', 'eq', 'gwangju_edu');
        }
        // 그 외 모든 카테고리
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
                        {news.length > 0 ? (
                            <div className="flex flex-col divide-y divide-slate-100">
                                {/* 첫 번째 기사 - 큰 썸네일 (1페이지일 때만) */}
                                {currentPage === 1 && news[0] && (
                                    <Link key={news[0].id} href={`/news/${news[0].id}`} className="flex gap-6 py-5 cursor-pointer group">
                                        <OptimizedImage
                                            src={news[0].thumbnail_url}
                                            alt={news[0].title}
                                            width={384}
                                            height={160}
                                            className="w-96 h-40 object-cover shrink-0 bg-slate-200"
                                            priority={true}
                                        />
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
                                {(currentPage === 1 ? news.slice(1) : news).map((item: any) => (
                                    <Link key={item.id} href={`/news/${item.id}`} className="flex gap-4 py-4 cursor-pointer group">
                                        <OptimizedImage
                                            src={item.thumbnail_url}
                                            alt={item.title}
                                            width={160}
                                            height={96}
                                            className="w-40 h-24 object-cover shrink-0 bg-slate-200"
                                        />
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

