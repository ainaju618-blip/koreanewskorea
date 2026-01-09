'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Megaphone, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { NewsArticle, NewsCategory } from '@/types/region';
import { SIGUNGU_NEWS_TABS } from '@/types/region';
import NewsCard from './NewsCard';
import MobileFeedCard from './MobileFeedCard';

interface NewsTabsProps {
  regionCode: string;
  regionName: string;
  articles: NewsArticle[];
  isLoading?: boolean;
}

const INITIAL_ITEMS = 5;
const LOAD_MORE_ITEMS = 5;

// 모바일에서 기본 표시할 탭 (3개)
const MOBILE_PRIMARY_TABS: NewsCategory[] = ['all', 'government', 'council'];

/**
 * 뉴스 탭 컴포넌트
 * 모바일 최적화: 더보기 버튼 + 탭 축소
 */
export default function NewsTabs({ regionCode, regionName, articles, isLoading }: NewsTabsProps) {
  const [activeTab, setActiveTab] = useState<NewsCategory>('all');
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const [showAllTabs, setShowAllTabs] = useState(false);

  // Filter articles by category
  const filterArticles = (article: NewsArticle): boolean => {
    if (activeTab === 'all') return true;

    const source = article.source?.toLowerCase() || '';
    const category = article.category?.toLowerCase() || '';

    switch (activeTab) {
      case 'government':
        return ['행정', '안전', '건설', '환경', '복지', '보도자료', '시정', '경제', '문화'].includes(article.category)
          || source.includes('시청') || source.includes('군청') || source.includes('시장') || source.includes('군수');
      case 'council':
        return category === '의회' || source.includes('의회') || source.includes('의원');
      case 'emd':
        const emdTitle = article.title?.toLowerCase() || '';
        return category === '읍면동' || source.includes('읍') || source.includes('면') || source.includes('동')
          || emdTitle.includes('읍') || emdTitle.includes('면') || emdTitle.includes('동');
      case 'education':
        const isEducation = category === '교육' || source.includes('교육') || source.includes('학교');
        const title = article.title?.toLowerCase() || '';
        const hasNaju = title.includes('나주') || source.includes('나주');
        return isEducation && hasNaju;
      case 'business':
        return category === '기업' || category === '경제' || source.includes('기업') || source.includes('경제');
      case 'local':
        return category === '동네' || category === '지역' || source.includes('동네') || source.includes('마을');
      default:
        return true;
    }
  };

  const filteredArticles = articles.filter(filterArticles);
  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  // 탭 변경 시 초기화
  const handleTabChange = (tabId: NewsCategory) => {
    setActiveTab(tabId);
    setVisibleCount(INITIAL_ITEMS);
  };

  // 더보기 클릭
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + LOAD_MORE_ITEMS);
  };

  // 모바일용 탭 분류
  const primaryTabs = SIGUNGU_NEWS_TABS.filter(tab => MOBILE_PRIMARY_TABS.includes(tab.id));
  const secondaryTabs = SIGUNGU_NEWS_TABS.filter(tab => !MOBILE_PRIMARY_TABS.includes(tab.id));

  return (
    <section className="px-4 mb-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-cyan-500" />
          {regionName} 주요 소식
        </h2>
{/* 더보기 링크 제거 - 현재 페이지에서 뉴스 표시 중 */}
      </div>

      {/* Category Tabs - 모바일 최적화 */}
      <div className="mb-4">
        {/* 모바일: 3개 탭 + 더보기 버튼 */}
        <div className="flex gap-2 md:hidden">
          {primaryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all ${
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
          {/* 더보기 토글 버튼 */}
          <button
            onClick={() => setShowAllTabs(!showAllTabs)}
            className={`flex items-center gap-1 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all ${
              showAllTabs || secondaryTabs.some(t => t.id === activeTab)
                ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            <span>더보기</span>
            {showAllTabs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* 모바일: 확장 탭 영역 */}
        {showAllTabs && (
          <div className="flex flex-wrap gap-2 mt-2 md:hidden">
            {secondaryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  handleTabChange(tab.id);
                  setShowAllTabs(false);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={tab.description}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 데스크톱: 모든 탭 표시 */}
        <div className="hidden md:flex gap-2 overflow-x-auto hide-scrollbar pb-1">
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
          {visibleArticles.length > 0 ? (
            <>
              {/* 모바일: MobileFeedCard 사용 */}
              <div className="flex flex-col gap-4 md:hidden">
                {visibleArticles.map((article) => (
                  <MobileFeedCard key={article.id} article={article} />
                ))}
              </div>
              {/* 데스크톱: NewsCard 사용 */}
              <div className="hidden md:flex md:flex-col gap-4">
                {visibleArticles.map((article, index) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    variant={index === 0 ? 'featured' : 'default'}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>해당 카테고리의 소식이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 더보기 버튼 */}
      {!isLoading && hasMore && (
        <button
          onClick={handleLoadMore}
          className="w-full mt-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>더 많은 뉴스 보기</span>
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* 모두 봤을 때 */}
      {!isLoading && !hasMore && filteredArticles.length > INITIAL_ITEMS && (
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-4 py-2">
          모든 뉴스를 확인했습니다
        </p>
      )}
    </section>
  );
}
