import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { CATEGORY_MAP, JEONNAM_REGION_CODES } from '@/lib/category-constants';
import CategoryHeader from '@/components/category/CategoryHeader';
import Pagination from '@/components/ui/Pagination';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getSiteConfig, isValidRegion, VALID_REGIONS, SITE_CONFIGS, RegionId } from '@/config/site-regions';

// Jeonnam history content (default for all regional sites)
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

// ISR: 60s revalidation
export const revalidate = 60;

// Extract first image URL from content
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

// Get category news
async function getCategoryNews(slug: string, categoryName: string, page: number = 1) {
    try {
        const supabase = await createClient();
        const limit = 20;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let query = supabase
            .from('posts')
            .select('id, title, content, ai_summary, thumbnail_url, published_at', { count: 'exact' })
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .range(start, end);

        if (slug === 'jeonnam-region') {
            query = query.in('region', JEONNAM_REGION_CODES);
        } else if (slug === 'jeonnam') {
            query = query.or(`region.eq.jeonnam,source.eq.전라남도`);
        } else if (slug === 'kedu') {
            query = query.or(`source.eq.광주시교육청,source.eq.광주광역시교육청,source.eq.광주교육청`);
        } else if (slug === 'jedu') {
            query = query.or(`source.eq.전남교육청,source.eq.전라남도교육청`);
        } else if (slug === 'gwangju') {
            query = query
                .or(`category.eq.${categoryName},region.eq.${slug}`)
                .not('source', 'in', '(광주시교육청,광주광역시교육청,광주교육청)')
                .not('region', 'eq', 'gwangju_edu');
        } else if (VALID_REGIONS.includes(slug as RegionId)) {
            // Handle regional site category pages (mokpo, yeosu, suncheon, etc.)
            const siteConfig = SITE_CONFIGS[slug as RegionId];
            const regionSlugs = siteConfig.regions.primary.slugs;
            const regionNames = siteConfig.regions.primary.names;

            // Build OR condition for all primary regions
            const orConditions = [
                ...regionSlugs.map(s => `region.eq.${s}`),
                ...regionNames.map(n => `category.eq.${n}`),
            ].join(',');

            query = query.or(orConditions);
        } else {
            query = query.or(`category.eq.${categoryName},region.eq.${slug}`);
        }

        const { data, count } = await query;
        return { data: data || [], totalCount: count || 0 };
    } catch {
        return { data: [], totalCount: 0 };
    }
}

// Get popular news
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

// Format date
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
}

interface CategoryPageProps {
    params: Promise<{ region: string; slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
    const { region, slug } = await params;
    const config = getSiteConfig(region);
    const categoryInfo = CATEGORY_MAP[slug] || { name: slug.toUpperCase() };

    return {
        title: `${categoryInfo.name} | ${config.name} | 코리아NEWS`,
        description: `${config.name} ${categoryInfo.name} 뉴스`,
    };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { region, slug } = await params;
    const { page } = await searchParams;

    if (!isValidRegion(region)) {
        notFound();
    }

    const currentPage = parseInt(page || '1');
    const categoryInfo = CATEGORY_MAP[slug] || { name: slug.toUpperCase(), subMenus: ['전체'], dbCategory: slug };
    const config = getSiteConfig(region);

    // Get articles from DB
    const { data: news, totalCount } = await getCategoryNews(slug, categoryInfo.dbCategory || categoryInfo.name, currentPage);
    const popularNews = await getPopularNews();

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / 20);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <CategoryHeader slug={slug} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-9">
                        {news.length > 0 ? (
                            <div className="flex flex-col divide-y divide-slate-100">
                                {/* First article - large thumbnail (page 1 only) */}
                                {currentPage === 1 && news[0] && (
                                    <Link key={news[0].id} href={`/${region}/news/${news[0].id}`} className="flex gap-6 py-5 cursor-pointer group">
                                        <OptimizedImage
                                            src={getThumbnailUrl(news[0])}
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
                                {/* Remaining articles */}
                                {(currentPage === 1 ? news.slice(1) : news).map((item: any) => (
                                    <Link key={item.id} href={`/${region}/news/${item.id}`} className="flex gap-4 py-4 cursor-pointer group">
                                        <OptimizedImage
                                            src={getThumbnailUrl(item)}
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

                    {/* RIGHT COLUMN: Sidebar (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Widget 1: Most Viewed */}
                        <div className="bg-slate-50 p-4">
                            <h3 className="font-bold text-base mb-3 pb-2 border-b border-slate-300">가장 많이 본 뉴스</h3>
                            <div className="space-y-2.5">
                                {popularNews.length > 0 ? (
                                    popularNews.map((item: any, idx: number) => (
                                        <Link key={item.id} href={`/${region}/news/${item.id}`} className="flex gap-2.5 cursor-pointer group">
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

                        {/* Widget 2: Ad Banner */}
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
                            <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">
                                전남의 역사
                            </h4>
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

                        {/* Widget 4: Economy Plus */}
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
