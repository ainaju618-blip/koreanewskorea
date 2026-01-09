'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Menu, X, Search, MapPin, User, FileText, Facebook, Instagram, Twitter, ChevronRight, ChevronDown, Newspaper, Rocket, Telescope, Sparkles, Atom, Cpu, TrendingUp, Bot, Home, LogIn, Loader2 } from 'lucide-react';
import { PWAInstallButton, PWAInstallMenuItem } from './PWAInstallPrompt';
import HeaderRegionSelector, { getRegionFromPath, getHeaderRegionName, mapToHeaderRegion, HEADER_REGIONS } from './HeaderRegionSelector';
import { useUserRegion } from '@/hooks/useUserRegion';

// Dynamic import for NewsTicker (reduces initial bundle, loads after header)
const NewsTicker = dynamic(() => import('./NewsTicker'), {
    ssr: false,
    loading: () => <div className="h-[36px] bg-slate-50 animate-pulse" />
});

// CosmicPulse categories
const COSMOS_CATEGORIES = [
    { name: 'Space Science', slug: 'space-science', icon: Telescope },
    { name: 'SF Entertainment', slug: 'sf-entertainment', icon: Sparkles },
    { name: 'Astronomy', slug: 'astronomy', icon: Atom },
    { name: 'Future Tech', slug: 'future-tech', icon: Cpu },
    { name: 'Space Economy', slug: 'space-economy', icon: TrendingUp },
    { name: 'AI Content', slug: 'ai-content', icon: Bot },
];

// Category definition
interface Category {
    id: string;
    name: string;
    slug: string;
    depth: number;
    parent_id: string | null;
    show_in_gnb: boolean;
    custom_url?: string;
    link_target?: string;
    children?: Category[];
}

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentDate, setCurrentDate] = useState('');
    const megaMenuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // 기자 로그인 모달 상태
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginName, setLoginName] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // IP 기반 지역 감지
    const { region: detectedRegion, isLoading: isRegionLoading } = useUserRegion();

    // 현재 경로 기반 지역 (우선) 또는 IP 기반 지역
    const currentPathRegion = getRegionFromPath(pathname);
    const displayRegionCode = currentPathRegion !== 'korea' ? currentPathRegion : mapToHeaderRegion(detectedRegion);
    const displayRegionName = getHeaderRegionName(displayRegionCode);

    // IP 기반 홈 경로 계산
    const getHomePathByRegion = useCallback(() => {
        const mappedRegion = mapToHeaderRegion(detectedRegion);
        const regionInfo = HEADER_REGIONS.find(r => r.code === mappedRegion);
        return regionInfo?.path || '/';
    }, [detectedRegion]);

    // Check if current path matches category
    const isActiveCategory = (category: Category): boolean => {
        if (pathname === '/' && category.slug === 'home') return true;
        // region menu activates on jeonnam-region path
        if (category.slug === 'region' && pathname.startsWith('/category/jeonnam-region')) {
            return true;
        }
        // Exact path matching
        const categoryPath = `/category/${category.slug}`;
        if (pathname === categoryPath || pathname.startsWith(`${categoryPath}/`) || pathname.startsWith(`${categoryPath}?`)) {
            return true;
        }
        // Check children
        if (category.children) {
            return category.children.some(child => pathname.includes(`/${child.slug}`));
        }
        return false;
    };

    // Set date
    useEffect(() => {
        const date = new Date();
        const formatted = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        setCurrentDate(formatted);
    }, []);

    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories?gnb=true');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                }
            } catch (err) {
                console.error('Failed to load categories:', err);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    // Close mega menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
                setActiveMegaMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ESC key handler for closing menus (WCAG 2.1 AA)
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            if (isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
            if (activeMegaMenu) {
                setActiveMegaMenu(null);
            }
        }
    }, [isMobileMenuOpen, activeMegaMenu]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Focus trap for mobile menu (WCAG 2.1 AA)
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isMobileMenuOpen && mobileMenuRef.current) {
            // Focus first focusable element in mobile menu
            const focusableElements = mobileMenuRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                (focusableElements[0] as HTMLElement).focus();
            }

            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const getCategoryUrl = (category: Category, parent?: Category): string => {
        if (category.custom_url) return category.custom_url;
        // region goes to jeonnam-region page
        if (category.slug === 'region') return '/category/jeonnam-region';
        if (parent) return `/category/${parent.slug}/${category.slug}`;
        return `/category/${category.slug}`;
    };

    // 기자 로그인 핸들러
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

            // 로그인 성공 - 기자 대시보드로 이동
            setShowLoginModal(false);
            setLoginName('');
            setLoginPassword('');
            router.push('/reporter');
        } catch (err) {
            setLoginError('서버 연결에 실패했습니다.');
        } finally {
            setLoginLoading(false);
        }
    };

    const hasChildren = (category: Category) => category.children && category.children.length > 0;

    return (
        <header className="flex flex-col w-full bg-white relative z-50 font-sans">
            {/* Skip Navigation Link (WCAG 2.1 AA) */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                본문으로 바로가기
            </a>

            {/* =========================================================================
                LAYER 1: LOGO ZONE (55px) - Compact for better content visibility
            ========================================================================= */}
            <div className="h-[55px] bg-white border-b border-slate-100">
                <div className="w-full max-w-[1400px] mx-auto px-4 h-full flex flex-row items-center justify-between">

                    {/* Left: Region Selector */}
                    <div className="hidden lg:flex items-center">
                        <HeaderRegionSelector />
                    </div>

                    {/* Center Logo branding - 나주 고정 */}
                    <div className="flex flex-col items-center justify-center flex-1">
                        <Link href="/region/naju" className="group flex items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                            <span className="text-3xl md:text-4xl font-serif font-black text-secondary tracking-tighter group-hover:opacity-90 transition-opacity">
                                코리아<span className="text-primary">NEWS</span>
                            </span>
                            {/* 나주 강조 표시 */}
                            <span className="text-2xl md:text-3xl font-serif font-black text-red-500 ml-1 group-hover:opacity-90 transition-opacity">
                                나주
                            </span>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden absolute right-4 top-5">
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

                    {/* Right Ear Ad */}
                    <div className="hidden lg:flex w-[180px] h-[50px] bg-slate-50 items-center justify-center text-slate-300 text-xs rounded border border-slate-100 font-sans">
                        <span>Advertisement</span>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                LAYER 3: MAIN NAVIGATION (GNB) (48px) - Sticky, Compact
            ========================================================================= */}
            <div className="sticky top-0 z-40 bg-white border-t border-b-2 border-secondary shadow-sm h-[44px] md:h-[48px]">
                <div className="w-full max-w-[1400px] mx-auto px-4 h-full relative">

                    <nav className="hidden md:flex items-center justify-center h-full">
                        {/* Center aligned menu */}
                        <div className="flex items-center gap-8 h-full font-bold text-[16px] tracking-tight">
                            <Link href="/region/naju" className={`h-full flex items-center gap-1 transition-colors font-serif italic text-lg mr-2 relative px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                                ${pathname === '/' || pathname.startsWith('/region/') ? 'text-primary' : 'text-secondary hover:text-primary'}
                            `}>
                                <Home className="w-4 h-4" />
                                홈
                                {(pathname === '/' || pathname.startsWith('/region/')) && (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></span>
                                )}
                            </Link>

                            <Link href="/news/network" className={`h-full flex items-center transition-colors relative px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                                ${pathname.startsWith('/news') ? 'text-primary' : 'text-slate-800 hover:text-primary'}
                            `}>
                                <span>News TV</span>
                                {pathname.startsWith('/news') ? (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></span>
                                ) : (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                                )}
                            </Link>

                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="relative h-full flex items-center group/menu"
                                    onMouseEnter={() => setActiveMegaMenu(category.id)}
                                    onMouseLeave={() => setActiveMegaMenu(null)}
                                >
                                    <Link
                                        href={getCategoryUrl(category)}
                                        target={category.link_target || undefined}
                                        rel={category.link_target === '_blank' ? 'noopener noreferrer' : undefined}
                                        aria-haspopup={hasChildren(category) ? 'true' : undefined}
                                        aria-expanded={hasChildren(category) ? activeMegaMenu === category.id : undefined}
                                        className={`h-full flex items-center transition-colors relative px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                                            ${isActiveCategory(category) || activeMegaMenu === category.id ? 'text-primary' : 'text-slate-900'}
                                            hover:text-primary
                                        `}
                                    >
                                        {category.name}
                                        {(isActiveCategory(category) || activeMegaMenu === category.id) && (
                                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></span>
                                        )}
                                    </Link>

                                    {/* MEGA MENU DROPDOWN - Modern Design with Animation */}
                                    {/* region(jeonnam-region) menu dropdown disabled */}
                                    {hasChildren(category) && category.slug !== 'jeonnam' && category.slug !== 'region' && category.slug !== 'jeonnam-region' && (
                                        <div className={`absolute top-[48px] left-1/2 -translate-x-1/2 w-[640px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100/80 p-0 overflow-hidden
                                            opacity-0 invisible translate-y-2 group-hover/menu:opacity-100 group-hover/menu:visible group-hover/menu:translate-y-0 transition-all duration-300 ease-out z-50
                                        `}>
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-secondary to-secondary-light px-6 py-4 flex items-center gap-3">
                                                <div className="p-2 bg-white/10 rounded-lg">
                                                    <MapPin className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-serif font-bold text-white text-lg">{category.name}</h3>
                                                    <p className="text-white/60 text-xs">{category.children?.length || 0} categories</p>
                                                </div>
                                            </div>

                                            {/* Menu Items Grid */}
                                            <div className="p-5 grid grid-cols-4 gap-2">
                                                {category.children!.map((child, idx) => (
                                                    <Link
                                                        key={child.id}
                                                        href={getCategoryUrl(child, category)}
                                                        className="group/item relative flex items-center justify-center gap-2 px-3 py-3 text-sm text-slate-600 hover:text-primary bg-slate-50/50 hover:bg-primary/5 rounded-xl transition-all duration-200 border border-transparent hover:border-primary/20"
                                                        style={{ animationDelay: `${idx * 30}ms` }}
                                                    >
                                                        <span className="font-medium">{child.name}</span>
                                                        <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                                                    </Link>
                                                ))}
                                            </div>

                                            {/* Footer */}
                                            <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
                                                <Link href={getCategoryUrl(category)} className="text-xs text-slate-500 hover:text-primary flex items-center justify-center gap-1.5 font-semibold transition-colors group/all">
                                                    <Newspaper className="w-3.5 h-3.5" />
                                                    View All {category.name}
                                                    <ChevronRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* CosmicPulse Link (no dropdown) */}
                            <Link
                                href="/cosmos"
                                className={`h-full flex items-center gap-1.5 transition-colors relative px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2
                                    ${pathname.startsWith('/cosmos') ? 'text-purple-500' : 'text-slate-900'}
                                    hover:text-purple-500
                                `}
                            >
                                <Rocket className="w-4 h-4" />
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
                                    CosmicPulse
                                </span>
                                {pathname.startsWith('/cosmos') && (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></span>
                                )}
                            </Link>

                            {/* 기자로그인 & Search & PWA Install - Modern Design */}
                            <div className="flex items-center gap-3 ml-8 pl-6 border-l border-slate-200">
                                <button
                                    onClick={() => {
                                        const width = window.screen.availWidth;
                                        const height = window.screen.availHeight;
                                        window.open('/auth/reporter', 'reporter-login', `width=${width},height=${height},left=0,top=0,resizable=yes,scrollbars=yes`);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary border border-slate-200 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all"
                                >
                                    <LogIn className="w-4 h-4" />
                                    기자로그인
                                </button>
                                <div className="relative group/search">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        aria-label="Search articles"
                                        className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white w-[160px] focus:w-[200px] transition-all duration-300 font-sans font-normal placeholder:text-slate-400"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/search:text-primary transition-colors" />
                                </div>
                                <PWAInstallButton />
                            </div>
                        </div>
                    </nav>

                    {/* Mobile Only Header Content */}
                    <div className="md:hidden flex items-center justify-between h-full">
                        <HeaderRegionSelector />
                        <button className="p-2" aria-label="Search articles">
                            <Search className="w-6 h-6 text-secondary" />
                        </button>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                LAYER 4: TICKER (NewsTicker.tsx) (36px) - Compact
            ========================================================================= */}
            <NewsTicker />


            {/* =========================================================================
                기자 로그인 모달
            ========================================================================= */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-secondary to-secondary-light">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">기자 로그인</h3>
                                    <p className="text-xs text-white/60">코리아NEWS 기자 전용</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowLoginModal(false);
                                    setLoginError('');
                                }}
                                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleReporterLogin} className="p-6 space-y-4">
                            {loginError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                                    {loginError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    이름
                                </label>
                                <input
                                    type="text"
                                    value={loginName}
                                    onChange={(e) => setLoginName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                    placeholder="기자 이름 입력"
                                    required
                                    disabled={loginLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    비밀번호
                                </label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                    placeholder="비밀번호 입력"
                                    required
                                    disabled={loginLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                {loginLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        로그인
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="px-6 pb-6 text-center">
                            <p className="text-xs text-slate-400">
                                비밀번호를 잊으셨나요? 관리자에게 문의하세요.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                MOBILE MENU OVERLAY - Modern Slide-in Design
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
                    <div className="p-5 flex justify-between items-center bg-gradient-to-r from-secondary to-secondary-light text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <Menu className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-bold text-lg font-serif block">Menu</span>
                                <span className="text-white/60 text-xs">Navigation</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                            aria-label="메뉴 닫기"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="h-[calc(100%-80px)] overflow-y-auto">
                        <div className="p-5 space-y-6">
                            {/* Home Link - IP 기반 */}
                            <Link
                                href={getHomePathByRegion()}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
                            >
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                    <Home className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <span className="font-bold text-lg text-secondary font-serif block">
                                        코리아NEWS {displayRegionCode !== 'korea' ? displayRegionName : ''}
                                    </span>
                                    <span className="text-xs text-slate-500">홈으로 이동</span>
                                </div>
                            </Link>

                            {/* App Install Button */}
                            <PWAInstallMenuItem onMenuClose={() => setIsMobileMenuOpen(false)} />

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 gap-3">
                                <Link
                                    href="/subscribe"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-primary-light rounded-xl font-semibold text-white shadow-lg shadow-red-900/20"
                                >
                                    <FileText className="w-4 h-4" /> Subscribe
                                </Link>
                            </div>

                            {/* Categories */}
                            <div className="space-y-3">
                                {categories.map((category, catIdx) => (
                                    <div key={category.id} className="bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100">
                                        {/* Category Header */}
                                        <a
                                            href={getCategoryUrl(category)}
                                            target={category.link_target || undefined}
                                            rel={category.link_target === '_blank' ? 'noopener noreferrer' : undefined}
                                            onClick={(e) => {
                                                if (category.link_target === '_blank') {
                                                    setIsMobileMenuOpen(false);
                                                    return; // Allow default behavior for new tab
                                                }
                                                e.preventDefault();
                                                setIsMobileMenuOpen(false);
                                                window.location.href = getCategoryUrl(category);
                                            }}
                                            className="flex items-center justify-between p-4 cursor-pointer active:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                                    {catIdx + 1}
                                                </div>
                                                <span className="text-lg font-bold text-secondary font-serif">
                                                    {category.name}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                        </a>

                                        {/* Sub Categories */}
                                        {hasChildren(category) && (
                                            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                                                {category.children!.map((child) => (
                                                    <a
                                                        key={child.id}
                                                        href={getCategoryUrl(child, category)}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setIsMobileMenuOpen(false);
                                                            window.location.href = getCategoryUrl(child, category);
                                                        }}
                                                        className="px-3 py-2.5 text-sm text-slate-600 bg-white rounded-lg border border-slate-100 hover:border-primary/30 hover:text-primary transition-all text-center font-medium cursor-pointer active:scale-95"
                                                    >
                                                        {child.name}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* CosmicPulse */}
                            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-2xl overflow-hidden border border-purple-500/20">
                                <Link
                                    href="/cosmos"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-between p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                            <Rocket className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                CosmicPulse
                                            </span>
                                            <p className="text-xs text-gray-400">Explore the Universe</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-purple-400" />
                                </Link>
                                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                                    {COSMOS_CATEGORIES.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <Link
                                                key={cat.slug}
                                                href={`/cosmos/${cat.slug}`}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 bg-black/30 rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-all"
                                            >
                                                <Icon className="w-4 h-4 text-purple-400" />
                                                <span className="font-medium">{cat.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-3">Follow Us</p>
                                <div className="flex items-center gap-3">
                                    <a href="#" className="w-12 h-12 min-w-[44px] min-h-[44px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 hover:bg-[#1DA1F2] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" aria-label="Twitter">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="w-12 h-12 min-w-[44px] min-h-[44px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 hover:bg-[#4267B2] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" aria-label="Facebook">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="w-12 h-12 min-w-[44px] min-h-[44px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#dc2743] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" aria-label="Instagram">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
