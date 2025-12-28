import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { getHeroArticles, getWeightedArticles, getRegionDisplayName } from '@/lib/weighted-articles';
import { CURRENT_SITE } from '@/config/site-regions';
import HeroCarousel, { HeroCarouselSkeleton, type HeroArticle } from './HeroCarousel';

/**
 * Korea NEWS Regional - Weighted Main Section
 * ============================================
 * Layout: Traditional newspaper style with region-weighted articles
 * - Left: Hero Carousel (auto-rotating featured articles)
 * - Right: Sub-news list with region indicators
 *
 * Weight System:
 * - Primary regions: 1.0 (longest display time)
 * - Adjacent1 regions: 0.7
 * - Adjacent2 regions: 0.4
 * - Province: 0.3 (shortest display time)
 */

// Transform weighted article to hero article format
function toHeroArticle(article: Awaited<ReturnType<typeof getHeroArticles>>[0]): HeroArticle {
    return {
        id: article.id,
        title: article.title,
        ai_summary: article.ai_summary,
        thumbnail_url: article.thumbnail_url,
        category: article.category,
        region: article.region,
        regionType: article.regionType,
        regionWeight: article.regionWeight,
        published_at: article.published_at,
    };
}

async function HeroSection() {
    const heroArticles = await getHeroArticles();

    if (heroArticles.length === 0) {
        return (
            <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center text-gray-400">
                No articles available
            </div>
        );
    }

    const articles = heroArticles.map(toHeroArticle);

    return (
        <HeroCarousel
            articles={articles}
            intervals={CURRENT_SITE.hero.intervals}
        />
    );
}

async function SubNewsList() {
    const articles = await getWeightedArticles({ limit: 10 });

    // Skip first 5 (used in hero), take next 5 for sub-news
    const subNews = articles.slice(5, 10);

    if (subNews.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400">
                No additional articles
            </div>
        );
    }

    return (
        <div className="border border-gray-200">
            {subNews.map((article, idx) => (
                <Link
                    key={article.id}
                    href={`/news/${article.id}`}
                    className={`flex gap-4 p-4 hover:bg-gray-50 transition-colors ${
                        idx < subNews.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                >
                    {/* Thumbnail */}
                    <div className="relative w-[100px] h-[70px] flex-shrink-0 overflow-hidden bg-gray-100">
                        {article.thumbnail_url && (
                            <Image
                                src={article.thumbnail_url}
                                alt={article.title}
                                fill
                                className="object-cover"
                                sizes="100px"
                            />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-primary transition-colors">
                            {article.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[11px] px-1.5 py-0.5 ${
                                article.regionType === 'primary'
                                    ? 'bg-primary text-white'
                                    : article.regionType === 'adjacent1'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {getRegionDisplayName(article.category || null, article.region || null)}
                            </span>
                            <span className="text-[11px] text-gray-400">
                                {article.published_at
                                    ? new Date(article.published_at).toLocaleDateString('ko-KR')
                                    : ''}
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

export default async function MainSection() {
    return (
        <section className="mb-10">
            {/* Section Header */}
            <div className="kn-section-header">
                <h2 className="kn-section-title">
                    {CURRENT_SITE.name} 주요뉴스
                </h2>
                <Link href="/category/jeonnam" className="kn-section-more">
                    더보기 &gt;
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Hero Carousel - Left 60% */}
                <div className="w-full lg:w-[60%]">
                    <Suspense fallback={<HeroCarouselSkeleton />}>
                        <HeroSection />
                    </Suspense>
                </div>

                {/* Sub News List - Right 40% */}
                <div className="w-full lg:w-[40%]">
                    <Suspense fallback={<SubNewsListSkeleton />}>
                        <SubNewsList />
                    </Suspense>
                </div>
            </div>

            {/* Region Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-primary" /> 핵심지역
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-100" /> 인접지역
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-100" /> 연결지역
                </span>
            </div>
        </section>
    );
}

// Skeleton for sub-news list
function SubNewsListSkeleton() {
    return (
        <div className="border border-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 p-4 border-b border-gray-200 last:border-b-0">
                    <div className="w-[100px] h-[70px] bg-gray-200 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 animate-pulse mb-2" />
                        <div className="h-4 bg-gray-200 animate-pulse w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Skeleton for loading state
export function MainSectionSkeleton() {
    return (
        <section className="mb-10">
            <div className="kn-section-header">
                <div className="w-40 h-6 bg-gray-200 animate-pulse" />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Hero Skeleton */}
                <div className="w-full lg:w-[60%]">
                    <HeroCarouselSkeleton />
                </div>

                {/* Sub News Skeleton */}
                <div className="w-full lg:w-[40%]">
                    <SubNewsListSkeleton />
                </div>
            </div>
        </section>
    );
}
