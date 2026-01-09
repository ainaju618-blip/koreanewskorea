'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Newspaper, MapPin, Building2, Users, GraduationCap, Flame, Briefcase, MessageCircle, Search, UtensilsCrossed, Map, Landmark, Lightbulb } from 'lucide-react';

// 나주 전용 네비게이션 메뉴 (모두 서브페이지로 연결)
const NAJU_MENUS = [
  { name: '홈', href: '/region/naju', icon: Home },
  { name: '나주시소식', href: '/region/naju/government', icon: Building2 },
  { name: '의회소식', href: '/region/naju/council', icon: Users },
  { name: '교육소식', href: '/region/naju/education', icon: GraduationCap },
  { name: '소방서소식', href: '/region/naju/fire', icon: Flame },
  { name: '기업소식', href: '/region/naju/business', icon: Briefcase },
  { name: '오피니언', href: '/region/naju/opinion', icon: Lightbulb },
];

// 여행/맛집 서브메뉴
const NAJU_SUB_MENUS = [
  { name: '맛집', href: '/region/naju/food', icon: UtensilsCrossed },
  { name: '여행', href: '/region/naju/travel', icon: Map },
];

export default function NajuHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Set date (Korean time)
  useEffect(() => {
    const date = new Date();
    const formatted = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      timeZone: 'Asia/Seoul'
    });
    setCurrentDate(formatted);
  }, []);

  // ESC key handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Body scroll lock when mobile menu open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="flex flex-col w-full bg-white relative z-50 font-sans">
      {/* Skip Navigation Link (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-medium focus:shadow-lg"
      >
        본문으로 바로가기
      </a>

      {/* =========================================================================
          LAYER 1: LOGO ZONE (55px)
      ========================================================================= */}
      <div className="h-[55px] bg-white border-b border-slate-100">
        <div className="w-full max-w-[1400px] mx-auto px-4 h-full flex flex-row items-center justify-between">

          {/* Left: Date */}
          <div className="hidden lg:flex items-center gap-3 w-[200px]">
            <span className="text-sm text-slate-500">{currentDate}</span>
          </div>

          {/* Center Logo - 코리아NEWS 나주 (정중앙) */}
          <div className="flex items-center justify-center">
            <Link href="/region/naju" className="group flex items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <span className="text-3xl md:text-4xl font-serif font-black text-secondary tracking-tighter group-hover:opacity-90 transition-opacity">
                코리아<span className="text-primary">NEWS</span>
              </span>
              {/* 나주 강조 표시 - 빨간색 */}
              <span className="text-2xl md:text-3xl font-serif font-black text-red-500 ml-1 group-hover:opacity-90 transition-opacity">
                나주
              </span>
            </Link>
          </div>

          {/* Right: Search */}
          <div className="hidden lg:flex items-center gap-3 w-[200px] justify-end">
            <div className="relative group/search">
              <input
                type="text"
                placeholder="검색..."
                aria-label="검색"
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white w-[160px] transition-all duration-300 font-sans placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/search:text-primary transition-colors" />
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden absolute right-4 top-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-secondary min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================================
          LAYER 2: MAIN NAVIGATION (GNB) (48px) - Sticky
      ========================================================================= */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-md h-[44px] md:h-[48px]">
        <div className="w-full max-w-[1400px] mx-auto px-4 h-full relative">

          <nav className="hidden md:flex items-center justify-center h-full">
            <div className="flex items-center gap-1 h-full font-bold text-[15px]">
              {NAJU_MENUS.map((menu) => {
                const Icon = menu.icon;
                const isActive = pathname === menu.href ||
                  (menu.href === '/region/naju' && pathname === '/region/naju' && !menu.href.includes('tab'));

                return (
                  <Link
                    key={menu.name}
                    href={menu.href}
                    className={`h-full flex items-center gap-1.5 px-4 transition-all relative rounded-t-lg
                      ${isActive
                        ? 'text-white bg-white/20'
                        : 'text-white/90 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{menu.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-white rounded-t-full"></span>
                    )}
                  </Link>
                );
              })}

              {/* 맛집/여행/인사이트 링크 */}
              <div className="h-full flex items-center ml-2 border-l border-white/20 pl-2">
                {NAJU_SUB_MENUS.map((menu) => {
                  const Icon = menu.icon;
                  const isActive = pathname.startsWith(menu.href);
                  const isOpinion = menu.href.includes('opinion');
                  return (
                    <Link
                      key={menu.name}
                      href={menu.href}
                      className={`h-full flex items-center gap-1.5 px-3 transition-all relative
                        ${isOpinion
                          ? isActive
                            ? 'text-purple-200 bg-white/15'
                            : 'text-purple-200/80 hover:text-purple-100 hover:bg-white/10'
                          : isActive
                            ? 'text-yellow-200 bg-white/10'
                            : 'text-yellow-200/80 hover:text-yellow-100 hover:bg-white/10'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{menu.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* 전국판 링크 */}
              <a
                href="https://www.koreanewsone.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-full flex items-center gap-1.5 px-4 text-yellow-200 hover:text-yellow-100 hover:bg-white/10 transition-all ml-2 border-l border-white/20"
              >
                <MapPin className="w-4 h-4" />
                <span>전국판</span>
              </a>
            </div>
          </nav>

          {/* Mobile: Simple header */}
          <div className="md:hidden flex items-center justify-center h-full">
            <span className="text-white font-bold text-lg">나주 뉴스</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE MENU OVERLAY
      ========================================================================= */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}
        role="dialog"
        aria-modal="true"
        aria-label="모바일 메뉴"
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Menu Panel */}
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className={`absolute right-0 top-0 h-full w-[85%] max-w-[360px] bg-white shadow-2xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Header */}
          <div className="p-5 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg font-serif block">코리아NEWS 나주</span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              aria-label="메뉴 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="h-[calc(100%-80px)] overflow-y-auto">
            <div className="p-5 space-y-3">
              {NAJU_MENUS.map((menu) => {
                const Icon = menu.icon;
                return (
                  <Link
                    key={menu.name}
                    href={menu.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-colors border border-slate-100 hover:border-emerald-200"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="font-bold text-slate-700">{menu.name}</span>
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="border-t border-slate-200 my-4"></div>

              {/* 맛집/여행/인사이트 링크 */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">나주 탐방</p>
              {NAJU_SUB_MENUS.map((menu) => {
                const Icon = menu.icon;
                const isOpinion = menu.href.includes('opinion');
                return (
                  <Link
                    key={menu.name}
                    href={menu.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-colors border ${
                      isOpinion
                        ? 'bg-purple-50 hover:bg-purple-100 border-purple-100'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isOpinion ? 'bg-purple-500' : 'bg-amber-500'
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`font-bold ${isOpinion ? 'text-purple-700' : 'text-amber-700'}`}>{menu.name}</span>
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="border-t border-slate-200 my-4"></div>

              {/* 전국판 링크 */}
              <a
                href="https://www.koreanewsone.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-blue-700 block">전국판 바로가기</span>
                  <span className="text-xs text-blue-500">koreanewsone.com</span>
                </div>
              </a>

              {/* Date */}
              <div className="pt-4 text-center">
                <p className="text-sm text-slate-400">{currentDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
