'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pause, Play } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  ai_summary?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  category?: string;
  source?: string;
  published_at?: string;
  publishedAt?: string;
}

interface NewsHeroSliderProps {
  articles: Article[];
  interval?: number; // ms, default 6000
  regionName?: string;
}

// 출처에 따른 배지 색상
const SOURCE_BADGES: Record<string, { label: string; labelEn: string; color: string }> = {
  government: { label: '나주시소식', labelEn: 'City Hall', color: 'bg-red-500' },
  council: { label: '의회소식', labelEn: 'Council', color: 'bg-blue-500' },
  fire: { label: '나주소방서', labelEn: 'Fire Dept', color: 'bg-orange-500' },
  education: { label: '교육소식', labelEn: 'Education', color: 'bg-green-500' },
  business: { label: '기업소식', labelEn: 'Business', color: 'bg-indigo-500' },
  local: { label: '오피니언', labelEn: 'Opinion', color: 'bg-amber-500' },
};

// 기사 카테고리 분류
function classifyArticle(article: Article): 'government' | 'council' | 'fire' | 'education' | 'business' | 'local' {
  const source = article.source?.toLowerCase() || '';
  const category = article.category?.toLowerCase() || '';

  // 의회 판별
  if (category === '의회' || source.includes('의회') || source.includes('의원')) {
    return 'council';
  }

  // 소방 판별
  if (category === '소방' || source.includes('소방') || source.includes('119')) {
    return 'fire';
  }

  // 교육 판별 (나주 관련만)
  const isEducation = category === '교육' || source.includes('교육') || source.includes('학교');
  const title = article.title?.toLowerCase() || '';
  const hasNaju = title.includes('나주') || source.includes('나주');
  if (isEducation && hasNaju) {
    return 'education';
  }

  // 기업 판별
  if (category === '기업' || category === '경제' || source.includes('기업') || source.includes('경제')) {
    return 'business';
  }

  // 오피니언 판별
  if (category === '동네' || category === '지역' || source.includes('동네') || source.includes('마을')) {
    return 'local';
  }

  // 기본값: 시정
  return 'government';
}

export default function NewsHeroSlider({
  articles,
  interval = 6000,
  regionName = '나주',
}: NewsHeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 썸네일 URL 가져오기 (thumbnail 또는 thumbnail_url)
  const getThumbnail = (article: Article) => article.thumbnail || article.thumbnail_url;

  // 카테고리별로 기사 분류하고, 시청→의회→소방→교육→기업→동네 순으로 순환 배열 생성
  const rotatingArticles = useMemo(() => {
    const governmentArticles = articles.filter(a => classifyArticle(a) === 'government' && getThumbnail(a));
    const councilArticles = articles.filter(a => classifyArticle(a) === 'council' && getThumbnail(a));
    const fireArticles = articles.filter(a => classifyArticle(a) === 'fire' && getThumbnail(a));
    const educationArticles = articles.filter(a => classifyArticle(a) === 'education' && getThumbnail(a));
    const businessArticles = articles.filter(a => classifyArticle(a) === 'business' && getThumbnail(a));
    const localArticles = articles.filter(a => classifyArticle(a) === 'local' && getThumbnail(a));

    // 각 카테고리에서 최대 3개씩, 순환 배열 생성
    const result: { article: Article; category: 'government' | 'council' | 'fire' | 'education' | 'business' | 'local' }[] = [];
    const maxPerCategory = 3;

    // 라운드 로빈 방식으로 순환 (시청→의회→소방→교육→기업→동네→시청→...)
    for (let i = 0; i < maxPerCategory; i++) {
      if (governmentArticles[i]) {
        result.push({ article: governmentArticles[i], category: 'government' });
      }
      if (councilArticles[i]) {
        result.push({ article: councilArticles[i], category: 'council' });
      }
      if (fireArticles[i]) {
        result.push({ article: fireArticles[i], category: 'fire' });
      }
      if (educationArticles[i]) {
        result.push({ article: educationArticles[i], category: 'education' });
      }
      if (businessArticles[i]) {
        result.push({ article: businessArticles[i], category: 'business' });
      }
      if (localArticles[i]) {
        result.push({ article: localArticles[i], category: 'local' });
      }
    }

    // 썸네일 없는 기사도 포함 (백업)
    if (result.length === 0) {
      const govNoThumb = articles.filter(a => classifyArticle(a) === 'government').slice(0, 2);
      const councilNoThumb = articles.filter(a => classifyArticle(a) === 'council').slice(0, 2);
      const fireNoThumb = articles.filter(a => classifyArticle(a) === 'fire').slice(0, 2);
      const eduNoThumb = articles.filter(a => classifyArticle(a) === 'education').slice(0, 2);
      const bizNoThumb = articles.filter(a => classifyArticle(a) === 'business').slice(0, 2);
      const localNoThumb = articles.filter(a => classifyArticle(a) === 'local').slice(0, 2);

      govNoThumb.forEach(a => result.push({ article: a, category: 'government' }));
      councilNoThumb.forEach(a => result.push({ article: a, category: 'council' }));
      fireNoThumb.forEach(a => result.push({ article: a, category: 'fire' }));
      eduNoThumb.forEach(a => result.push({ article: a, category: 'education' }));
      bizNoThumb.forEach(a => result.push({ article: a, category: 'business' }));
      localNoThumb.forEach(a => result.push({ article: a, category: 'local' }));
    }

    return result;
  }, [articles]);

  const goToNext = useCallback(() => {
    if (rotatingArticles.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % rotatingArticles.length);
  }, [rotatingArticles.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // 자동 전환
  useEffect(() => {
    if (isPaused || rotatingArticles.length <= 1) return;

    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [isPaused, interval, goToNext, rotatingArticles.length]);

  if (rotatingArticles.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">뉴스를 불러오는 중...</p>
      </div>
    );
  }

  const current = rotatingArticles[currentIndex];
  const currentArticle = current.article;
  const badge = SOURCE_BADGES[current.category];
  const thumbnailUrl = getThumbnail(currentArticle);
  const summary = currentArticle.summary || currentArticle.ai_summary || currentArticle.content?.slice(0, 150) || '';

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={currentArticle.title}
            fill
            className="object-cover transition-transform duration-700"
            priority
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800" />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 lg:p-8">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`${badge.color} text-white text-xs font-bold px-2.5 py-1 rounded`}>
            {badge.label}
          </span>
        </div>

        {/* Title */}
        <Link href={`/news/${currentArticle.id}`} className="group/title">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 line-clamp-2 group-hover/title:text-cyan-300 transition-colors">
            {currentArticle.title}
          </h2>
        </Link>

        {/* Summary */}
        {summary && (
          <p className="text-gray-200 text-sm md:text-base leading-relaxed line-clamp-2 max-w-4xl mb-4">
            {summary}...
          </p>
        )}

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Empty space for balance */}
          <div />

          {/* Pause/Play Button (Center) */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors"
            aria-label={isPaused ? '재생' : '일시정지'}
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-white" />
            ) : (
              <Pause className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Slide Indicator (Right) */}
          <div className="flex items-center gap-1 text-white font-medium">
            <span className="text-lg font-bold">
              {String(currentIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-400">
              {String(rotatingArticles.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Dot Indicators (for clicking) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1.5">
        {rotatingArticles.map((item, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`슬라이드 ${index + 1}로 이동 (${SOURCE_BADGES[item.category].label})`}
          />
        ))}
      </div>
    </div>
  );
}
