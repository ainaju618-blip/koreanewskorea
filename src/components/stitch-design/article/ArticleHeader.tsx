'use client';

import { useRouter } from 'next/navigation';

interface ArticleHeaderProps {
  title?: string;
  onBookmark?: () => void;
  onShare?: () => void;
  isBookmarked?: boolean;
}

export default function ArticleHeader({
  title = '전국판 뉴스',
  onBookmark,
  onShare,
  isBookmarked = false,
}: ArticleHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white/95 dark:bg-[#101722]/95 backdrop-blur-sm p-4 border-b border-gray-100 dark:border-gray-800">
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
      >
        <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
      </button>

      <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center truncate px-2">
        {title}
      </h2>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onBookmark}
          aria-label="Bookmark"
          className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
        >
          <span className={`material-symbols-outlined text-[24px] ${isBookmarked ? 'filled text-primary' : ''}`}>
            {isBookmarked ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
        <button
          onClick={handleShare}
          aria-label="Share"
          className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
        >
          <span className="material-symbols-outlined text-[24px]">share</span>
        </button>
      </div>
    </header>
  );
}
