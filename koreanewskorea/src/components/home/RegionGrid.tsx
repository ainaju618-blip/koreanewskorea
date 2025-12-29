import Link from 'next/link';
import { getArticlesByRegions, getRegionDisplayName } from '@/lib/weighted-articles';
import { CURRENT_SITE } from '@/config/site-regions';

/**
 * Korea NEWS Regional - Region Grid with Weighted Display
 * ========================================================
 * Shows news from primary and adjacent regions
 * - Primary regions displayed prominently
 * - Adjacent regions included with visual distinction
 *
 * For Site: 전남/목포/무안/신안
 * - Primary: 전남, 목포, 무안, 신안 (weight 1.0)
 * - Adjacent1: 영암, 함평 (weight 0.7)
 * - Adjacent2: 나주, 영광, 광주 (weight 0.4)
 */

interface RegionCardProps {
    name: string;
    articles: Array<{ id: string; title: string }>;
    isPrimary: boolean;
    isAdjacent1: boolean;
}

function RegionCard({ name, articles, isPrimary, isAdjacent1 }: RegionCardProps) {
    return (
        <div className={`kn-region-card ${isPrimary ? 'border-primary/30' : ''}`}>
            {/* Region Name with Weight Indicator */}
            <div className={`kn-region-name flex items-center gap-2 ${
                isPrimary ? 'text-primary' : isAdjacent1 ? 'text-blue-600' : 'text-gray-700'
            }`}>
                {name}
                {isPrimary && (
                    <span className="text-[10px] px-1 py-0.5 bg-primary/10 text-primary">핵심</span>
                )}
                {isAdjacent1 && !isPrimary && (
                    <span className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-600">인접</span>
                )}
            </div>

            {/* News List */}
            <ul className="kn-region-news-list">
                {articles.length > 0 ? (
                    articles.map((article) => (
                        <li key={article.id}>
                            <Link
                                href={`/news/${article.id}`}
                                className="kn-region-news-item block"
                            >
                                {article.title}
                            </Link>
                        </li>
                    ))
                ) : (
                    <li className="text-gray-400 text-sm py-2">
                        등록된 뉴스가 없습니다
                    </li>
                )}
            </ul>
        </div>
    );
}

export default async function RegionGrid() {
    const config = CURRENT_SITE;

    // Collect all region names
    const primaryRegions = config.regions.primary.names;
    const adjacent1Regions = config.regions.adjacent1.names;
    const adjacent2Regions = config.regions.adjacent2.names;

    // Fetch articles for all regions
    const allRegions = [...primaryRegions, ...adjacent1Regions, ...adjacent2Regions];
    const articlesByRegion = await getArticlesByRegions(allRegions, 3, config);

    return (
        <section className="mb-10">
            {/* Section Header */}
            <div className="kn-section-header">
                <h2 className="kn-section-title">지역별 뉴스</h2>
                <Link href="/region" className="kn-section-more">
                    전체보기 &gt;
                </Link>
            </div>

            {/* Primary Regions - 4 Column Grid */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary" />
                    핵심 지역 ({primaryRegions.join(', ')})
                </h3>
                <div className="kn-region-grid">
                    {primaryRegions.map((regionName) => (
                        <RegionCard
                            key={regionName}
                            name={regionName}
                            articles={articlesByRegion[regionName]?.map(a => ({
                                id: a.id,
                                title: a.title,
                            })) || []}
                            isPrimary={true}
                            isAdjacent1={false}
                        />
                    ))}
                </div>
            </div>

            {/* Adjacent Regions - Combined */}
            {(adjacent1Regions.length > 0 || adjacent2Regions.length > 0) && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400" />
                        인접 지역
                    </h3>
                    <div className="kn-region-grid">
                        {/* Adjacent1 - Closer regions */}
                        {adjacent1Regions.map((regionName) => (
                            <RegionCard
                                key={regionName}
                                name={regionName}
                                articles={articlesByRegion[regionName]?.map(a => ({
                                    id: a.id,
                                    title: a.title,
                                })) || []}
                                isPrimary={false}
                                isAdjacent1={true}
                            />
                        ))}

                        {/* Adjacent2 - Further regions */}
                        {adjacent2Regions.map((regionName) => (
                            <RegionCard
                                key={regionName}
                                name={regionName}
                                articles={articlesByRegion[regionName]?.map(a => ({
                                    id: a.id,
                                    title: a.title,
                                })) || []}
                                isPrimary={false}
                                isAdjacent1={false}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* View All Sites */}
            <div className="mt-6 text-center">
                <Link
                    href="/sites"
                    className="inline-block px-6 py-2 border border-gray-300 text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                    전남 8개 사이트 전체보기
                </Link>
            </div>
        </section>
    );
}

// Skeleton for loading state
export function RegionGridSkeleton() {
    return (
        <section className="mb-10">
            <div className="kn-section-header">
                <div className="w-32 h-6 bg-gray-200 animate-pulse" />
            </div>

            {/* Primary Skeleton */}
            <div className="mb-6">
                <div className="w-40 h-5 bg-gray-200 animate-pulse mb-3" />
                <div className="kn-region-grid">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="kn-region-card">
                            <div className="h-5 w-16 bg-gray-200 animate-pulse mb-3" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 animate-pulse" />
                                <div className="h-4 bg-gray-200 animate-pulse w-4/5" />
                                <div className="h-4 bg-gray-200 animate-pulse w-3/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Adjacent Skeleton */}
            <div>
                <div className="w-32 h-5 bg-gray-200 animate-pulse mb-3" />
                <div className="kn-region-grid">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="kn-region-card">
                            <div className="h-5 w-16 bg-gray-200 animate-pulse mb-3" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 animate-pulse" />
                                <div className="h-4 bg-gray-200 animate-pulse w-4/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
