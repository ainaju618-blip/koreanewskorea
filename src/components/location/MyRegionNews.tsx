'use client';

// My Region News Section Component
// Displays top 5 articles from user's selected region

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cleanContentPreview } from '@/lib/contentUtils';

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

interface MyRegionNewsProps {
    regionCode: string;
    regionName: string;
    articles: Article[];
    total: number;
}

export default function MyRegionNews({ regionCode, regionName, articles, total }: MyRegionNewsProps) {
    if (!articles || articles.length === 0) {
        return null;
    }

    const mainArticle = articles[0];
    const subArticles = articles.slice(1, 5);

    const getCategorySlug = () => {
        // Build category URL based on region
        if (regionCode === 'gwangju') {
            return '/category/gwangju';
        }
        return `/category/jeonnam/${regionCode}`;
    };

    return (
        <section className="mb-8">
            {/* Section Header */}
            <div className="flex items-center justify-between border-t-4 border-[#A6121D] pt-3 mb-5">
                <h2 className="text-xl font-serif font-black text-slate-900 flex items-baseline gap-2">
                    {regionName} 소식
                    <span className="text-sm text-slate-500 font-sans font-normal">
                        {total > 0 && `${total}건`}
                    </span>
                </h2>
                <Link
                    href={getCategorySlug()}
                    className="flex items-center gap-1 text-sm text-slate-600 hover:text-[#A6121D] transition-colors"
                >
                    더보기 <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Main + Sub Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Article */}
                <Link href={`/article/${mainArticle.id}`} className="group">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 mb-3">
                        {mainArticle.thumbnail_url ? (
                            <Image
                                src={mainArticle.thumbnail_url}
                                alt={mainArticle.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                                <span className="text-slate-400 text-sm">No Image</span>
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#A6121D] transition-colors line-clamp-2 mb-2">
                        {mainArticle.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                        {mainArticle.ai_summary || cleanContentPreview(mainArticle.content, 100)}
                    </p>
                    <span className="text-xs text-slate-400 mt-2 block">
                        {new Date(mainArticle.published_at || mainArticle.created_at).toLocaleDateString('ko-KR')}
                    </span>
                </Link>

                {/* Sub Articles */}
                <div className="flex flex-col gap-3">
                    {subArticles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/article/${article.id}`}
                            className="group flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
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
                                <h4 className="text-sm font-medium text-slate-800 group-hover:text-[#A6121D] line-clamp-2 transition-colors">
                                    {article.title}
                                </h4>
                                <span className="text-xs text-slate-400">
                                    {new Date(article.published_at || article.created_at).toLocaleDateString('ko-KR')}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
