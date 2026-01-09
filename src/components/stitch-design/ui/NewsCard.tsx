import Image from 'next/image';
import Link from 'next/link';

interface NewsCardProps {
  id: string;
  title: string;
  summary?: string;
  thumbnail?: string;
  category?: string;
  categoryColor?: 'blue' | 'red' | 'green' | 'orange' | 'purple';
  source?: string;
  date?: string;
  commentCount?: number;
  variant?: 'hero' | 'list' | 'compact';
}

const categoryColors = {
  blue: 'text-primary bg-blue-50 dark:bg-blue-900/30',
  red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
  green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
  purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
};

export default function NewsCard({
  id,
  title,
  summary,
  thumbnail,
  category,
  categoryColor = 'blue',
  source,
  date,
  commentCount,
  variant = 'list',
}: NewsCardProps) {
  // Hero 카드 (전국판 메인 뉴스)
  if (variant === 'hero') {
    return (
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
          {source && <span>{source}</span>}
          {source && <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />}
          {category && <span>{category}</span>}
          {commentCount !== undefined && (
            <>
              <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
              <span>댓글 {commentCount}</span>
            </>
          )}
        </div>
      </Link>
    );
  }

  // List 카드 (뉴스 목록)
  if (variant === 'list') {
    return (
      <Link
        href={`/news/${id}`}
        className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 items-start active:bg-slate-50 dark:active:bg-slate-800 transition-colors cursor-pointer"
      >
        <div className="flex-1 flex flex-col justify-between min-h-[72px]">
          <h3 className="text-gray-900 dark:text-slate-100 text-[16px] font-semibold leading-tight line-clamp-2 mb-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500 mt-1">
            {category && (
              <span className={`font-bold ${categoryColors[categoryColor].split(' ')[0]}`}>
                {category}
              </span>
            )}
            {category && date && <span>·</span>}
            {date && <span>{date}</span>}
          </div>
        </div>
        {thumbnail && (
          <div
            className="w-[72px] h-[72px] rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center shrink-0"
            style={{ backgroundImage: `url('${thumbnail}')` }}
          />
        )}
      </Link>
    );
  }

  // Compact 카드 (나주판 스타일)
  return (
    <Link
      href={`/news/${id}`}
      className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex flex-1 flex-col justify-start gap-2">
        <div className="flex items-center gap-2">
          {category && (
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${categoryColors[categoryColor]}`}>
              {category}
            </span>
          )}
          {date && <span className="text-gray-400 dark:text-gray-500 text-xs">{date}</span>}
        </div>
        <h4 className="text-gray-900 dark:text-gray-100 text-[17px] font-bold leading-snug line-clamp-2">
          {title}
        </h4>
        {summary && (
          <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-relaxed line-clamp-2">
            {summary}
          </p>
        )}
      </div>
      {thumbnail && (
        <div className="shrink-0">
          <div
            className="bg-center bg-no-repeat bg-cover rounded-lg h-24 w-24 bg-gray-200"
            style={{ backgroundImage: `url('${thumbnail}')` }}
          />
        </div>
      )}
    </Link>
  );
}
