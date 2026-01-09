import Image from 'next/image';
import Link from 'next/link';

interface RelatedNewsItem {
  id: string;
  title: string;
  thumbnail?: string;
  category?: string;
  timeAgo?: string;
}

interface RelatedNewsProps {
  items: RelatedNewsItem[];
  title?: string;
}

export default function RelatedNews({
  items,
  title = '관련 뉴스',
}: RelatedNewsProps) {
  if (items.length === 0) return null;

  return (
    <section className="py-8 px-5 bg-white dark:bg-[#101722]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <Link
          href="/news"
          className="text-sm text-primary font-medium flex items-center"
        >
          더보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            className="flex gap-4 group"
          >
            {item.thumbnail && (
              <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            )}
            <div className="flex flex-col justify-center py-0.5">
              {item.category && (
                <span className="text-xs text-primary font-bold mb-1">{item.category}</span>
              )}
              <h4 className="text-[15px] font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {item.title}
              </h4>
              {item.timeAgo && (
                <span className="text-xs text-gray-400">{item.timeAgo}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
