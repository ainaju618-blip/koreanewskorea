'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, Clock, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';

const ITEMS_PER_PAGE = 15;

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  source: string;
  publishedAt: string;
  category: string;
}

export default function NajuBusinessPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/region/naju/news?limit=500');
        if (res.ok) {
          const data = await res.json();
          // 기업/경제 관련 기사만 필터링
          const filtered = (data.articles || []).filter((article: NewsArticle) => {
            const cat = article.category?.toLowerCase() || '';
            const source = article.source?.toLowerCase() || '';
            const title = article.title?.toLowerCase() || '';
            return cat === '기업' || cat === '경제' || cat === '산업'
              || source.includes('기업') || source.includes('경제') || source.includes('산업')
              || title.includes('기업') || title.includes('산업') || title.includes('에너지');
          });
          setArticles(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
    });
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(articles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentArticles = articles.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative text-white py-12 md:py-16 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/hero/business-hero.png"
          alt="기업 소식 배경"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/70 to-amber-700/50" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Briefcase className="w-7 h-7" />
            기업 소식
          </h1>
          <p className="text-amber-100 mt-2">나주 에너지밸리 및 지역 기업 소식</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="ml-3 text-gray-500">뉴스를 불러오는 중...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">등록된 소식이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 기사 목록 */}
            <div className="space-y-4">
              {currentArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex">
                    {article.thumbnail && (
                      <div className="w-32 md:w-48 flex-shrink-0">
                        <div className="aspect-[4/3] relative">
                          <Image
                            src={article.thumbnail}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          {article.source}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>
                      <h2 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-amber-600">
                        {article.title}
                      </h2>
                      {article.summary && (
                        <p className="text-sm text-gray-500 line-clamp-2">{article.summary}</p>
                      )}
                    </div>
                    <div className="hidden md:flex items-center px-4">
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page as number)}
                      className={`px-4 py-2 rounded-lg border ${
                        currentPage === page
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* 페이지 정보 */}
            <p className="text-center text-sm text-gray-400 mt-4">
              총 {articles.length}개 중 {startIndex + 1}-{Math.min(endIndex, articles.length)}번째
            </p>
          </>
        )}
      </main>
    </div>
  );
}
