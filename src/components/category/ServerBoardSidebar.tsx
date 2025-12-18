import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-server';

interface ServerSidebarProps {
    regionName?: string;
    regionCode?: string;
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

/**
 * 게시판 사이드바 (Server Component 버전)
 * 강원일보 스타일: 가장 많이 본 뉴스, 이미지 배너, 역사, 이코노미 플러스
 */
// Gwangju history content
const GWANGJU_HISTORY = [
    {
        id: 1,
        title: '5.18 Democratic Uprising - The Spirit of Gwangju',
        image: '/images/history/518.jpg',
    },
    {
        id: 2,
        title: 'Gwangju Student Independence Movement (1929)',
        image: '/images/history/student.jpg',
    },
    {
        id: 3,
        title: 'Mudeungsan and Historical Heritage of Gwangju',
        image: '/images/history/mudeung.jpg',
    },
];

export default async function ServerBoardSidebar({ regionName = '전남', regionCode }: ServerSidebarProps) {
    const isGwangju = regionCode === 'gwangju' || regionName === '광주';
    const popularNews = await getPopularNews();

    return (
        <div className="lg:col-span-3 space-y-6">
            {/* Widget 1: 가장 많이 본 뉴스 */}
            <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-base mb-4 pb-2 border-b border-slate-300">
                    가장 많이 본 뉴스
                </h3>
                <div className="space-y-3">
                    {popularNews.length > 0 ? (
                        popularNews.map((item: any, idx: number) => (
                            <Link key={item.id} href={`/news/${item.id}`} className="flex gap-2.5 cursor-pointer group">
                                <span className="font-black text-red-600 text-base w-4">{idx + 1}</span>
                                <p className="text-sm text-slate-700 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                    {item.title}
                                </p>
                            </Link>
                        ))
                    ) : (
                        [...Array(5)].map((_, n) => (
                            <div key={n} className="flex gap-2.5">
                                <span className="font-black text-red-600 text-base w-4">{n + 1}</span>
                                <p className="text-sm text-slate-400">인기 뉴스 제목 {n + 1}</p>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-3 text-right">
                    <Link href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">
                        더보기
                    </Link>
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
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
            </Link>

            {/* Widget 3: Region History */}
            <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">
                    {isGwangju ? '광주의 역사' : `${regionName}의 역사`}
                </h4>
                <div className="space-y-3">
                    {isGwangju ? (
                        GWANGJU_HISTORY.map((item) => (
                            <div key={item.id} className="flex gap-3 cursor-pointer group">
                                <div className="w-20 h-14 bg-slate-200 shrink-0 rounded overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{item.id}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                        {item.title}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 cursor-pointer group">
                                <div className="w-20 h-14 bg-slate-200 shrink-0 rounded"></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                        [역사 기획 {i}] {regionName}의 역사 기사 제목이 들어갑니다
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Widget 4: 이코노미 플러스 */}
            <div>
                <h4 className="font-bold text-base mb-3 pb-2 border-b-2 border-slate-900">
                    이코노미 플러스
                </h4>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 cursor-pointer group">
                            <div className="w-20 h-14 bg-slate-200 shrink-0 rounded"></div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 leading-snug transition-colors">
                                    [경제 특집 {i}] 이코노미 플러스 제목입니다
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
