'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JEONNAM_REGIONS, type Region } from '@/constants/regions';

/**
 * 전남 인터랙티브 지도 컴포넌트
 * 
 * SVG 기반 간소화 그리드 맵으로 22개 시군 표시
 * 각 지역 hover 시 하이라이트, 클릭 시 해당 페이지로 이동
 */
export default function JeonnamMap() {
    const router = useRouter();

    // 지역별 그리드 위치 정의 (5열 x 5행 근사화 배치)
    const gridLayout: (Region | null)[][] = [
        // 1행: 영광, 장성, 담양, null, 구례
        [
            JEONNAM_REGIONS.find(r => r.code === 'yeonggwang') || null,
            JEONNAM_REGIONS.find(r => r.code === 'jangseong') || null,
            JEONNAM_REGIONS.find(r => r.code === 'damyang') || null,
            null,
            JEONNAM_REGIONS.find(r => r.code === 'gurye') || null,
        ],
        // 2행: 함평, 광주(표시용), 화순, 순천, 광양
        [
            JEONNAM_REGIONS.find(r => r.code === 'hampyeong') || null,
            { code: 'gwangju', name: '광주', type: 'metro' as const },
            JEONNAM_REGIONS.find(r => r.code === 'hwasun') || null,
            JEONNAM_REGIONS.find(r => r.code === 'suncheon') || null,
            JEONNAM_REGIONS.find(r => r.code === 'gwangyang') || null,
        ],
        // 3행: 무안, 나주, 보성, 고흥, 여수
        [
            JEONNAM_REGIONS.find(r => r.code === 'muan') || null,
            JEONNAM_REGIONS.find(r => r.code === 'naju') || null,
            JEONNAM_REGIONS.find(r => r.code === 'boseong') || null,
            JEONNAM_REGIONS.find(r => r.code === 'goheung') || null,
            JEONNAM_REGIONS.find(r => r.code === 'yeosu') || null,
        ],
        // 4행: 목포, 영암, 장흥, 강진, null
        [
            JEONNAM_REGIONS.find(r => r.code === 'mokpo') || null,
            JEONNAM_REGIONS.find(r => r.code === 'yeongam') || null,
            JEONNAM_REGIONS.find(r => r.code === 'jangheung') || null,
            JEONNAM_REGIONS.find(r => r.code === 'gangjin') || null,
            JEONNAM_REGIONS.find(r => r.code === 'gokseong') || null,
        ],
        // 5행: 신안, null, 해남, 완도, 진도
        [
            JEONNAM_REGIONS.find(r => r.code === 'sinan') || null,
            null,
            JEONNAM_REGIONS.find(r => r.code === 'haenam') || null,
            JEONNAM_REGIONS.find(r => r.code === 'wando') || null,
            JEONNAM_REGIONS.find(r => r.code === 'jindo') || null,
        ],
    ];

    const handleRegionClick = (region: Region | null) => {
        if (!region) return;
        if (region.code === 'gwangju') {
            router.push('/category/gwangju');
        } else {
            router.push(`/category/jeonnam/${region.code}`);
        }
    };

    const getRegionColor = (region: Region | null) => {
        if (!region) return 'bg-transparent';
        if (region.code === 'gwangju') return 'bg-purple-200 hover:bg-purple-300';
        if (region.type === 'city') return 'bg-blue-200 hover:bg-blue-400';
        return 'bg-green-100 hover:bg-green-300';
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* 범례 */}
            <div className="flex justify-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-purple-200 rounded" />
                    <span className="text-sm text-slate-600">광주광역시</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-blue-200 rounded" />
                    <span className="text-sm text-slate-600">시(市)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-100 rounded" />
                    <span className="text-sm text-slate-600">군(郡)</span>
                </div>
            </div>

            {/* 그리드 맵 */}
            <div className="grid grid-cols-5 gap-2">
                {gridLayout.flat().map((region, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleRegionClick(region)}
                        disabled={!region}
                        className={`
                            aspect-square rounded-lg flex items-center justify-center
                            text-sm font-semibold transition-all duration-200
                            ${getRegionColor(region)}
                            ${region ? 'cursor-pointer hover:scale-105 hover:shadow-md text-slate-700' : 'cursor-default'}
                        `}
                    >
                        {region?.name || ''}
                    </button>
                ))}
            </div>

            {/* 안내 메시지 */}
            <p className="text-center text-sm text-slate-400 mt-4">
                지역을 클릭하면 해당 지역 뉴스 페이지로 이동합니다
            </p>
        </div>
    );
}
