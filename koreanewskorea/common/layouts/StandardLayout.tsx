/**
 * Standard Layout - Tier 2 (5 Cities: Mokpo, Yeosu, Suncheon, Naju, Gwangyang)
 * Simplified layout with fewer sections
 */

import { Article } from '@/common/lib/content';
import { RegionConfig } from '@/common/lib/regions';
import RegionalHeader from '@/common/components/RegionalHeader';
import RegionalHero from '@/common/components/RegionalHero';
import NewsList from '@/common/components/NewsList';
import Footer from '@/common/components/Footer';

interface StandardLayoutProps {
    region: RegionConfig;
    localNews: Article[];
    nearbyNews: Article[];
}

export default function StandardLayout({
    region,
    localNews,
    nearbyNews,
}: StandardLayoutProps) {
    // Hero uses first 3 local articles
    const heroArticles = localNews.slice(0, 3);
    const remainingLocal = localNews.slice(3);

    return (
        <>
            <RegionalHeader region={region} />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                {/* Hero Section */}
                <RegionalHero articles={heroArticles} tier={2} />

                {/* Zone 1: Local News */}
                <NewsList
                    articles={remainingLocal}
                    title={`${region.nameKo} 소식`}
                    showRegion={false}
                    columns={3}
                />

                {/* Zone 2: Combined Nearby + National */}
                <NewsList
                    articles={nearbyNews}
                    title="전남 / 광주 소식"
                    showRegion={true}
                    columns={3}
                />
            </main>

            <Footer />
        </>
    );
}
