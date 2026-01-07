'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface BreakingNewsItem {
  id: string | number;
  title: string;
  href?: string;
}

interface BreakingNewsTickerProps {
  /** List of breaking news items */
  items: BreakingNewsItem[];
  /** Badge text */
  badgeText?: string;
  /** Auto-rotate interval in milliseconds (0 to disable) */
  autoRotateInterval?: number;
  /** Callback when a news item is clicked */
  onItemClick?: (item: BreakingNewsItem) => void;
  /** Additional CSS classes */
  className?: string;
}

export default function BreakingNewsTicker({
  items,
  badgeText = 'Breaking',
  autoRotateInterval = 5000,
  onItemClick,
  className = '',
}: BreakingNewsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  }, [items.length]);

  // Auto-rotate effect
  useEffect(() => {
    if (autoRotateInterval <= 0 || items.length <= 1) return;

    const timer = setInterval(() => {
      goToNext();
    }, autoRotateInterval);

    return () => clearInterval(timer);
  }, [autoRotateInterval, items.length, goToNext]);

  // Reset index when items change
  useEffect(() => {
    setCurrentIndex(0);
  }, [items]);

  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick(currentItem);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-[#151c24] border-b border-gray-100 dark:border-gray-800 ${className}`}
    >
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-4">
        {/* Badge */}
        <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md animate-pulse shrink-0">
          {badgeText}
        </span>

        {/* News Content */}
        <p
          onClick={handleItemClick}
          className="text-sm font-medium text-[#111418] dark:text-white truncate cursor-pointer hover:underline flex-1"
          role={currentItem.href ? 'link' : 'text'}
        >
          {currentItem.title}
        </p>

        {/* Navigation Controls */}
        {items.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Counter */}
            <span className="text-xs text-gray-400 mr-2">
              {currentIndex + 1} / {items.length}
            </span>

            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Previous news"
            >
              <span className="material-symbols-outlined text-[20px] text-[#60708a] dark:text-gray-400">
                chevron_left
              </span>
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Next news"
            >
              <span className="material-symbols-outlined text-[20px] text-[#60708a] dark:text-gray-400">
                chevron_right
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
