'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, MapPin, Clock, ChevronRight } from 'lucide-react';

/**
 * Korea NEWS Gwangju - Unique Brand Header
 * ========================================
 * Design Philosophy:
 *   - Newspaper Authority (명조 타이틀, 격식있는 레이아웃)
 *   - Modern Elegance (깔끔한 라인, 세련된 호버 효과)
 *   - Korea Red Accent (#A6121D 강조)
 *   - Gwangju Regional Identity (지역 정체성)
 */

// GNB Menu Items (Type A - Metro City)
const GNB_MENU = [
    { name: '홈', slug: '/' },
    { name: '정치', slug: '/category/politics' },
    { name: '경제', slug: '/category/economy' },
    { name: '사회', slug: '/category/society' },
    { name: '문화', slug: '/category/culture' },
    { name: '오피니언', slug: '/category/opinion' },
    { name: '광주소식', slug: '/category/gwangju' },
];

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const pathname = usePathname();

    // Get current date in Korean format
    const today = new Date();
    const dateString = today.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    });

    // Live clock
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(
                new Date().toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                })
            );
        };
        updateTime();
        const timer = setInterval(updateTime, 60000);
        return () => clearInterval(timer);
    }, []);

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 80);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (slug: string) => {
        if (slug === '/') return pathname === '/';
        return pathname?.startsWith(slug);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <>
            {/* ===== TOP INFO BAR ===== */}
            <div className="bg-slate-900 text-white hidden md:block">
                <div className="w-full max-w-[1400px] mx-auto px-6">
                    <div className="h-8 flex items-center justify-between text-xs">
                        {/* Left: Location & Date */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-primary-light">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="font-medium">광주광역시</span>
                            </div>
                            <span className="text-slate-400">{dateString}</span>
                            <div className="flex items-center gap-1 text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{currentTime}</span>
                            </div>
                        </div>

                        {/* Right: Quick Links */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="/reporter/login"
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                기자 로그인
                            </Link>
                            <span className="text-slate-600">|</span>
                            <a
                                href="https://www.koreanewsone.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                                본사 <ChevronRight className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== BRAND HEADER ===== */}
            <div className="bg-white border-b-4 border-primary hidden md:block">
                <div className="w-full max-w-[1400px] mx-auto px-6">
                    <div className="py-6 flex items-center justify-between">
                        {/* Logo - Left aligned, Newspaper style */}
                        <Link href="/" className="flex items-baseline gap-1 group">
                            <span
                                className="text-4xl font-serif tracking-tight text-slate-900 group-hover:text-primary transition-colors"
                                style={{ fontFamily: 'ChosunilboMyungjo, serif' }}
                            >
                                코리아NEWS
                            </span>
                            <span className="text-lg font-bold text-primary ml-1">
                                광주
                            </span>
                        </Link>

                        {/* Center: Tagline */}
                        <div className="hidden lg:block text-center">
                            <p className="text-sm text-slate-500 italic">
                                &ldquo;빛고을 광주, 시민과 함께하는 뉴스&rdquo;
                            </p>
                        </div>

                        {/* Right: Search */}
                        <div className="flex items-center gap-4">
                            <form onSubmit={handleSearch} className="relative hidden lg:block">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="뉴스 검색"
                                    className="w-64 pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-sm focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </form>
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="lg:hidden p-2 text-slate-600 hover:text-primary"
                                aria-label="Search"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== NAVIGATION BAR ===== */}
            <nav
                className={`bg-white border-b border-slate-200 transition-all duration-300 ${
                    isScrolled
                        ? 'fixed top-0 left-0 right-0 z-50 shadow-lg'
                        : ''
                }`}
            >
                <div className="w-full max-w-[1400px] mx-auto px-6">
                    {/* Mobile Header */}
                    <div className="md:hidden h-14 flex items-center justify-between">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 -ml-2 text-slate-600 hover:text-primary"
                            aria-label="Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <Link href="/" className="flex items-baseline gap-0.5">
                            <span
                                className="text-xl font-serif text-slate-900"
                                style={{ fontFamily: 'ChosunilboMyungjo, serif' }}
                            >
                                코리아NEWS
                            </span>
                            <span className="text-sm font-bold text-primary">광주</span>
                        </Link>

                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className="p-2 -mr-2 text-slate-600 hover:text-primary"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <ul className="flex items-center justify-center">
                            {GNB_MENU.map((item, idx) => (
                                <li key={item.slug} className="relative group">
                                    <Link
                                        href={item.slug}
                                        className={`flex items-center h-12 px-6 text-[15px] font-medium transition-all relative ${
                                            isActive(item.slug)
                                                ? 'text-primary'
                                                : 'text-slate-700 hover:text-primary'
                                        }`}
                                    >
                                        {item.name}
                                        {/* Active indicator - Red underline */}
                                        <span
                                            className={`absolute bottom-0 left-0 right-0 h-[3px] bg-primary transition-transform origin-left ${
                                                isActive(item.slug)
                                                    ? 'scale-x-100'
                                                    : 'scale-x-0 group-hover:scale-x-100'
                                            }`}
                                        />
                                    </Link>
                                    {/* Divider */}
                                    {idx < GNB_MENU.length - 1 && (
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-3 bg-slate-200" />
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Sticky header mini logo (shows when scrolled) */}
                    {isScrolled && (
                        <div className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 items-baseline gap-0.5">
                            <Link href="/" className="flex items-baseline gap-0.5">
                                <span
                                    className="text-lg font-serif text-slate-800"
                                    style={{ fontFamily: 'ChosunilboMyungjo, serif' }}
                                >
                                    코리아NEWS
                                </span>
                                <span className="text-xs font-bold text-primary">광주</span>
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* ===== SEARCH OVERLAY ===== */}
            {searchOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 md:pt-32">
                    <div className="w-full max-w-xl mx-4 bg-white rounded-lg shadow-2xl overflow-hidden">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="검색어를 입력하세요"
                                className="w-full pl-14 pr-14 py-5 text-lg border-0 focus:ring-0"
                                autoFocus
                            />
                            <Search className="w-6 h-6 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2" />
                            <button
                                type="button"
                                onClick={() => setSearchOpen(false)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </form>
                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                            <p className="text-xs text-slate-500">
                                <span className="font-medium text-primary">Tip:</span> 정치, 경제, 사회, 문화 등 카테고리명으로 검색해보세요
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MOBILE MENU DRAWER ===== */}
            <div
                className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${
                    isMobileMenuOpen ? 'visible' : 'invisible'
                }`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/50 transition-opacity ${
                        isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Drawer */}
                <div
                    className={`absolute left-0 top-0 h-full w-[300px] bg-white shadow-2xl transition-transform ${
                        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    {/* Drawer Header - Korea Red accent */}
                    <div className="h-20 bg-primary flex items-center px-5">
                        <div className="flex-1">
                            <span
                                className="text-xl font-serif text-white"
                                style={{ fontFamily: 'ChosunilboMyungjo, serif' }}
                            >
                                코리아NEWS
                            </span>
                            <span className="text-sm font-bold text-white/80 ml-1">광주</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 text-white/80 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Region Badge */}
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>광주광역시 지역 뉴스</span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <nav className="p-4">
                        <ul className="space-y-1">
                            {GNB_MENU.map((item) => (
                                <li key={item.slug}>
                                    <Link
                                        href={item.slug}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center justify-between px-4 py-3.5 rounded-lg font-medium transition-all ${
                                            isActive(item.slug)
                                                ? 'bg-primary text-white'
                                                : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
                                        }`}
                                    >
                                        <span>{item.name}</span>
                                        <ChevronRight
                                            className={`w-4 h-4 ${
                                                isActive(item.slug) ? 'text-white/70' : 'text-slate-400'
                                            }`}
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-slate-100 bg-white">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">뉴스 제보 및 문의</p>
                            <a
                                href="tel:010-2631-3865"
                                className="text-sm font-bold text-primary hover:underline"
                            >
                                010-2631-3865
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
