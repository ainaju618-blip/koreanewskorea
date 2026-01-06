'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, MapPin, Globe, Building2 } from 'lucide-react';
import { useUserRegion } from '@/hooks/useUserRegion';

// 헤더용 4개 지역만 정의
export const HEADER_REGIONS = [
    { code: 'korea', name: '전국', path: '/', icon: Globe },
    { code: 'gwangju', name: '광주', path: '/region/gwangju', icon: Building2 },
    { code: 'naju', name: '나주', path: '/region/naju', icon: MapPin },
    { code: 'jindo', name: '진도', path: '/region/jindo', icon: MapPin },
] as const;

export type HeaderRegionCode = typeof HEADER_REGIONS[number]['code'];

// 현재 경로에서 지역 코드 추출
export function getRegionFromPath(pathname: string): HeaderRegionCode {
    if (pathname.startsWith('/region/gwangju')) return 'gwangju';
    if (pathname.startsWith('/region/naju')) return 'naju';
    if (pathname.startsWith('/region/jindo')) return 'jindo';
    return 'korea'; // 기본값: 전국
}

// 지역 코드로 지역명 가져오기
export function getHeaderRegionName(code: HeaderRegionCode): string {
    const region = HEADER_REGIONS.find(r => r.code === code);
    return region?.name || '전국';
}

// IP 기반 감지된 지역을 헤더 지역으로 매핑
export function mapToHeaderRegion(detectedRegion: string): HeaderRegionCode {
    // 광주 → 광주
    if (detectedRegion === 'gwangju') return 'gwangju';
    // 전남 시군 → 나주 (기본) 또는 진도
    if (detectedRegion === 'jindo') return 'jindo';
    if (detectedRegion === 'naju') return 'naju';
    // 전남 기타 시군 → 나주로 매핑
    if (['jeonnam', 'mokpo', 'yeosu', 'suncheon', 'muan', 'sinan', 'yeongam', 'haenam', 'wando',
         'gurye', 'gokseong', 'goheung', 'boseong', 'hwasun', 'jangheung', 'gangjin',
         'yeonggwang', 'hampyeong', 'damyang', 'jangseong', 'gwangyang'].includes(detectedRegion)) {
        return 'naju';
    }
    // 그 외 모든 지역 → 전국
    return 'korea';
}

interface HeaderRegionSelectorProps {
    className?: string;
}

export default function HeaderRegionSelector({ className = '' }: HeaderRegionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // 현재 경로 기반 지역
    const currentRegion = getRegionFromPath(pathname);
    const currentRegionInfo = HEADER_REGIONS.find(r => r.code === currentRegion) || HEADER_REGIONS[0];

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleRegionSelect = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-primary bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <MapPin className="w-4 h-4 text-primary" />
                <span>{currentRegionInfo.name}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {HEADER_REGIONS.map((region) => {
                        const Icon = region.icon;
                        const isActive = region.code === currentRegion;

                        return (
                            <button
                                key={region.code}
                                onClick={() => handleRegionSelect(region.path)}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                                    ${isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
                                    }`}
                                role="option"
                                aria-selected={isActive}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                                <span>{region.name}</span>
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
