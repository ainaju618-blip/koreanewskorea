/**
 * Skeleton Atom Component
 * WCAG 2.1 AA 준수 스켈레톤 로딩 UI
 *
 * 사용:
 * - 콘텐츠 로딩 중 레이아웃 유지
 * - CLS (Cumulative Layout Shift) 방지
 * - 접근성: reduced-motion 지원
 */

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  /** 스켈레톤 모양 */
  variant?: 'box' | 'text' | 'circle' | 'card';
  /** 16:9, 4:3, 1:1 등 비율 (box/card에서 사용) */
  aspectRatio?: 'video' | 'square' | '4/3' | 'auto';
  /** 애니메이션 활성화 */
  animate?: boolean;
  /** 스크린리더용 설명 */
  label?: string;
}

/**
 * 기본 스켈레톤 컴포넌트
 */
export default function Skeleton({
  className,
  variant = 'box',
  aspectRatio = 'auto',
  animate = true,
  label = '콘텐츠 로딩 중',
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-gray-200 rounded',
    // reduced-motion 지원: 애니메이션 비활성화
    animate && 'animate-pulse motion-reduce:animate-none'
  );

  const aspectClasses = {
    video: 'aspect-video', // 16:9
    square: 'aspect-square', // 1:1
    '4/3': 'aspect-[4/3]',
    auto: '',
  };

  const variantClasses = {
    box: 'rounded-lg',
    text: 'h-4 rounded',
    circle: 'rounded-full',
    card: 'rounded-xl',
  };

  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn(
        baseClasses,
        variantClasses[variant],
        aspectClasses[aspectRatio],
        className
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * 텍스트 라인 스켈레톤
 */
export function SkeletonText({
  lines = 1,
  className,
  animate = true,
}: {
  lines?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded',
            animate && 'animate-pulse motion-reduce:animate-none',
            // 마지막 줄은 75% 너비
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
      <span className="sr-only">텍스트 로딩 중</span>
    </div>
  );
}

/**
 * 뉴스 카드 스켈레톤 (16:9)
 */
export function NewsCardSkeleton({
  variant = 'default',
  className,
}: {
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}) {
  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={cn('flex gap-4 py-4 border-b border-gray-100', className)}
        role="status"
        aria-label="뉴스 카드 로딩 중"
        aria-busy="true"
      >
        {/* 썸네일 */}
        <div className="w-24 h-16 bg-gray-200 rounded-lg animate-pulse motion-reduce:animate-none flex-shrink-0" />
        {/* 콘텐츠 */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-full" />
          <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-2/3" />
          <div className="h-3 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-1/3" />
        </div>
        <span className="sr-only">뉴스 카드 로딩 중</span>
      </div>
    );
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <div
        className={cn('rounded-2xl overflow-hidden border border-gray-200', className)}
        role="status"
        aria-label="뉴스 카드 로딩 중"
        aria-busy="true"
      >
        {/* 16:9 이미지 영역 */}
        <div className="aspect-video bg-gray-200 animate-pulse motion-reduce:animate-none" />
        {/* 콘텐츠 */}
        <div className="p-6 space-y-3">
          <div className="h-7 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-full" />
          <div className="h-7 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-4/5" />
          <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-2/3" />
          <div className="flex gap-3 pt-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-16" />
            <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-20" />
            <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-16" />
          </div>
        </div>
        <span className="sr-only">뉴스 카드 로딩 중</span>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn('rounded-xl overflow-hidden border border-gray-200', className)}
      role="status"
      aria-label="뉴스 카드 로딩 중"
      aria-busy="true"
    >
      {/* 16:9 이미지 영역 */}
      <div className="aspect-video bg-gray-200 animate-pulse motion-reduce:animate-none" />
      {/* 콘텐츠 */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-full animate-pulse motion-reduce:animate-none w-16" />
          <div className="h-5 bg-gray-200 rounded-full animate-pulse motion-reduce:animate-none w-20" />
        </div>
        <div className="h-5 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-full" />
        <div className="h-5 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-1/2" />
      </div>
      <span className="sr-only">뉴스 카드 로딩 중</span>
    </div>
  );
}

/**
 * 히어로 섹션 스켈레톤
 */
export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('mb-10', className)}
      role="status"
      aria-label="히어로 섹션 로딩 중"
      aria-busy="true"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gray-200 rounded animate-pulse motion-reduce:animate-none" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse motion-reduce:animate-none" />
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse motion-reduce:animate-none" />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 메인 이미지 (7 columns) */}
        <div className="lg:col-span-7 aspect-video bg-gray-200 rounded-xl animate-pulse motion-reduce:animate-none" />

        {/* 사이드 리스트 (5 columns) */}
        <div className="lg:col-span-5 bg-gray-50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse motion-reduce:animate-none" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse motion-reduce:animate-none flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-full" />
                <div className="h-3 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">히어로 섹션 로딩 중</span>
    </div>
  );
}

/**
 * 사이드바 스켈레톤
 */
export function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-label="사이드바 로딩 중"
      aria-busy="true"
    >
      {/* 섹션 1 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-1/2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-16 h-12 bg-gray-200 rounded animate-pulse motion-reduce:animate-none flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-full" />
              <div className="h-3 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-2/3" />
            </div>
          </div>
        ))}
      </div>

      {/* 섹션 2 */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-2/3" />
        <div className="h-24 bg-gray-200 rounded animate-pulse motion-reduce:animate-none w-full" />
      </div>
      <span className="sr-only">사이드바 로딩 중</span>
    </div>
  );
}
