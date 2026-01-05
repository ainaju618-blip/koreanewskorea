'use client';

/**
 * NativeAdSlot - 네이티브 광고 슬롯
 * ==================================
 * 뉴스 피드와 유사한 디자인의 광고 컴포넌트
 *
 * variant:
 * - card: 뉴스 카드 형태 (16:9 이미지)
 * - banner: 와이드 배너 형태
 * - inline: 텍스트 인라인 형태
 */

interface NativeAdSlotProps {
  variant?: 'card' | 'banner' | 'inline';
  position: string;
  className?: string;
}

export default function NativeAdSlot({
  variant = 'card',
  position,
  className,
}: NativeAdSlotProps) {
  // Card variant - 뉴스 카드 형태
  if (variant === 'card') {
    return (
      <div
        className={`bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden border border-slate-200 ${className || ''}`}
        data-ad-position={position}
      >
        {/* 이미지 영역 */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/80 shadow-inner flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-300">AD</span>
            </div>
            <p className="text-sm text-slate-400">광고 영역</p>
          </div>
          {/* 광고 라벨 */}
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-500/80 text-white text-[10px] font-medium rounded">
            광고
          </span>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="p-4">
          <p className="text-sm text-slate-500 mb-2">
            이 공간에 광고가 표시됩니다
          </p>
          <p className="text-xs text-slate-400">
            광고 문의: 010-2631-3865
          </p>
        </div>
      </div>
    );
  }

  // Banner variant - 와이드 배너
  if (variant === 'banner') {
    return (
      <div
        className={`bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 rounded-xl border border-slate-200 py-6 px-8 ${className || ''}`}
        data-ad-position={position}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
              <span className="text-lg font-bold text-slate-300">AD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">
                이 공간에 브랜드 메시지를 전달하세요
              </p>
              <p className="text-xs text-slate-400 mt-1">
                배너 광고 영역 | 광고 문의: 010-2631-3865
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-medium rounded">
            광고
          </span>
        </div>
      </div>
    );
  }

  // Inline variant - 텍스트 인라인
  return (
    <div
      className={`bg-slate-50 border-l-4 border-slate-300 px-4 py-3 rounded-r-lg ${className || ''}`}
      data-ad-position={position}
    >
      <div className="flex items-center gap-3">
        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-medium rounded">
          AD
        </span>
        <p className="text-sm text-slate-500">
          광고 영역 | 문의: 010-2631-3865
        </p>
      </div>
    </div>
  );
}

// Skeleton
export function NativeAdSlotSkeleton({ variant = 'card' }: { variant?: 'card' | 'banner' | 'inline' }) {
  if (variant === 'card') {
    return (
      <div className="bg-slate-100 rounded-xl overflow-hidden">
        <div className="aspect-[16/9] bg-slate-200 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
  );
}
