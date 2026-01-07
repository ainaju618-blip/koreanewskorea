'use client';

import React from 'react';
import Link from 'next/link';

interface BreakingNews {
  id: string;
  title: string;
  href?: string;
}

interface BreakingNewsBannerProps {
  news?: BreakingNews;
  date?: string;
  className?: string;
}

export default function BreakingNewsBanner({
  news,
  date,
  className = '',
}: BreakingNewsBannerProps) {
  const formattedDate = date || new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).replace(/\. /g, '.').replace('.', '');

  return (
    <div
      className={`bg-white dark:bg-[#1a2230] px-4 py-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 text-xs ${className}`}
    >
      <span className="font-bold font-sans text-gray-600 dark:text-gray-400 shrink-0">
        {formattedDate}
      </span>

      {news && (
        <div className="flex items-center gap-2 overflow-hidden ml-3">
          <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold shrink-0 animate-pulse-red">
            속보
          </span>
          {news.href ? (
            <Link
              href={news.href}
              className="truncate text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              {news.title}
            </Link>
          ) : (
            <span className="truncate text-gray-600 dark:text-gray-400">
              {news.title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
