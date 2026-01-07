'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================
// Types
// ============================================
interface NewsItem {
  id: string;
  title: string;
  summary: string;
  thumbnailUrl?: string;
  source: string;
  timeAgo: string;
  subCategory?: string;
  isFeatured?: boolean;
}

interface NativeAd {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  sponsor: string;
}

interface CategoryPageProps {
  categoryName: string;
  filterChips?: string[];
  news?: NewsItem[];
  nativeAd?: NativeAd;
  onBack?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
  onLoadMore?: () => void;
}

// ============================================
// Default Data
// ============================================
const DEFAULT_FILTER_CHIPS = ['전체', '국회', '대통령실', '행정', '외교', '국방'];

// ============================================
// Sub Components
// ============================================

// Sticky Header Component
function StickyHeader({
  title,
  onBack,
  onSearch,
  onFilter,
}: {
  title: string;
  onBack?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 h-14">
      <button
        onClick={onBack}
        className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
        aria-label="Go back"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-1">
        <button
          onClick={onSearch}
          className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
          aria-label="Search"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
        <button
          onClick={onFilter}
          className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
          aria-label="Filter options"
        >
          <span className="material-symbols-outlined">tune</span>
        </button>
      </div>
    </div>
  );
}

// Filter Chips Component
function FilterChips({
  chips,
  activeChip,
  onChipClick,
}: {
  chips: string[];
  activeChip: string;
  onChipClick: (chip: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#101622]">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onChipClick(chip)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeChip === chip
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

// Sort Bar Component
function SortBar({
  sortBy,
  onSortChange,
}: {
  sortBy: string;
  onSortChange?: (sort: string) => void;
}) {
  return (
    <div className="flex items-center justify-end px-4 py-2 bg-background-light dark:bg-background-dark">
      <button
        onClick={() => onSortChange?.('latest')}
        className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400"
      >
        <span className="material-symbols-outlined text-[16px]">sort</span>
        {sortBy}
      </button>
    </div>
  );
}

// Featured Card Component
function FeaturedCard({ news }: { news: NewsItem }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105 bg-gray-200 dark:bg-gray-700"
          style={news.thumbnailUrl ? { backgroundImage: `url('${news.thumbnailUrl}')` } : {}}
        />
        <span className="absolute top-3 left-3 z-20 rounded bg-primary px-2 py-1 text-xs font-bold text-white shadow-sm">
          주요 뉴스
        </span>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
          {news.title}
        </h2>
        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
          {news.summary}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary">{news.source}</span>
            <span>•</span>
            <span>{news.timeAgo}</span>
          </div>
          <button className="p-1 hover:text-primary transition-colors" aria-label="Bookmark">
            <span className="material-symbols-outlined text-[20px]">bookmark</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// Standard News Card Component
function NewsCard({ news }: { news: NewsItem }) {
  return (
    <article className="flex items-stretch gap-4 rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors hover:border-primary/30">
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex flex-col gap-1">
          {news.subCategory && (
            <span className="text-xs font-medium text-primary mb-0.5 font-sans">
              {news.subCategory}
            </span>
          )}
          <h3 className="text-base font-bold leading-snug text-gray-900 dark:text-white line-clamp-2">
            {news.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 font-sans mt-1">
            {news.summary}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-sans mt-auto">
          <span>{news.source}</span>
          <span>•</span>
          <span>{news.timeAgo}</span>
        </div>
      </div>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
        {news.thumbnailUrl && (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url('${news.thumbnailUrl}')` }}
          />
        )}
      </div>
    </article>
  );
}

// Native Ad Component
function NativeAdCard({ ad }: { ad: NativeAd }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 p-4">
      <div className="flex w-full items-start justify-between">
        <div className="flex flex-col gap-1 pr-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300 font-sans">
              AD
            </span>
            <span className="text-xs font-medium text-gray-500 font-sans">{ad.sponsor}</span>
          </div>
          <h3 className="text-base font-bold leading-snug text-gray-900 dark:text-white mt-1">
            {ad.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 font-sans mt-1">
            {ad.description}
          </p>
        </div>
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
          {ad.thumbnailUrl && (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${ad.thumbnailUrl}')` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// News List Component
function NewsList({
  news,
  nativeAd,
  adPosition = 2,
}: {
  news: NewsItem[];
  nativeAd?: NativeAd;
  adPosition?: number;
}) {
  const featuredNews = news.find((n) => n.isFeatured);
  const regularNews = news.filter((n) => !n.isFeatured);

  // Insert ad at specified position
  const newsWithAd = [...regularNews];

  return (
    <div className="flex flex-col gap-4">
      {newsWithAd.map((item, index) => (
        <div key={item.id}>
          <Link href={`/news/${item.id}`}>
            <NewsCard news={item} />
          </Link>
          {/* Insert native ad after specified position */}
          {nativeAd && index === adPosition && (
            <div className="mt-4">
              <NativeAdCard ad={nativeAd} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Load More Button
function LoadMoreButton({ onClick }: { onClick?: () => void }) {
  return (
    <div className="mt-4 flex justify-center pb-8">
      <button
        onClick={onClick}
        className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        더보기
        <span className="material-symbols-outlined text-[18px]">expand_more</span>
      </button>
    </div>
  );
}

// Bottom Navigation Component
function BottomNav({ activeTab = 'category' }: { activeTab?: string }) {
  const navItems = [
    { id: 'home', icon: 'home', label: '홈', href: '/' },
    { id: 'category', icon: 'category', label: '카테고리', href: '/category' },
    { id: 'newspaper', icon: 'newspaper', label: '신문', href: '/newspaper' },
    { id: 'my', icon: 'person', label: '마이', href: '/my' },
  ];

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#101622] pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === item.id
                ? 'text-primary'
                : 'text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${
                activeTab === item.id ? 'fill-current' : ''
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`text-[10px] font-sans ${
                activeTab === item.id ? 'font-bold' : 'font-medium'
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

// ============================================
// Main Component
// ============================================
export default function CategoryPage({
  categoryName,
  filterChips = DEFAULT_FILTER_CHIPS,
  news = [],
  nativeAd,
  onBack,
  onSearch,
  onFilter,
  onLoadMore,
}: CategoryPageProps) {
  const [activeChip, setActiveChip] = useState(filterChips[0] || '전체');
  const [sortBy, setSortBy] = useState('최신순');

  // Separate featured and regular news
  const featuredNews = news.find((n) => n.isFeatured);
  const regularNews = news.filter((n) => !n.isFeatured);

  // Filter news by active chip
  const filteredNews =
    activeChip === '전체'
      ? regularNews
      : regularNews.filter((n) => n.subCategory === activeChip);

  return (
    <div className="relative flex h-full w-full flex-col min-h-screen pb-20 bg-background-light dark:bg-background-dark font-sans text-gray-900 dark:text-gray-100 antialiased overflow-x-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#101622]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
        <StickyHeader
          title={categoryName}
          onBack={onBack}
          onSearch={onSearch}
          onFilter={onFilter}
        />
        <FilterChips
          chips={filterChips}
          activeChip={activeChip}
          onChipClick={setActiveChip}
        />
        <SortBar sortBy={sortBy} onSortChange={setSortBy} />
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-4 px-4 py-4">
        {/* Featured Card */}
        {featuredNews && (
          <Link href={`/news/${featuredNews.id}`}>
            <FeaturedCard news={featuredNews} />
          </Link>
        )}

        {/* News List */}
        {filteredNews.length > 0 ? (
          <NewsList news={filteredNews} nativeAd={nativeAd} adPosition={1} />
        ) : (
          <div className="py-10 text-center text-gray-400 dark:text-gray-500">
            해당 카테고리의 뉴스가 없습니다.
          </div>
        )}

        {/* Load More */}
        {filteredNews.length > 0 && <LoadMoreButton onClick={onLoadMore} />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab="category" />
    </div>
  );
}

// ============================================
// Exported Sub Components (for flexibility)
// ============================================
export {
  StickyHeader,
  FilterChips,
  SortBar,
  FeaturedCard,
  NewsCard,
  NativeAdCard,
  NewsList,
  LoadMoreButton,
  BottomNav,
};

// ============================================
// Type Exports
// ============================================
export type { NewsItem, NativeAd, CategoryPageProps };
