'use client';

import { useState, useEffect } from 'react';
import CategoryTabs, { CategoryTabsSkeleton } from './CategoryTabs';

/**
 * CategoryNewsSection - 카테고리 탭 + 뉴스 그리드 (Client Component)
 * ================================================================
 * 카테고리 선택 상태를 관리하고, 선택된 카테고리에 따라 뉴스를 필터링
 * 실제 뉴스 데이터는 API를 통해 가져옴
 */

interface Article {
  id: string;
  title: string;
  ai_summary?: string;
  thumbnail_url?: string;
  category?: string;
  published_at: string;
  view_count?: number;
}

// Category 매핑
const CATEGORY_MAP: Record<string, string[]> = {
  all: [],
  politics: ['정치', '경제', '국회', '청와대', '기획재정부'],
  education: ['교육', '문화', '예술', '교육부', '문화체육관광부'],
  society: ['사회', '복지', '보건', '보건복지부', '고용노동부'],
  tech: ['AI', '과학', '기술', '과학기술정보통신부', '산업통상자원부'],
  region: ['지역', '광주', '전남', '전북'],
  trending: [],
};

export default function CategoryNewsSection() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        // 카테고리별 뉴스 API 호출
        const params = new URLSearchParams({
          category: activeCategory,
          limit: '6',
        });
        const res = await fetch(`/api/news?${params}`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [activeCategory]);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <section>
      {/* 카테고리 탭 */}
      <CategoryTabs
        activeCategory={activeCategory}
        onTabChange={setActiveCategory}
      />

      {/* 뉴스 그리드 */}
      <div className="py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden border border-slate-200"
              >
                <div className="aspect-[16/9] bg-slate-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 rounded animate-pulse" />
                  <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500">해당 카테고리의 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article, index) => (
              <a
                key={article.id}
                href={`/news/${article.id}`}
                className="group block bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {/* 이미지 */}
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  {article.thumbnail_url ? (
                    <img
                      src={article.thumbnail_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading={index < 3 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <span className="text-4xl">📰</span>
                    </div>
                  )}

                  {/* 카테고리 뱃지 */}
                  {article.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#A6121D] text-white text-xs font-medium rounded">
                      {article.category}
                    </span>
                  )}
                </div>

                {/* 콘텐츠 */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#A6121D] line-clamp-2 leading-snug mb-2 transition-colors">
                    {article.title}
                  </h3>

                  {article.ai_summary && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                      {article.ai_summary}
                    </p>
                  )}

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <time dateTime={new Date(article.published_at).toISOString()}>
                      {formatRelativeTime(article.published_at)}
                    </time>
                    {article.view_count !== undefined && article.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <span>👁️</span>
                        {article.view_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* 더보기 링크 */}
        <div className="mt-6 text-center">
          <a
            href={activeCategory === 'all' ? '/news' : `/category/${activeCategory}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <span>더 많은 뉴스 보기</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

// Skeleton for loading
export function CategoryNewsSectionSkeleton() {
  return (
    <section>
      <CategoryTabsSkeleton />
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden border border-slate-200"
            >
              <div className="aspect-[16/9] bg-slate-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
