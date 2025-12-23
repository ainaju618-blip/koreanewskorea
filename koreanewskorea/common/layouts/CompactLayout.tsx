/**
 * Compact Layout - Tier 3 (17 Counties)
 * Minimal layout for regions with less content
 */

import { Article } from '@/common/lib/content';
import { RegionConfig } from '@/common/lib/regions';
import RegionalHeader from '@/common/components/RegionalHeader';
import RegionalHero from '@/common/components/RegionalHero';
import NewsList from '@/common/components/NewsList';
import Footer from '@/common/components/Footer';

interface CompactLayoutProps {
    region: RegionConfig;
    localNews: Article[];
    nearbyNews: Article[];
}

export default function CompactLayout({
    region,
    localNews,
    nearbyNews,
}: CompactLayoutProps) {
    // Hero uses first 1 local article
    const heroArticle = localNews.slice(0, 1);
    const remainingLocal = localNews.slice(1);

    return (
        <>
            <RegionalHeader region={region} />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                {/* Featured Article */}
                <RegionalHero articles={heroArticle} tier={3} />

                {/* Local News (List format) */}
                {remainingLocal.length > 0 && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                marginBottom: '1rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '2px solid var(--color-primary)',
                            }}
                        >
                            {region.nameKo} 소식
                        </h2>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {remainingLocal.map((article) => (
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

                {/* Nearby News Grid */}
                <NewsList
                    articles={nearbyNews}
                    title="주변 지역 소식"
                    showRegion={true}
                    columns={3}
                />
            </main>

            <Footer />
        </>
    );
}
