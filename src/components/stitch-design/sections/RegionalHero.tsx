'use client';

import { useState } from 'react';

interface RegionalHeroProps {
  regionName: string;
  slogan?: string;
  subtitle?: string;
  backgroundImage?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function RegionalHero({
  regionName,
  slogan = '역사와 미래가 공존하는 도시',
  subtitle = '행정/생활 정보의 중심',
  backgroundImage,
  searchPlaceholder,
  onSearch,
}: RegionalHeroProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="@container">
      <div className="relative flex min-h-[260px] flex-col gap-6 items-center justify-center p-6 overflow-hidden bg-primary">
        {/* Background Image */}
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
            style={{ backgroundImage: `url('${backgroundImage}')` }}
          />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-primary" />

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-2 text-center mt-2">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium w-fit mx-auto border border-white/30 backdrop-blur-sm">
            {subtitle}
          </span>
          <h1 className="text-white text-3xl font-black leading-tight tracking-tight">
            {regionName}, {slogan.split(' ').slice(0, 3).join(' ')}
            <br />
            {slogan.split(' ').slice(3).join(' ')}
          </h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative z-10 flex flex-col w-full max-w-[480px]">
          <div className="flex w-full items-stretch rounded-xl h-12 shadow-lg">
            <div className="text-primary flex bg-white dark:bg-[#1e293b] items-center justify-center pl-4 rounded-l-xl border-r-0">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-gray-900 dark:text-white focus:outline-0 bg-white dark:bg-[#1e293b] h-full placeholder:text-gray-400 px-3 text-sm font-normal leading-normal"
              placeholder={searchPlaceholder || `${regionName} 지역 뉴스 및 정보 검색`}
            />
            <div className="flex items-center justify-center rounded-r-xl bg-white dark:bg-[#1e293b] pr-2">
              <button
                type="submit"
                className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 transition-colors"
              >
                <span className="truncate">검색</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
