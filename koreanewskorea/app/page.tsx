/**
 * Regional Homepage - Main Page
 * Dynamically renders based on subdomain/region
 */

import { headers } from 'next/headers';
import {
    getRegionConfig,
    getDefaultRegion,
    type RegionConfig
} from '@/common/lib/regions';
import {
    getLocalNews,
    getNearbyNews,
    getNationalNews
} from '@/common/lib/content';
import FullLayout from '@/common/layouts/FullLayout';
import StandardLayout from '@/common/layouts/StandardLayout';
import CompactLayout from '@/common/layouts/CompactLayout';

export default async function HomePage() {
    // Get region from middleware header
    const headersList = await headers();
    const regionCode = headersList.get('x-region') || 'gwangju';

    const region: RegionConfig = getRegionConfig(regionCode) || getDefaultRegion();

    // Tier-based content ratios
    // Tier 1: 70/20/10, Tier 2: 50/30/20, Tier 3: 30/40/30
    const totalArticles = 20;
    const ratios = {
        1: { local: 0.7, nearby: 0.2, national: 0.1 },
        2: { local: 0.5, nearby: 0.3, national: 0.2 },
        3: { local: 0.3, nearby: 0.4, national: 0.3 },
    };
    const ratio = ratios[region.tier];

    // Fetch content based on tier
    const [localNews, nearbyNews, nationalNews] = await Promise.all([
        getLocalNews(regionCode, Math.ceil(totalArticles * ratio.local)),
        getNearbyNews(regionCode, Math.ceil(totalArticles * ratio.nearby)),
        getNationalNews(Math.ceil(totalArticles * ratio.national)),
    ]);

    // Render layout based on tier
    switch (region.tier) {
        case 1:
            return (
                <FullLayout
                    region={region}
                    localNews={localNews}
                    nearbyNews={nearbyNews}
                    nationalNews={nationalNews}
                />
            );
        case 2:
            return (
                <StandardLayout
                    region={region}
                    localNews={localNews}
                    nearbyNews={nearbyNews}
                />
            );
        case 3:
        default:
            return (
                <CompactLayout
                    region={region}
                    localNews={localNews}
                    nearbyNews={nearbyNews}
                />
            );
    }
}
