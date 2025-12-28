'use client';

import { useState, useEffect } from 'react';

interface SubMenuItem {
    name: string;
    slug: string;
    keywords: string[];
    articleCount: number;
    isActive: boolean;
}

interface RegionMenuResult {
    region: string;
    regionName: string;
    method: string;
    subMenus: SubMenuItem[];
    totalArticles: number;
    generatedAt: string;
}

interface UseRegionSubMenusOptions {
    method?: 'static' | 'dynamic' | 'auto';
    days?: number;
    minArticles?: number;
    enabled?: boolean;
}

/**
 * Hook for fetching keyword-based sub-menus for a region
 *
 * Usage:
 *   const { subMenus, loading } = useRegionSubMenus('mokpo');
 *   const { subMenus } = useRegionSubMenus('yeosu', { method: 'static' });
 */
export function useRegionSubMenus(
    regionCode: string,
    options: UseRegionSubMenusOptions = {}
) {
    const {
        method = 'auto',
        days = 30,
        minArticles = 3,
        enabled = true,
    } = options;

    const [data, setData] = useState<RegionMenuResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled || !regionCode) {
            return;
        }

        const fetchSubMenus = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    method,
                    days: days.toString(),
                    minArticles: minArticles.toString(),
                });

                const res = await fetch(
                    `/api/regions/${regionCode}/submenus?${params}`
                );

                if (!res.ok) {
                    throw new Error(`Failed to fetch: ${res.status}`);
                }

                const result = await res.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchSubMenus();
    }, [regionCode, method, days, minArticles, enabled]);

    return {
        subMenus: data?.subMenus || [],
        totalArticles: data?.totalArticles || 0,
        regionName: data?.regionName || '',
        loading,
        error,
        refetch: () => {
            // Trigger refetch by updating a dependency
            setData(null);
        },
    };
}

/**
 * Static sub-menus (no API call, instant)
 * Use this for SSR or when API is not available
 */
export function getStaticRegionSubMenus(regionCode: string): SubMenuItem[] {
    const STATIC_MENUS: Record<string, SubMenuItem[]> = {
        mokpo: [
            { name: '해양관광', slug: 'marine', keywords: ['해양', '항구', '케이블카'], articleCount: 0, isActive: true },
            { name: '근대문화', slug: 'modern', keywords: ['근대', '역사', '문화'], articleCount: 0, isActive: true },
            { name: '도시개발', slug: 'urban', keywords: ['개발', '도시', '교통'], articleCount: 0, isActive: true },
            { name: '시민생활', slug: 'life', keywords: ['복지', '교육', '안전'], articleCount: 0, isActive: true },
        ],
        yeosu: [
            { name: '관광명소', slug: 'tourism', keywords: ['관광', '밤바다', '엑스포'], articleCount: 0, isActive: true },
            { name: '수산업', slug: 'fishery', keywords: ['수산', '항만', '어업'], articleCount: 0, isActive: true },
            { name: '산업단지', slug: 'industry', keywords: ['산단', '화학', '기업'], articleCount: 0, isActive: true },
            { name: '시민생활', slug: 'life', keywords: ['복지', '교육', '문화'], articleCount: 0, isActive: true },
        ],
        suncheon: [
            { name: '생태관광', slug: 'eco', keywords: ['순천만', '정원', '습지'], articleCount: 0, isActive: true },
            { name: '문화유산', slug: 'heritage', keywords: ['낙안읍성', '선암사', '역사'], articleCount: 0, isActive: true },
            { name: '교통발전', slug: 'transport', keywords: ['철도', 'KTX', '교통'], articleCount: 0, isActive: true },
            { name: '시민생활', slug: 'life', keywords: ['복지', '교육', '환경'], articleCount: 0, isActive: true },
        ],
        gwangju: [
            { name: '문화예술', slug: 'culture', keywords: ['문화', '예술', 'ACC'], articleCount: 0, isActive: true },
            { name: '민주인권', slug: 'democracy', keywords: ['민주', '인권', '5.18'], articleCount: 0, isActive: true },
            { name: '도시발전', slug: 'urban', keywords: ['개발', '도시', '교통'], articleCount: 0, isActive: true },
            { name: '청년미래', slug: 'youth', keywords: ['청년', 'AI', '일자리'], articleCount: 0, isActive: true },
        ],
        // Add more regions as needed...
    };

    return STATIC_MENUS[regionCode] || [
        { name: '정책행정', slug: 'policy', keywords: ['정책', '행정'], articleCount: 0, isActive: true },
        { name: '문화관광', slug: 'culture', keywords: ['문화', '관광', '축제'], articleCount: 0, isActive: true },
        { name: '복지교육', slug: 'welfare', keywords: ['복지', '교육'], articleCount: 0, isActive: true },
        { name: '지역소식', slug: 'local', keywords: ['지역', '주민'], articleCount: 0, isActive: true },
    ];
}

export default useRegionSubMenus;
