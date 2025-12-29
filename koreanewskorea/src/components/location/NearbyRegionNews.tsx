'use client';

// Nearby Region News Section Component
// Displays articles from nearby regions with tab navigation

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getRegionName, RegionCode } from '@/lib/location';

interface Article {
    id: string;
    title: string;
    content: string;
    thumbnail_url: string | null;
    source: string;
    region: string;
    category: string;
    published_at: string;
    created_at: string;
    ai_summary?: string;
}

interface NearbyRegionNewsProps {
    regions: string[];
    articles: Article[];
}

export default function NearbyRegionNews({ regions, articles }: NearbyRegionNewsProps) {
    const [activeRegion, setActiveRegion] = useState<string | null>(null);

    if (!regions || regions.length === 0 || !articles || articles.length === 0) {
        return null;
    }

    // Filter articles by selected region or show all
    const filteredArticles = activeRegion
        ? articles.filter((a) => a.region === activeRegion)
        : articles;

    const displayArticles = filteredArticles.slice(0, 4);

    return (
        <section className="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-100">
            {/* Section Header */}
            <div className="flex items-center justify-between border-t-4 border-slate-400 pt-3 mb-4">
                <h2 className="text-lg font-serif font-bold text-slate-800">
                    Nearby Regions
                </h2>
            </div>

            {/* Region Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setActiveRegion(null)}
                    className={`
            px-3 py-1.5 text-sm rounded-full transition-colors
            ${!activeRegion
                            ? 'bg-slate-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }
          `}
                >
                    All
                </button>
                {regions.map((regionCode) => (
                    <button
                        key={regionCode}
                        onClick={() => setActiveRegion(regionCode)}
                        className={`
              px-3 py-1.5 text-sm rounded-full transition-colors
              ${activeRegion === regionCode
                                ? 'bg-slate-700 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }
            `}
                    >
                        {getRegionName(regionCode as RegionCode)}
                    </button>
                ))}
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayArticles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/article/${article.id}`}
                        className="group flex gap-3 bg-white p-3 rounded-lg hover:shadow-md transition-shadow"
                    >
                        <div className="relative w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-slate-100">
                            {article.thumbnail_url ? (
                                <Image
                                    src={article.thumbnail_url}
                                    alt={article.title}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                                    <span className="text-slate-400 text-xs">No Image</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-xs text-[#A6121D] font-medium">
                                {getRegionName(article.region as RegionCode)}
                            </span>
                            <h4 className="text-sm font-medium text-slate-800 group-hover:text-[#A6121D] line-clamp-2 transition-colors">
                                {article.title}
                            </h4>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Empty State */}
            {displayArticles.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                    No recent news in this region
                </div>
            )}
        </section>
    );
}
