/**
 * News List Component
 * Displays a grid of news cards
 */

import { Article } from '@/common/lib/content';
import NewsCard from './NewsCard';

interface NewsListProps {
    articles: Article[];
    title?: string;
    showRegion?: boolean;
    columns?: 2 | 3 | 4;
}

export default function NewsList({
    articles,
    title,
    showRegion = true,
    columns = 4
}: NewsListProps) {
    if (articles.length === 0) {
        return null;
    }

    return (
        <section style={{ marginBottom: '2rem' }}>
            {title && (
                <h2
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--color-text)',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid var(--color-primary)',
                    }}
                >
                    {title}
                </h2>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: '1rem',
                }}
            >
                {articles.map((article) => (
                    <NewsCard key={article.id} article={article} showRegion={showRegion} />
                ))}
            </div>
        </section>
    );
}
