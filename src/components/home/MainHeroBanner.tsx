'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * MainHeroBanner - 전국판 메인 히어로 배너
 * ==========================================
 * 풀 와이드 배경 이미지 + 검색 기능 + 지역 퀵링크
 */

export default function MainHeroBanner() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // 주요 지역 퀵링크
  const quickRegions = [
    { name: '서울', code: 'seoul' },
    { name: '경기', code: 'gyeonggi' },
    { name: '부산', code: 'busan' },
    { name: '대구', code: 'daegu' },
    { name: '광주', code: 'gwangju' },
    { name: '전남', code: 'jeonnam' },
  ];

  return (
    <section className="relative w-full h-[400px] md:h-[480px] overflow-hidden -mx-4 px-4 lg:-mx-[calc((100vw-1280px)/2)] lg:px-[calc((100vw-1280px)/2)]">
      {/* Background Image */}
      <Image
        src="/images/hero/main-hero.png"
        alt="코리아뉴스코리아 전국 뉴스"
        fill
        className="object-cover"
        priority
        quality={90}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto flex flex-col justify-center">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary/90 text-white text-xs font-bold rounded-full uppercase tracking-wide">
            National Edition
          </span>
          <span className="text-cyan-300 text-sm font-medium">전국판</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
          대한민국 <span className="text-cyan-400">전국</span> 뉴스
          <br className="hidden md:block" />
          <span className="text-2xl md:text-3xl lg:text-4xl font-normal text-slate-300">
            코리아NEWS
          </span>
        </h1>

        {/* Description */}
        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mb-8">
          17개 시·도, 250개 시·군·구의 지역 소식을 한눈에.
          <br className="hidden md:block" />
          정책 브리핑부터 지역 뉴스까지 대한민국 전체를 아우릅니다.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="뉴스 검색..."
              className="w-full px-6 py-4 pr-14 bg-white/95 backdrop-blur-sm rounded-full text-slate-900 placeholder:text-slate-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary hover:bg-primary/90 text-white rounded-full transition-colors"
              aria-label="검색"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Quick Region Links */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-slate-400 text-sm mr-2">
            <MapPin className="w-4 h-4" />
            주요 지역:
          </span>
          {quickRegions.map((region) => (
            <Link
              key={region.code}
              href={`/region/${region.code}`}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors backdrop-blur-sm border border-white/20"
            >
              {region.name}
            </Link>
          ))}
          <Link
            href="/region"
            className="flex items-center gap-1 px-3 py-1.5 text-cyan-300 hover:text-cyan-200 text-sm transition-colors"
          >
            전체 보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
