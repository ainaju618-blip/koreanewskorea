/**
 * NewsList Organism Component
 * 뉴스 기사 목록 표시
 */

import { cn } from '@/lib/utils';
import NewsCard, { NewsCardProps } from '@/components/molecules/NewsCard';

export interface NewsListProps {
  title?: string;
  articles: Omit<NewsCardProps, 'variant' | 'className'>[];
  variant?: 'grid' | 'list' | 'featured';
  columns?: 1 | 2 | 3 | 4;
  showMoreLink?: {
    href: string;
    label: string;
  };
  emptyMessage?: string;
  className?: string;
}

export default function NewsList({
  title,
  articles,
  variant = 'grid',
  columns = 3,
  showMoreLink,
  emptyMessage = '표시할 뉴스가 없습니다',
  className,
}: NewsListProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // 빈 상태
  if (!articles.length) {
    return (
      <section className={className}>
        {title && (
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          <span className="block text-4xl mb-4">📰</span>
          <p>{emptyMessage}</p>
        </div>
      </section>
    );
  }

  // Featured variant (첫 번째 기사 크게)
  if (variant === 'featured' && articles.length > 0) {
    const [featured, ...rest] = articles;

    return (
      <section className={className}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-600 rounded-full"></span>
              {title}
            </h2>
            {showMoreLink && (
              <a
                href={showMoreLink.href}
                className="text-blue-600 text-sm hover:underline"
              >
                {showMoreLink.label} →
              </a>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 피처드 기사 */}
          <NewsCard {...featured} variant="featured" />

          {/* 나머지 기사 */}
          <div className="space-y-4">
            {rest.slice(0, 4).map((article) => (
              <NewsCard key={article.id} {...article} variant="compact" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // List variant (세로 나열)
  if (variant === 'list') {
    return (
      <section className={className}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            {showMoreLink && (
              <a
                href={showMoreLink.href}
                className="text-blue-600 text-sm hover:underline"
              >
                {showMoreLink.label} →
              </a>
            )}
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              {...article}
              variant="compact"
              className="px-4"
            />
          ))}
        </div>
      </section>
    );
  }

  // Grid variant (기본)
  return (
    <section className={className}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            {title}
          </h2>
          {showMoreLink && (
            <a
              href={showMoreLink.href}
              className="text-blue-600 text-sm hover:underline"
            >
              {showMoreLink.label} →
            </a>
          )}
        </div>
      )}
      <div className={cn('grid gap-6', columnClasses[columns])}>
        {articles.map((article) => (
          <NewsCard key={article.id} {...article} variant="default" />
        ))}
      </div>
    </section>
  );
}
