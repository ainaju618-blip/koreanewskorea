/**
 * NewsCard Molecule Component
 * 뉴스 기사 카드 컴포넌트
 *
 * WCAG 2.1 AA 준수:
 * - 44px 최소 터치 타겟
 * - 4.5:1 색상 대비
 * - 키보드 네비게이션 (focus-visible)
 * - 스크린리더 지원 (aria-label)
 * - reduced-motion 지원
 */

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Badge from '@/components/atoms/Badge';

export interface NewsCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  category?: string;
  regionName?: string;
  author?: string;
  publishedAt: string;
  viewCount?: number;
  href: string;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
  /** LCP 최적화: 뷰포트 내 첫 번째 이미지에 true */
  priority?: boolean;
}

export default function NewsCard({
  id,
  title,
  subtitle,
  imageUrl,
  category,
  regionName,
  author,
  publishedAt,
  viewCount,
  href,
  variant = 'default',
  className,
  priority = false,
}: NewsCardProps) {
  /**
   * 날짜 포맷팅 함수
   * @returns 상대 시간 또는 절대 날짜
   */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;

    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * ISO 8601 날짜 형식 (dateTime 속성용)
   */
  const getISODate = (dateStr: string) => {
    return new Date(dateStr).toISOString();
  };

  // 공통 링크 클래스 (focus-visible 스타일 포함)
  const linkClasses = cn(
    'group block',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'rounded-xl' // ring-offset을 위한 border-radius
  );

  // Featured variant (대형 카드)
  if (variant === 'featured') {
    return (
      <Link
        href={href}
        className={cn(linkClasses, 'rounded-2xl', className)}
        aria-label={`${title} 기사 보기`}
      >
        <article className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 motion-reduce:transition-none">
          {/* 이미지 - 16:9 비율 */}
          <div className="relative aspect-video bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${title} 기사 이미지`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px"
                className="object-cover group-hover:scale-105 transition-transform duration-300 motion-reduce:transform-none"
                priority={priority}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <span className="text-6xl" role="img" aria-hidden="true">
                  📰
                </span>
              </div>
            )}
            {/* 카테고리 오버레이 */}
            {category && (
              <div className="absolute top-4 left-4">
                <Badge variant="primary" size="md">
                  {category}
                </Badge>
              </div>
            )}
          </div>

          {/* 콘텐츠 */}
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2 leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                {subtitle}
              </p>
            )}
            {/* 메타 정보 - 접근성 개선 */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {regionName && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">📍</span>
                  <span>{regionName}</span>
                </span>
              )}
              {author && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">✍️</span>
                  <span>{author}</span>
                </span>
              )}
              <time dateTime={getISODate(publishedAt)}>
                {formatDate(publishedAt)}
              </time>
              {viewCount !== undefined && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">👁️</span>
                  <span>{viewCount.toLocaleString()}회</span>
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Compact variant (리스트 아이템)
  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className={cn(linkClasses, 'rounded-lg', className)}
        aria-label={`${title} 기사 보기`}
      >
        <article className="flex gap-4 py-4 min-h-[64px] border-b border-gray-100 hover:bg-gray-50 transition-colors motion-reduce:transition-none">
          {/* 썸네일 */}
          {imageUrl && (
            <div className="relative w-24 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          )}

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 leading-snug">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
              {regionName && <span>{regionName}</span>}
              <time dateTime={getISODate(publishedAt)}>
                {formatDate(publishedAt)}
              </time>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Default variant (표준 카드 - 16:9 비율)
  return (
    <Link
      href={href}
      className={cn(linkClasses, className)}
      aria-label={`${title} 기사 보기`}
    >
      <article className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 motion-reduce:transition-none">
        {/* 이미지 - 16:9 비율 */}
        <div className="relative aspect-video bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300 motion-reduce:transform-none"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <span className="text-4xl" role="img" aria-hidden="true">
                📰
              </span>
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="p-4">
          {/* 태그 */}
          <div className="flex flex-wrap gap-2 mb-2">
            {category && (
              <Badge variant="primary" size="sm">
                {category}
              </Badge>
            )}
            {regionName && (
              <Badge variant="default" size="sm">
                <span aria-hidden="true">📍</span> {regionName}
              </Badge>
            )}
          </div>

          {/* 제목 */}
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2 leading-snug">
            {title}
          </h3>

          {/* 부제목 */}
          {subtitle && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* 메타 정보 */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {author && <span>{author}</span>}
            <time dateTime={getISODate(publishedAt)}>
              {formatDate(publishedAt)}
            </time>
          </div>
        </div>
      </article>
    </Link>
  );
}
