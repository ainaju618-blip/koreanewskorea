'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Search, MapPin, User, FileText, Facebook, Instagram, Twitter, ChevronRight } from 'lucide-react';
import NewsTicker from './NewsTicker';
import { PWAInstallButton } from './PWAInstallPrompt';

// 카테고리 타입 정의
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

    // 날짜 설정
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

    // 카테고리 데이터 로딩
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories?gnb=true');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                }
            } catch (err) {
                console.error('카테고리 로딩 실패:', err);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    // 외부 클릭 시 메가메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
                setActiveMegaMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCategoryUrl = (category: Category, parent?: Category): string => {
        if (category.custom_url) return category.custom_url;
        if (parent) return `/category/${parent.slug}/${category.slug}`;
        return `/category/${category.slug}`;
    };

    const hasChildren = (category: Category) => category.children && category.children.length > 0;

    return (
        <div className="flex flex-col w-full bg-white relative z-50 font-sans">
            {/* =========================================================================
                LAYER 1: TOP UTILITY BAR (32px) - Deep Royal Blue (Authority)
            ========================================================================= */}
            <div className="h-[32px] bg-[#0a192f] text-white/90 hidden md:block">
                <div className="w-full max-w-[1400px] mx-auto px-4 h-full flex justify-between items-center text-xs">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 opacity-80">
                            <a href="#" className="hover:text-[#ff2e63] transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
                            <a href="#" className="hover:text-[#ff2e63] transition-colors"><Facebook className="w-3.5 h-3.5" /></a>
                            <a href="#" className="hover:text-[#ff2e63] transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
                        </div>
                        <span className="opacity-60 font-medium">
                            {currentDate}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 font-medium tracking-wide opacity-90">
                        <Link href="/subscribe" className="hover:text-[#ff2e63] transition-colors">구독신청</Link>
                        <span className="w-[1px] h-2.5 bg-white/20"></span>
                        <Link href="/reporter/login" className="flex items-center gap-1 hover:text-[#ff2e63] transition-colors">
                            <User className="w-3 h-3" /> 기자로그인
                        </Link>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                LAYER 2: LOGO ZONE (70px) - Increased whitespace
            ========================================================================= */}
            <div className="h-[70px] bg-white border-b border-slate-100">
                <div className="w-full max-w-[1400px] mx-auto px-4 h-full flex flex-row items-center justify-between">

                    {/* Left Ear Ad */}
                    <div className="hidden lg:flex w-[180px] h-[50px] bg-slate-50 items-center justify-center text-slate-300 text-xs rounded border border-slate-100 font-sans">
                        <span>Advertisement</span>
                    </div>

                    {/* Center Logo branding */}
                    <div className="flex flex-col items-center justify-center flex-1">
                        <Link href="/" className="group flex items-center gap-1.5">
                            <span className="text-4xl md:text-5xl font-serif font-black text-[#0a192f] tracking-tighter group-hover:opacity-90 transition-opacity">
                                코리아<span className="text-[#ff2e63]">NEWS</span>
                            </span>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden absolute right-4 top-5">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[#0a192f]">
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
                LAYER 3: MAIN NAVIGATION (GNB) (55px) - Sticky, Royal Blue Border
            ========================================================================= */}
            <div className="sticky top-0 z-40 bg-white border-t border-b-2 border-[#0a192f] shadow-sm h-[50px] md:h-[55px]">
                <div className="w-full max-w-[1400px] mx-auto px-4 h-full relative">

                    <nav className="hidden md:flex items-center justify-center h-full">
                        {/* 메뉴 가운데 정렬 */}
                        <div className="flex items-center gap-8 h-full font-bold text-[16px] tracking-tight">
                            <Link href="/" className="h-full flex items-center text-[#0a192f] hover:text-[#ff2e63] transition-colors font-serif italic text-lg mr-2">
                                Home
                            </Link>

                            <Link href="/news/network" className="h-full flex items-center text-slate-800 hover:text-[#ff2e63] transition-colors relative group">
                                <span>뉴스TV</span>
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff2e63] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
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
                                        className={`h-full flex items-center transition-colors relative
                                            ${activeMegaMenu === category.id ? 'text-[#ff2e63]' : 'text-slate-900'}
                                            hover:text-[#ff2e63]
                                        `}
                                    >
                                        {category.name}
                                        {activeMegaMenu === category.id && (
                                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff2e63]"></span>
                                        )}
                                    </Link>

                                    {/* MEGA MENU DROPDOWN - Modern Shadow & Border */}
                                    {hasChildren(category) && category.slug !== 'jeonnam' && (
                                        <div className={`absolute top-[55px] left-1/2 -translate-x-1/2 w-[600px] bg-white border-t-2 border-[#ff2e63] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-b-lg p-6 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 ease-out z-50
                                            grid grid-cols-4 gap-6
                                        `}>
                                            <div className="col-span-4 mb-3 pb-2 border-b border-slate-100 font-serif font-bold text-[#0a192f] text-lg flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-[#ff2e63]" /> {category.name}
                                            </div>
                                            {category.children!.map((child) => (
                                                <Link
                                                    key={child.id}
                                                    href={getCategoryUrl(child, category)}
                                                    className="text-slate-600 hover:text-[#0a192f] hover:font-bold hover:bg-slate-50 text-sm transition-all text-center py-2 rounded-md block"
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                            <div className="col-span-4 border-t border-slate-50 mt-2 pt-3 text-center">
                                                <Link href={getCategoryUrl(category)} className="text-xs text-slate-400 hover:text-[#ff2e63] flex items-center justify-center gap-1 font-medium transition-colors">
                                                    View All <ChevronRight className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Search & PWA Install - 메뉴와 함께 가운데 배치 */}
                            <div className="flex items-center gap-3 ml-6">
                                <div className="relative group">
                                    <input type="text" placeholder="Search..." className="pl-4 pr-9 py-1.5 text-sm border border-slate-200 rounded-full bg-slate-50 focus:outline-none focus:border-[#ff2e63] focus:ring-1 focus:ring-[#ff2e63]/20 w-[140px] focus:w-[180px] transition-all duration-300 font-sans font-normal" />
                                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 group-focus-within:text-[#ff2e63] transition-colors" />
                                </div>
                                <PWAInstallButton />
                            </div>
                        </div>
                    </nav>

                    {/* Mobile Only Header Content */}
                    <div className="md:hidden flex items-center justify-between h-full">
                        <span className="font-bold text-lg text-[#0a192f]">
                            전체메뉴
                        </span>
                        <button className="p-2">
                            <Search className="w-6 h-6 text-[#0a192f]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                LAYER 4: TICKER (NewsTicker.tsx) (45px)
            ========================================================================= */}
            <NewsTicker />


            {/* =========================================================================
                MOBILE MENU OVERLAY
            ========================================================================= */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fade-in-up">
                    <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-[#0a192f] text-white">
                        <span className="font-bold text-xl font-serif">Menu</span>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/reporter/login" className="flex items-center justify-center gap-2 py-3 bg-slate-50/80 rounded-xl font-bold text-slate-700 border border-slate-200 shadow-sm">
                                <User className="w-4 h-4" /> 기자로그인
                            </Link>
                            <Link href="/subscribe" className="flex items-center justify-center gap-2 py-3 bg-[#ff2e63]/10 rounded-xl font-bold text-[#ff2e63] border border-[#ff2e63]/20 shadow-sm">
                                <FileText className="w-4 h-4" /> 구독신청
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {categories.map((category) => (
                                <div key={category.id} className="border-b border-slate-100 pb-4 last:border-0">
                                    <div className="flex items-center justify-between py-2">
                                        <Link
                                            href={getCategoryUrl(category)}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="text-xl font-bold text-[#0a192f] font-serif"
                                        >
                                            {category.name}
                                        </Link>
                                    </div>

                                    {hasChildren(category) && (
                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            {category.children!.map((child) => (
                                                <Link
                                                    key={child.id}
                                                    href={getCategoryUrl(child, category)}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="pl-3 py-2 text-sm text-slate-600 border-l-2 border-slate-100 hover:border-[#ff2e63] hover:text-[#ff2e63] hover:bg-slate-50 transition-all rounded-r-md block"
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
