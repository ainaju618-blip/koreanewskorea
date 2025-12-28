'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { MapPin, ArrowLeft, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { JEONNAM_REGIONS, getRegionByCode } from '@/constants/regions';
import { useEffect, useState } from 'react';
import CategoryHeader from '@/components/category/CategoryHeader';
import Pagination from '@/components/ui/Pagination';

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

// 기사 타입 정의
interface Post {
    id: string;
    title: string;
    excerpt?: string;
    content?: string;
    region?: string;
    category?: string;
    created_at: string;
    image_url?: string;
    thumbnail_url?: string;
    ai_summary?: string;
    [key: string]: any;
}

// 날짜 포맷
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
}

export default function RegionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const regionCode = params.region as string;
    const region = getRegionByCode(regionCode);

    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // URL에서 페이지 번호 가져오기 (기본값 1)
    const page = parseInt(searchParams.get('page') || '1');
    const postsPerPage = 20;

    // 해당 지역 기사 불러오기
    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                // 직접 지역 필터링하여 API 요청
                // 참고: API가 region을 지원하도록 수정될 때까지 아래 로직 사용
                // 여기서는 limit=50으로 넉넉히 가져와서 클라이이언트 필터링을 유지하거나,
                // API 업데이트를 가정하고 server side params를 사용.
                // *현재상황*: API는 page/limit/status만 받음. Region param은 아직 없음.
                // 1) 전체 region 글을 가져와서(limit 크게)
                // 2) 클라이언트에서 필터링
                // 3) 그 결과를 페이징
                // -> 데이터 양이 많아지면 문제되지만, 지금은 임시로 이렇게 구현하고 API 업데이트 예정.

                // 임시: 100개 가져와서 클라이언트 필터링
                const res = await fetch(`/api/posts?limit=100&status=published`);
                if (res.ok) {
                    const result = await res.json();
                    const allPosts = result.posts || [];

                    // 해당 지역 기사만 필터링
                    const filteredPosts = allPosts.filter((post: Post) =>
                        post.region === regionCode ||
                        post.title?.includes(region?.name || '') ||
                        post.content?.includes(region?.name || '')
                    );

                    setTotalCount(filteredPosts.length);

                    // 클라이언트 사이드 페이징 (API 업데이트 전까지 유지)
                    const startIdx = (page - 1) * postsPerPage;
                    setPosts(filteredPosts.slice(startIdx, startIdx + postsPerPage));
                }
            } catch (err) {
                console.error('기사 로드 실패:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (region) {
            fetchPosts();
        }
    }, [regionCode, region, page]);

    // 지역 코드가 잘못된 경우
    if (!region) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">지역을 찾을 수 없습니다</h1>
                    <p className="text-slate-500 mb-6">요청하신 지역 코드 '{regionCode}'가 존재하지 않습니다.</p>
                    <Link
                        href="/category/jeonnam"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        전남 허브로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Standard Category Header with Active State */}
            <CategoryHeader slug="jeonnam" currentSubSlug={regionCode} />

            {/* ============================================
                [MAIN CONTENT] 2-Column Grid (Standard Layout)
                ============================================ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: News Content (9 cols) */}
                    <div className="lg:col-span-9">

                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
                            <Newspaper className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-slate-900">{region.name} 최신 기사</h2>
                        </div>

                        {/* News List */}
                        <div className="flex flex-col divide-y divide-slate-100">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex gap-4 py-4 animate-pulse">
                                            <div className="w-40 h-24 bg-slate-200 rounded shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                                <div className="h-3 bg-slate-200 rounded w-full" />
                                                <div className="h-3 bg-slate-200 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : posts.length > 0 ? (
                                posts.map((item) => (
                                    <Link key={item.id} href={`/news/${item.id}`} className="flex gap-4 py-4 cursor-pointer group">
                                        {item.thumbnail_url || item.image_url ? (
                                            <img
                                                src={item.thumbnail_url || item.image_url}
                                                alt={item.title}
                                                className="w-40 h-24 object-cover shrink-0 bg-slate-200"
                                            />
                                        ) : (
                                            <div className="w-40 h-24 bg-slate-200 shrink-0 flex items-center justify-center text-slate-400 text-xs">
                                                No Image
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col justify-start">
                                            <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:underline line-clamp-2 leading-snug">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-1.5 leading-relaxed">
                                                {item.ai_summary || item.excerpt || item.content?.substring(0, 100)}
                                            </p>
                                            <span className="text-xs text-slate-400">
                                                {item.created_at ? formatDate(item.created_at) : ''}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="py-16 text-center text-slate-400">
                                    <p>등록된 기사가 없습니다.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="mt-8">
                            <Pagination
                                currentPage={page}
                                totalPages={Math.ceil(totalCount / postsPerPage)}
                            />
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Sidebar (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">

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
                            <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">{region?.name}의 역사</h4>
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
