import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { JEONNAM_REGION_CODES, JEONNAM_REGION_MAP } from '@/lib/category-constants';
import CategoryHeader from '@/components/category/CategoryHeader';
import Pagination from '@/components/ui/Pagination';

export const dynamic = 'force-dynamic';

// 역매핑: 영문 코드 -> 한글명
const REGION_CODE_TO_NAME: Record<string, string> = {};
Object.entries(JEONNAM_REGION_MAP).forEach(([name, code]) => {
    REGION_CODE_TO_NAME[code] = name;
});

// 전남 시군 목록 (전체 포함)
const JEONNAM_REGIONS = [
    { code: 'all', name: '전체' },
    { code: 'naju', name: '나주시' },
    { code: 'mokpo', name: '목포시' },
    { code: 'suncheon', name: '순천시' },
    { code: 'yeosu', name: '여수시' },
    { code: 'gwangyang', name: '광양시' },
    { code: 'damyang', name: '담양군' },
    { code: 'gokseong', name: '곡성군' },
    { code: 'gurye', name: '구례군' },
    { code: 'goheung', name: '고흥군' },
    { code: 'boseong', name: '보성군' },
    { code: 'hwasun', name: '화순군' },
    { code: 'jangheung', name: '장흥군' },
    { code: 'gangjin', name: '강진군' },
    { code: 'haenam', name: '해남군' },
    { code: 'yeongam', name: '영암군' },
    { code: 'muan', name: '무안군' },
    { code: 'hampyeong', name: '함평군' },
    { code: 'yeonggwang', name: '영광군' },
    { code: 'jangseong', name: '장성군' },
    { code: 'wando', name: '완도군' },
    { code: 'jindo', name: '진도군' },
    { code: 'shinan', name: '신안군' },
];

// 기사 가져오기
async function getRegionNews(region: string, page: number = 1) {
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

        if (region === 'all') {
            // 전체: 모든 전남 시군 기사
            query = query.in('region', JEONNAM_REGION_CODES);
        } else {
            // 특정 시군
            query = query.eq('region', region);
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

interface PageProps {
    searchParams: Promise<{ region?: string; page?: string }>;
}

export default async function JeonnamRegionPage({ searchParams }: PageProps) {
    const { region = 'all', page } = await searchParams;
    const currentPage = parseInt(page || '1');

    const { data: news, totalCount } = await getRegionNews(region, currentPage);
    const popularNews = await getPopularNews();
    const totalPages = Math.ceil(totalCount / 20);

    const currentRegion = JEONNAM_REGIONS.find(r => r.code === region) || JEONNAM_REGIONS[0];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <CategoryHeader slug="jeonnam-region" />

            {/* Main Content - 9:3 그리드 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: 기사 목록 (9칸) */}
                    <div className="lg:col-span-9">
                        {/* 현재 선택된 지역 표시 */}
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                📰 {currentRegion.name} 최신 기사
                            </h2>
                            <span className="text-sm text-slate-500">
                                총 {totalCount}건
                            </span>
                        </div>

                        {/* 기사 목록 */}
                        {news.length > 0 ? (
                            <div className="flex flex-col divide-y divide-slate-100">
                                {/* 첫 번째 기사 - 큰 썸네일 (1페이지일 때만) */}
                                {currentPage === 1 && news[0] && (
                                    <Link key={news[0].id} href={`/news/${news[0].id}`} className="flex gap-6 py-5 cursor-pointer group">
                                        {news[0].thumbnail_url ? (
                                            <img
                                                src={news[0].thumbnail_url}
                                                alt={news[0].title}
                                                className="w-96 h-40 object-cover shrink-0 bg-slate-200"
                                            />
                                        ) : (
                                            <div className="w-96 h-40 bg-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                                                No Image
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col justify-start">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                    {REGION_CODE_TO_NAME[news[0].region] || news[0].region}
                                                </span>
                                            </div>
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
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                    {REGION_CODE_TO_NAME[item.region] || item.region}
                                                </span>
                                            </div>
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
                                basePath={`/category/jeonnam-region?region=${region}`}
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
                                    popularNews.map((item: any, idx: number) => (
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
                                전남 최신 뉴스
                            </h4>
                            <div className="space-y-3">
                                {news.slice(0, 3).map((item: any) => (
                                    <Link
                                        key={item.id}
                                        href={`/news/${item.id}`}
                                        className="flex gap-3 cursor-pointer group"
                                    >
                                        <div className="w-20 h-14 bg-slate-200 shrink-0 rounded overflow-hidden">
                                            {item.thumbnail_url && (
                                                <img
                                                    src={item.thumbnail_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
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
