'use client';

import React from 'react';
import Link from 'next/link';

interface PopularNewsItem {
  id: string;
  title: string;
  href: string;
  viewCount?: number;
}

interface PopularNewsSidebarProps {
  title?: string;
  news?: PopularNewsItem[];
  maxItems?: number;
  className?: string;
}

const defaultNews: PopularNewsItem[] = [
  { id: '1', title: '정부, 새로운 경제 활성화 정책 발표...시장 반응 주목', href: '/news/1' },
  { id: '2', title: '서울 아파트값 상승세 지속...전문가들 "신중한 접근 필요"', href: '/news/2' },
  { id: '3', title: '국내 IT 기업들, AI 투자 경쟁 본격화', href: '/news/3' },
  { id: '4', title: '기상청 "이번 주 전국 대부분 맑음...일교차 주의"', href: '/news/4' },
  { id: '5', title: '프로야구 시즌 개막, 팬들의 관심 집중', href: '/news/5' },
];

export default function PopularNewsSidebar({
  title = '실시간 인기 뉴스',
  news = defaultNews,
  maxItems = 5,
  className = '',
}: PopularNewsSidebarProps) {
  const displayNews = news.slice(0, maxItems);

  return (
    <div
      className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{title}</h3>
      <ol className="flex flex-col gap-4">
        {displayNews.map((item, index) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-start gap-3 group cursor-pointer"
            >
              <span
                className={`text-xl font-bold italic font-serif min-w-[1.5rem] ${
                  index < 3
                    ? 'text-primary dark:text-primary-light'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {index + 1}
              </span>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:underline group-hover:text-primary dark:group-hover:text-primary-light line-clamp-2">
                {item.title}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
