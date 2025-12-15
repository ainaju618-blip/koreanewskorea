import Link from 'next/link'
import { NewsItem } from '@/types/news'
import { Clock, ArrowRight } from 'lucide-react'
import { cleanContentPreview } from '@/lib/contentUtils'

interface NewsCardProps {
    news: NewsItem
    variant?: 'horizontal' | 'vertical' | 'compact' | 'overlay' | 'list'
    imageHeight?: string
    showCategory?: boolean
}

export function NewsCard({
    news,
    variant = 'horizontal',
    imageHeight = 'h-52',
    showCategory = true
}: NewsCardProps) {

    // 1. Vertical Card (Grid View - Modern with Depth)
    if (variant === 'vertical') {
        return (
            <Link
                href={`/news/${news.id}`}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 h-full border border-slate-100/80"
            >
                {/* Thumbnail */}
                <div className={`${imageHeight} relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50`}>
                    {news.thumbnail_url ? (
                        <img
                            src={news.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-gradient-to-br from-slate-100 to-slate-200">
                            <span className="font-serif font-bold text-sm tracking-tight">Korea News</span>
                        </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Category Badge */}
                    {showCategory && news.category && (
                        <div className="absolute top-4 left-4 z-10">
                            <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-[10px] font-bold text-slate-800 uppercase tracking-wider rounded-full shadow-sm border border-slate-100/50">
                                {news.category}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-serif font-bold text-slate-900 leading-snug group-hover:text-[#0a192f] line-clamp-2 mb-2.5 transition-colors">
                        {news.title}
                    </h3>
                    <p className="text-[14px] text-slate-500 line-clamp-2 leading-relaxed flex-1 font-sans">
                        {news.ai_summary || cleanContentPreview(news.content, 100)}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-sans">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {news.published_at?.split('T')[0]}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-[#A6121D] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            Read <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </Link>
        )
    }

    // 2. Overlay Card (For Hero/Featured - Cinematic)
    if (variant === 'overlay') {
        return (
            <Link href={`/news/${news.id}`} className="group relative block w-full h-full overflow-hidden rounded-2xl">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={news.thumbnail_url || '/placeholder.png'}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                    />
                </div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white">
                    {news.category && (
                        <span className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-widest uppercase mb-4 rounded-full border border-white/20">
                            {news.category}
                        </span>
                    )}
                    <h3 className="text-2xl md:text-4xl font-serif font-bold leading-tight mb-3 drop-shadow-lg group-hover:text-blue-100 transition-colors duration-300">
                        {news.title}
                    </h3>
                    <p className="text-white/80 text-sm md:text-base font-light line-clamp-2 drop-shadow-md max-w-2xl">
                        {news.ai_summary}
                    </p>
                </div>

                {/* Hover Indicator */}
                <div className="absolute bottom-8 right-8 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                </div>
            </Link>
        )
    }

    // 3. Compact Card (Sidebar/List - Clean)
    if (variant === 'compact') {
        return (
            <Link href={`/news/${news.id}`} className="group flex gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-all duration-200">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {showCategory && news.category && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A6121D]"></span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{news.category || 'News'}</span>
                    </div>
                    <h3 className="text-[14px] font-serif font-bold text-slate-800 leading-snug group-hover:text-[#0a192f] line-clamp-2 transition-colors">
                        {news.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 mt-1.5 block">{news.published_at?.split('T')[0]}</span>
                </div>
                {news.thumbnail_url && (
                    <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative">
                        <img src={news.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    </div>
                )}
            </Link>
        )
    }

    // 4. List Card (Editorial Style - Premium)
    if (variant === 'list') {
        return (
            <Link
                href={`/news/${news.id}`}
                className="group flex flex-col md:flex-row gap-6 py-7 border-b border-slate-100 last:border-0 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent -mx-4 px-4 rounded-xl transition-all duration-300"
            >
                {/* Content (Left or Top) */}
                <div className="flex-1 flex flex-col gap-2 order-2 md:order-1">
                    <div className="flex items-center gap-2 mb-1">
                        {showCategory && news.category && (
                            <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider rounded-full">
                                {news.category}
                            </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">{news.published_at?.split('T')[0]}</span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 leading-snug group-hover:text-[#0a192f] transition-colors">
                        {news.title}
                    </h3>

                    {news.subtitle && (
                        <div className="text-base text-slate-600 font-medium pl-3 border-l-2 border-[#A6121D]">
                            {news.subtitle}
                        </div>
                    )}

                    <p className="text-[15px] text-slate-500 leading-relaxed font-light line-clamp-2 mt-1">
                        {news.ai_summary || cleanContentPreview(news.content, 160)}...
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#A6121D] opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span>Continue reading</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* Thumbnail (Right) */}
                {news.thumbnail_url && (
                    <div className="w-full md:w-[260px] shrink-0 order-1 md:order-2">
                        <div className="aspect-[16/10] relative overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                            <img
                                src={news.thumbnail_url}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                        </div>
                    </div>
                )}
            </Link>
        )
    }

    // 5. Default: Horizontal Card (Standard - Refined)
    return (
        <Link
            href={`/news/${news.id}`}
            className="group block py-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/30 -mx-3 px-3 rounded-lg transition-all duration-200"
        >
            <div className="flex gap-4">
                {/* Thumbnail */}
                {news.thumbnail_url && (
                    <div className="w-[120px] md:w-[160px] shrink-0">
                        <div className="aspect-[4/3] relative overflow-hidden rounded-xl shadow-sm">
                            <img
                                src={news.thumbnail_url}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="text-base md:text-lg font-serif font-bold text-slate-900 leading-snug group-hover:text-[#0a192f] mb-1.5 transition-colors line-clamp-2">
                        {news.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed font-light line-clamp-2 mb-2">
                        {news.ai_summary || cleanContentPreview(news.content, 120)}...
                    </p>
                    <div className="mt-auto text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{news.published_at?.split('T')[0]}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
