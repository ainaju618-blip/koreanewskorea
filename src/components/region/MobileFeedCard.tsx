'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Share2, Bookmark, MoreHorizontal, Clock, Eye } from 'lucide-react';
import type { NewsArticle } from '@/types/region';
import { getCategoryStyle, formatRelativeTime } from '@/types/region';

interface MobileFeedCardProps {
  article: NewsArticle;
  onShare?: (article: NewsArticle) => void;
  onBookmark?: (article: NewsArticle) => void;
}

/**
 * 모바일 피드 카드 컴포넌트
 * 모바일 최적화 - 요약, 인터랙션, 터치 영역 강화
 */
export default function MobileFeedCard({ article, onShare, onBookmark }: MobileFeedCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const style = getCategoryStyle(article.category);

  // 요약 텍스트 가져오기
  const getSummary = (): string => {
    if (article.summary) {
      // HTML 태그 제거하고 반환
      const plainText = article.summary.replace(/<[^>]*>/g, '').trim();
      return plainText.length > 100 ? plainText.slice(0, 100) + '...' : plainText;
    }
    // summary가 없으면 제목 기반으로 간단한 설명 생성
    return `${article.source || '뉴스'}에서 전하는 ${article.category || '최신'} 소식입니다.`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: getSummary(),
          url: `/news/${article.id}`,
        });
      } catch (err) {
        // 사용자가 공유 취소함
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(`${window.location.origin}/news/${article.id}`);
      // TODO: 토스트 메시지 표시
    }
    onShare?.(article);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.(article);
  };

  const handleMore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: 더보기 메뉴 표시
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
      <Link href={`/news/${article.id}`} className="block">
        {/* 썸네일 이미지 (16:9 비율) */}
        {article.thumbnail && (
          <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.thumbnail}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {/* 카테고리 배지 - 이미지 위에 오버레이 */}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-sm ${style.color} bg-white/90 dark:bg-gray-900/90`}>
                {style.emoji} {article.category || '뉴스'}
              </span>
            </div>
          </div>
        )}

        {/* 컨텐츠 영역 */}
        <div className="p-4">
          {/* 썸네일 없을 때 카테고리 배지 */}
          {!article.thumbnail && (
            <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full mb-2 ${style.color}`}>
              {style.emoji} {article.category || '뉴스'}
            </span>
          )}

          {/* 제목 */}
          <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-2">
            {article.title}
          </h3>

          {/* 요약 텍스트 */}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
            {getSummary()}
          </p>

          {/* 메타 정보 */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(article.publishedAt)}
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>{article.source || '뉴스'}</span>
            {article.viewCount && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {article.viewCount.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* 인터랙션 버튼 영역 (링크 밖에 위치) */}
      <div className="px-4 pb-4 pt-0 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 -mt-1 pt-3">
        <div className="flex items-center gap-1">
          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-gray-500 dark:text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
            aria-label="공유하기"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium">공유</span>
          </button>

          {/* 북마크 버튼 */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg transition-colors ${
              isBookmarked
                ? 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/30'
                : 'text-gray-500 dark:text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
            }`}
            aria-label={isBookmarked ? '북마크 해제' : '북마크'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">저장</span>
          </button>
        </div>

        {/* 더보기 버튼 */}
        <button
          onClick={handleMore}
          className="p-2 min-w-[44px] min-h-[44px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="더보기"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
