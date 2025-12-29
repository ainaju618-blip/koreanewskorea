'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Clock, ChevronRight } from 'lucide-react';
import { useRegionSafe } from '@/contexts/RegionContext';
import { CURRENT_SITE } from '@/config/site-regions';

/**
 * Korea NEWS Regional - Gangwon Ilbo Style Header
 * ================================================
 * Design: Traditional newspaper layout
 * - 30px top bar (social, login, date)
 * - Centered logo area with banners
 * - 50px blue navigation bar
 * - Dynamic branding from site-regions config
 */

// GNB Menu Items - Base menus (region-specific item added dynamically)
const BASE_GNB_MENU = [
    { name: '홈', slug: '/' },
    { name: '정치', slug: '/category/politics' },
    { name: '경제', slug: '/category/economy' },
    { name: '사회', slug: '/category/society' },
    { name: '문화', slug: '/category/culture' },
    { name: '의회', slug: '/category/council' },
    { name: '교육', slug: '/category/education' },
];

// Build dynamic GNB menu with region-specific local news
function buildGnbMenu(siteConfig: { id: string; regions: { primary: { names: string[] } } }) {
    const localNewsName = siteConfig.regions.primary.names.length > 1
        ? `${siteConfig.regions.primary.names[0]} 외 ${siteConfig.regions.primary.names.length - 1}곳`
        : siteConfig.regions.primary.names[0] || '지역소식';

    return [
        ...BASE_GNB_MENU,
        { name: localNewsName, slug: `/category/${siteConfig.id}` },
        { name: '관광', slug: '/tour' },
    ];
}

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const pathname = usePathname();

    // Use region context if available, fallback to CURRENT_SITE for backward compatibility
    const regionContext = useRegionSafe();
    const siteConfig = regionContext?.siteConfig || CURRENT_SITE;
    const region = regionContext?.region || 'gwangju';

    // Build dynamic GNB menu based on current region
    const GNB_MENU = buildGnbMenu(siteConfig);

    // Helper to build region-prefixed URLs
    const buildUrl = (path: string) => {
        if (path === '/') return `/${region}`;
        return `/${region}${path}`;
    };

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
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (slug: string) => {
        const fullPath = buildUrl(slug);
        if (slug === '/') return pathname === `/${region}` || pathname === `/${region}/`;
        return pathname?.startsWith(fullPath);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/${region}/search?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <>
            {/* ===== TOP BAR - 30px ===== */}
            <div className="kn-topbar hidden md:block">
                <div className="container-kn h-full flex items-center justify-between">
                    {/* Left: Date & Time */}
                    <div className="flex items-center gap-3 text-[12px]">
                        <span>{dateString}</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {currentTime}
                        </span>
                    </div>

                    {/* Right: Links */}
                    <div className="flex items-center gap-4 text-[12px]">
                        <Link href={buildUrl('/reporter/login')} className="hover:text-primary">
                            기자 로그인
                        </Link>
                        <span className="text-gray-300">|</span>
                        <a
                            href="https://www.koreanewskorea.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                        >
                            본사
                        </a>
                        <span className="text-gray-300">|</span>
                        <Link href={buildUrl('/contact')} className="hover:text-primary">
                            제보하기
                        </Link>
                    </div>
                </div>
            </div>

            {/* ===== LOGO AREA - Centered ===== */}
            <div className="kn-logo-area hidden md:block">
                <div className="container-kn">
                    <div className="flex items-center justify-between py-4">
                        {/* Left Banner Space */}
                        <div className="w-[200px] h-[60px] bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                            AD
                        </div>

                        {/* Center Logo */}
                        <div className="kn-logo">
                            <Link href={buildUrl('/')} className="block">
                                <h1 className="kn-logo-text">
                                    코리아NEWS <span style={{ color: '#0066CC' }}>{siteConfig.name}</span>
                                </h1>
                                <p className="kn-logo-subtitle">
                                    {siteConfig.subtitle}
                                </p>
                            </Link>
                        </div>

                        {/* Right Banner Space */}
                        <div className="w-[200px] h-[60px] bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                            AD
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== MAIN NAVIGATION - 50px Blue Bar ===== */}
            <nav
                className={`kn-nav transition-all duration-300 ${
                    isScrolled
                        ? 'fixed top-0 left-0 right-0 z-50 shadow-md'
                        : ''
                }`}
            >
                <div className="container-kn h-full">
                    {/* Mobile Header */}
                    <div className="md:hidden h-[50px] flex items-center justify-between">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-white"
                            aria-label="Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <Link href={buildUrl('/')} className="text-white font-bold text-lg">
                            코리아NEWS {siteConfig.name}
                        </Link>

                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className="p-2 text-white"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <ul className="kn-nav-list hidden md:flex">
                        {GNB_MENU.map((item) => (
                            <li key={item.slug}>
                                <Link
                                    href={buildUrl(item.slug)}
                                    className={`kn-nav-item ${
                                        isActive(item.slug) ? 'active' : ''
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}

                        {/* Search Button */}
                        <li className="ml-auto">
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="kn-nav-item"
                                aria-label="Search"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Spacer when nav is fixed */}
            {isScrolled && <div className="h-[50px] hidden md:block" />}

            {/* ===== SEARCH OVERLAY ===== */}
            {searchOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center pt-20">
                    <div className="w-full max-w-xl mx-4 bg-white overflow-hidden">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="검색어를 입력하세요"
                                className="w-full pl-12 pr-12 py-4 text-lg border-0 focus:ring-0"
                                autoFocus
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <button
                                type="button"
                                onClick={() => setSearchOpen(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
                            정치, 경제, 사회, 문화 등 카테고리명으로 검색해보세요
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
                    className={`absolute left-0 top-0 h-full w-[280px] bg-white transition-transform ${
                        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    {/* Drawer Header */}
                    <div className="h-14 bg-primary flex items-center justify-between px-4">
                        <span className="text-white font-bold">코리아NEWS {siteConfig.name}</span>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 text-white/80 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Region Info */}
                    <div className="px-4 py-3 bg-gray-50 border-b text-sm text-gray-600">
                        {siteConfig.subtitle}
                    </div>

                    {/* Menu Items */}
                    <nav className="py-2">
                        <ul>
                            {GNB_MENU.map((item) => (
                                <li key={item.slug}>
                                    <Link
                                        href={buildUrl(item.slug)}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 ${
                                            isActive(item.slug)
                                                ? 'bg-primary text-white'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span>{item.name}</span>
                                        <ChevronRight
                                            className={`w-4 h-4 ${
                                                isActive(item.slug) ? 'text-white/70' : 'text-gray-400'
                                            }`}
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                        <p className="text-xs text-gray-500 text-center mb-1">뉴스 제보</p>
                        <a
                            href="tel:010-2631-3865"
                            className="block text-center text-sm font-bold text-primary"
                        >
                            010-2631-3865
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
