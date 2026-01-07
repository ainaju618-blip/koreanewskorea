'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NewsCardProps {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  category?: string;
  source?: string;
  date?: string;
  readTime?: string;
  variant?: 'default' | 'compact' | 'horizontal' | 'hero';
  className?: string;
}

export default function NewsCard({
  id,
  title,
  summary,
  imageUrl,
  category,
  source,
  date,
  readTime,
  variant = 'default',
  className = '',
}: NewsCardProps) {
  const href = `/news/${id}`;

  // Hero variant (large featured card)
  if (variant === 'hero') {
    return (
      <Link href={href} className={`block group ${className}`}>
        <article className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {category && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-primary text-white text-xs font-bold mb-3">
                {category}
              </span>
            )}
            <h2 className="text-white text-xl font-bold leading-tight line-clamp-2 mb-2">
              {title}
            </h2>
            {summary && (
              <p className="text-white/80 text-sm line-clamp-2 mb-3">{summary}</p>
            )}
            <div className="flex items-center gap-2 text-white/60 text-xs">
              {source && <span>{source}</span>}
              {source && date && <span>·</span>}
              {date && <span>{date}</span>}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Horizontal variant (thumbnail left, content right)
  if (variant === 'horizontal') {
    return (
      <Link href={href} className={`block group ${className}`}>
        <article className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
          {imageUrl && (
            <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {category && (
              <span className="text-primary text-xs font-bold mb-1 block">{category}</span>
            )}
            <h3 className="text-[#111318] dark:text-white text-base font-bold leading-snug line-clamp-2 mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mt-2">
              {source && <span>{source}</span>}
              {source && date && <span>·</span>}
              {date && <span>{date}</span>}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Compact variant (smaller, no image)
  if (variant === 'compact') {
    return (
      <Link href={href} className={`block group ${className}`}>
        <article className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
          <h3 className="text-[#111318] dark:text-white text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mt-1.5">
            {source && <span>{source}</span>}
            {source && date && <span>·</span>}
            {date && <span>{date}</span>}
          </div>
        </article>
      </Link>
    );
  }

  // Default variant (card with image on top)
  return (
    <Link href={href} className={`block group ${className}`}>
      <article className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {imageUrl && (
          <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4">
          {category && (
            <span className="text-primary text-xs font-bold mb-2 block">{category}</span>
          )}
          <h3 className="text-[#111318] dark:text-white text-base font-bold leading-snug line-clamp-2 mb-2">
            {title}
          </h3>
          {summary && (
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
              {summary}
            </p>
          )}
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
            {source && <span>{source}</span>}
            {source && date && <span>·</span>}
            {date && <span>{date}</span>}
            {readTime && (
              <>
                <span>·</span>
                <span>{readTime}</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
