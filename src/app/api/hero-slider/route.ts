import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Region code to display name mapping
const REGION_DISPLAY_NAMES: Record<string, string> = {
    gwangju: 'Gwangju',
    jeonnam: 'Jeonnam',
    naju: 'Naju',
    mokpo: 'Mokpo',
    yeosu: 'Yeosu',
    suncheon: 'Suncheon',
    gwangyang: 'Gwangyang',
    damyang: 'Damyang',
    gokseong: 'Gokseong',
    gurye: 'Gurye',
    goheung: 'Goheung',
    boseong: 'Boseong',
    hwasun: 'Hwasun',
    jangheung: 'Jangheung',
    gangjin: 'Gangjin',
    haenam: 'Haenam',
    yeongam: 'Yeongam',
    muan: 'Muan',
    hampyeong: 'Hampyeong',
    yeonggwang: 'Yeonggwang',
    jangseong: 'Jangseong',
    wando: 'Wando',
    jindo: 'Jindo',
    shinan: 'Shinan',
};

// Region code to Korean name mapping
const REGION_KR_NAMES: Record<string, string> = {
    gwangju: '광주',
    jeonnam: '전남',
    naju: '나주',
    mokpo: '목포',
    yeosu: '여수',
    suncheon: '순천',
    gwangyang: '광양',
    damyang: '담양',
    gokseong: '곡성',
    gurye: '구례',
    goheung: '고흥',
    boseong: '보성',
    hwasun: '화순',
    jangheung: '장흥',
    gangjin: '강진',
    haenam: '해남',
    yeongam: '영암',
    muan: '무안',
    hampyeong: '함평',
    yeonggwang: '영광',
    jangseong: '장성',
    wando: '완도',
    jindo: '진도',
    shinan: '신안',
};

interface HeroSliderSettings {
    regions: string[];
    interval: number;
    enabled: boolean;
}

// Default settings (fallback)
const DEFAULT_SETTINGS: HeroSliderSettings = {
    regions: ['gwangju', 'jeonnam', 'naju', 'suncheon', 'gwangyang', 'gwangju'],
    interval: 4000,
    enabled: true,
};

// GET: Fetch hero slider articles based on admin-configured regions
export async function GET(req: NextRequest) {
    try {
        // 1. Fetch hero_slider settings from site_settings
        const { data: settingData } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'hero_slider')
            .single();

        const settings: HeroSliderSettings = settingData?.value || DEFAULT_SETTINGS;

        if (!settings.enabled) {
            return NextResponse.json({
                articles: [],
                settings: { interval: settings.interval, enabled: false },
            });
        }

        const regionList = settings.regions || DEFAULT_SETTINGS.regions;

        // 2. Count occurrences of each region
        const regionCounts: Record<string, number> = {};
        regionList.forEach((region) => {
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        });

        // 3. Fetch articles for each unique region (with enough to cover duplicates)
        const uniqueRegions = Object.keys(regionCounts);
        const articlesByRegion: Record<string, any[]> = {};

        for (const region of uniqueRegions) {
            const needed = regionCounts[region];

            // Map region code to category filter
            // category field stores: 광주, 전남, 나주, etc. (Korean)
            const categoryName = REGION_KR_NAMES[region] || region;

            const { data, error } = await supabaseAdmin
                .from('posts')
                .select('id, title, content, ai_summary, thumbnail_url, category, region, published_at')
                .eq('status', 'published')
                .or(`category.eq.${categoryName},region.eq.${region}`)
                .not('thumbnail_url', 'is', null)
                .neq('thumbnail_url', '')
                .like('thumbnail_url', 'http%')
                .order('published_at', { ascending: false })
                .limit(needed);

            if (!error && data) {
                articlesByRegion[region] = data;
            } else {
                articlesByRegion[region] = [];
            }
        }

        // 4. Build final article list based on region order
        const regionUsage: Record<string, number> = {};
        const articles: any[] = [];

        for (const region of regionList) {
            const index = regionUsage[region] || 0;
            const regionArticles = articlesByRegion[region] || [];

            if (regionArticles[index]) {
                articles.push({
                    ...regionArticles[index],
                    regionCode: region,
                    regionName: REGION_KR_NAMES[region] || region,
                    regionNameEn: REGION_DISPLAY_NAMES[region] || region,
                });
            }

            regionUsage[region] = index + 1;
        }

        return NextResponse.json({
            articles,
            settings: {
                interval: settings.interval,
                enabled: settings.enabled,
                regions: regionList,
            },
        });
    } catch (error: any) {
        console.error('GET /api/hero-slider error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
