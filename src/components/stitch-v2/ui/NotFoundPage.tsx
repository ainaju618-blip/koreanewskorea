'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ============================================
// Types
// ============================================
interface NotFoundPageProps {
  title?: string;
  message?: string;
  showSearch?: boolean;
  showBackButton?: boolean;
  illustrationUrl?: string;
  onSearch?: (query: string) => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
}

// ============================================
// Sub Components
// ============================================

// Header Component
function Header({ onGoBack }: { onGoBack?: () => void }) {
  const router = useRouter();

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-50">
      <button
        className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        onClick={handleBack}
        aria-label="Go back"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
    </div>
  );
}

// Error Content Component
function ErrorContent({
  title,
  message,
  illustrationUrl,
}: {
  title: string;
  message: string;
  illustrationUrl?: string;
}) {
  return (
    <>
      {/* Hero Section: Illustration & 404 Code */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-sm mb-6">
        {/* Decorative Background Text */}
        <span className="text-[140px] leading-none font-black text-gray-200/60 dark:text-gray-800/60 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 tracking-tighter">
          404
        </span>

        {/* Illustration Image */}
        <div className="relative z-10 w-48 h-48 rounded-2xl overflow-hidden shadow-lg rotate-3 transition-transform hover:rotate-0 duration-500 ease-out bg-white dark:bg-gray-800">
          <div
            className="w-full h-full bg-center bg-no-repeat bg-cover"
            style={{
              backgroundImage: illustrationUrl
                ? `url("${illustrationUrl}")`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
        </div>
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-center text-center space-y-3 mb-10 z-10 w-full max-w-md">
        <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight px-4">
          {title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-relaxed px-4 break-keep">
          {message.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < message.split('\n').length - 1 && (
                <br className="hidden min-[360px]:block" />
              )}
            </React.Fragment>
          ))}
        </p>
      </div>
    </>
  );
}

// Search Suggestion Component
function SearchSuggestion({
  onSearch,
}: {
  onSearch?: (query: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="w-full max-w-sm mb-6 z-10">
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center w-full h-14 rounded-xl bg-white dark:bg-[#1a2330] shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all overflow-hidden group">
          <div className="grid place-items-center h-full w-12 text-primary group-focus-within:text-primary">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            className="peer h-full w-full outline-none bg-transparent text-base text-[#111418] dark:text-white pr-4 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="찾으시는 내용을 검색해보세요"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>
    </div>
  );
}

// Action Buttons Component
function ActionButtons({
  onGoHome,
  onGoBack,
}: {
  onGoHome?: () => void;
  onGoBack?: () => void;
}) {
  const router = useRouter();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      router.push('/');
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-sm gap-3 z-10">
      {/* Primary Button */}
      <button
        className="relative flex items-center justify-center w-full h-14 bg-primary hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-[16px] rounded-xl transition-all shadow-md shadow-blue-500/20 gap-2"
        onClick={handleGoHome}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          home
        </span>
        홈으로 가기
      </button>

      {/* Secondary Button */}
      <button
        className="relative flex items-center justify-center w-full h-14 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 font-medium text-[16px] rounded-xl transition-all gap-2"
        onClick={handleGoBack}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          history
        </span>
        이전 페이지
      </button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export default function NotFoundPage({
  title = '페이지를 찾을 수 없습니다',
  message = '요청하신 페이지가 존재하지 않거나\n이동되었습니다.',
  showSearch = true,
  showBackButton = true,
  illustrationUrl,
  onSearch,
  onGoHome,
  onGoBack,
}: NotFoundPageProps) {
  return (
    <div className="bg-[#f5f7f8] dark:bg-[#101722] text-[#111418] dark:text-white overflow-x-hidden">
      <div className="relative flex h-auto min-h-screen w-full flex-col">
        {/* Top App Bar */}
        {showBackButton && <Header onGoBack={onGoBack} />}

        {/* Main Content Area (Centered) */}
        <div className="flex w-full grow flex-col items-center justify-center p-6 pb-12">
          {/* Error Content */}
          <ErrorContent
            title={title}
            message={message}
            illustrationUrl={illustrationUrl}
          />

          {/* Search Suggestion */}
          {showSearch && <SearchSuggestion onSearch={onSearch} />}

          {/* Action Buttons */}
          <ActionButtons onGoHome={onGoHome} onGoBack={onGoBack} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================
export { Header, ErrorContent, SearchSuggestion, ActionButtons };
export type { NotFoundPageProps };
