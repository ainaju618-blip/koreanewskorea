'use client';

import { getCategoryStyle } from '@/lib/category-constants';
import { CategoryIcon } from './CategoryIcon';

interface NoImageCardProps {
  category?: string | null;
  className?: string;
}

export function NoImageCard({ category, className = '' }: NoImageCardProps) {
  const style = getCategoryStyle(category);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${style.gradient} ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id={`pattern-${category || 'default'}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#pattern-${category || 'default'})`} />
        </svg>
      </div>

      {/* Decorative Circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full" />

      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <CategoryIcon iconName={style.iconName} className="w-16 h-16 text-white/25" />
      </div>

      {/* Category Badge */}
      {category && (
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 bg-black/30 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            {category}
          </span>
        </div>
      )}
    </div>
  );
}
