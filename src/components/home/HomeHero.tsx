import Link from 'next/link';
import Image from 'next/image';
import HeroSlider from './HeroSlider';
import AdBanner from './AdBanner';
import { createClient } from '@/lib/supabase-server';

/**
 * Korea NEWS Home Hero Section (Server Component)
 * ================================================
 * Fetches data on server for instant LCP
 */

// Region mappings
const REGION_DISPLAY_NAMES: Record<string, string> = {
    gwangju: 'Gwangju', jeonnam: 'Jeonnam', naju: 'Naju', mokpo: 'Mokpo',
    yeosu: 'Yeosu', suncheon: 'Suncheon', gwangyang: 'Gwangyang',
    damyang: 'Damyang', gokseong: 'Gokseong', gurye: 'Gurye',
    goheung: 'Goheung', boseong: 'Boseong', hwasun: 'Hwasun',
    jangheung: 'Jangheung', gangjin: 'Gangjin', haenam: 'Haenam',
    yeongam: 'Yeongam', muan: 'Muan', hampyeong: 'Hampyeong',
    yeonggwang: 'Yeonggwang', jangseong: 'Jangseong', wando: 'Wando',
    jindo: 'Jindo', shinan: 'Shinan',
};

const REGION_KR_NAMES: Record<string, string> = {
    gwangju: '광주', jeonnam: '전남', naju: '나주', mokpo: '목포',
    yeosu: '여수', suncheon: '순천', gwangyang: '광양',
    damyang: '담양', gokseong: '곡성', gurye: '구례',
    goheung: '고흥', boseong: '보성', hwasun: '화순',
    jangheung: '장흥', gangjin: '강진', haenam: '해남',
    yeongam: '영암', muan: '무안', hampyeong: '함평',
    yeonggwang: '영광', jangseong: '장성', wando: '완도',
    jindo: '진도', shinan: '신안',
};

const DEFAULT_REGIONS = ['gwangju', 'jeonnam', 'naju', 'suncheon', 'gwangyang', 'gwangju'];

// Server-side data fetching
async function getHeroData() {
    const supabase = await createClient();

    // 1. Fetch hero_slider settings
    const { data: settingData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'hero_slider')
        .single();

    const settings = settingData?.value || { regions: DEFAULT_REGIONS, interval: 4000, enabled: true };
    const regionList = settings.regions || DEFAULT_REGIONS;

    // 2. Count occurrences of each region
    const regionCounts: Record<string, number> = {};
    regionList.forEach((region: string) => {
        regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    // 3. Fetch articles for each unique region
    const uniqueRegions = Object.keys(regionCounts);
    const articlesByRegion: Record<string, any[]> = {};

    for (const region of uniqueRegions) {
        const needed = regionCounts[region];
        const categoryName = REGION_KR_NAMES[region] || region;

        const { data } = await supabase
            .from('posts')
            .select('id, title, content, ai_summary, thumbnail_url, category, region, published_at')
            .eq('status', 'published')
            .or(`category.eq.${categoryName},region.eq.${region}`)
            .not('thumbnail_url', 'is', null)
            .neq('thumbnail_url', '')
            .like('thumbnail_url', 'http%')
            .order('published_at', { ascending: false })
            .limit(needed);

        articlesByRegion[region] = data || [];
    }

    // 4. Build final article list
    const regionUsage: Record<string, number> = {};
    const sliderArticles: any[] = [];

    for (const region of regionList) {
        const index = regionUsage[region] || 0;
        const regionArticles = articlesByRegion[region] || [];

        if (regionArticles[index]) {
            sliderArticles.push({
                ...regionArticles[index],
                regionCode: region,
                regionName: REGION_KR_NAMES[region] || region,
                regionNameEn: REGION_DISPLAY_NAMES[region] || region,
            });
        }
        regionUsage[region] = index + 1;
    }

    return {
        sliderArticles,
        settings: { interval: settings.interval }
    };
}

export default async function HomeHero() {
    const { sliderArticles, settings } = await getHeroData();

    return (
        <section className="container-kn mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[500px]">
                {/* Main Hero Slider (Left) - Client Component with server data */}
                <div className="lg:col-span-8 h-full min-h-[400px]">
                    <HeroSlider
                        initialArticles={sliderArticles}
                        initialInterval={settings.interval}
                    />
                </div>

                {/* Side Stack (Right) - Ad Banner + Article */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                    {/* Top: Ad Banner */}
                    <div className="flex-1 min-h-[140px]">
                        <AdBanner variant="polytechnic" />
                    </div>
                    {/* Bottom: Divination Button */}
                    <div className="flex-1 min-h-[140px]">
                        <Link
                            href="/divination"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex h-full rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]"
                        >
                            {/* Background Image */}
                            <Image
                                src="/images/divination/divination-bg.png"
                                alt="Divination Background"
                                fill
                                className="object-cover"
                            />
                            {/* Dark overlay for text readability */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                            {/* Content */}
                            <div className="relative flex flex-col items-center justify-center w-full p-6 text-center">
                                <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">
                                    오늘의 운세
                                </h3>
                                <p className="text-purple-200 text-sm drop-shadow-md">
                                    주역 점술
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Visual Separation */}
            <div className="w-full h-px bg-slate-200 my-6" />
        </section>
    );
}
