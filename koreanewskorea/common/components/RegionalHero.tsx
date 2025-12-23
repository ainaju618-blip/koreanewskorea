/**
 * Regional Hero Component
 * Hero section with featured articles
 * Size varies by tier
 */

import { Article } from '@/common/lib/content';

interface RegionalHeroProps {
    articles: Article[];
    tier: 1 | 2 | 3;
}

export default function RegionalHero({ articles, tier }: RegionalHeroProps) {
    // Number of articles to show based on tier
    const articleCount = tier === 1 ? 6 : tier === 2 ? 3 : 1;
    const displayArticles = articles.slice(0, articleCount);

    if (displayArticles.length === 0) {
        return null;
    }

    // Tier 3: Single featured article
    if (tier === 3) {
        const featured = displayArticles[0];
        return (
            <section style={{ marginBottom: '2rem' }}>
                <a href={`/news/${featured.id}`} style={{ display: 'block' }}>
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '300px',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            backgroundColor: 'var(--color-bg-secondary)',
                        }}
                    >
                        {featured.thumbnail_url && (
                            <img
                                src={featured.thumbnail_url}
                                alt={featured.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        )}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '1.5rem',
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                color: 'white',
                            }}
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                                {featured.title}
                            </h2>
                        </div>
                    </div>
                </a>
            </section>
        );
    }

    // Tier 1 & 2: Grid layout
    const gridCols = tier === 1 ? 3 : 2;

    return (
        <section style={{ marginBottom: '2rem' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                    gap: '1rem',
                }}
            >
                {displayArticles.map((article, index) => (
                    <a
                        key={article.id}
                        href={`/news/${article.id}`}
                        style={{
                            display: 'block',
                            position: 'relative',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            height: index === 0 && tier === 1 ? '400px' : '200px',
                            gridColumn: index === 0 && tier === 1 ? 'span 2' : 'span 1',
                            gridRow: index === 0 && tier === 1 ? 'span 2' : 'span 1',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'var(--color-bg-secondary)',
                            }}
                        >
                            {article.thumbnail_url && (
                                <img
                                    src={article.thumbnail_url}
                                    alt={article.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            )}
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '1rem',
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                color: 'white',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: index === 0 && tier === 1 ? '1.25rem' : '0.875rem',
                                    fontWeight: 600,
                                    margin: 0,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {article.title}
                            </h3>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
