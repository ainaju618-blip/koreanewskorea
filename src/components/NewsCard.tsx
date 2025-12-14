import Link from 'next/link'
import { NewsItem } from '@/types/news'
import { Clock, MapPin } from 'lucide-react'
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

    // 1. Vertical Card (Grid View - Minimalist with Depth)
    if (variant === 'vertical') {
        return (
            <Link
                href={`/news/${news.id}`}
                className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 h-full border border-slate-100"
            >
                {/* Thumbnail */}
                <div className={`${imageHeight} relative overflow-hidden bg-slate-100`}>
                    {news.thumbnail_url ? (
                        <img
                            src={news.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                            <span className="font-serif font-bold text-sm">Korea News</span>
                        </div>
                    )}
                    {/* Category Overlay (Top Left) */}
                    {showCategory && news.category && (
                        <div className="absolute top-4 left-4 z-10">
                            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-900 uppercase tracking-wider rounded-sm shadow-sm">
                                {news.category}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-serif font-bold text-slate-900 leading-snug group-hover:text-[#0a192f] line-clamp-2 mb-3 transition-colors">
                        {news.title}
                    </h3>
                    <p className="text-[15px] text-slate-500 line-clamp-3 leading-relaxed flex-1 font-sans">
                        {news.ai_summary || cleanContentPreview(news.content, 100)}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-sans">
                        <span>{news.published_at?.split('T')[0]}</span>
                        <span className="font-medium text-[#ff2e63] group-hover:opacity-100 opacity-0 transition-opacity">Read Article →</span>
                    </div>
                </div>
            </Link>
        )
    }

    // 2. Overlay Card (For Hero/Featured)
    if (variant === 'overlay') {
        return (
            <Link href={`/news/${news.id}`} className="group relative block w-full h-full overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity" />
                <img
                    src={news.thumbnail_url || '/placeholder.png'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white">
                    {news.category && (
                        <span className="inline-block px-2 py-0.5 border border-white/30 text-[10px] font-bold tracking-widest uppercase mb-3 backdrop-blur-md">
                            {news.category}
                        </span>
                    )}
                    <h3 className="text-2xl md:text-4xl font-serif font-bold leading-tight mb-3 drop-shadow-lg group-hover:text-blue-100 transition-colors">
                        {news.title}
                    </h3>
                    <p className="text-white/80 text-sm md:text-base font-light line-clamp-2 drop-shadow-md">
                        {news.ai_summary}
                    </p>
                </div>
            </Link>
        )
    }

    // 3. Compact Card (Sidebar/List small)
    if (variant === 'compact') {
        return (
            <Link href={`/news/${news.id}`} className="group flex gap-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        {showCategory && news.category && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff2e63]"></span>
                        )}
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{news.category || 'News'}</span>
                    </div>
                    <h3 className="text-[16px] font-serif font-bold text-slate-800 leading-snug group-hover:text-[#0a192f] line-clamp-2 transition-colors">
                        {news.title}
                    </h3>
                    <span className="text-xs text-slate-400 mt-1 block">{news.published_at?.split('T')[0]}</span>
                </div>
                {news.thumbnail_url && (
                    <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative">
                        <img src={news.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    </div>
                )}
            </Link>
        )
    }

    // 4. List Card (Editorial Style)
    if (variant === 'list') {
        return (
            <Link
                href={`/news/${news.id}`}
                className="group flex flex-col md:flex-row gap-6 py-8 border-b border-slate-200 last:border-0 hover:bg-slate-50/30 transition-colors"
            >
                {/* Content (Left or Top) - Changed order for mobile first */}
                <div className="flex-1 flex flex-col gap-3 order-2 md:order-1">
                    <div className="flex items-center gap-2 mb-1">
                        {showCategory && news.category && (
                            <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider rounded-sm">
                                {news.category}
                            </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">{news.published_at?.split('T')[0]}</span>
                    </div>

                    <h3 className="text-2xl font-serif font-bold text-slate-900 leading-tight group-hover:text-[#0a192f] transition-colors">
                        {news.title}
                    </h3>

                    {news.subtitle && (
                        <div className="text-lg text-slate-700 font-medium pl-3 border-l-2 border-[#ff2e63]">
                            {news.subtitle}
                        </div>
                    )}

                    <p className="text-base text-slate-600 leading-relaxed font-light line-clamp-3 md:line-clamp-2 mix-blend-multiply">
                        {news.ai_summary || cleanContentPreview(news.content, 160)}...
                    </p>
                </div>

                {/* Thumbnail (Right) */}
                {news.thumbnail_url && (
                    <div className="w-full md:w-[280px] shrink-0 order-1 md:order-2">
                        <div className="aspect-[16/10] relative overflow-hidden rounded-lg shadow-sm">
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

    // 5. Default: Horizontal Card (Grid/Standard)
    return (
        <Link
            href={`/news/${news.id}`}
            className="group block py-6 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
        >
            <div className="flex gap-5">
                {/* Thumbnail */}
                {news.thumbnail_url && (
                    <div className="w-[140px] md:w-[180px] shrink-0">
                        <div className="aspect-[4/3] relative overflow-hidden rounded-lg shadow-sm">
                            <img
                                src={news.thumbnail_url}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col">
                    <h3 className="text-lg md:text-xl font-serif font-bold text-slate-900 leading-tight group-hover:text-[#0a192f] mb-2 transition-colors">
                        {news.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-light line-clamp-2 md:line-clamp-3 mb-3">
                        {news.ai_summary || cleanContentPreview(news.content, 160)}...
                    </p>
                    <div className="mt-auto text-xs text-slate-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{news.published_at?.split('T')[0]}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
