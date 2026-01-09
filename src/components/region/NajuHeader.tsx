'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Newspaper, MapPin, Building2, Users, GraduationCap, Briefcase, MessageCircle, Search, UtensilsCrossed, Map, Landmark, Lightbulb, LogIn, LogOut, User, Loader2 } from 'lucide-react';
import ReporterDashboardEmbed from '@/components/reporter/ReporterDashboardEmbed';

// 나주 전용 네비게이션 메뉴 (모두 서브페이지로 연결)
const NAJU_MENUS = [
  { name: '홈', href: '/region/naju', icon: Home },
  { name: '나주시소식', href: '/region/naju/government', icon: Building2 },
  { name: '의회소식', href: '/region/naju/council', icon: Users },
  { name: '교육소식', href: '/region/naju/education', icon: GraduationCap },
  { name: '읍면동소식', href: '/region/naju/emd', icon: MapPin },
  { name: '기업소식', href: '/region/naju/business', icon: Briefcase },
  { name: '오피니언', href: '/region/naju/opinion', icon: Lightbulb },
];

// 여행/맛집 서브메뉴
const NAJU_SUB_MENUS = [
  { name: '맛집', href: '/region/naju/food', icon: UtensilsCrossed },
  { name: '여행', href: '/region/naju/travel', icon: Map },
];

interface Reporter {
  id: string;
  name: string;
  position: string;
  region: string;
  regionGroup?: string;
  access_level: number;
  profile_image?: string;
}

interface NajuHeaderProps {
  children?: React.ReactNode;
}

export default function NajuHeader({ children }: NajuHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // 기자 로그인 모드 상태
  const [isReporterMode, setIsReporterMode] = useState(false);
  const [reporter, setReporter] = useState<Reporter | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // 로그인 폼 상태
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 기자 인증 상태 확인
  useEffect(() => {
    const checkReporterAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.reporter) {
            setReporter(data.reporter);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkReporterAuth();
  }, []);

  // 페이지 이동 시 기자 포털 모드 자동 닫기 + 로그아웃
  const prevPathnameRef = useRef<string | null>(null);
  useEffect(() => {
    // 첫 렌더링에서는 prevPathname이 null이므로 스킵
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }
    // pathname이 실제로 변경되었을 때만 처리
    if (prevPathnameRef.current !== pathname) {
      const wasLoggedIn = reporter !== null;
      prevPathnameRef.current = pathname;

      // 로그인 상태였으면 로그아웃 처리
      if (wasLoggedIn) {
        fetch('/api/auth/logout', { method: 'POST' })
          .then(() => {
            setReporter(null);
          })
          .catch(err => console.error('Auto logout failed:', err));
      }
      setIsReporterMode(false);
    }
  }, [pathname, reporter]);

  // 기자 로그인 처리
  const handleReporterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginName, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.message || '로그인에 실패했습니다.');
        return;
      }

      // 로그인 성공 - 기자 정보 다시 불러오기
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.reporter) {
          setReporter(meData.reporter);
          setLoginName('');
          setLoginPassword('');
        }
      }
    } catch (err) {
      setLoginError('서버 연결에 실패했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 기자 로그아웃
  const handleReporterLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setReporter(null);
      setIsReporterMode(false);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // 기자 로그인 모드 닫기
  const handleCloseReporterMode = () => {
    setIsReporterMode(false);
    setLoginError('');
    setLoginName('');
    setLoginPassword('');
  };

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
    if (event.key === 'Escape') {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
      if (isReporterMode && !reporter) {
        handleCloseReporterMode();
      }
    }
  }, [isMobileMenuOpen, isReporterMode, reporter]);

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
    <>
      <header className="flex flex-col w-full bg-white relative z-50 font-sans">
        {/* Skip Navigation Link (WCAG 2.1 AA) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-medium focus:shadow-lg"
        >
          본문으로 바로가기
        </a>

        {/* =========================================================================
            LAYER 1: LOGO ZONE (모바일: 48px, 데스크톱: 55px)
        ========================================================================= */}
        <div className="h-[48px] md:h-[55px] bg-white border-b border-slate-100">
          <div className="w-full max-w-[1400px] mx-auto px-4 h-full flex flex-row items-center justify-between">

            {/* Left: Date */}
            <div className="hidden lg:flex items-center gap-3 w-[200px]">
              <span className="text-sm text-slate-500">{currentDate}</span>
            </div>

            {/* Center Logo - 코리아NEWS 나주 (정중앙) */}
            <div className="flex items-center justify-center">
              <Link href="/region/naju" className="group flex items-center gap-1 md:gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <span className="text-xl md:text-4xl font-serif font-black text-secondary tracking-tighter group-hover:opacity-90 transition-opacity">
                  코리아<span className="text-primary">NEWS</span>
                </span>
                {/* 나주 강조 표시 - 빨간색 */}
                <span className="text-lg md:text-3xl font-serif font-black text-red-500 ml-0.5 md:ml-1 group-hover:opacity-90 transition-opacity">
                  나주
                </span>
              </Link>
            </div>

            {/* Right: Reporter Login + Search */}
            <div className="hidden lg:flex items-center gap-3 w-[280px] justify-end">
              {/* 기자로그인 버튼 */}
              {isCheckingAuth ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : reporter ? (
                <button
                  onClick={() => setIsReporterMode(!isReporterMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isReporterMode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{reporter.name} 기자</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsReporterMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>기자로그인</span>
                </button>
              )}

              {/* 검색 */}
              <div className="relative group/search">
                <input
                  type="text"
                  placeholder="검색..."
                  aria-label="검색"
                  className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white w-[140px] transition-all duration-300 font-sans placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/search:text-primary transition-colors" />
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2">
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
            LAYER 2: MAIN NAVIGATION (GNB) (48px) - Sticky (Desktop Only)
            모바일에서는 BottomNav 사용으로 숨김
        ========================================================================= */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-md h-[48px] hidden md:block">
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

      {/* =========================================================================
          REPORTER MODE: 로그인 UI 또는 대시보드
      ========================================================================= */}
      {isReporterMode ? (
        <div className="min-h-screen bg-slate-50">
          {/* 로그인 헤더 카드 */}
          <div className="relative text-white overflow-hidden">
            {/* Background Image */}
            <img
              src="/images/hero/reporter-hero.png"
              alt="기자 포털 배경"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-emerald-800/50" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Newspaper className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">기자 포털</h1>
                    <p className="text-emerald-100">코리아NEWS 나주 기자 전용</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseReporterMode}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                  <span>닫기</span>
                </button>
              </div>
            </div>
          </div>

          {/* 로그인 전: 로그인 박스 / 로그인 후: 대시보드 */}
          {reporter ? (
            /* ===== 기존 대시보드 사용 ===== */
            <ReporterDashboardEmbed reporter={reporter} onLogout={handleReporterLogout} onClose={handleCloseReporterMode} />
          ) : (
            /* ===== 로그인 박스 ===== */
            <div className="w-full max-w-[1400px] mx-auto px-4 py-12">
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">기자 로그인</h2>
                    <p className="text-sm text-slate-500 mt-1">기자님 전용 로그인입니다</p>
                  </div>

                  <form onSubmit={handleReporterLogin} className="space-y-4">
                    <div>
                      <label htmlFor="reporter-name" className="block text-sm font-medium text-slate-700 mb-1">
                        이름 또는 이메일
                      </label>
                      <input
                        id="reporter-name"
                        type="text"
                        value={loginName}
                        onChange={(e) => setLoginName(e.target.value)}
                        placeholder="홍길동 또는 email@example.com"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="reporter-password" className="block text-sm font-medium text-slate-700 mb-1">
                        비밀번호
                      </label>
                      <input
                        id="reporter-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="********"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                    {loginError && (
                      <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{loginError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          로그인 중...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          로그인
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== 일반 페이지 콘텐츠 ===== */
        children
      )}
    </>
  );
}

