import Link from 'next/link';
import type { NewsArticle } from '@/types/region';
import { getCategoryStyle, formatRelativeTime } from '@/types/region';

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'default' | 'featured';
}

/**
 * 뉴스 카드 컴포넌트
 * SSR 가능 - 서버 컴포넌트에서 사용 가능
 *
 * variant:
 * - default: 작은 썸네일 (기존)
 * - featured: 모바일에서 큰 이미지 상단 배치
 */
export default function NewsCard({ article, variant = 'default' }: NewsCardProps) {
  const style = getCategoryStyle(article.category);

  // Featured 카드 (모바일: 큰 이미지 상단)
  if (variant === 'featured') {
    return (
      <Link
        href={`/news/${article.id}`}
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer block"
      >
        {/* 모바일: 큰 이미지 상단 */}
        {article.thumbnail && (
          <div className="md:hidden w-full aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.thumbnail}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* 모바일: 텍스트만 / 데스크톱: 기존 레이아웃 */}
        <div className="p-3">
          {/* 데스크톱: 기존 가로 레이아웃 */}
          <div className="hidden md:flex gap-4">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mb-2 ${style.color}`}>
                  {style.emoji} {article.category || '뉴스'}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1">
                  {article.title}
                </h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                {formatRelativeTime(article.publishedAt)} · {article.source || '뉴스'}
              </p>
            </div>
            {article.thumbnail && (
              <div className="w-[156px] h-[88px] shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden relative aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>

          {/* 모바일: 세로 레이아웃 (이미지 위, 텍스트 아래) */}
          <div className="md:hidden">
            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mb-2 ${style.color}`}>
              {style.emoji} {article.category || '뉴스'}
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-2">
              {article.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {formatRelativeTime(article.publishedAt)} · {article.source || '뉴스'}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Default 카드 (기존 레이아웃)
  return (
    <Link
      href={`/news/${article.id}`}
      className="bg-white dark:bg-gray-800 rounded-xl pt-3 px-3 pb-[7px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer block"
    >
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mb-2 ${style.color}`}>
              {style.emoji} {article.category || '뉴스'}
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1">
              {article.title}
            </h3>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
            {formatRelativeTime(article.publishedAt)} · {article.source || '뉴스'}
          </p>
        </div>
        {article.thumbnail && (
          <div className="w-[100px] h-[70px] md:w-[156px] md:h-[88px] shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
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
