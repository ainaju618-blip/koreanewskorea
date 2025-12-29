import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { SITE_CONFIGS, VALID_REGIONS, BASE_DOMAIN } from '@/config/site-regions';

export const metadata: Metadata = {
    title: '코리아NEWS - 광주·전남 지역 뉴스 포털',
    description: '광주·전남 9개 지역의 실시간 뉴스를 한곳에서. 목포, 여수, 순천, 나주, 광양, 담양, 고흥, 해남, 광주 지역 뉴스.',
    openGraph: {
        title: '코리아NEWS - 광주·전남 지역 뉴스 포털',
        description: '광주·전남 9개 지역의 실시간 뉴스를 한곳에서.',
        url: BASE_DOMAIN,
        siteName: '코리아NEWS',
        type: 'website',
    },
};

/**
 * Korea NEWS Landing Page
 * =========================
 * Portal page showing all 9 regional sites
 * Users can select their region to navigate to regional news
 */

// Region display order and grouping
const REGION_GROUPS = {
    metro: {
        label: '광역시',
        regions: ['gwangju'] as const,
    },
    cities: {
        label: '시',
        regions: ['mokpo', 'yeosu', 'suncheon', 'naju', 'gwangyang'] as const,
    },
    counties: {
        label: '군',
        regions: ['damyang', 'goheung', 'haenam'] as const,
    },
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="py-8 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    코리아NEWS
                </h1>
                <p className="text-lg text-slate-300">
                    광주·전남 지역 뉴스 포털
                </p>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Intro */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                        <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        지역을 선택해주세요
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        9개 지역의 최신 뉴스와 정보를 확인하세요.
                        각 지역 홈페이지에서 지역 맞춤 뉴스를 제공합니다.
                    </p>
                </div>

                {/* Region Grid */}
                <div className="space-y-8">
                    {Object.entries(REGION_GROUPS).map(([groupKey, group]) => (
                        <div key={groupKey}>
                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
                                {group.label}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {group.regions.map((regionId) => {
                                    const config = SITE_CONFIGS[regionId];
                                    if (!config) return null;

                                    return (
                                        <Link
                                            key={regionId}
                                            href={`/${regionId}`}
                                            className="group relative bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-primary/50 rounded-xl p-6 text-center transition-all duration-200"
                                        >
                                            <div className="text-2xl mb-2">
                                                {getRegionEmoji(regionId)}
                                            </div>
                                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">
                                                {config.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {config.subtitle.split(' ')[0]}
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats or Info */}
                <div className="mt-16 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-800/30 rounded-xl p-6">
                        <div className="text-3xl font-bold text-primary">9</div>
                        <div className="text-sm text-slate-400">지역</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-6">
                        <div className="text-3xl font-bold text-primary">24/7</div>
                        <div className="text-sm text-slate-400">실시간 뉴스</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-6">
                        <div className="text-3xl font-bold text-primary">AI</div>
                        <div className="text-sm text-slate-400">뉴스 큐레이션</div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-16 py-8 border-t border-slate-800">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} 코리아NEWS. All rights reserved.
                    </p>
                    <div className="mt-4 flex justify-center gap-6 text-sm">
                        <a
                            href="https://www.koreanewsone.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            본사 바로가기
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Helper function to get region emoji/icon
function getRegionEmoji(regionId: string): string {
    const emojis: Record<string, string> = {
        gwangju: '🏙️',
        mokpo: '🌊',
        yeosu: '🚢',
        suncheon: '🌿',
        naju: '🍐',
        gwangyang: '🏭',
        damyang: '🎋',
        goheung: '🚀',
        haenam: '🌾',
    };
    return emojis[regionId] || '📍';
}
