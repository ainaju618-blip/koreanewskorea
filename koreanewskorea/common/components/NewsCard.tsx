/**
 * News Card Component
 * Displays article thumbnail, title, date, and region badge
 */

import { Article } from '@/common/lib/content';
import { getRegionConfig } from '@/common/lib/regions';

interface NewsCardProps {
    article: Article;
    showRegion?: boolean;
}

export default function NewsCard({ article, showRegion = true }: NewsCardProps) {
    const regionConfig = getRegionConfig(article.region);
    const formattedDate = new Date(article.published_at).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
    });

    return (
        <article
            style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'box-shadow 0.2s',
            }}
        >
            <a href={`/news/${article.id}`} style={{ display: 'block' }}>
                {/* Thumbnail */}
                {article.thumbnail_url && (
                    <div
                        style={{
                            width: '100%',
                            paddingTop: '56.25%', // 16:9 ratio
                            position: 'relative',
                            backgroundColor: 'var(--color-bg-secondary)',
                        }}
                    >
                        <img
                            src={article.thumbnail_url}
                            alt={article.title}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    </div>
                )}

                {/* Content */}
                <div style={{ padding: '1rem' }}>
                    {/* Region Badge */}
                    {showRegion && regionConfig && (
                        <span
                            className={`region-badge region-badge--tier${regionConfig.tier}`}
                            style={{ marginBottom: '0.5rem' }}
                        >
                            {regionConfig.nameKo}
                        </span>
                    )}

                    {/* Title */}
                    <h3
                        style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--color-text)',
                            lineHeight: 1.4,
                            marginTop: showRegion ? '0.5rem' : 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {article.title}
                    </h3>

                    {/* Date */}
                    <time
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            marginTop: '0.5rem',
                            display: 'block',
                        }}
                    >
                        {formattedDate}
                    </time>
                </div>
            </a>
        </article>
    );
}
