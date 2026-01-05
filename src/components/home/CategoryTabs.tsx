'use client';

import { useState } from 'react';
import { Newspaper, Building2, GraduationCap, Heart, Cpu, MapPin, TrendingUp, type LucideIcon } from 'lucide-react';

/**
 * CategoryTabs - 카테고리 탭 네비게이션
 * =========================================
 * 뉴스 카테고리별 필터링 탭 UI
 *
 * WCAG 2.1 AA 준수:
 * - role="tablist" 시맨틱
 * - 키보드 화살표 네비게이션
 * - aria-selected 상태
 */

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: '전체', icon: Newspaper, color: '#A6121D' },
  { id: 'politics', name: '정치·경제', icon: Building2, color: '#2563EB' },
  { id: 'education', name: '교육·문화', icon: GraduationCap, color: '#7C3AED' },
  { id: 'society', name: '사회·복지', icon: Heart, color: '#059669' },
  { id: 'tech', name: 'AI·과학', icon: Cpu, color: '#EA580C' },
  { id: 'region', name: '지역', icon: MapPin, color: '#EC4899' },
  { id: 'trending', name: '인기', icon: TrendingUp, color: '#DC2626' },
];

interface CategoryTabsProps {
  activeCategory?: string;
  onTabChange?: (categoryId: string) => void;
  className?: string;
}

export default function CategoryTabs({
  activeCategory = 'all',
  onTabChange,
  className,
}: CategoryTabsProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % CATEGORIES.length;
      setFocusedIndex(nextIndex);
      (document.getElementById(`tab-${CATEGORIES[nextIndex].id}`) as HTMLElement)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + CATEGORIES.length) % CATEGORIES.length;
      setFocusedIndex(prevIndex);
      (document.getElementById(`tab-${CATEGORIES[prevIndex].id}`) as HTMLElement)?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTabChange?.(CATEGORIES[index].id);
    }
  };

  return (
    <div className={`bg-white border-b border-slate-200 ${className || ''}`}>
      <div className="w-full max-w-[1400px] mx-auto px-4">
        <div
          role="tablist"
          aria-label="뉴스 카테고리"
          className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                id={`tab-${category.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${category.id}`}
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => onTabChange?.(category.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={() => setFocusedIndex(index)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={{
                  backgroundColor: isActive ? category.color : undefined,
                } as React.CSSProperties}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// Skeleton for loading
export function CategoryTabsSkeleton() {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="w-full max-w-[1400px] mx-auto px-4 py-2">
        <div className="flex items-center gap-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-24 h-10 bg-slate-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
