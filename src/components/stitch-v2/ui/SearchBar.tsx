'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  showClear?: boolean;
  autoFocus?: boolean;
  className?: string;
  variant?: 'default' | 'hero' | 'header';
}

export default function SearchBar({
  placeholder = '검색어를 입력하세요',
  defaultValue = '',
  onSearch,
  showClear = true,
  autoFocus = false,
  className = '',
  variant = 'default',
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  // Hero variant (for hero sections with gradient background)
  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} className={`w-full ${className}`}>
        <div className="relative flex items-center w-full h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-sm overflow-hidden">
          <div className="grid place-items-center h-full w-12 text-white/80">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="peer h-full w-full outline-none bg-transparent text-white pr-4 placeholder-white/60 text-base"
          />
          {showClear && query && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center pr-4 text-white/60 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </button>
          )}
        </div>
      </form>
    );
  }

  // Header variant (for search in headers)
  if (variant === 'header') {
    return (
      <form onSubmit={handleSubmit} className={`flex-1 ${className}`}>
        <div className="flex w-full items-stretch rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 flex items-center justify-center pl-3">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="flex w-full min-w-0 flex-1 bg-transparent border-none focus:ring-0 text-[#111318] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2.5 text-base font-normal leading-normal"
          />
          {showClear && query && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center pr-3 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </button>
          )}
        </div>
      </form>
    );
  }

  // Default variant
  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="relative flex items-center w-full h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all overflow-hidden">
        <div className="grid place-items-center h-full w-12 text-gray-400 dark:text-gray-500">
          <span className="material-symbols-outlined">search</span>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="peer h-full w-full outline-none bg-transparent text-[#111318] dark:text-white pr-4 placeholder-gray-400 dark:placeholder-gray-500 text-base font-normal leading-normal"
        />
        {showClear && query && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center justify-center pr-4 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">cancel</span>
          </button>
        )}
      </div>
    </form>
  );
}
