/**
 * Full Layout - Tier 1 (Gwangju, Jeonnam)
 * Most comprehensive layout with all sections
 */

import { Article } from '@/common/lib/content';
import { RegionConfig } from '@/common/lib/regions';
import RegionalHeader from '@/common/components/RegionalHeader';
import RegionalHero from '@/common/components/RegionalHero';
import NewsList from '@/common/components/NewsList';
import Footer from '@/common/components/Footer';

interface FullLayoutProps {
    region: RegionConfig;
    localNews: Article[];
    nearbyNews: Article[];
    nationalNews: Article[];
}

export default function FullLayout({
    region,
    localNews,
    nearbyNews,
    nationalNews,
}: FullLayoutProps) {
    // Hero uses first 6 local articles
    const heroArticles = localNews.slice(0, 6);
    const remainingLocal = localNews.slice(6);

    return (
        <>
            <RegionalHeader region={region} />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                {/* Hero Section */}
                <RegionalHero articles={heroArticles} tier={1} />

                {/* Zone 1: Local News */}
                <NewsList
                    articles={remainingLocal}
                    title={`${region.nameKo} 주요뉴스`}
                    showRegion={false}
                    columns={4}
                />

                {/* Zone 2: Nearby News */}
                <NewsList
                    articles={nearbyNews}
                    title="주변 지역 소식"
                    showRegion={true}
                    columns={3}
                />

                {/* Zone 3: National News */}
                {nationalNews.length > 0 && (
                    <section style={{ marginTop: '2rem' }}>
                        <h2
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                marginBottom: '1rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '2px solid var(--color-primary)',
                            }}
                        >
                            전국/광역 뉴스
                        </h2>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {nationalNews.map((article) => (
                                <li
                                    key={article.id}
                                    style={{
                                        padding: '0.75rem 0',
                                        borderBottom: '1px solid var(--color-border)',
                                    }}
                                >
                                    <a
                                        href={`/news/${article.id}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>{article.title}</span>
                                        <time style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(article.published_at).toLocaleDateString('ko-KR', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </time>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>

            <Footer />
        </>
    );
}
