'use client';

import { useState } from 'react';
import Link from 'next/link';

// =============================================================================
// Types
// =============================================================================

interface SearchResultsProps {
  searchQuery: string;
  resultCount: number;
  onBack?: () => void;
  onSearch?: (query: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  categoryColor: 'blue' | 'gray' | 'green' | 'purple';
  source: string;
  timeAgo: string;
  imageUrl?: string;
  imageType?: 'thumbnail' | 'large';
  badge?: string;
}

type FilterType = 'all' | 'news' | 'region' | 'tag' | 'opinion';
type SortType = 'relevance' | 'latest' | 'popular';

// =============================================================================
// Sub-Components
// =============================================================================

// SearchHeader Component
function SearchHeader({
  searchQuery,
  onBack,
  onSearch,
  onClear,
}: {
  searchQuery: string;
  onBack?: () => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;
}) {
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    onClear?.();
  };

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <button
        onClick={onBack}
        aria-label="Go back"
        className="flex items-center justify-center text-[#111318] dark:text-white"
      >
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>
      <form onSubmit={handleSubmit} className="flex flex-1 h-11 relative">
        <div className="flex w-full items-stretch rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-[#616f89] dark:text-gray-400 flex items-center justify-center pl-3">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex w-full min-w-0 flex-1 bg-transparent border-none focus:ring-0 text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-500 px-3 text-base font-normal leading-normal"
            placeholder="Search..."
          />
          {inputValue && (
            <div className="flex items-center justify-center pr-3">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center text-[#616f89] dark:text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

// ResultInfo Component
function ResultInfo({
  searchQuery,
  resultCount,
  sortType,
  onSortChange,
}: {
  searchQuery: string;
  resultCount: number;
  sortType: SortType;
  onSortChange?: (sort: SortType) => void;
}) {
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortLabels: Record<SortType, string> = {
    relevance: '관련도순',
    latest: '최신순',
    popular: '인기순',
  };

  return (
    <div className="px-4 py-2 flex justify-between items-center">
      <h2 className="text-[#111318] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
        &apos;<span className="text-primary">{searchQuery}</span>&apos; 검색 결과{' '}
        {resultCount.toLocaleString()}건
      </h2>
      <div className="relative">
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="flex items-center gap-1 text-sm text-[#616f89] dark:text-gray-400 font-medium"
        >
          {sortLabels[sortType]}
          <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </button>
        {showSortMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[100px] z-10">
            {(Object.keys(sortLabels) as SortType[]).map((sort) => (
              <button
                key={sort}
                onClick={() => {
                  onSortChange?.(sort);
                  setShowSortMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  sortType === sort
                    ? 'text-primary font-medium'
                    : 'text-[#111318] dark:text-gray-200'
                }`}
              >
                {sortLabels[sort]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// FilterChips Component
function FilterChips({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}) {
  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'news', label: '뉴스' },
    { id: 'region', label: '지역' },
    { id: 'tag', label: '태그' },
    { id: 'opinion', label: '오피니언' },
  ];

  return (
    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange?.(filter.id)}
          className={`flex h-9 shrink-0 items-center justify-center rounded-full px-4 shadow-sm transition-all ${
            activeFilter === filter.id
              ? 'bg-primary text-white border border-primary'
              : 'bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <p className={`text-sm leading-normal ${activeFilter === filter.id ? 'font-bold' : 'font-medium'}`}>
            {filter.label}
          </p>
        </button>
      ))}
    </div>
  );
}

// SearchResultCard Component
function SearchResultCard({
  result,
  searchQuery,
}: {
  result: SearchResult;
  searchQuery: string;
}) {
  const categoryColorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 ring-blue-700/10',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-500/10',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-green-600/20',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-purple-700/10',
  };

  // Highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="text-primary bg-primary/10 dark:bg-primary/30 rounded px-0.5 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Large image card
  if (result.imageType === 'large') {
    return (
      <article className="flex flex-col gap-3 rounded-xl bg-white dark:bg-gray-800 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700">
        <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 relative">
          {result.imageUrl && (
            <div
              className="w-full h-full bg-center bg-cover"
              style={{ backgroundImage: `url("${result.imageUrl}")` }}
              role="img"
              aria-label={result.title}
            />
          )}
          {result.badge && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
              {result.badge}
            </div>
          )}
        </div>
        <div className="p-4 pt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${categoryColorClasses[result.categoryColor]}`}
            >
              {result.category}
            </span>
            <span className="text-xs text-[#616f89] dark:text-gray-400">
              {result.source} &bull; {result.timeAgo}
            </span>
          </div>
          <h3 className="text-[#111318] dark:text-gray-100 text-lg font-bold leading-snug font-display">
            {highlightText(result.title, searchQuery)}
          </h3>
          <p className="text-[#616f89] dark:text-gray-400 text-sm font-normal leading-relaxed line-clamp-2 font-sans">
            {highlightText(result.excerpt, searchQuery)}
          </p>
        </div>
      </article>
    );
  }

  // Thumbnail card or text-only card
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-white dark:bg-gray-800 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700">
      <div className={`flex ${result.imageUrl ? 'items-start justify-between gap-4' : 'flex-col gap-2'}`}>
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${categoryColorClasses[result.categoryColor]}`}
            >
              {result.category}
            </span>
            <span className="text-xs text-[#616f89] dark:text-gray-400">
              {result.source} &bull; {result.timeAgo}
            </span>
          </div>
          <h3 className="text-[#111318] dark:text-gray-100 text-lg font-bold leading-snug font-display">
            {highlightText(result.title, searchQuery)}
          </h3>
          <p className="text-[#616f89] dark:text-gray-400 text-sm font-normal leading-relaxed line-clamp-2 font-sans">
            {highlightText(result.excerpt, searchQuery)}
          </p>
        </div>
        {result.imageUrl && result.imageType === 'thumbnail' && (
          <div className="w-24 h-24 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="w-full h-full bg-center bg-cover"
              style={{ backgroundImage: `url("${result.imageUrl}")` }}
              role="img"
              aria-label={result.title}
            />
          </div>
        )}
      </div>
    </article>
  );
}

// SearchResultList Component
function SearchResultList({
  results,
  searchQuery,
  onLoadMore,
  hasMore = true,
}: {
  results: SearchResult[];
  searchQuery: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) {
  return (
    <main className="flex flex-col gap-4 p-4">
      {results.map((result, index) => (
        <div key={result.id}>
          {/* Divider before large image cards (except first) */}
          {index > 0 && result.imageType === 'large' && (
            <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-1 mb-4" />
          )}
          <SearchResultCard result={result} searchQuery={searchQuery} />
        </div>
      ))}

      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-3 mt-2 rounded-lg bg-white dark:bg-gray-800 text-primary font-medium text-sm border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          더보기
          <span className="material-symbols-outlined text-lg">expand_more</span>
        </button>
      )}
    </main>
  );
}

// BottomNav Component
function BottomNav({ activeTab = 'search' }: { activeTab?: string }) {
  const navItems = [
    { id: 'home', icon: 'home', label: '홈', href: '/' },
    { id: 'search', icon: 'search', label: '검색', href: '/search' },
    { id: 'bookmarks', icon: 'bookmark', label: '저장', href: '/bookmarks' },
    { id: 'notifications', icon: 'notifications', label: '알림', href: '/notifications', badge: true },
    { id: 'profile', icon: 'person', label: 'MY', href: '/mypage' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#101622] border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-end pb-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 w-12 group ${
                item.badge ? 'relative' : ''
              }`}
            >
              {item.badge && (
                <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500" />
              )}
              <span
                className={`material-symbols-outlined text-[24px] ${
                  isActive
                    ? 'text-primary fill-current'
                    : 'text-[#616f89] group-hover:text-primary transition-colors'
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-sans ${
                  isActive
                    ? 'font-bold text-primary'
                    : 'font-medium text-[#616f89] group-hover:text-primary transition-colors'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function SearchResults({
  searchQuery,
  resultCount,
  onBack,
  onSearch,
}: SearchResultsProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('relevance');

  // Mock data for demonstration
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: `2024년 글로벌 ${searchQuery} 전망 보고서 발표`,
      excerpt: `세계 ${searchQuery}가 회복세를 보일 것으로 예상되며 인플레이션 둔화와 금리 인하 가능성이 제기되고 있습니다. 주요국 중앙은행의 정책 변화가 주목됩니다.`,
      category: searchQuery,
      categoryColor: 'blue',
      source: '한국일보',
      timeAgo: '2시간 전',
      imageUrl: 'https://via.placeholder.com/96x96',
      imageType: 'thumbnail',
    },
    {
      id: '2',
      title: `코스피, 외국인 매수세 유입에 ${searchQuery} 지표 호조로 상승 마감`,
      excerpt: `투자자들이 주요 ${searchQuery} 지표를 주시하며 외국인 매수세가 대거 유입되어 코스피가 전일 대비 1.5% 상승하며 거래를 마쳤습니다. 반도체 관련주가 강세를 보였습니다.`,
      category: '증권',
      categoryColor: 'gray',
      source: '매일경제',
      timeAgo: '4시간 전',
    },
    {
      id: '3',
      title: `골목상권 살리기 프로젝트, 지역 ${searchQuery} 활성화의 열쇠 될까`,
      excerpt: `전통시장과 골목상권을 연계한 새로운 소비 촉진 캠페인이 시작되었습니다. 지역 ${searchQuery}에 활력을 불어넣을 수 있을지 귀추가 주목됩니다.`,
      category: '생활',
      categoryColor: 'green',
      source: '연합뉴스',
      timeAgo: '5시간 전',
      imageUrl: 'https://via.placeholder.com/640x360',
      imageType: 'large',
      badge: '포토',
    },
    {
      id: '4',
      title: `[사설] 저출산 문제와 미래 ${searchQuery} 성장 동력`,
      excerpt: `인구 감소가 ${searchQuery} 구조에 미칠 영향을 분석하고 실질적인 대책을 마련해야 할 시점입니다.`,
      category: '칼럼',
      categoryColor: 'purple',
      source: '조선일보',
      timeAgo: '1일 전',
    },
  ];

  const handleLoadMore = () => {
    // Load more results
    console.log('Load more results');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-x-hidden pb-20 min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <SearchHeader
          searchQuery={searchQuery}
          onBack={onBack}
          onSearch={onSearch}
          onClear={() => onSearch?.('')}
        />
        {/* Filter & Sort Section */}
        <div className="flex flex-col pb-2">
          <ResultInfo
            searchQuery={searchQuery}
            resultCount={resultCount}
            sortType={sortType}
            onSortChange={setSortType}
          />
          <FilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </div>
      </header>

      {/* Search Results */}
      <SearchResultList
        results={mockResults}
        searchQuery={searchQuery}
        onLoadMore={handleLoadMore}
        hasMore={true}
      />

      {/* Bottom Navigation */}
      <BottomNav activeTab="search" />

      {/* Safe Area Spacer for Bottom Nav */}
      <div className="h-20 w-full" />
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export {
  SearchHeader,
  ResultInfo,
  FilterChips,
  SearchResultCard,
  SearchResultList,
  BottomNav,
};

export type {
  SearchResultsProps,
  SearchResult,
  FilterType,
  SortType,
};
