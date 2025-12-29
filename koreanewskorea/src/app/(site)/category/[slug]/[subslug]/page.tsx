import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';
import { CATEGORY_MAP, JEONNAM_REGION_CODES } from '@/lib/category-constants';
import CategoryHeader from '@/components/category/CategoryHeader';
import { NoImagePlaceholder } from '@/components/ui/NoImagePlaceholder';

// Jeonnam history content
const JEONNAM_HISTORY = [
    { id: 1, title: '명량해전, 이순신 장군의 기적의 승리' },
    { id: 2, title: '다산 정약용의 강진 유배 18년' },
    { id: 3, title: '판소리의 고장, 남도 소리의 뿌리' },
];

// Economy Plus content
const ECONOMY_PLUS = [
    { id: 1, title: '여수산단·광양제철, 남해안 산업벨트 현황' },
    { id: 2, title: '전남 해상풍력, 신재생에너지 허브로 도약' },
    { id: 3, title: '전남 농수산물, K-푸드 수출 최전선' },
];

export const dynamic = 'force-dynamic';

interface SubCategoryPageProps {
    params: Promise<{ slug: string; subslug: string }>;
}

// 지역별 기사 가져오기
async function getRegionNews(slug: string, regionCode: string) {
    try {
        const supabase = await createClient();

        // published: 전체 공개, limited: 제한공개 (이미지 없음)
        let query = supabase
            .from('posts')
            .select('*')
            .in('status', ['published', 'limited'])
            .order('published_at', { ascending: false })
            .limit(20);

        // 지역 필터링
        query = query.eq('region', regionCode);

        // 혹시 카테고리도 맞춰야 한다면?
        // query = query.eq('category', '전남'); // Optional validation

        const { data } = await query;
        return data || [];
    } catch {
        return [];
    }
}

// 인기 기사 가져오기 (재사용)
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

export default async function SubCategoryPage({ params }: SubCategoryPageProps) {
    const { slug, subslug } = await params;

    // 유효한 지역 코드인지 확인 (전남의 경우)
    // 만약 다른 카테고리의 서브슬러그가 생긴다면 로직 확장 필요
    const isValidRegion = JEONNAM_REGION_CODES.includes(subslug);

    // DB에서 기사 가져오기
    const news = isValidRegion
        ? await getRegionNews(slug, subslug)
        : [];

    const popularNews = await getPopularNews();

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">

            {/* Reusable Header with Active State */}
            <CategoryHeader slug={slug} currentSubSlug={subslug} />

            {/* ============================================
                [MAIN CONTENT] 2-Column Grid (9:3)
                ============================================ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: News Content (9 cols) */}
                    <div className="lg:col-span-9">

                        {/* News List */}
                        {news.length > 0 ? (
                            <div className="flex flex-col divide-y divide-slate-100">
                                {/* 첫 번째 기사 - 큰 썸네일 */}
                                {news[0] && (
                                    <Link key={news[0].id} href={`/news/${news[0].id}`} className="flex gap-6 py-5 cursor-pointer group">
                                        {news[0].thumbnail_url ? (
                                            <img
                                                src={news[0].thumbnail_url}
                                                alt={news[0].title}
                                                className="w-96 h-40 object-cover shrink-0 bg-slate-200"
                                            />
                                        ) : (
                                            <NoImagePlaceholder
                                                regionName={news[0].source}
                                                className="w-96 h-40 shrink-0"
                                            />
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
                                {news.slice(1).map((item: any) => (
                                    <Link key={item.id} href={`/news/${item.id}`} className="flex gap-4 py-4 cursor-pointer group">
                                        {item.thumbnail_url ? (
                                            <img
                                                src={item.thumbnail_url}
                                                alt={item.title}
                                                className="w-40 h-24 object-cover shrink-0 bg-slate-200"
                                            />
                                        ) : (
                                            <NoImagePlaceholder
                                                regionName={item.source}
                                                className="w-40 h-24 shrink-0"
                                            />
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
                                {isValidRegion ? (
                                    <p>'{subslug}' 지역의 등록된 기사가 없습니다.</p>
                                ) : (
                                    <p>존재하지 않는 지역이거나 기사가 없습니다.</p>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {news.length > 0 && (
                            <div className="mt-8 text-center">
                                <button className="px-16 py-3 border border-slate-300 text-slate-600 font-bold rounded hover:bg-slate-50 transition-colors">
                                    더보기
                                </button>
                            </div>
                        )}

                    </div>

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

                        {/* Widget 2: Ad Banner - Korea Polytechnic */}
                        <Link
                            href="https://ipsi.kopo.ac.kr/poly/wonseo/wonseoSearch.do?daehag_cd=3320000&gwajeong_gb=34"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block w-full aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:scale-[1.02]"
                        >
                            <Image
                                src="/images/ads/naju01.png"
                                alt="2026 Korea Polytechnic Naju Campus Admission"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 1024px) 100vw, 300px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
                        </Link>

                        {/* Widget 3: Region History */}
                        <div className="">
                            <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">전남의 역사</h4>
                            <div className="space-y-3">
                                {JEONNAM_HISTORY.map((item) => (
                                    <div key={item.id} className="flex gap-3 cursor-pointer group">
                                        <div className="w-20 h-14 bg-slate-200 shrink-0 rounded overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">{item.id}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:underline leading-snug">
                                                {item.title}
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
                                {ECONOMY_PLUS.map((item) => (
                                    <div key={item.id} className="flex gap-3 cursor-pointer group">
                                        <div className="w-20 h-14 bg-slate-200 shrink-0 rounded overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">{item.id}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:underline leading-snug">
                                                {item.title}
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
