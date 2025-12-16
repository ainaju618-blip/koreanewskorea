import Link from 'next/link';
import Image from 'next/image';
import { cleanContentPreview } from '@/lib/contentUtils';
import HeroSlider from './HeroSlider';
import { createClient } from '@/lib/supabase-server';

/**
 * Korea NEWS Home Hero Section (Server Component)
 * ================================================
 * Fetches data on server for instant LCP
 */

interface Article {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    thumbnail_url?: string;
    author?: string;
    category?: string;
    published_at?: string;
}

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

    // 5. Fetch side articles (different from slider)
    const sliderIds = sliderArticles.map(a => a.id);
    let sideQuery = supabase
        .from('posts')
        .select('id, title, content, summary, thumbnail_url, category, published_at')
        .eq('status', 'published')
        .not('thumbnail_url', 'is', null)
        .neq('thumbnail_url', '')
        .like('thumbnail_url', 'http%');

    // Exclude slider articles if there are any
    if (sliderIds.length > 0) {
        sideQuery = sideQuery.not('id', 'in', `(${sliderIds.join(',')})`);
    }

    const { data: sideData } = await sideQuery
        .order('published_at', { ascending: false })
        .limit(2);

    return {
        sliderArticles,
        sideArticles: sideData || [],
        settings: { interval: settings.interval }
    };
}

// Side Article Component (Server-rendered)
function SideArticle({ article, priority = false }: { article: Article; priority?: boolean }) {
    const displayCategory = (cat?: string) => {
        if (!cat) return 'News';
        const lowerCat = cat.toLowerCase().trim();
        if (lowerCat.includes('society')) return 'AI';
        return cat;
    };

    return (
        <Link
            href={`/news/${article.id}`}
            className="group flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
        >
            {/* Image Area */}
            <div className="relative w-full h-24 overflow-hidden bg-slate-100 border-b border-slate-100">
                {article.thumbnail_url ? (
                    <Image
                        src={article.thumbnail_url}
                        alt={article.title}
                        fill
                        priority={priority}
                        sizes="(max-width: 1024px) 100vw, 400px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-slate-300 text-xs font-bold">No Image</span>
                    </div>
                )}
            </div>

            {/* Text Area */}
            <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            {displayCategory(article.category)}
                        </span>
                    </div>

                    <h3 className="text-lg font-serif font-bold text-slate-900 leading-[1.25] mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                    </h3>
                </div>

                <p className="text-slate-700 text-sm line-clamp-2 leading-snug font-normal">
                    {(!article.content || article.content.includes('Error'))
                        ? (article.summary || '')
                        : cleanContentPreview(article.content, 60)}...
                </p>
            </div>
        </Link>
    );
}

export default async function HomeHero() {
    const { sliderArticles, sideArticles, settings } = await getHeroData();

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

                {/* Side Stack (Right) - Server-rendered */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                    {sideArticles.length > 0 ? (
                        sideArticles.map((article, idx) => (
                            <div key={article.id} className="flex-1 min-h-[140px]">
                                <SideArticle article={article} priority={idx === 0} />
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="flex-1 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                                <span className="text-slate-400 text-sm">Preparing...</span>
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                                <span className="text-slate-400 text-sm">Preparing...</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Visual Separation */}
            <div className="w-full h-px bg-slate-200 my-6" />
        </section>
    );
}
