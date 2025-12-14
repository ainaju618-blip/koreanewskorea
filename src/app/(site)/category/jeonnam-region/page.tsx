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
    const totalPages = Math.ceil(totalCount / 20);

    const currentRegion = JEONNAM_REGIONS.find(r => r.code === region) || JEONNAM_REGIONS[0];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <CategoryHeader slug="jeonnam-region" />

            {/* 시군 선택 탭 */}
            <div className="bg-slate-50 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-1 py-3">
                        {JEONNAM_REGIONS.map((r) => (
                            <Link
                                key={r.code}
                                href={`/category/jeonnam-region?region=${r.code}`}
                                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${region === r.code
                                    ? 'bg-[#ff2e63] text-white font-bold'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                            >
                                {r.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <div className="flex flex-col divide-y divide-slate-100">
                    {news.length > 0 ? (
                        news.map((item: any) => (
                            <Link key={item.id} href={`/news/${item.id}`} className="flex gap-4 py-4 cursor-pointer group">
                                {item.thumbnail_url ? (
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.title}
                                        className="w-40 h-24 object-cover shrink-0 bg-slate-200 rounded"
                                    />
                                ) : (
                                    <div className="w-40 h-24 bg-slate-200 shrink-0 flex items-center justify-center text-slate-400 text-xs rounded">
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
                        ))
                    ) : (
                        <div className="py-10 text-center text-slate-400">
                            등록된 기사가 없습니다.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        basePath={`/category/jeonnam-region?region=${region}`}
                    />
                </div>
            </div>
        </div>
    );
}
