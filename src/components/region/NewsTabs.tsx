'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Megaphone, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NewsArticle, NewsCategory } from '@/types/region';
import { SIGUNGU_NEWS_TABS, getCategoryStyle, formatRelativeTime } from '@/types/region';
import NewsCard from './NewsCard';

interface NewsTabsProps {
  regionCode: string;
  regionName: string;
  articles: NewsArticle[];
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 5;

/**
 * 뉴스 탭 컴포넌트
 * 3단계 정규화: 시군청 / 시군의회 / 교육청
 */
export default function NewsTabs({ regionCode, regionName, articles, isLoading }: NewsTabsProps) {
  const [activeTab, setActiveTab] = useState<NewsCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter articles by category
  const filterArticles = (article: NewsArticle): boolean => {
    if (activeTab === 'all') return true;

    const source = article.source?.toLowerCase() || '';
    const category = article.category?.toLowerCase() || '';

    switch (activeTab) {
      case 'government':
        // 시군청 보도자료
        return ['행정', '안전', '건설', '환경', '복지', '보도자료', '시정', '경제', '문화'].includes(article.category)
          || source.includes('시청') || source.includes('군청') || source.includes('시장') || source.includes('군수');
      case 'council':
        // 시군의회 보도자료
        return category === '의회' || source.includes('의회') || source.includes('의원');
      case 'emd':
        // 읍면동 보도자료
        const emdTitle = article.title?.toLowerCase() || '';
        return category === '읍면동' || source.includes('읍') || source.includes('면') || source.includes('동') 
          || emdTitle.includes('읍') || emdTitle.includes('면') || emdTitle.includes('동');
      case 'education':
        // 지역교육지원청 보도자료 (나주 관련만)
        const isEducation = category === '교육' || source.includes('교육') || source.includes('학교');
        const title = article.title?.toLowerCase() || '';
        const hasNaju = title.includes('나주') || source.includes('나주');
        return isEducation && hasNaju;
      case 'business':
        // 기업 보도자료
        return category === '기업' || category === '경제' || source.includes('기업') || source.includes('경제');
      case 'local':
        // 오피니언
        return category === '동네' || category === '지역' || source.includes('동네') || source.includes('마을');
      default:
        return true;
    }
  };

  const filteredArticles = articles.filter(filterArticles);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 탭 변경 시 페이지 리셋
  const handleTabChange = (tabId: NewsCategory) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  return (
    <section className="px-4 mb-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-cyan-500" />
          {regionName} 주요 소식
        </h2>
        {articles.length > 0 && (
          <Link
            href={`/region/${regionCode}/news`}
            className="text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-cyan-500"
          >
            더보기 &gt;
          </Link>
        )}
      </div>

      {/* Category Tabs - 3단계 정규화 */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
        {SIGUNGU_NEWS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-200 dark:shadow-cyan-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={tab.description}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
          <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">뉴스를 불러오는 중...</span>
        </div>
      )}

      {/* Articles List */}
      {!isLoading && (
        <div className="flex flex-col gap-4">
          {paginatedArticles.length > 0 ? (
            paginatedArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>해당 카테고리의 소식이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 UI */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pb-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}
