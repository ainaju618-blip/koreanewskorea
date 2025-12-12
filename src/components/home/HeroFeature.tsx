import Link from 'next/link';
import { NewsItem } from '@/types/news';

interface HeroFeatureProps {
    news: NewsItem;
}

export default function HeroFeature({ news }: HeroFeatureProps) {
    return (
        <div className="flex flex-col mb-8">
            {/* Large Image Area */}
            <Link href={`/news/${news.id}`} className="block group">
                <div className="w-full aspect-[16/9] relative overflow-hidden bg-slate-100 border border-slate-200">
                    {news.thumbnail_url ? (
                        <img
                            src={news.thumbnail_url}
                            alt={news.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            Main Feature Image
                        </div>
                    )}
                    {/* Tag Overlay (Optional) */}
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 font-bold">
                        주요뉴스
                    </div>
                </div>

                {/* Title Area (Below Image) */}
                <div className="mt-5 text-center px-4">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight group-hover:text-blue-700 transition-colors break-keep">
                        {news.title}
                    </h2>
                </div>
            </Link>
        </div>
    );
}
