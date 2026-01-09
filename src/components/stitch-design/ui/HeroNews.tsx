import Image from 'next/image';
import Link from 'next/link';

interface HeroNewsProps {
  id: string;
  title: string;
  summary?: string;
  thumbnail?: string;
  source?: string;
  region?: string;
  commentCount?: number;
  updatedAgo?: string;
}

export default function HeroNews({
  id,
  title,
  summary,
  thumbnail,
  source = '정책브리핑',
  region = '전국',
  commentCount = 0,
  updatedAgo = '10분 전 업데이트',
}: HeroNewsProps) {
  return (
    <section className="bg-white dark:bg-slate-900 pb-6 pt-4">
      <div className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">TOP NEWS</span>
          <span className="text-gray-500 dark:text-slate-400 text-xs font-medium">{updatedAgo}</span>
        </div>

        {/* Hero Article */}
        <Link href={`/news/${id}`} className="group cursor-pointer block">
          {thumbnail && (
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative mb-4 shadow-sm">
              <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-snug tracking-tight mb-2">
            {title}
          </h2>
          {summary && (
            <p className="text-gray-500 dark:text-slate-400 text-base leading-relaxed line-clamp-2 mb-3">
              {summary}
            </p>
          )}
          <div className="flex items-center text-xs text-gray-500 dark:text-slate-500 font-medium gap-2">
            <span>{source}</span>
            <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
            <span>{region}</span>
            {commentCount > 0 && (
              <>
                <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
                <span>댓글 {commentCount}</span>
              </>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
}
