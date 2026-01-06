import Link from 'next/link';
import type { NewsArticle } from '@/types/region';
import { getCategoryStyle, formatRelativeTime } from '@/types/region';

interface NewsCardProps {
  article: NewsArticle;
}

/**
 * 뉴스 카드 컴포넌트
 * SSR 가능 - 서버 컴포넌트에서 사용 가능
 */
export default function NewsCard({ article }: NewsCardProps) {
  const style = getCategoryStyle(article.category);

  return (
    <Link
      href={`/news/${article.id}`}
      className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block"
    >
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mb-2 ${style.color}`}>
              {style.emoji} {article.category || '뉴스'}
            </span>
            <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
              {article.title}
            </h3>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {formatRelativeTime(article.publishedAt)} · {article.source || '뉴스'}
          </p>
        </div>
        {article.thumbnail && (
          <div className="w-[156px] h-[88px] shrink-0 rounded-lg bg-gray-200 overflow-hidden relative aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.thumbnail}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
