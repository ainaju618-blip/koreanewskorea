import Link from 'next/link';
import { NewsItem } from '@/types/news';

interface MostViewedProps {
    news: NewsItem[];
}

export default function MostViewed({ news }: MostViewedProps) {
    return (
        <div className="bg-white p-6 border border-slate-200 rounded-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b border-slate-900">
                가장 많이 본 뉴스
            </h3>
            <div className="flex flex-col gap-4">
                {news.map((item, index) => (
                    <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="group flex gap-3 items-start hover:bg-slate-50 transition-colors p-1 rounded-lg"
                    >
                        <span className="text-2xl font-black text-slate-800 leading-none mt-1 w-6 text-center font-serif italic">
                            {index + 1}
                        </span>
                        <div className="flex-1">
                            <h4 className="text-[15px] font-bold text-slate-800 leading-snug group-hover:text-[color:var(--color-primary)] line-clamp-2">
                                {item.title}
                            </h4>
                        </div>
                    </Link>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <Link href="/news/popular" className="inline-block px-6 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-full hover:bg-slate-200 transition-colors">
                    더보기
                </Link>
            </div>
        </div>
    );
}
