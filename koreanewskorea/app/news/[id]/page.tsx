/**
 * News Detail Page
 * Shows full article content with regional context
 */

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getArticleById, getRelatedArticles } from '@/common/lib/content';
import { getRegionConfig, getDefaultRegion } from '@/common/lib/regions';
import RegionalHeader from '@/common/components/RegionalHeader';
import NewsCard from '@/common/components/NewsCard';
import Footer from '@/common/components/Footer';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function NewsDetailPage({ params }: PageProps) {
    const { id } = await params;

    // Get region from middleware
    const headersList = await headers();
    const regionCode = headersList.get('x-region') || 'gwangju';
    const region = getRegionConfig(regionCode) || getDefaultRegion();

    // Fetch article
    const article = await getArticleById(id);

    if (!article) {
        notFound();
    }

    // Fetch related articles
    const relatedArticles = await getRelatedArticles(id, article.region, 4);

    // Format date
    const formattedDate = new Date(article.published_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <>
            <RegionalHeader region={region} />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                <article style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Article Header */}
                    <header style={{ marginBottom: '2rem' }}>
                        <h1
                            style={{
                                fontSize: '2rem',
                                fontWeight: 700,
                                lineHeight: 1.3,
                                marginBottom: '1rem',
                            }}
                        >
                            {article.title}
                        </h1>

                        <div
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'center',
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.875rem',
                            }}
                        >
                            <span className="region-badge">
                                {getRegionConfig(article.region)?.nameKo || article.region}
                            </span>
                            <time>{formattedDate}</time>
                            {article.author && <span>{article.author}</span>}
                        </div>
                    </header>

                    {/* Thumbnail */}
                    {article.thumbnail_url && (
                        <figure style={{ marginBottom: '2rem' }}>
                            <img
                                src={article.thumbnail_url}
                                alt={article.title}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '0.5rem',
                                }}
                            />
                        </figure>
                    )}

                    {/* Article Content */}
                    <div
                        style={{
                            fontSize: '1.125rem',
                            lineHeight: 1.8,
                            color: 'var(--color-text)',
                        }}
                        dangerouslySetInnerHTML={{ __html: article.content || '' }}
                    />

                    {/* Source Link */}
                    {article.source_url && (
                        <div
                            style={{
                                marginTop: '2rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--color-border)',
                            }}
                        >
                            <a
                                href={article.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'var(--color-accent)',
                                    fontSize: '0.875rem',
                                }}
                            >
                                원문 보기 &rarr;
                            </a>
                        </div>
                    )}
                </article>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                    <section style={{ marginTop: '3rem' }}>
                        <h2
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                marginBottom: '1rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '2px solid var(--color-primary)',
                            }}
                        >
                            관련 기사
                        </h2>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '1rem',
                            }}
                        >
                            {relatedArticles.map((related) => (
                                <NewsCard key={related.id} article={related} showRegion={false} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </>
    );
}
