'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Newspaper, Menu, X, Search, MapPin, ChevronDown, Bell,
  Home, Map, Building2, UtensilsCrossed, Briefcase, Globe
} from 'lucide-react';

// 네비게이션 메뉴 아이템
const NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/map', label: '뉴스지도', icon: Map },
  { href: '/region/naju', label: '지역뉴스', icon: Building2 },
  { href: '/category/travel', label: '여행', icon: Globe },
  { href: '/category/food', label: '맛집', icon: UtensilsCrossed },
  { href: '/category/business', label: '비즈니스', icon: Briefcase },
];

// 지역 목록
const REGIONS = [
  { id: 'all', name: '전국', href: '/' },
  { id: 'seoul', name: '서울', href: '/region/seoul' },
  { id: 'gyeonggi', name: '경기', href: '/region/gyeonggi' },
  { id: 'incheon', name: '인천', href: '/region/incheon' },
  { id: 'busan', name: '부산', href: '/region/busan' },
  { id: 'daegu', name: '대구', href: '/region/daegu' },
  { id: 'gwangju', name: '광주', href: '/region/gwangju' },
  { id: 'daejeon', name: '대전', href: '/region/daejeon' },
  { id: 'ulsan', name: '울산', href: '/region/ulsan' },
  { id: 'sejong', name: '세종', href: '/region/sejong' },
  { id: 'jeonnam', name: '전남', href: '/region/jeonnam' },
  { id: 'naju', name: '나주', href: '/region/naju' },
];

interface StitchHeaderProps {
  currentRegion?: string;
  showSearch?: boolean;
}

export default function StitchHeader({ currentRegion = '전국', showSearch = true }: StitchHeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Search:', searchQuery);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        {/* Top Bar */}
        <div className="bg-gray-900 text-white py-1.5 px-4 text-xs hidden lg:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-gray-400">2026.01.05 (일)</span>
              <span className="text-cyan-400 font-medium">오늘의 헤드라인: 전국 한파 주의보 발령</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-cyan-400 transition-colors">로그인</Link>
              <Link href="#" className="hover:text-cyan-400 transition-colors">회원가입</Link>
              <Link href="#" className="hover:text-cyan-400 transition-colors">광고문의</Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto">
          <div className="px-4 h-14 lg:h-16 flex items-center justify-between gap-4">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-1.5 shrink-0">
              <Newspaper className="w-6 h-6 lg:w-7 lg:h-7 text-cyan-500" />
              <h1 className="text-lg lg:text-xl font-black tracking-tight">
                코리아<span className="text-cyan-500">NEWS</span>
              </h1>
            </Link>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Region Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsRegionOpen(!isRegionOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-cyan-500" />
                  <span className="font-bold text-gray-900">{currentRegion}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Region Dropdown */}
                {isRegionOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsRegionOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
                      {REGIONS.map((region) => (
                        <Link
                          key={region.id}
                          href={region.href}
                          onClick={() => setIsRegionOpen(false)}
                          className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            currentRegion === region.name
                              ? 'text-cyan-600 font-bold bg-cyan-50'
                              : 'text-gray-700'
                          }`}
                        >
                          {region.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Search Button */}
              {showSearch && (
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="검색"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {/* Notification */}
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative hidden lg:flex">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors lg:hidden"
                aria-label="메뉴"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar (Expandable) */}
          {isSearchOpen && (
            <div className="px-4 pb-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="검색어를 입력하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <nav className="px-4 py-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex gap-2">
                <Link
                  href="#"
                  className="flex-1 py-2 text-center text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="#"
                  className="flex-1 py-2 text-center text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
